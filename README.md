# Olostep MCP Server

<a href="https://glama.ai/mcp/servers/ur5ulf3b8e">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/ur5ulf3b8e/badge" />
</a>

A powerful MCP (Machine Control Protocol) server that provides web scraping and content extraction capabilities for AI assistants.

## Installation

Install and run the server using npx:

```bash
env OLOSTEP_API_KEY=<key> npx -y olostep-mcp
```

## Compatibility

The Olostep MCP server is compatible with all major AI coding assistants including:
- Windsurf
- Cursor
- Claude Desktop
- And more!

## Available Tools

The server provides two powerful tools for web interaction:

### 1. Get Webpage Content
Retrieves webpage content in markdown format.

Parameters:
- `url_to_scrape`: The URL of the webpage to scrape
- `country` (optional): Residential country to load the request from (e.g., US, CA, GB)
- `wait_before_scraping` (optional): Time to wait in milliseconds before starting the scrape

### 2. Get Website Map
Retrieves a list of URLs from a website sorted by relevance to a search query.

Parameters:
- `url`: The URL of the website to map
- `search_query`: The search query to sort URLs by

### 3. Google Search Results
Retrieves structured data from Google search results using the SERP API.

Parameters:
- `query`: The search query
- `country` (optional): Country code for localized results (e.g., US, GB)

Response includes:
- Organic search results with titles, links, and snippets
- Knowledge graph data when available
- Related questions (People Also Ask)
- Related searches
- Rich snippets and other structured data

## Development

```
npm ci
npm run build
npm publish
```
