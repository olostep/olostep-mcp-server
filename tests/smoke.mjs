#!/usr/bin/env node
// Universal MCP smoke test for the Olostep MCP server.
//
// Modes:
//   node tests/smoke.mjs stdio  [--module ./build/index.js] [--no-real]
//   node tests/smoke.mjs remote --url https://mcp.olostep.com/mcp  [--no-real]
//
// Reads the API key from OLOSTEP_TEST_API_KEY. If unset (or --no-real is passed),
// the real-API check is skipped — schema/protocol checks still run.
//
// Exit codes: 0 = all checks pass, 1 = any check failed, 2 = bad args.

import { spawn } from "node:child_process";
import process from "node:process";

// ---------- Transports ----------

class StdioTransport {
  constructor(modulePath, apiKey) {
    this.modulePath = modulePath;
    this.apiKey = apiKey;
    this.pending = new Map();
    this.nextId = 1;
  }

  async start() {
    this.proc = spawn(process.execPath, [this.modulePath], {
      env: { ...process.env, OLOSTEP_API_KEY: this.apiKey },
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.proc.stdout.setEncoding("utf8"); // avoid utf-8 corruption across chunk boundaries
    this.proc.stderr.on("data", () => {}); // server logs go to stderr — ignore
    this.proc.on("error", (e) => {
      console.error("spawn failed:", e.message);
      process.exit(1);
    });

    let buf = "";
    this.proc.stdout.on("data", (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id !== undefined && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    });

    // JSON-RPC over stdio is request/response — the per-request timeout in `request()`
    // covers slow boot. No artificial sleep needed.
  }

  request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`timeout after 60s on ${method}`));
        }
      }, 60000);
    });
  }

  notify(method, params) {
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
  }

  async stop() {
    this.proc?.kill();
  }
}

class RemoteTransport {
  constructor(url, apiKey) {
    this.url = url;
    this.apiKey = apiKey;
    this.nextId = 1;
  }

  async start() {}

  async request(method, params) {
    const id = this.nextId++;
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} on ${method}: ${body.slice(0, 200)}`);
    }
    const text = await res.text();
    const messages = parseSse(text);
    const msg = messages.find((m) => m.id === id) || messages[0];
    if (!msg) throw new Error(`empty response on ${method}: ${text.slice(0, 200)}`);
    if (msg.error) throw new Error(msg.error.message || JSON.stringify(msg.error));
    return msg.result;
  }

  notify() {
    // stateless server has no persistent session — notifications are no-ops here
  }

  async stop() {}
}

// ---------- util ----------

function parseSse(text) {
  // SSE per spec: events separated by blank lines; multiple `data:` lines per event
  // are joined with `\n` before parsing. Today the server emits single-line JSON, but
  // if it ever pretty-prints or chunks at a `\n` inside a string, the naive grep
  // would drop the message.
  const out = [];
  for (const event of text.split(/\r?\n\r?\n/)) {
    const dataLines = [];
    for (const line of event.split(/\r?\n/)) {
      if (line.startsWith("data: ")) dataLines.push(line.slice(6));
      else if (line.startsWith("data:")) dataLines.push(line.slice(5));
    }
    if (dataLines.length === 0) continue;
    try {
      out.push(JSON.parse(dataLines.join("\n")));
    } catch {
      // ignore non-JSON event
    }
  }
  return out;
}

function parseArgs(argv) {
  const out = { mode: argv[0] };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-real") out.noReal = true;
    else if (a === "--module") out.module = argv[++i];
    else if (a === "--url") out.url = argv[++i];
  }
  return out;
}

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(2);
}

// ---------- main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OLOSTEP_TEST_API_KEY || "";
  const skipReal = args.noReal || !apiKey;

  let transport;
  if (args.mode === "stdio") {
    transport = new StdioTransport(args.module || "./build/index.js", apiKey || "fake-key-for-schema");
  } else if (args.mode === "remote") {
    if (!args.url) die('--url is required for "remote" mode');
    transport = new RemoteTransport(args.url, apiKey || "fake-key-for-schema");
  } else {
    die('mode must be "stdio" or "remote"');
  }

  const results = [];
  const check = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: "PASS" });
      console.log(`PASS  ${name}`);
    } catch (e) {
      results.push({ name, status: "FAIL", error: e.message });
      console.log(`FAIL  ${name}`);
      console.log(`      ${e.message}`);
    }
  };

  await transport.start();

  await check("initialize", async () => {
    const r = await transport.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "olostep-smoke", version: "1" },
    });
    if (!r?.serverInfo?.name) throw new Error("no serverInfo in response");
  });

  await transport.notify("notifications/initialized", {});

  let tools;
  await check("tools/list returns 10 tools", async () => {
    const r = await transport.request("tools/list", {});
    tools = r?.tools || [];
    if (tools.length !== 10) {
      throw new Error(`got ${tools.length} tools, expected 10`);
    }
  });

  await check("schema: wait_for_completion_seconds.maximum = 900", () => {
    const t = tools.find((x) => x.name === "batch_scrape_urls");
    const w = t?.inputSchema?.properties?.wait_for_completion_seconds;
    if (w?.maximum !== 900) throw new Error(`maximum = ${w?.maximum}, expected 900`);
  });

  // Trip-wires: every tool has a meaningful description that mentions its core verb.
  // Exact-wording assertions (e.g. "PREFERRED tool for crawling") live in the golden
  // file at `tests/description-goldens.json` and are checked by
  // `tests/check-descriptions.mjs`. That separate check fails loudly if descriptions
  // drift without an intentional goldens update — but doesn't break this smoke on
  // every wording tweak.
  await check("schema: every tool has a non-trivial description", () => {
    for (const t of tools) {
      if (!t.description || t.description.length < 40) {
        throw new Error(`tool ${t.name} has missing/short description (${t.description?.length || 0} chars)`);
      }
    }
  });

  await check("schema: expected tool set is present", () => {
    const expected = [
      "scrape_website",
      "get_webpage_content",
      "search_web",
      "answers",
      "batch_scrape_urls",
      "get_batch_results",
      "create_crawl",
      "get_crawl_results",
      "create_map",
      "get_website_urls",
    ];
    const got = new Set(tools.map((t) => t.name));
    const missing = expected.filter((n) => !got.has(n));
    const unexpected = [...got].filter((n) => !expected.includes(n));
    if (missing.length || unexpected.length) {
      throw new Error(`missing=[${missing.join(",")}] unexpected=[${unexpected.join(",")}]`);
    }
  });

  if (skipReal) {
    console.log("SKIP  scrape_website real call (no OLOSTEP_TEST_API_KEY or --no-real)");
  } else {
    await check("scrape_website https://example.com returns 'Example Domain'", async () => {
      const r = await transport.request("tools/call", {
        name: "scrape_website",
        arguments: { url_to_scrape: "https://example.com", output_format: "markdown" },
      });
      const text = r?.content?.[0]?.text || "";
      if (!text.includes("Example Domain")) {
        throw new Error(`response did not contain 'Example Domain'. First 200 chars: ${text.slice(0, 200)}`);
      }
    });
  }

  await transport.stop();

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`\n${passed} passed, ${failed} failed${skipReal ? " (real-API check skipped)" : ""}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("fatal:", e.message);
  process.exit(1);
});
