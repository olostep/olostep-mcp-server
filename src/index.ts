#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from 'dotenv';
import { getWebpageMarkdown } from "./tools/getWebpageMarkdown.js";
import { getWebsiteMap } from "./tools/getWebsiteURLs.js";
import { getGoogleSearch } from "./tools/getGoogleSearch.js";

dotenv.config(); // Load .env file (though API key will now be in claude_desktop_config.json)

const OLOSTEP_API_KEY = process.env.OLOSTEP_API_KEY; // Get API key from environment variables

if (!OLOSTEP_API_KEY) {
    console.error("Error: OLOSTEP_API_KEY environment variable is not set. Please configure it in your claude_desktop_config.json file.");
    process.exit(1); // Exit if API key is not configured
}

const server = new McpServer({
    name: "olostep",
    version: "1.0.0",
});

// Register the webpage markdown tool
server.tool(
    getWebpageMarkdown.name,
    getWebpageMarkdown.description,
    getWebpageMarkdown.schema,
    async (params) => {
        const result = await getWebpageMarkdown.handler(params, OLOSTEP_API_KEY);
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
        const result = await getGoogleSearch.handler(params, OLOSTEP_API_KEY);
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