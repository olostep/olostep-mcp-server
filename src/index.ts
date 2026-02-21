#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from 'dotenv';
import { getWebpageMarkdown } from "./tools/getWebpageMarkdown.js";
import { getWebsiteMap } from "./tools/getWebsiteURLs.js";
import { scrapeWebsite } from "./tools/scrapeWebsite.js";
import { searchWeb } from "./tools/searchWeb.js";
import { getGoogleSearch } from "./tools/getGoogleSearch.js";
import { answers } from "./tools/answers.js";
import { batchScrapeUrls } from "./tools/batchScrapeUrls.js";
import { getBatchResults } from "./tools/getBatchResults.js";
import { createCrawl } from "./tools/createCrawl.js";
import { createMap } from "./tools/createMap.js";

dotenv.config(); // Load .env file (though API key will now be in claude_desktop_config.json)

const OLOSTEP_API_KEY = process.env.OLOSTEP_API_KEY; // Get API key from environment variables
const ORBIT_KEY = process.env.ORBIT_KEY; // Get Orbit key from environment variables

const missingApiKeyError = {
    isError: true,
    content: [
        {
            type: "text" as const,
            text: "OLOSTEP_API_KEY environment variable is not set. Set it and restart the server to use Olostep tools.",
        },
    ],
};

if (!OLOSTEP_API_KEY) {
    // Don't hard-exit: allow initialize/tools/list so Docker-based setups can be smoke-tested.
    console.error(
        "Warning: OLOSTEP_API_KEY is not set. The server will start, but tool calls will fail until you provide the key."
    );
}

const server = new McpServer({
    name: "olostep",
    version: "1.0.0",
});

// Register Create Map tool
server.tool(
    createMap.name,
    createMap.description,
    createMap.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await createMap.handler(params, OLOSTEP_API_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register Create Crawl tool
server.tool(
    createCrawl.name,
    createCrawl.description,
    createCrawl.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await createCrawl.handler(params, OLOSTEP_API_KEY, ORBIT_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register Batch Scrape URLs tool
server.tool(
    batchScrapeUrls.name,
    batchScrapeUrls.description,
    batchScrapeUrls.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await batchScrapeUrls.handler(params, OLOSTEP_API_KEY, ORBIT_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register Get Batch Results tool
server.tool(
    getBatchResults.name,
    getBatchResults.description,
    getBatchResults.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await getBatchResults.handler(params, OLOSTEP_API_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register Answers (AI) tool
server.tool(
    answers.name,
    answers.description,
    answers.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await answers.handler(params, OLOSTEP_API_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register Search (parser-based) tool
server.tool(
    searchWeb.name,
    searchWeb.description,
    searchWeb.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await searchWeb.handler(params, OLOSTEP_API_KEY, ORBIT_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register Scrape Website tool
server.tool(
    scrapeWebsite.name,
    scrapeWebsite.description,
    scrapeWebsite.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await scrapeWebsite.handler(params, OLOSTEP_API_KEY, ORBIT_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register the webpage markdown tool
server.tool(
    getWebpageMarkdown.name,
    getWebpageMarkdown.description,
    getWebpageMarkdown.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await getWebpageMarkdown.handler(params, OLOSTEP_API_KEY, ORBIT_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register the website map tool
server.tool(
    getWebsiteMap.name,
    getWebsiteMap.description,
    getWebsiteMap.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await getWebsiteMap.handler(params, OLOSTEP_API_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);

// Register the Google search tool
server.tool(
    getGoogleSearch.name,
    getGoogleSearch.description,
    getGoogleSearch.schema,
    async (params) => {
        if (!OLOSTEP_API_KEY) return missingApiKeyError;
        const result = await getGoogleSearch.handler(params, OLOSTEP_API_KEY, ORBIT_KEY);
        return {
            ...result,
            content: result.content.map(item => ({ ...item, type: item.type as "text" }))
        };
    }
);



async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(error => {
    process.exit(1);
});
