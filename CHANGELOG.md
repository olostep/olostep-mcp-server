# Changelog

All notable changes to the Olostep MCP Server will be documented in this file.

## [Unreleased]

## [1.0.21] - 2026-11-11

### Added
- Server instructions sent on connect: which tool to use for which goal, with the routing rule in the first 512 characters, plus how to follow up on crawl and batch jobs.
- `max_characters` on `scrape_website`, `get_crawl_results` and `get_batch_results` (default 20,000 per page).
- Every scraped page now comes back with its `url` and `title`.
- `search_web` takes `limit` (1-25), `include_domains`, `exclude_domains`, `scrape_results` and `max_characters`. With `scrape_results`, each result includes its page content as markdown, capped at `max_characters` (default 20,000).

### Changed
- `search_web` now uses the Olostep `/v1/searches` endpoint instead of scraping a Google results page. Results are `{ url, title, description }` under `results` (previously Google's `organic` list and related searches). The `country` parameter is removed: `/v1/searches` does not take one, and calls that still pass it keep working.
- Tool descriptions rewritten as "Use this when..." with when to use a sibling tool instead. `answers` no longer warns about lists; it points list-of-items tasks to `scrape_website`.
- Page content longer than `max_characters` is cut, and the result lists the cut fields under `truncated` with the full length and a `full_text_url`. Before, a single page could return 70 KB or more.
- `get_webpage_content` and `get_website_urls`, duplicates of `scrape_website` and `create_map`, are no longer listed in `tools/list`. Calls to them still work.
- Safety hints are set explicitly per tool. `create_crawl` and `batch_scrape_urls` are now `readOnlyHint: true` like the other tools (they only read public web pages); they stay `idempotentHint: false` because each call starts a new job.

### Fixed
- The server reported version 1.0.0 to clients; it now reports the package version.
- `get_batch_results` returned `has_more: true` and a `next_cursor` when the first page already held every URL (e.g. any batch of up to 20 URLs read by `batch_scrape_urls`), so agents made one extra empty call.

## [1.0.20] - 2026-11-08

### Added
- `get_batch_results` takes a `cursor` and returns `next_cursor`, so batches larger than one call can be read in full.

### Changed
- `batch_scrape_urls` now accepts up to 100k URLs, matching the Olostep API.
- Updated the batch wording and tagline: scale to 1M requests with 10 parallel batches.

### Fixed
- `get_batch_results` always read from the start of a batch, so items past the first call could not be retrieved.
- `has_more` on `get_batch_results` and `get_crawl_results` is now `false` once an empty page is reached.
- If a status check failed (e.g. 401 or 500) while `create_crawl` or `batch_scrape_urls` was waiting, the error was dropped and the job was reported as still running. It now returns the HTTP status and the job id. Page and item listing failures after a job completes are also errors with their HTTP status.
- A crawl or batch status other than `in_progress` or `completed` is now an error instead of "call again in ~10 seconds", so an unexpected status can't leave an agent polling forever.

## [1.0.13] - 2026-04-21

### Added
- `get_crawl_results` tool — the missing companion to `create_crawl`. Polls crawl status via `GET /v1/crawls/{crawl_id}`, lists discovered pages via `GET /v1/crawls/{crawl_id}/pages`, and retrieves scraped content per page in the requested formats (`markdown`, `html`, `json`, `text`). Supports pagination via `cursor`/`items_limit` and optional `search_query` filtering.

### Fixed
- Agents using Claude Code, Cursor, and other MCP clients could not complete a crawl workflow — `create_crawl` returned only a `crawl_id` with no paired fetcher, so agents fell back to `get_website_urls` + `batch_scrape_urls`. The new `get_crawl_results` tool closes the loop.
- Rewrote `create_crawl`'s description to explicitly state it is asynchronous, returns a `crawl_id`, and must be paired with `get_crawl_results` (not `get_batch_results` — crawls and batches are separate API resources).

## [1.0.11] - 2026-03-16

### Added
- Cloud-ready HTTP transport support using Express
- Dual-mode transport support (Stdio and HTTP) via `TRANSPORT` env var or `--transport` flag
- Health check endpoint (`/health`)
- Docker configuration for cloud deployment (`Dockerfile.cloud`, `.dockerignore.cloud`)

### Changed
- Updated `@modelcontextprotocol/sdk` to v1.27.1
- Refactored server initialization to support multiple transports
- Improved logging with structured JSON output

## [1.0.8] - 2024-12-01

### Added
- Added logo and icon assets for MCP directory listings
- Improved package metadata with better keywords for discoverability
- Enhanced description across all configuration files

### Changed
- Synchronized version numbers across server.json and package.json

## [1.0.7] - 2024-11-14

### Added
- `answers` tool - AI-powered answers with citations and optional JSON-shaped outputs
- `batch_scrape_urls` tool - Batch scraping of up to 10k URLs
- `create_crawl` tool - Autonomous site crawling from a start URL
- `create_map` tool - Website URL discovery and mapping with include/exclude filters

### Improved
- Enhanced error handling and reporting
- Better documentation with examples for all tools

## [1.0.6] - 2024-10-28

### Added
- `search_web` tool - Parser-based web search with structured results
- Country-specific request routing for geo-targeted content

## [1.0.5] - 2024-10-15

### Added
- `scrape_website` tool with parser support
- Configurable wait times for JavaScript-heavy websites

## [1.0.0] - 2024-09-20

### Initial Release
- `get_webpage_content` - Retrieve webpage content in markdown
- `get_website_urls` - Search and retrieve relevant URLs from a website  
- `web_search` - Structured web search results

