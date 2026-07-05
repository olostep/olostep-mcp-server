#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
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

function oauthResourceUrl(req: Request): string {
    if (OAUTH_RESOURCE_URL) return OAUTH_RESOURCE_URL;
    const proto = ((req.headers["x-forwarded-proto"] as string) || req.protocol).split(",")[0];
    const host = ((req.headers["x-forwarded-host"] as string) || req.headers.host || "").split(",")[0];
    return `${proto}://${host}`;
}

function oauthProtectedResourceMetadataUrl(req: Request): string {
    return `${oauthResourceUrl(req)}/.well-known/oauth-protected-resource`;
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
    return name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
        app.get("/.well-known/oauth-protected-resource", (req: Request, res: Response) => {
            res.json({
                resource: oauthResourceUrl(req),
                authorization_servers: [OAUTH_AS_URL],
                scopes_supported: OAUTH_SCOPES,
                resource_documentation: "https://docs.olostep.com/",
            });
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
