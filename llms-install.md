# Olostep MCP Server — Installation Guide for AI Agents

These instructions are for AI agents (such as Cline) installing the Olostep MCP server for a user. Follow them in order.

## What this server does

Olostep gives the agent live web data through 10 tools: `scrape_website`, `get_webpage_content`, `search_web`, `answers`, `get_website_urls`, `create_map`, `batch_scrape_urls`, `get_batch_results`, `create_crawl`, and `get_crawl_results`.

## Prerequisites

1. **Node.js 18 or newer.** Check with `node --version`. If it is missing, ask the user to install it from https://nodejs.org.
2. **An Olostep API key.** If the user does not have one, ask them to create a free account at https://olostep.com/auth and copy the key from their dashboard.

Ask the user for the API key and write it only into the MCP settings file. Do not echo it back in chat, and do not save it in any other file.

## Installation

No clone or build step is needed. The server is published on npm as `olostep-mcp` and runs with `npx`.

Add this entry to the `mcpServers` object in the MCP settings file (for Cline, `cline_mcp_settings.json`), replacing `YOUR_API_KEY_HERE` with the user's key:

```json
{
  "mcpServers": {
    "olostep": {
      "command": "npx",
      "args": ["-y", "olostep-mcp"],
      "env": {
        "OLOSTEP_API_KEY": "YOUR_API_KEY_HERE"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If the file already contains other servers, add the `olostep` entry alongside them; do not replace the existing entries.

### Windows

If `npx` cannot be found on Windows, use `cmd` to launch it:

```json
"command": "cmd",
"args": ["/c", "npx", "-y", "olostep-mcp"]
```

## Verify the installation

1. Confirm the `olostep` server shows as connected with 10 tools.
2. Call `get_webpage_content` with `{"url": "https://example.com"}`. The result should contain the text "Example Domain".

## Troubleshooting

- **`401 Unauthorized` or "Invalid API key":** the key is missing or wrong. Ask the user to check it at https://olostep.com/auth and update `OLOSTEP_API_KEY`.
- **`npx` not found:** Node.js is not installed or not on `PATH`. Install Node.js 18+ and restart the editor.
- **Server times out on first start:** the first `npx` run downloads the package. Wait a moment and retry.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OLOSTEP_API_KEY` | Yes | Olostep API key |
| `ORBIT_KEY` | No | Routes requests through Orbit |

More details: [README.md](README.md) and https://docs.olostep.com
