# Olostep MCP Server

A Model Context Protocol (MCP) server implementation that integrates with [Olostep](https://olostep.com) for web scraping, content extraction, and search capabilities.
To set up Olostep MCP Server, you need to have an API key. You can get the API key by signing up on the [Olostep website](https://olostep.com/auth).


## Features

- Web page content extraction with clean markdown formatting
- Google search results with structured data extraction
- Website URL discovery and mapping
- Country-specific request routing for geo-targeted content
- Configurable wait times for JavaScript-heavy websites
- Comprehensive error handling and reporting
- Simple API key configuration

## Installation

### Running with npx

```bash
env OLOSTEP_API_KEY=your-api-key npx -y olostep-mcp
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

## Configuration

### Environment Variables

- `OLOSTEP_API_KEY`: Your Olostep API key (required)

## Available Tools

### 1. Get Webpage Content (`get_webpage_content`)

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

### 2. Get Website URLs (`get_website_urls`)

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

### 3. Google Search (`google_search`)

Retrieve structured data from Google search results.

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

