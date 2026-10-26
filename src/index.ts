#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { createHash } from "node:crypto";
import { isLoopbackRedirect, packState, unpackState } from "./oauthRelay.js";
import { getWebpageMarkdown } from "./tools/getWebpageMarkdown.js";
import { getWebsiteMap } from "./tools/getWebsiteURLs.js";
import { scrapeWebsite } from "./tools/scrapeWebsite.js";
import { searchWeb } from "./tools/searchWeb.js";
import { answers } from "./tools/answers.js";
import { batchScrapeUrls } from "./tools/batchScrapeUrls.js";
import { getBatchResults } from "./tools/getBatchResults.js";
import { createCrawl } from "./tools/createCrawl.js";
import { getCrawlResults } from "./tools/getCrawlResults.js";
import { createMap } from "./tools/createMap.js";

dotenv.config();

// --- OAuth resource-server support (additive; dormant unless configured) ---
// When MCP_OAUTH_AUTHORIZATION_SERVER_URL is set, this server advertises OAuth
// protected-resource metadata and challenges unauthenticated /mcp requests, so
// clients like ChatGPT can run the OAuth login flow. The bearer token — whether
// it's an Olostep API key OR a Cognito OAuth JWT — is forwarded verbatim to
// api.olostep.com unchanged, so no per-token-type handling is needed here.
const OAUTH_AS_URL = (process.env.MCP_OAUTH_AUTHORIZATION_SERVER_URL ?? "").replace(/\/+$/, "");
const OAUTH_SCOPES = (process.env.MCP_OAUTH_SCOPES ?? "olostep/api").split(/\s+/).filter(Boolean);
const OAUTH_RESOURCE_URL = (process.env.MCP_OAUTH_RESOURCE_URL ?? "").replace(/\/+$/, "");
const OAUTH_ENABLED = OAUTH_AS_URL.length > 0;

