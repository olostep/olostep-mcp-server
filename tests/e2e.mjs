#!/usr/bin/env node
/**
 * Deep end-to-end test suite for the Olostep MCP server.
 *
 * Exercises every tool with real Olostep API calls, including the async
 * batch and crawl polling workflows and error handling. Uses the official
 * MCP SDK client over Streamable HTTP.
 *
 * Target is configurable so the same suite runs:
 *   - in CI before deploy, against a locally-spawned server
 *   - after deploy, against the live hosted server
 *
 * Env:
 *   MCP_URL          MCP endpoint (default: https://mcp.olostep.com/mcp)
 *   HEALTH_URL       health endpoint (default: derived from MCP_URL)
 *   OLOSTEP_API_KEY  API key (falls back to OLOSTEP_TEST_API_KEY)
 *
 * Exit codes: 0 = all pass, 1 = any failure.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = process.env.MCP_URL ?? "https://mcp.olostep.com/mcp";
const API_KEY = process.env.OLOSTEP_API_KEY ?? process.env.OLOSTEP_TEST_API_KEY;
const HEALTH_URL = process.env.HEALTH_URL ?? MCP_URL.replace(/\/mcp\/?$/, "/health");

const EXPECTED_TOOLS = [
  "create_map",
  "create_crawl",
  "get_crawl_results",
  "batch_scrape_urls",
  "get_batch_results",
  "answers",
  "search_web",
  "scrape_website",
  "get_webpage_content",
  "get_website_urls",
];

const results = [];

function log(status, name, detail = "") {
  const row = { status, name, detail: String(detail).slice(0, 200) };
  results.push(row);
  const icon = status === "PASS" ? "✓" : status === "SKIP" ? "○" : "✗";
  console.log(`${icon} ${status.padEnd(5)} ${name}${detail ? ` — ${detail}` : ""}`);
}

function parseToolText(result) {
  const text = result?.content?.find((c) => c.type === "text")?.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

function hasWebsiteUrls(data) {
  if (Array.isArray(data.urls) && data.urls.length > 0) return true;
  const raw = data._raw ?? "";
  return /Found \d+ URLs/i.test(raw) || (raw.includes("https://") && raw.split("https://").length > 2);
}

async function call(client, name, args, timeoutMs = 300000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await client.callTool({ name, arguments: args }, undefined, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!API_KEY) {
    console.error("OLOSTEP_API_KEY (or OLOSTEP_TEST_API_KEY) is not set");
    process.exit(1);
  }

  console.log(`\n=== Olostep MCP E2E ===`);
  console.log(`target: ${MCP_URL}\n`);

  // 0. Health
  try {
    const h = await fetch(HEALTH_URL);
    const body = await h.json();
    log(h.ok && body.status === "ok" ? "PASS" : "FAIL", "health_endpoint", JSON.stringify(body));
  } catch (e) {
    log("FAIL", "health_endpoint", e.message);
  }

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: { headers: { Authorization: `Bearer ${API_KEY}` } },
  });
  const client = new Client({ name: "e2e-suite", version: "1.0.0" });

  try {
    await client.connect(transport);
    log("PASS", "mcp_connect");
  } catch (e) {
    log("FAIL", "mcp_connect", e.message);
    printSummary();
    process.exit(1);
  }

  // 1. listTools
  let tools;
  try {
    const listed = await client.listTools();
    tools = listed.tools.map((t) => t.name).sort();
    const missing = EXPECTED_TOOLS.filter((n) => !tools.includes(n));
    const extra = tools.filter((n) => !EXPECTED_TOOLS.includes(n));
    if (missing.length === 0 && tools.length >= 10) {
      log("PASS", "list_tools", `${tools.length} tools`);
    } else {
      log("FAIL", "list_tools", `missing=${missing.join(",")} extra=${extra.join(",")}`);
    }
  } catch (e) {
    log("FAIL", "list_tools", e.message);
    await client.close();
    printSummary();
    process.exit(1);
  }

  // 2. scrape_website — markdown
  try {
    const r = await call(client, "scrape_website", {
      url_to_scrape: "https://example.com",
      output_format: "markdown",
    });
    const data = parseToolText(r);
    const md = data.markdown_content ?? data.result?.markdown_content ?? "";
    log(!r.isError && md.includes("Example Domain") ? "PASS" : "FAIL", "scrape_website_markdown");
  } catch (e) {
    log("FAIL", "scrape_website_markdown", e.message);
  }

  // 3. scrape_website — html
  try {
    const r = await call(client, "scrape_website", {
      url_to_scrape: "https://example.com",
      output_format: "html",
      wait_before_scraping: 0,
    });
    const data = parseToolText(r);
    const html = data.html_content ?? data.result?.html_content ?? "";
    log(!r.isError && (html.includes("Example") || html.includes("example")) ? "PASS" : "FAIL", "scrape_website_html");
  } catch (e) {
    log("FAIL", "scrape_website_html", e.message);
  }

  // 4. get_webpage_content
  try {
    const r = await call(client, "get_webpage_content", {
      url_to_scrape: "https://example.com",
    });
    const data = parseToolText(r);
    const md = data.markdown_content ?? data.result?.markdown_content ?? data._raw ?? "";
    log(!r.isError && String(md).includes("Example") ? "PASS" : "FAIL", "get_webpage_content");
  } catch (e) {
    log("FAIL", "get_webpage_content", e.message);
  }

  // 5. search_web
  try {
    const r = await call(client, "search_web", {
      query: "Model Context Protocol MCP",
      country: "US",
    });
    const data = parseToolText(r);
    const hasOrganic = Array.isArray(data.organic) && data.organic.length > 0;
    log(!r.isError && hasOrganic ? "PASS" : "FAIL", "search_web", hasOrganic ? `${data.organic.length} results` : "");
  } catch (e) {
    log("FAIL", "search_web", e.message);
  }

  // 6. answers
  try {
    const r = await call(client, "answers", {
      task: "What is example.com used for? Answer in one short sentence.",
    }, 180000);
    const data = parseToolText(r);
    const hasAnswer =
      data.result?.json_content ||
      data.json_content ||
      (data._raw && data._raw.length > 20);
    log(!r.isError && hasAnswer ? "PASS" : "FAIL", "answers");
  } catch (e) {
    log("FAIL", "answers", e.message);
  }

  // 7. create_map
  let mapUrls = [];
  try {
    const r = await call(client, "create_map", {
      website_url: "https://docs.olostep.com",
      top_n: 5,
    }, 180000);
    const data = parseToolText(r);
    mapUrls = data.urls ?? [];
    log(!r.isError && mapUrls.length > 0 ? "PASS" : "FAIL", "create_map", `${mapUrls.length} urls`);
  } catch (e) {
    log("FAIL", "create_map", e.message);
  }

  // 8. get_website_urls (requires search_query)
  try {
    const r = await call(client, "get_website_urls", {
      url: "https://docs.olostep.com",
      search_query: "api",
    }, 180000);
    const data = parseToolText(r);
    log(!r.isError && hasWebsiteUrls(data) ? "PASS" : "FAIL", "get_website_urls");
  } catch (e) {
    log("FAIL", "get_website_urls", e.message);
  }

  // 9. batch workflow
  let batchId = null;
  try {
    const r = await call(client, "batch_scrape_urls", {
      urls_to_scrape: [
        { url: "https://example.com", custom_id: "0" },
        { url: "https://iana.org/domains/example", custom_id: "1" },
      ],
      output_format: "markdown",
      wait_for_completion_seconds: 0,
    }, 90000);
    const data = parseToolText(r);
    batchId = data.id ?? data.batch_id ?? null;
    const status = data.status ?? "";
    const done = status === "completed" || (data.completed_urls >= 2);
    log(!r.isError && batchId ? "PASS" : "FAIL", "batch_scrape_urls", `id=${batchId} status=${status}`);
    if (!done && batchId) {
      log("SKIP", "batch_wait_inline", "not completed inline, will poll");
    }
  } catch (e) {
    log("FAIL", "batch_scrape_urls", e.message);
  }

  // 10. get_batch_results
  if (batchId) {
    try {
      let completed = false;
      for (let i = 0; i < 18 && !completed; i++) {
        const r = await call(client, "get_batch_results", {
          batch_id: batchId,
          formats: ["markdown"],
          items_limit: 5,
        });
        const data = parseToolText(r);
        const status = data.status ?? "";
        if (status === "completed" || (data.items && data.items.length > 0)) {
          completed = true;
          const count = data.items?.length ?? data.items_count ?? 0;
          log(!r.isError ? "PASS" : "FAIL", "get_batch_results", `status=${status} items=${count}`);
          break;
        }
        if (i < 17) await sleep(10000);
      }
      if (!completed) log("FAIL", "get_batch_results", "timeout after polling");
    } catch (e) {
      log("FAIL", "get_batch_results", e.message);
    }
  } else {
    log("SKIP", "get_batch_results", "no batch_id");
  }

  // 11. crawl workflow
  let crawlId = null;
  try {
    const r = await call(client, "create_crawl", {
      start_url: "https://example.com",
      max_pages: 2,
      output_format: "markdown",
    }, 120000);
    const data = parseToolText(r);
    crawlId = data.crawl_id ?? data.id ?? null;
    log(!r.isError && crawlId ? "PASS" : "FAIL", "create_crawl", `id=${crawlId}`);
  } catch (e) {
    log("FAIL", "create_crawl", e.message);
  }

  // 12. get_crawl_results (poll)
  if (crawlId) {
    try {
      let done = false;
      for (let i = 0; i < 24 && !done; i++) {
        const r = await call(client, "get_crawl_results", {
          crawl_id: crawlId,
          formats: ["markdown"],
          items_limit: 5,
        }, 120000);
        const data = parseToolText(r);
        const status = data.status ?? "";
        const pages = data.pages ?? data.items ?? [];
        if (status === "completed" || pages.length > 0) {
          done = true;
          log(!r.isError ? "PASS" : "FAIL", "get_crawl_results", `status=${status} pages=${pages.length}`);
          break;
        }
        if (i < 23) await sleep(10000);
      }
      if (!done) log("FAIL", "get_crawl_results", "timeout after polling");
    } catch (e) {
      log("FAIL", "get_crawl_results", e.message);
    }
  } else {
    log("SKIP", "get_crawl_results", "no crawl_id");
  }

  // 13. answers with JSON shape
  try {
    const r = await call(client, "answers", {
      task: "What is the Model Context Protocol?",
      json: { summary: "", official_url: "" },
    }, 180000);
    const data = parseToolText(r);
    log(!r.isError && (data.result || data._raw?.length > 30) ? "PASS" : "FAIL", "answers_structured_json");
  } catch (e) {
    log("FAIL", "answers_structured_json", e.message);
  }

  // 14. scrape with country
  try {
    const r = await call(client, "scrape_website", {
      url_to_scrape: "https://example.com",
      output_format: "markdown",
      country: "US",
    });
    const data = parseToolText(r);
    const md = data.markdown_content ?? data.result?.markdown_content ?? "";
    const ok = !r.isError && (String(md).includes("Example") || data.page_metadata?.status_code === 200);
    log(ok ? "PASS" : "FAIL", "scrape_website_country_us");
  } catch (e) {
    log("FAIL", "scrape_website_country_us", e.message);
  }

  // 15. Error handling — invalid URL
  try {
    const r = await call(client, "scrape_website", {
      url_to_scrape: "https://this-domain-definitely-does-not-exist-olostep-e2e.invalid",
      output_format: "markdown",
    }, 60000);
    log(r.isError ? "PASS" : "FAIL", "error_invalid_domain", r.isError ? "returned isError" : "unexpected success");
  } catch (e) {
    log("PASS", "error_invalid_domain", "threw as expected");
  }

  await client.close();
  printSummary();
}

function printSummary() {
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  console.log("\n=== Summary ===");
  console.log(`PASS: ${pass}  FAIL: ${fail}  SKIP: ${skip}  TOTAL: ${results.length}`);
  if (fail > 0) {
    console.log("\nFailed:");
    results.filter((r) => r.status === "FAIL").forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
