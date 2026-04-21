# Olostep MCP Server

[Docker Hub](https://hub.docker.com/r/olostep/mcp-server)
[npm version](https://www.npmjs.com/package/olostep-mcp)
[License: ISC](https://opensource.org/licenses/ISC)

A Model Context Protocol (MCP) server implementation that integrates with [Olostep](https://olostep.com) for web scraping, content extraction, and search capabilities.
To set up Olostep MCP Server, you need to have an API key. You can get the API key by signing up on the [Olostep website](https://olostep.com/auth).

## Features

- Scrape website content in HTML, Markdown, JSON or Plain Text (with optional parsers)
- Parser-based web search with structured results
- AI Answers with citations and optional JSON-shaped outputs
- Batch scraping of up to 10k URLs
- Autonomous site crawling from a start URL
- Website URL discovery and mapping (with include/exclude filters)
- Country-specific request routing for geo-targeted content
- Configurable wait times for JavaScript-heavy websites
- Comprehensive error handling and reporting
- Simple API key configuration

## Installation

There are multiple ways to connect to the Olostep MCP Server. Choose the one that best fits your workflow.

### ☁️ Remote Endpoint (Recommended)

The simplest way — no local installation required. Connect directly to our hosted MCP server:

```
https://mcp.olostep.com/mcp
```

Authentication is done via a `Bearer` token in the `Authorization` header using your Olostep API key. See the [Client Setup](#client-setup) section below for configuration examples.

### 🐳 Docker Hub

Pull and run the official Docker image:

```bash
docker pull olostep/mcp-server

docker run -i --rm \
  -e OLOSTEP_API_KEY="your-api-key" \
  olostep/mcp-server
```

### 🔧 Local Docker Build

If you prefer to build the image yourself from source:

```bash
git clone https://github.com/olostep/olostep-mcp-server.git
cd olostep-mcp-server
npm install
npm run build
docker build -t olostep/mcp-server:local .

docker run -i --rm -e OLOSTEP_API_KEY="your-api-key" olostep/mcp-server:local
```

### 📦 npx

Run without any installation using npx:

```bash
env OLOSTEP_API_KEY=your-api-key npx -y olostep-mcp
```

On Windows (PowerShell):

```powershell
$env:OLOSTEP_API_KEY = "your-api-key"; npx -y olostep-mcp
```

On Windows (CMD):

```cmd
set OLOSTEP_API_KEY=your-api-key && npx -y olostep-mcp
```

Or install globally:

```bash
npm install -g olostep-mcp
```

## Client Setup

### Cursor

The easiest way is to use the remote endpoint. Create or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "olostep": {
      "url": "https://mcp.olostep.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Alternative (local):** Go to Cursor Settings > Features > MCP Servers, click "+ Add New MCP Server":

- **Name:** `olostep`
- **Type:** `command`
- **Command:** `env OLOSTEP_API_KEY=your-api-key npx -y olostep-mcp`

### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-server-olostep": {
      "command": "npx",
      "args": ["-y", "olostep-mcp"],
      "env": {
        "OLOSTEP_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Alternative (Docker):**

```json
{
  "mcpServers": {
    "olostep": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "OLOSTEP_API_KEY=YOUR_API_KEY_HERE",
        "olostep/mcp-server"
      ]
    }
  }
}
```

Or install via the Smithery CLI in your device terminal:

```bash
npx -y @smithery/cli install @olostep/olostep-mcp-server --client claude
```

### Claude Code

Add the remote endpoint to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "olostep": {
      "url": "https://mcp.olostep.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Alternative (local):**

```json
{
  "mcpServers": {
    "olostep": {
      "command": "npx",
      "args": ["-y", "olostep-mcp"],
      "env": {
        "OLOSTEP_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### Windsurf

Add this to your `./codeium/windsurf/model_config.json`:

```json
{
  "mcpServers": {
    "olostep": {
      "serverUrl": "https://mcp.olostep.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Alternative (local):**

```json
{
  "mcpServers": {
    "mcp-server-olostep": {
      "command": "npx",
      "args": ["-y", "olostep-mcp"],
      "env": {
        "OLOSTEP_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### VS Code

Add this to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "olostep": {
      "type": "http",
      "url": "https://mcp.olostep.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Alternative (local):**

```json
{
  "servers": {
    "olostep": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "olostep-mcp"],
      "env": {
        "OLOSTEP_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### Metorial

**Option 1: One-Click Installation (Recommended)**

1. Open [Metorial](https://metorial.com) dashboard
2. Navigate to MCP Servers directory
3. Search for "Olostep"
4. Click "Install" and enter your API key

**Option 2: Manual Configuration**

Add this to your Metorial MCP server configuration:

```json
{
  "olostep": {
    "command": "npx",
    "args": ["-y", "olostep-mcp"],
    "env": {
      "OLOSTEP_API_KEY": "YOUR_API_KEY_HERE"
    }
  }
}
```

The Olostep tools will then be available in your Metorial AI chats.

## Configuration

### Environment Variables

- `OLOSTEP_API_KEY`: Your Olostep API key (required)
- `ORBIT_KEY`: An optional key for using Orbit to route requests.

## Available Tools

### 1. Scrape Website (`scrape_website`)

Extract content from a single URL. Supports multiple formats and JavaScript rendering.

```json
{
  "name": "scrape_website",
  "arguments": {
    "url_to_scrape": "https://example.com",
    "output_format": "markdown",
    "country": "US",
    "wait_before_scraping": 1000,
    "parser": "@olostep/amazon-product"
  }
}
```

#### Parameters:

- `url_to_scrape`: The URL of the website you want to scrape (required)
- `output_format`: Choose format (`html`, `markdown`, `json`, or `text`) - default: `markdown`
- `country`: Optional country code (e.g., US, GB, CA) for location-specific scraping
- `wait_before_scraping`: Wait time in milliseconds before scraping (0-10000)
- `parser`: Optional parser ID for specialized extraction

#### Response (example):

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"id\": \"scrp_...\",\n  \"url\": \"https://example.com\",\n  \"markdown_content\": \"# ...\",\n  \"html_content\": null,\n  \"json_content\": null,\n  \"text_content\": null,\n  \"status\": \"succeeded\",\n  \"timestamp\": \"2025-11-14T12:34:56Z\",\n  \"screenshot_hosted_url\": null,\n  \"page_metadata\": { }\n}"
    }
  ]
}
```

### 2. Search the Web (`search_web`)

Search the Web for a given query and get structured results (non-AI, parser-based).

```json
{
  "name": "search_web",
  "arguments": {
    "query": "your search query",
    "country": "US"
  }
}
```

#### Parameters:

- `query`: Search query (required)
- `country`: Optional country code for localized results (default: `US`)

#### Response:

- Structured JSON (as text) representing parser-based results

### 3. Answers (AI) (`answers`)

Search the web and return AI-powered answers in the JSON structure you want, with sources and citations.

```json
{
  "name": "answers",
  "arguments": {
    "task": "Who are the top 5 competitors to Acme Inc. in the EU?",
    "json": "Return a list of the top 5 competitors with name and homepage URL"
  }
}
```

#### Parameters:

- `task`: Question or task to answer using web data (required)
- `json`: Optional JSON schema/object or a short description of the desired output shape

#### Response includes:

- `answer_id`, `object`, `task`, `result` (JSON if provided), `sources`, `created`

### 4. Batch Scrape URLs (`batch_scrape_urls`)

Scrape up to 10k URLs at the same time. Perfect for large-scale data extraction.

```json
{
  "name": "batch_scrape_urls",
  "arguments": {
    "urls_to_scrape": [
      {"url": "https://example.com/a", "custom_id": "a"},
      {"url": "https://example.com/b", "custom_id": "b"}
    ],
    "output_format": "markdown",
    "country": "US",
    "wait_before_scraping": 500,
    "parser": "@olostep/amazon-product"
  }
}
```

#### Response includes:

- `batch_id`, `status`, `total_urls`, `created_at`, `formats`, `country`, `parser`, `urls`

### 5. Create Crawl (`create_crawl`)

Start an **async** crawl that autonomously discovers and scrapes entire websites by following links. Returns a `crawl_id` — the crawl runs in the background and does **not** return content in this response. You must then call `get_crawl_results` with the `crawl_id` to poll status and retrieve the scraped pages (same two-step pattern as `batch_scrape_urls` + `get_batch_results`).

```json
{
  "name": "create_crawl",
  "arguments": {
    "start_url": "https://example.com/docs",
    "max_pages": 25,
    "follow_links": true,
    "output_format": "markdown",
    "country": "US",
    "parser": "@olostep/doc-parser"
  }
}
```

#### Response includes:

- `crawl_id`, `object`, `status`, `start_url`, `max_pages`, `follow_links`, `created`, `formats`, `country`, `parser`

> Pair this call with `get_crawl_results` — do **not** pass a `crawl_id` to `get_batch_results` (crawls and batches are separate resources).

### 6. Create Map (`create_map`)

Get all URLs on a website. Extract all URLs for discovery and analysis.

```json
{
  "name": "create_map",
  "arguments": {
    "website_url": "https://example.com",
    "search_query": "blog",
    "top_n": 200,
    "include_url_patterns": ["/blog/**"],
    "exclude_url_patterns": ["/admin/**"]
  }
}
```

#### Response includes:

- `map_id`, `object`, `url`, `total_urls`, `urls`, `search_query`, `top_n`

### 7. Get Webpage Content (`get_webpage_content`)

Retrieves webpage content in clean markdown format with support for JavaScript rendering.

```json
{
  "name": "get_webpage_content",
  "arguments": {
    "url_to_scrape": "https://example.com",
    "wait_before_scraping": 1000,
    "country": "US"
  }
}
```

#### Parameters:

- `url_to_scrape`: The URL of the webpage to scrape (required)
- `wait_before_scraping`: Time to wait in milliseconds before starting the scrape (default: 0)
- `country`: Residential country to load the request from (e.g., US, CA, GB) (optional)

#### Response:

```json
{
  "content": [
    {
      "type": "text",
      "text": "# Example Website\n\nThis is the markdown content of the webpage..."
    }
  ]
}
```

### 8. Get Website URLs (`get_website_urls`)

Search and retrieve relevant URLs from a website, sorted by relevance to your query.

```json
{
  "name": "get_website_urls",
  "arguments": {
    "url": "https://example.com",
    "search_query": "your search term"
  }
}
```

#### Parameters:

- `url`: The URL of the website to map (required)
- `search_query`: The search query to sort URLs by (required)

#### Response:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 42 URLs matching your query:\n\nhttps://example.com/page1\nhttps://example.com/page2\n..."
    }
  ]
}
```

### 9. Get Batch Results (`get_batch_results`)

Retrieve the results of a previously submitted batch scrape job using its `batch_id`.

```json
{
  "name": "get_batch_results",
  "arguments": {
    "batch_id": "batch_abc123"
  }
}
```

#### Parameters:

- `batch_id`: The batch ID returned from `batch_scrape_urls` (required)

#### Response includes:

- `batch_id`, `status` (`processing` or `completed`), `total_urls`, `completed_urls`, `items` (array of scraped results per URL with `url`, `custom_id`, `markdown_content`, `html_content`, `json_content`, `text_content`, `status`, `page_metadata`)

### 10. Get Crawl Results (`get_crawl_results`)

Retrieve the status and scraped pages for an async crawl started with `create_crawl`. This is the required companion to `create_crawl` — `create_crawl` only kicks off the job and returns a `crawl_id`; this tool is how you actually fetch the discovered pages and their content.

```json
{
  "name": "get_crawl_results",
  "arguments": {
    "crawl_id": "crawl_abc123",
    "formats": ["markdown"],
    "items_limit": 20,
    "cursor": 0
  }
}
```

#### Parameters:

- `crawl_id`: The crawl ID returned from `create_crawl` (required)
- `formats`: Array of formats to retrieve per page — `markdown`, `html`, `json`, `text` (default: `["markdown"]`)
- `items_limit`: Max pages to retrieve content for, 1–100 (default: 20)
- `cursor`: Pagination cursor into the list of discovered pages (default: 0)
- `search_query`: Optional filter to rank/select pages by relevance to a query

#### Response includes:

- **While in progress:** `crawl_id`, `status` (`in_progress`), `pages_completed`, `pages_total`, and a `message` prompting you to call again in ~10 seconds.
- **When completed:** `crawl_id`, `status` (`completed`), `pages_returned`, `next_cursor`, `has_more`, and a `pages` array where each entry has `url`, `custom_id`, and the requested content fields (`markdown_content`, `html_content`, `json_content`, `text_content`).

## Error Handling

The server provides robust error handling:

- Detailed error messages for API issues
- Network error reporting
- Authentication failure handling
- Rate limit information

Example error response:

```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Olostep API Error: 401 Unauthorized. Details: {\"error\":\"Invalid API key\"}"
    }
  ]
}
```

## Distribution

### Docker Images

The MCP server is available as a Docker image:

- **Docker Hub:** `[olostep/mcp-server](https://hub.docker.com/r/olostep/mcp-server)`
- **Official Docker MCP Registry:** `mcp/olostep` (coming soon - enhanced security with signatures & SBOMs)
- **GitHub Container Registry:** `ghcr.io/olostep/olostep-mcp-server`

### Docker Desktop MCP Toolkit

The Olostep MCP Server is being added to Docker Desktop's official MCP Toolkit, which means users will be able to:

- Discover it in Docker Desktop's MCP Toolkit UI
- Install it with one click
- Configure it visually
- Use it with any MCP-compatible client (Claude Desktop, Cursor, etc.)

**Status**: Submission in progress to [Docker MCP Registry](https://github.com/docker/mcp-registry)

### Supported Platforms

- `linux/amd64`
- `linux/arm64`

### Building Locally

```bash
# Clone the repository
git clone https://github.com/olostep/olostep-mcp-server.git
cd olostep-mcp-server

# Build the image
npm install
npm run build
docker build -t olostep/mcp-server .

# Run locally
docker run -i --rm -e OLOSTEP_API_KEY="your-key" olostep/mcp-server
```

## License

ISC License