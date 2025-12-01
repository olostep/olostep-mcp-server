# MCP Directory Submission Guide

Use this information to submit Olostep MCP to various directories.

## Quick Copy Info

**Name:** Olostep MCP Server  
**Package:** `olostep-mcp` (npm)  
**Install:** `npx -y olostep-mcp`  
**GitHub:** https://github.com/olostep/olostep-mcp-server  
**Website:** https://olostep.com  
**Docs:** https://docs.olostep.com  
**Logo:** `assets/logo.png` (Square icon)  
**Category:** Web Scraping / Search / AI Tools

---

## Short Description (1 line)

API to search, extract and structure web data. Web scraping, AI-powered answers with citations, batch processing (10k URLs), and autonomous site crawling for AI agents.

---

## Medium Description (2-3 lines)

Olostep MCP Server is a web search, scraping and crawling API for AI agents. Features include single URL scraping, batch processing of 10k+ URLs, AI-powered answers with citations, structured web search results, and autonomous site crawling. Perfect for building AI workflows that need real-time web data.

---

## Full Description

Olostep MCP Server is a Model Context Protocol server that integrates with [Olostep](https://olostep.com) for web scraping, content extraction, and search capabilities.

### Features

- **Scrape Websites** - Extract content in HTML, Markdown, JSON, or Plain Text
- **Web Search** - Structured search results with knowledge panels, related questions, and rich snippets
- **AI Answers** - AI-powered answers with citations in custom JSON shapes
- **Batch Scraping** - Process up to 10,000 URLs simultaneously
- **Site Crawling** - Autonomously discover and scrape entire websites
- **URL Mapping** - Discover all URLs on a website with include/exclude filters
- **Geo-targeting** - Route requests through specific countries (US, GB, CA, etc.)
- **JS Rendering** - Handle JavaScript-heavy websites with configurable wait times

### Available Tools (9)

1. `scrape_website` - Extract content from a single URL
2. `search_web` - Web search with structured results
3. `answers` - AI-powered answers with citations
4. `batch_scrape_urls` - Scrape up to 10k URLs at once
5. `create_crawl` - Autonomous site crawler
6. `create_map` - URL discovery and mapping
7. `get_webpage_content` - Clean markdown extraction
8. `get_website_urls` - Search relevant URLs from a website
9. `web_search` - Parser-based web search with structured data

---

## Directory Submission Checklist

### ✅ Already Listed
- [x] **Smithery** - https://smithery.ai (@olostep/olostep-mcp-server)
- [x] **Metorial** - https://metorial.com

### 📝 To Submit
- [ ] **Glama** - https://glama.ai/mcp/servers (Submit form)
- [ ] **PulseMCP** - https://pulsemcp.com (Submit form)
- [ ] **MCP.so** - https://mcp.so (Submit form)
- [ ] **Awesome MCP Servers** - https://github.com/punkpeye/awesome-mcp-servers (GitHub PR)
- [ ] **MCP Hub** - https://mcphub.io (Submit form)

---

## GitHub PR Template (for Awesome MCP Servers)

Add to the **Web Scraping** or **Search** section:

```markdown
- [Olostep](https://github.com/olostep/olostep-mcp-server) - API to search, extract and structure web data. Web scraping, AI-powered answers with citations, batch processing (10k URLs), and autonomous site crawling. <a href="https://smithery.ai/server/@olostep/olostep-mcp-server"><img alt="Smithery Installs" src="https://smithery.ai/badge/@olostep/olostep-mcp-server"/></a>
```

---

## Configuration Examples

### Claude Desktop
```json
{
  "mcpServers": {
    "olostep": {
      "command": "npx",
      "args": ["-y", "olostep-mcp"],
      "env": {
        "OLOSTEP_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### Cursor
```
Name: olostep-mcp
Type: command
Command: env OLOSTEP_API_KEY=your-api-key npx -y olostep-mcp
```

### Smithery CLI
```bash
npx -y @smithery/cli install @olostep/olostep-mcp-server --client claude
```

---

## Contact

- **Support:** support@olostep.com
- **Twitter:** @olostep
- **Discord:** [Join community](https://discord.gg/olostep)

