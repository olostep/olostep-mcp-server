# Olostep MCP Server

[![Docker Pulls](https://img.shields.io/docker/pulls/olostep/mcp-server)](https://hub.docker.com/r/olostep/mcp-server)
[![Docker Image Version](https://img.shields.io/docker/v/olostep/mcp-server?sort=semver)](https://hub.docker.com/r/olostep/mcp-server)

**The official MCP (Model Context Protocol) server for [Olostep](https://olostep.com) - web scraping, search, and AI-powered answers for AI agents and LLMs.**

## 🚀 Quick Start

```bash
docker run -i --rm -e OLOSTEP_API_KEY="your-key" olostep/mcp-server
```

Get your free API key at [olostep.com/auth](https://olostep.com/auth)

## ✨ Features

| Tool | Description |
|------|-------------|
| `scrape_website` | Extract content from URLs (HTML, Markdown, JSON, Text) |
| `search_web` | Web search with structured results |
| `answers` | AI-powered answers with sources and citations |
| `batch_scrape_urls` | Batch processing up to 100k URLs |
| `create_crawl` | Autonomous website crawling |
| `create_map` | Website URL discovery and mapping |

## 🔧 Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "olostep": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "OLOSTEP_API_KEY=YOUR_API_KEY",
        "olostep/mcp-server"
      ]
    }
  }
}
```

## 🔧 Usage with Cursor

Add an MCP server:
- **Name:** `olostep`
- **Type:** `command`  
- **Command:** `docker run -i --rm -e OLOSTEP_API_KEY=your-key olostep/mcp-server`

## 📦 Tags

- `latest` - Latest stable release
- `v1.0.9` - Current version

## 🔗 Links

- **Website:** [olostep.com](https://olostep.com)
- **GitHub:** [olostep/olostep-mcp-server](https://github.com/olostep/olostep-mcp-server)
- **API Key:** [Get Free Key](https://olostep.com/auth)
- **Docs:** [Documentation](https://docs.olostep.com)

## 📄 License

ISC License
