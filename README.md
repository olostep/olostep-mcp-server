# Olostep MCP Server

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

### Running with npx

```bash
env OLOSTEP_API_KEY=your-api-key npx -y olostep-mcp
```

On Windows (PowerShell):

```powershell
$env:OLOSTEP_API_KEY = \"your-api-key\"; npx -y olostep-mcp
```

On Windows (CMD):

```cmd
set OLOSTEP_API_KEY=your-api-key && npx -y olostep-mcp
```

### Manual Installation

```bash
npm install -g olostep-mcp
```

### Running on Claude Desktop

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

Or for a more straightforward way you can install via the Smithery CLI by running the following code in your device terminal

```
npx -y @smithery/cli install @olostep/olostep-mcp-server --client claude
```

### Running on Windsurf

Add this to your `./codeium/windsurf/model_config.json`:

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

### Running on Cursor

To configure Olostep MCP in Cursor:

1. Open Cursor Settings
2. Go to Features > MCP Servers 
3. Click "+ Add New MCP Server"
4. Enter the following:
   - Name: "olostep-mcp" (or your preferred name)
   - Type: "command"
   - Command: `env OLOSTEP_API_KEY=your-api-key npx -y olostep-mcp`

Replace `your-api-key` with your Olostep API key.

### Running on Metorial

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

Autonomously discover and scrape entire websites by following links.

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

### 9. Web Search (`google_search`)

Retrieve structured data from web search results.

```json
{
  "name": "google_search",
  "arguments": {
    "query": "your search query",
    "country": "US"
  }
}
```

#### Parameters:

- `query`: The search query to perform (required)
- `country`: Country code for localized results (e.g., US, GB) (default: "US")

#### Response includes:

- Organic search results with titles, links, and snippets
- Knowledge graph data when available
- Related questions (People Also Ask)
- Related searches
- Rich snippets and other structured data

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


## License

ISC License
