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
    process.stdout.write(JSON.stringify(entry) + "\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = { name: string; description: string; schema: any; handler: (...args: any[]) => Promise<any> };

const tools: AnyTool[] = [
    createMap, createCrawl, getCrawlResults, batchScrapeUrls, getBatchResults,
    answers, searchWeb, scrapeWebsite, getWebpageMarkdown,
    getWebsiteMap,
];

function createMcpServer(apiKey: string, orbitKey?: string) {
    const server = new McpServer({ name: "olostep", version: "1.0.0" });

    for (const tool of tools) {
        server.registerTool(
            tool.name,
            { description: tool.description, inputSchema: tool.schema },
            async (params: Record<string, unknown>) => wrap(await tool.handler(params, apiKey, orbitKey))
        );
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

    app.post("/mcp", async (req: Request, res: Response) => {
        const start = Date.now();
        const auth = req.headers.authorization;
        const apiKey = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

        if (!apiKey) {
            log("warn", "Rejected request — missing API key", { status: 401 });
            res.status(401).json({ error: "Missing Authorization: Bearer <OLOSTEP_API_KEY>" });
            return;
        }

        const orbitKey = req.headers["x-orbit-key"] as string | undefined;

        try {
            const server = createMcpServer(apiKey, orbitKey);
            const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

            res.on("finish", () => {
                const durationMs = Date.now() - start;
                log("info", "Request handled", { durationMs, status: res.statusCode });
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

    app.listen(port, () => {
        log("info", "MCP server started in HTTP mode", { port });
    });
}

const useHttp =
    process.argv.includes("--transport=http") || process.env.TRANSPORT === "http";

if (useHttp) {
    startHttp().catch(() => process.exit(1));
} else {
    startStdio().catch(() => process.exit(1));
}