// Cognito has no dynamic client registration, which Claude's directory needs.
// When a register client is set, this server fronts Cognito's metadata with a
// /register endpoint that hands out that pre-made client to allowed callbacks.
// Login and tokens still go straight to Cognito.
const REGISTER_CLIENT_ID = (process.env.MCP_OAUTH_REGISTER_CLIENT_ID ?? "").trim();
const REGISTER_CLIENT_SECRET = (process.env.MCP_OAUTH_REGISTER_CLIENT_SECRET ?? "").trim();
const REGISTER_REDIRECT_URIS = (process.env.MCP_OAUTH_REGISTER_REDIRECT_URIS ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
const REGISTER_ENABLED = OAUTH_ENABLED && REGISTER_CLIENT_ID.length > 0 && REGISTER_REDIRECT_URIS.length > 0;

// Loopback relay for local tools with random callback ports (see oauthRelay.ts).
// When on, login and token requests go through this server, which passes them to
// Cognito unchanged for fixed callbacks and relays loopback ones.
const RELAY_ENABLED = REGISTER_ENABLED && REGISTER_CLIENT_SECRET.length > 0 && process.env.MCP_OAUTH_RELAY_LOOPBACK === "true";
const RELAY_KEY = createHash("sha256").update(`loopback-relay:${REGISTER_CLIENT_SECRET}`).digest("hex");

let cognitoMetadata: Record<string, unknown> | null = null;

async function getCognitoMetadata(): Promise<Record<string, unknown>> {
    if (cognitoMetadata) return cognitoMetadata;
    const res = await fetch(`${OAUTH_AS_URL}/.well-known/openid-configuration`);
    if (!res.ok) throw new Error(`Cognito discovery returned ${res.status}`);
    cognitoMetadata = (await res.json()) as Record<string, unknown>;
    return cognitoMetadata;
}

function requestOrigin(req: Request): string {
    if (OAUTH_RESOURCE_URL) return new URL(OAUTH_RESOURCE_URL).origin;
    const proto = ((req.headers["x-forwarded-proto"] as string) || req.protocol).split(",")[0];
    const host = ((req.headers["x-forwarded-host"] as string) || req.headers.host || "").split(",")[0];
    return `${proto}://${host}`;
}

// The resource must equal the URL clients connect to, including the /mcp path.
function oauthResourceUrl(req: Request): string {
    return OAUTH_RESOURCE_URL || `${requestOrigin(req)}/mcp`;
}

// Metadata is served at the origin root, so build it from the origin, not the resource.
function oauthProtectedResourceMetadataUrl(req: Request): string {
    return `${requestOrigin(req)}/.well-known/oauth-protected-resource`;
}

type ToolResult = { isError?: boolean; content: { type: "text"; text: string }[] };

function wrap(result: { isError?: boolean; content: { type: string; text: string }[] }): ToolResult {
    return {
        isError: result.isError,
        content: result.content.map(item => ({ type: "text" as const, text: item.text })),
    };
}

function log(level: string, message: string, extra: Record<string, unknown> = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...extra,
    };
    process.stderr.write(JSON.stringify(entry) + "\n");  // ✅ NEW: stderr
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = { name: string; description: string; schema: any; handler: (...args: any[]) => Promise<any> };

const tools: AnyTool[] = [
    createMap, createCrawl, getCrawlResults, batchScrapeUrls, getBatchResults,
    answers, searchWeb, scrapeWebsite, getWebpageMarkdown,
    getWebsiteMap,
];

// MCP tool annotations. Every tool must declare all three hints (some clients,
// e.g. ChatGPT Apps, reject tools that omit any of them). All Olostep tools hit
// the live web (open world) and none delete or overwrite data (never
// destructive). Most only read; the two that start jobs are writes. Default is
// read-only so any new tool is valid out of the box — list writers explicitly.
const WRITE_TOOLS = new Set(["create_crawl", "batch_scrape_urls"]);
function annotationsFor(name: string) {
    const isWrite = WRITE_TOOLS.has(name);
    return {
        // Claude's directory reads the human-readable title from annotations.
        title: titleFor(name),
        readOnlyHint: !isWrite,
        destructiveHint: false,
        // Reads are idempotent (same call, same result, no extra effect). The two
        // writers start a NEW job each call, so they are not idempotent. OpenAI's
        // submission check expects all four hint fields present.
        idempotentHint: !isWrite,
        openWorldHint: true,
    };
}

// Human-readable title from the snake_case tool name (e.g. "create_map" ->
// "Create Map"). OpenAI's Apps tool examples always include a `title`.
function titleFor(name: string): string {
    return name.split("_").map(w => w === "urls" ? "URLs" : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function createMcpServer(apiKey: string, orbitKey?: string) {
    const server = new McpServer({ name: "olostep", version: "1.0.0" });

    for (const tool of tools) {
        const registered = server.registerTool(
            tool.name,
            { title: titleFor(tool.name), description: tool.description, inputSchema: tool.schema, annotations: annotationsFor(tool.name) },
            async (params: Record<string, unknown>) => wrap(await tool.handler(params, apiKey, orbitKey))
        );
        // The SDK stamps every tool with an experimental `execution: {taskSupport}`
        // field (its async-tasks feature). We don't use tasks, and that extra
        // field can trip strict tool-list validators, so drop it — keeping the
        // wire shape to plain name/description/inputSchema/annotations.
        (registered as { execution?: unknown }).execution = undefined;
    }

    // Clean each tool object in tools/list to exactly match OpenAI's Apps
    // reference shape (name/title/description/inputSchema/annotations). The hints
    // stay ONLY in the nested `annotations` object, per the spec and OpenAI docs
    // (no top-level duplicates — unexpected top-level keys can make a strict
    // validator reject the tool and report its annotations as missing). We only
    // strip the draft-07 `$schema` meta key the SDK's zod->JSON-schema conversion
    // stamps onto inputSchema, which isn't part of the reference shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const low = (server as any).server;
    const handlers = low?._requestHandlers as Map<string, (req: unknown, extra: unknown) => Promise<any>> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
    const originalListTools = handlers?.get("tools/list");
    if (handlers && originalListTools) {
        handlers.set("tools/list", async (req: unknown, extra: unknown) => {
            const result = await originalListTools(req, extra);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const listTools = (result as { tools?: any[] })?.tools;
            if (Array.isArray(listTools)) {
                for (const t of listTools) {
                    if (t?.inputSchema && typeof t.inputSchema === "object") {
                        delete t.inputSchema.$schema;
                    }
                }
            }
            return result;
        });
    }

    return server;
}

async function startStdio() {
    const apiKey = process.env.OLOSTEP_API_KEY;
    if (!apiKey) {
        log("warn", "OLOSTEP_API_KEY is not set — tool calls will fail until you provide the key");
    }
    const server = createMcpServer(apiKey ?? "", process.env.ORBIT_KEY);
    await server.connect(new StdioServerTransport());
    log("info", "MCP server started in STDIO mode");
}

async function startHttp() {
    const port = parseInt(process.env.PORT ?? "3000", 10);
    const app = express();
    app.use(express.json());

    // No favicon of our own; send clients (and Claude's directory) to the site icon.
    app.get("/favicon.ico", (_req: Request, res: Response) => {
        res.redirect(302, "https://www.olostep.com/favicon.ico");
    });

    app.get("/health", (_req: Request, res: Response) => {
        res.json({ status: "ok" });
    });

    // OpenAI Apps domain verification. Serves the challenge token as plain text
    // at the origin-root well-known URL so ChatGPT can confirm we control this
    // host. Token comes from an env var so it can be set/rotated without a code
    // change. Dormant (404) until the token is configured.
    app.get("/.well-known/openai-apps-challenge", (_req: Request, res: Response) => {
        const token = process.env.OPENAI_APPS_CHALLENGE_TOKEN;
        if (!token) {
            res.status(404).type("text/plain").send("");
            return;
        }
        res.type("text/plain").send(token);
    });

    // OAuth 2.0 Protected Resource Metadata (RFC 9728). Lets ChatGPT discover
    // which authorization server (Cognito) to use. Only mounted when configured.
    if (OAUTH_ENABLED) {
        app.get(["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"], (req: Request, res: Response) => {
            res.json({
                resource: oauthResourceUrl(req),
                authorization_servers: [REGISTER_ENABLED ? requestOrigin(req) : OAUTH_AS_URL],
                scopes_supported: OAUTH_SCOPES,
                resource_documentation: "https://docs.olostep.com/",
            });
        });
    }

    // Authorization server metadata (RFC 8414). Same Cognito endpoints, plus our /register.
    if (REGISTER_ENABLED) {
        app.get(
            ["/.well-known/oauth-authorization-server", "/.well-known/oauth-authorization-server/mcp", "/.well-known/openid-configuration"],
            async (req: Request, res: Response) => {
                try {
                    const cognito = await getCognitoMetadata();
                    const origin = requestOrigin(req);
                    res.json({
                        issuer: origin,
                        authorization_endpoint: RELAY_ENABLED ? `${origin}/authorize` : cognito.authorization_endpoint,
                        token_endpoint: RELAY_ENABLED ? `${origin}/token` : cognito.token_endpoint,
                        registration_endpoint: `${origin}/register`,
                        jwks_uri: cognito.jwks_uri,
                        scopes_supported: OAUTH_SCOPES,
                        response_types_supported: ["code"],
                        grant_types_supported: ["authorization_code", "refresh_token"],
                        code_challenge_methods_supported: ["S256"],
                        token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
                    });
                } catch (err) {
                    log("error", "Cognito discovery failed", { error: err instanceof Error ? err.message : String(err) });
                    res.status(502).json({ error: "temporarily_unavailable" });
                }
            },
        );

        // Dynamic client registration (RFC 7591). Only callbacks on the allow-list get the client.
        app.post("/register", (req: Request, res: Response) => {
            const requested: unknown = req.body?.redirect_uris;
            const uris = Array.isArray(requested) ? requested.filter((u): u is string => typeof u === "string") : [];
            const allowed = uris.filter(u => REGISTER_REDIRECT_URIS.includes(u) || (RELAY_ENABLED && isLoopbackRedirect(u)));
            if (allowed.length === 0) {
                log("warn", "Rejected client registration", { redirect_uris: uris });
                res.status(400).json({
                    error: "invalid_redirect_uri",
                    error_description: "This redirect URI is not registered with Olostep.",
                });
                return;
            }
            log("info", "Client registration", { redirect_uris: allowed });
            res.status(201).json({
                client_id: REGISTER_CLIENT_ID,
                ...(REGISTER_CLIENT_SECRET && { client_secret: REGISTER_CLIENT_SECRET, client_secret_expires_at: 0 }),
                client_id_issued_at: Math.floor(Date.now() / 1000),
                redirect_uris: allowed,
                grant_types: ["authorization_code", "refresh_token"],
                response_types: ["code"],
                token_endpoint_auth_method: REGISTER_CLIENT_SECRET ? "client_secret_post" : "none",
                scope: OAUTH_SCOPES.join(" "),
                client_name: typeof req.body?.client_name === "string" ? req.body.client_name : undefined,
            });
        });
    }

    if (RELAY_ENABLED) {
        const relayCallback = (req: Request) => `${requestOrigin(req)}/oauth/callback`;

        // Fixed callbacks pass straight through to Cognito. Loopback callbacks get our
        // own callback instead, with theirs packed into a signed state.
        app.get("/authorize", async (req: Request, res: Response) => {
            const params = new URLSearchParams();
            for (const [k, v] of Object.entries(req.query)) {
                if (typeof v === "string") params.set(k, v);
            }
            const redirectUri = params.get("redirect_uri") ?? "";
            if (params.get("client_id") !== REGISTER_CLIENT_ID) {
                res.status(400).json({ error: "invalid_client" });
                return;
            }
            let cognito: Record<string, unknown>;
            try {
                cognito = await getCognitoMetadata();
            } catch {
                res.status(502).json({ error: "temporarily_unavailable" });
                return;
            }
            if (REGISTER_REDIRECT_URIS.includes(redirectUri)) {
                res.redirect(302, `${cognito.authorization_endpoint}?${params}`);
                return;
            }
            if (!isLoopbackRedirect(redirectUri)) {
                log("warn", "Rejected authorize redirect", { redirect_uri: redirectUri });
                res.status(400).json({ error: "invalid_request", error_description: "Unregistered redirect_uri." });
                return;
            }
            // Relayed codes travel through a browser to a local port, so PKCE is required.
            if (!params.get("code_challenge") || params.get("code_challenge_method") !== "S256") {
                res.status(400).json({ error: "invalid_request", error_description: "PKCE with S256 is required." });
                return;
            }
            params.set("state", packState(redirectUri, params.get("state") ?? "", RELAY_KEY));
            params.set("redirect_uri", relayCallback(req));
            log("info", "Relaying loopback sign-in");
            res.redirect(302, `${cognito.authorization_endpoint}?${params}`);
        });

        app.get("/oauth/callback", (req: Request, res: Response) => {
            const unpacked = typeof req.query.state === "string" ? unpackState(req.query.state, RELAY_KEY) : null;
            if (!unpacked) {
                res.status(400).type("text/plain").send("This sign-in link has expired or is invalid. Start the sign-in again from your app.");
                return;
            }
            const target = new URL(unpacked.redirectUri);
            for (const key of ["code", "error", "error_description"]) {
                const value = req.query[key];
                if (typeof value === "string") target.searchParams.set(key, value);
            }
            if (unpacked.clientState) target.searchParams.set("state", unpacked.clientState);
            res.redirect(302, target.toString());
        });

        // Token requests are forwarded to Cognito. For relayed codes the redirect_uri
        // is swapped back to ours, since that is what Cognito issued the code against.
        app.options(["/token", "/register"], (_req: Request, res: Response) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.status(204).end();
        });

        app.post("/token", express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            const body = new URLSearchParams();
            for (const [k, v] of Object.entries(req.body ?? {})) {
                if (typeof v === "string") body.set(k, v);
            }
            const redirectUri = body.get("redirect_uri");
            if (body.get("grant_type") === "authorization_code" && redirectUri && isLoopbackRedirect(redirectUri)) {
                body.set("redirect_uri", relayCallback(req));
            }
            try {
                const cognito = await getCognitoMetadata();
                const headers: Record<string, string> = { "Content-Type": "application/x-www-form-urlencoded" };
                if (req.headers.authorization) headers.Authorization = req.headers.authorization;
                const upstream = await fetch(String(cognito.token_endpoint), { method: "POST", headers, body: body.toString() });
                res.status(upstream.status);
                res.setHeader("Content-Type", upstream.headers.get("content-type") ?? "application/json");
                res.setHeader("Cache-Control", "no-store");
                res.send(await upstream.text());
            } catch (err) {
                log("error", "Token relay failed", { error: err instanceof Error ? err.message : String(err) });
                res.status(502).json({ error: "temporarily_unavailable" });
            }
        });
    }

    app.post("/mcp", async (req: Request, res: Response) => {
        const start = Date.now();
        const auth = req.headers.authorization;
        const apiKey = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

        if (!apiKey) {
            // When OAuth is enabled, return the challenge that tells ChatGPT where
            // to authenticate. API-key clients always send a token so never see this.
            if (OAUTH_ENABLED) {
                res.setHeader(
                    "WWW-Authenticate",
                    `Bearer resource_metadata="${oauthProtectedResourceMetadataUrl(req)}", scope="${OAUTH_SCOPES.join(" ")}"`
                );
            }
            log("warn", "Rejected request — missing token", { status: 401 });
            res.status(401).json({ error: "Missing Authorization: Bearer <token>" });
            return;
        }

        const orbitKey = req.headers["x-orbit-key"] as string | undefined;

        try {
            const server = createMcpServer(apiKey, orbitKey);
            const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

            res.on("close", () => {
                const durationMs = Date.now() - start;
                log("info", "Request handled", { durationMs, status: res.statusCode });
                transport.close().catch(() => {});
                server.close().catch(() => {});
            });

            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        } catch (err) {
            const durationMs = Date.now() - start;
            log("error", "Request failed", {
                durationMs,
                error: err instanceof Error ? err.message : String(err),
            });
            if (!res.headersSent) {
                res.status(500).json({ error: "Internal server error" });
            }
        }
    });

    // Stateless server: no standalone SSE stream (GET) and no sessions to end (DELETE).
    // The spec requires 405 here; a 404 tells clients like Cursor their session is gone,
    // so they reconnect in a loop and give up.
    app.all("/mcp", (_req: Request, res: Response) => {
        res.setHeader("Allow", "POST");
        res.status(405).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Method not allowed." },
            id: null,
        });
    });

    const httpServer = app.listen(port, () => {
        log("info", "MCP server started in HTTP mode", { port });
    });
    
    // Allow long-running requests (e.g., polling for batch/crawl completion)
    httpServer.timeout = 600000;          // 10 minutes total request timeout
    httpServer.keepAliveTimeout = 120000; // 2 minutes — how long to keep idle connections open
    httpServer.headersTimeout = 125000;   // Must be > keepAliveTimeout
}

const useHttp =
    process.argv.includes("--transport=http") || process.env.TRANSPORT === "http";

if (useHttp) {
    startHttp().catch(() => process.exit(1));
} else {
    startStdio().catch(() => process.exit(1));
}
