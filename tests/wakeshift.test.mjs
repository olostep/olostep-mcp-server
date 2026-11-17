// Wakeshift: create_crawl and batch_scrape_urls wake the conversation when their job
// finishes, through Olostep's job webhook. Runs against a local stub of the API and
// Wakeshift's offline test client: nothing leaves this machine, and no key is needed.
// Run with: npm run build && npm run test:wakeshift

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, beforeEach, test } from "node:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createTestClient, createToolCall, withCall } from "@wakeshift/sdk/testing";

const SECRET = "test-secret-test-secret-test-secret-0123";
const BASE = "https://mcp.example.com";

let api;
let posts; // bodies of the create calls the stub received
let checks; // status checks the stub received
let jobStatus; // what the stub's status checks answer
let createStatus; // what the stub's create calls answer

before(async () => {
  api = createServer((request, response) => {
    let raw = "";
    request.on("data", (c) => (raw += c));
    request.on("end", () => {
      let body = { id: "job_1", status: "in_progress" };
      const path = new URL(request.url, "http://localhost").pathname;
      if (request.method === "POST") {
        posts.push(JSON.parse(raw));
        if (createStatus !== 200) body = { error: "boom" };
      }
      else {
        checks.push(path);
        if (path.endsWith("/pages")) body = { pages: [{ url: "https://a.com", retrieve_id: "r0" }] };
        else if (path.endsWith("/items")) body = { items: [{ url: "https://a.com", retrieve_id: "r0" }] };
        else if (path.endsWith("/retrieve")) body = { markdown_content: "page" };
        else body = { id: "job_1", status: jobStatus, total_urls: 1 };
      }
      response.writeHead(request.method === "POST" ? createStatus : 200, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    });
  });
  await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
  process.env.OLOSTEP_API_URL = `http://127.0.0.1:${api.address().port}/v1`;
});

after(() => {
  api.closeAllConnections();
  api.close();
});

beforeEach(() => {
  posts = [];
  checks = [];
  jobStatus = "in_progress";
  createStatus = 200;
});

const modules = async () => ({
  ...(await import("../build/wakeshift.js")),
  ...(await import("../build/tools/createCrawl.js")),
  ...(await import("../build/tools/batchScrapeUrls.js")),
});

// The server as src/index.ts builds it, with `jobs` undefined when Wakeshift is off.
async function connect(jobs) {
  const { createCrawl, batchScrapeUrls } = await modules();
  const server = new McpServer({ name: "olostep", version: "test" });
  jobs?.attach(server);
  for (const tool of [createCrawl, batchScrapeUrls]) {
    server.registerTool(tool.name, { description: tool.description, inputSchema: tool.schema }, async (params) => {
      const job = await jobs?.start(tool.name, params.wait_for_completion_seconds);
      const args = job?.wakes ? { ...params, wait_for_completion_seconds: 0 } : params;
      return tool.handler(args, "key", undefined, job);
    });
  }
  server.registerTool("plain_tool", { description: "Does nothing." }, async () => ({ content: [{ type: "text", text: "ok" }] }));
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  const client = new Client({ name: "test", version: "1" });
  await client.connect(b);
  return client;
}

// call.wakes as a newer SDK sets it (wakeshift/wakeshift#1173): @wakeshift/sdk
// 0.11.1 has no call.wakes, so a test that needs one sets it on the call
// (undefined leaves it absent, as on 0.11.1).
function withWakes(call, wakes) {
  if (wakes !== undefined) Object.defineProperty(call, "wakes", { value: wakes, configurable: true });
  return call;
}

// Wakeshift on, with each tool call's call.wakes set to `wakes` (true unless
// given: the wake is confirmed), except on a stand-in call that set its own.
async function on(opts = {}) {
  const wakes = "wakes" in opts ? opts.wakes : true;
  const { jobWakes } = await modules();
  const wake = createTestClient({ app: "Olostep" });
  const currentCall = wake.currentCall.bind(wake);
  wake.currentCall = () => {
    const call = currentCall();
    return Object.hasOwn(call, "wakes") ? call : withWakes(call, wakes);
  };
  return { wake, jobs: jobWakes(wake, SECRET, BASE) };
}

const crawlArgs = { url: "https://a.com" }; // the wait left at its default
const tokenOf = (webhook) => webhook.slice(`${BASE}/webhooks/olostep/`.length);

// What Olostep sent on 2026-11-11 (the job's webhook URL left out). Its docs
// name the counts differently (urls_count, items_*): both are below.
const crawlBody = {"id": "event_51f75b6b0369e10c", "object": "event.crawl.completed", "timestamp": 1794432155092, "delivery_attempt": "1/5", "data": {"id": "crawl_mxjd3xvbp6", "object": "crawl", "status": "completed", "created": 1794432098450, "storage": {"expires_in": "7d"}, "cost_usd": null, "max_depth": null, "max_pages": 1, "start_url": "https://example.com", "start_date": "2026-11-11", "pages_count": 1, "exclude_urls": [], "include_urls": ["/**"], "current_depth": 0, "credits_consumed": null, "include_external": false}};
const batchBody = {"id": "event_c8421c9342cdc620", "object": "event.batch.completed", "timestamp": 1794432100346, "delivery_attempt": "1/5", "data": {"id": "batch_c0ebngfqs6q8", "object": "batch", "status": "completed", "created": 1794432099000, "cost_usd": null, "metadata": {}, "start_date": "2026-11-11", "total_urls": 2, "failed_urls": 0, "completed_at": 1794432100000, "completed_urls": 2, "number_retried": 0, "credits_consumed": null}};
const batchProgress = {"id": "event_0ffc1b64da994934", "object": "event.batch.progress", "timestamp": 1794432100319, "delivery_attempt": "1/5", "data": {"id": "batch_c0ebngfqs6q8", "items": [{"url": "https://example.com", "custom_id": "item_68eu779gna", "retrieve_id": "c0ebngfqs6q8_item_68eu779gna"}, {"url": "https://example.org", "custom_id": "item_loclhhxr3l", "retrieve_id": "c0ebngfqs6q8_item_loclhhxr3l"}], "cursor": 1794432100089, "object": "batch", "status": "in_progress", "created": 1794432099000, "total_urls": 2, "items_count": 2, "completed_urls": 2}};

// Olostep's documented bodies (docs.olostep.com/api-reference/common/webhooks).
const documentedCrawl = {
  id: "event_x9y8z7w6v5u4t3s2", object: "event.crawl.completed", timestamp: 1737570000000, delivery_attempt: "1/5",
  data: { id: "crawl_abc789", object: "crawl", status: "completed", start_url: "https://example.com", urls_count: 87,
    max_pages: 100, max_depth: 3, actual_max_depth: 3, start_epoch: 1737569500000, start_date: "2024-01-15" },
};
const documentedBatch = {
  id: "event_a1b2c3d4e5f6g7h8", object: "event.batch.completed", timestamp: 1737570000000, delivery_attempt: "1/5",
  data: { id: "batch_xyz123", object: "batch", status: "completed", items_total: 100, items_completed: 98, items_failed: 2,
    created_at: "2024-01-15T10:00:00Z", completed_at: "2024-01-15T10:05:32Z" },
};

test("off: no webhook, nothing subscribed, and no settings means no Wakeshift and no log line", async () => {
  const { jobWakesFromEnv } = await modules();
  assert.equal(jobWakesFromEnv({}), undefined);
  const client = await connect(undefined);
  await client.callTool({ name: "create_crawl", arguments: { ...crawlArgs, wait_for_completion_seconds: 0 } });
  assert.equal("webhook" in posts[0], false);
});

test("a key without the webhook secret or the public URL leaves Wakeshift off", async () => {
  const { jobWakesFromEnv } = await modules();
  assert.equal(jobWakesFromEnv({ WAKESHIFT_KEY: "wsk_x" }), undefined);
  assert.equal(jobWakesFromEnv({ WAKESHIFT_KEY: "wsk_x", OLOSTEP_WEBHOOK_SECRET: "short" }), undefined);
  assert.equal(jobWakesFromEnv({ OLOSTEP_WEBHOOK_SECRET: SECRET }), undefined);
  assert.equal(jobWakesFromEnv({ WAKESHIFT_KEY: "wsk_x", OLOSTEP_WEBHOOK_SECRET: SECRET }), undefined, "no public URL: off");
  // All three set: the client is made, and a key that isn't one fails at startup.
  assert.throws(() => jobWakesFromEnv({ WAKESHIFT_KEY: "wsk_x", OLOSTEP_WEBHOOK_SECRET: SECRET, OLOSTEP_PUBLIC_URL: BASE }), { code: "config" });
});

test("a wakeable call: create_crawl subscribes the conversation, gives Olostep this server's webhook, and returns without waiting", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  const t0 = Date.now();
  const result = await client.callTool({ name: "create_crawl", arguments: crawlArgs });
  assert.ok(Date.now() - t0 < 3000, "no wait: Wakeshift wakes the agent instead");
  assert.notEqual(result.isError, true);
  assert.equal(wake.subscriptions.length, 1);
  const [sub] = wake.subscriptions;
  assert.equal(sub.event, "crawl.completed");
  assert.match(sub.args.job, /^[0-9a-f-]{36}$/);
  assert.equal(sub.once, true);
  assert.equal(sub.ttl, 24 * 60 * 60);
  assert.ok(posts[0].webhook.startsWith(`${BASE}/webhooks/olostep/crawl.${sub.args.job}.`));
  assert.equal(checks.length, 0, "no status check beyond Olostep's own wait");
});

test("batch_scrape_urls does the same for the batch's end", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  const t0 = Date.now();
  await client.callTool({ name: "batch_scrape_urls", arguments: { urls: ["https://a.com"] } });
  assert.ok(Date.now() - t0 < 3000);
  assert.equal(checks.length, 0);
  assert.deepEqual(wake.subscriptions.map((s) => s.event), ["batch.completed"]);
  assert.ok(posts[0].webhook.startsWith(`${BASE}/webhooks/olostep/batch.${wake.subscriptions[0].args.job}.`));
});

test("the webhook emits the job's end once, to that job, however often Olostep retries", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  await client.callTool({ name: "create_crawl", arguments: crawlArgs });
  const tok = tokenOf(posts[0].webhook);
  assert.equal((await jobs.receive(tok, crawlBody)).status, 204);
  assert.equal((await jobs.receive(tok, { ...crawlBody, delivery_attempt: "2/5" })).status, 204);
  assert.equal(wake.emits.length, 1, "the retry, with the same emit ID, was a duplicate");
  const [first] = wake.emits;
  assert.equal(first.event, "crawl.completed");
  assert.deepEqual(first.args, wake.subscriptions[0].args);
  assert.deepEqual(first.payload, { crawl_id: "crawl_mxjd3xvbp6", status: "completed", pages: 1 });
  assert.match(first.id, /^olostep-[0-9a-f]{64}$/);
  assert.equal(first.text, "Crawl crawl_mxjd3xvbp6 finished: completed, 1 page.");
});

test("a batch webhook emits the batch's counts", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  await client.callTool({ name: "batch_scrape_urls", arguments: { urls: ["https://a.com"] } });
  const tok = tokenOf(posts[0].webhook);
  assert.equal((await jobs.receive(tok, batchProgress)).status, 204, "progress is accepted, so Olostep doesn't retry it");
  assert.equal(wake.emits.length, 0, "and wakes nobody");
  assert.equal((await jobs.receive(tok, batchBody)).status, 204);
  assert.deepEqual(wake.emits.map((e) => e.payload), [{ batch_id: "batch_c0ebngfqs6q8", status: "completed", urls: 2, completed: 2, failed: 0 }]);
  assert.equal(wake.emits[0].text, "Batch batch_c0ebngfqs6q8 finished: completed, 2 completed, 0 failed.");
});

test("the documented bodies work too, and a failed job wakes the agent with its status", async () => {
  const { wake, jobs } = await on();
  const job = "00000000-0000-4000-8000-000000000000";
  const exp = Math.floor(Date.now() / 1000) + 60;
  assert.equal((await jobs.receive(jobs.token("crawl", job, exp), documentedCrawl)).status, 204);
  assert.equal((await jobs.receive(jobs.token("batch", job, exp), documentedBatch)).status, 204);
  const failed = { id: "event_f1", object: "event.crawl.failed", data: { id: "crawl_x", object: "crawl", status: "failed" } };
  assert.equal((await jobs.receive(jobs.token("crawl", "11111111-1111-4111-8111-111111111111", exp), failed)).status, 204);
  assert.deepEqual(wake.emits.map((e) => e.text), [
    "Crawl crawl_abc789 finished: completed, 87 pages.",
    "Batch batch_xyz123 finished: completed, 98 completed, 2 failed.",
    "Crawl crawl_x finished: failed.",
  ]);
});

test("a token this server didn't make, or for another kind, or expired, emits nothing", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  await client.callTool({ name: "create_crawl", arguments: crawlArgs });
  const tok = tokenOf(posts[0].webhook);
  const [kind, job, exp, mac] = tok.split(".");
  const now = Math.floor(Date.now() / 1000);
  for (const bad of [
    `${kind}.${job}.${exp}.${mac.slice(0, -2)}AA`,
    `batch.${job}.${exp}.${mac}`,
    `${kind}.${job}.${Number(exp) + 1}.${mac}`,
    `${kind}.${job}.${exp}.0.${mac}`,
    jobs.token("crawl", job, now - 1),
    "nonsense",
  ]) {
    assert.equal((await jobs.receive(bad, crawlBody)).status, 404, bad.slice(0, 20));
  }
  // The same job ID under another server's secret.
  const forged = (await import("../build/wakeshift.js")).jobWakes(createTestClient(), "another-secret-another-secret-012345", BASE).token("crawl", job, now + 60);
  assert.equal((await jobs.receive(forged, crawlBody)).status, 404);
  assert.equal(wake.emits.length, 0);
});

test("only a final status wakes: progress and unknown statuses are accepted and ignored", async () => {
  const { isFinal } = await modules();
  assert.equal(isFinal("event.crawl.completed", "completed"), true);
  assert.equal(isFinal("event.crawl.failed", "failed"), true);
  assert.equal(isFinal("event.batch.completed", "Cancelled"), true);
  assert.equal(isFinal("event.batch.progress", "completed"), false);
  assert.equal(isFinal("event.batch.completed", "in_progress"), false);
  assert.equal(isFinal("event.crawl.something_new", "paused"), false);
  const { wake, jobs } = await on();
  const tok = jobs.token("crawl", "44444444-4444-4444-8444-444444444444", Math.floor(Date.now() / 1000) + 60);
  assert.equal((await jobs.receive(tok, { id: "e1", object: "event.crawl.paused", data: { id: "crawl_x", status: "paused" } })).status, 204);
  assert.equal(wake.emits.length, 0);
});

test("a body that isn't Olostep's event is refused, and emits nothing", async () => {
  const { wake, jobs } = await on();
  const tok = jobs.token("crawl", "00000000-0000-4000-8000-000000000000", Math.floor(Date.now() / 1000) + 60);
  assert.equal((await jobs.receive(tok, { hello: "world" })).status, 400);
  assert.equal((await jobs.receive(tok, undefined)).status, 400);
  assert.equal(wake.emits.length, 0);
});

test("when Wakeshift can't take the emit, Olostep is asked to retry", async () => {
  const { jobs } = await on();
  jobs.crawlCompleted.emit = async () => { throw new Error("unreachable"); };
  const tok = jobs.token("crawl", "00000000-0000-4000-8000-000000000000", Math.floor(Date.now() / 1000) + 60);
  assert.equal((await jobs.receive(tok, crawlBody)).status, 502);
});

test("a job that can't be created leaves no subscription", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  createStatus = 500;
  const result = await client.callTool({ name: "create_crawl", arguments: crawlArgs });
  assert.equal(result.isError, true);
  assert.equal(wake.subscriptions.length, 1, "it subscribed before creating the job");
  // The SDK ends a failed call's subscriptions (rolled back, so not among unsubscribes).
  const { subscriptions } = await jobs.crawlCompleted.status(wake.subscriptions[0].args);
  assert.equal(subscriptions, 0, "and the failed call ended it");
});

test("Wakeshift down: the tool waits as it always has, its result is Olostep's own, and nothing is subscribed", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  wake.failNext("subscribe", "unreachable");
  jobStatus = "completed";
  const result = await client.callTool({ name: "create_crawl", arguments: crawlArgs });
  assert.notEqual(result.isError, true);
  assert.match(result.content[0].text, /page/, "Olostep's own wait returned the pages");
  assert.ok(checks.length > 0, "it waited");
  assert.equal(wake.subscriptions.length, 0);
  assert.ok(posts[0].webhook, "the webhook still goes with the job, and matches nobody");
});

test("an explicit wait the client can hold is respected: the tool waits, and nothing stays subscribed", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  jobStatus = "completed";
  const result = await client.callTool({ name: "batch_scrape_urls", arguments: { urls: ["https://a.com"], wait_for_completion_seconds: 30 } });
  assert.match(result.content[0].text, /page/);
  assert.ok(checks.length > 0, "it waited");
  assert.equal(wake.subscriptions.length - wake.unsubscribes.length, 0, "the subscription it made was ended");
  assert.doesNotMatch(JSON.stringify(result), /Wakeshift test client/, "no wake instructions in the result");
});

test("an explicit wait longer than the client can hold, with the wake confirmed: subscribed, and no wait", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  const t0 = Date.now();
  await client.callTool({ name: "create_crawl", arguments: { ...crawlArgs, wait_for_completion_seconds: 120 } });
  assert.ok(Date.now() - t0 < 3000, "it didn't wait");
  assert.equal(checks.length, 0);
  assert.equal(wake.subscriptions.length - wake.unsubscribes.length, 1, "the subscription stays");
  const { waitOutlastsCall } = await modules();
  assert.deepEqual(
    [[120, "claude-code"], [60, "claude-code"], [30, "claude-code"], [120, "codex"], [400, "codex"], [120, null], [120, "cursor"], [undefined, "claude-code"]].map(([w, h]) => waitOutlastsCall(w, h)),
    [true, false, false, false, true, false, false, false],
  );
});

test("a long explicit wait from an agent Wakeshift can't wake still waits as asked", async () => {
  const { wake, jobs } = await on();
  const call = withWakes(createToolCall({ tool: "create_crawl", client: wake }), false);
  const job = await withCall(wake, call, () => jobs.start("create_crawl", 120));
  assert.equal(job.wakes, false);
  assert.equal(call.unsubscribes.length, 0, "the subscription stays while the tool waits");
});

test("an explicit wait of 0 counts like the default: subscribed, and no wait", async () => {
  const { wake, jobs } = await on();
  const client = await connect(jobs);
  const t0 = Date.now();
  await client.callTool({ name: "create_crawl", arguments: { ...crawlArgs, wait_for_completion_seconds: 0 } });
  assert.ok(Date.now() - t0 < 3000);
  assert.equal(checks.length, 0);
  assert.equal(wake.subscriptions.length, 1);
  const { waitIsOpen } = await modules();
  assert.deepEqual([undefined, 0, 45, 1, 60, 120].map(waitIsOpen), [true, true, true, false, false, false]);
});

test("a wake not confirmed yet: the tool waits as before, and the subscription stays until the wait returns the job's result", async () => {
  const { wake, jobs } = await on();
  // Claude Code without Wakeshift's plugin, the first time: subscribed and
  // recognized, but nothing listens until the user answers (wakeshift/wakeshift#1338).
  const call = withWakes(createToolCall({ tool: "create_crawl", client: wake }), false);
  const job = await withCall(wake, call, () => jobs.start("create_crawl", undefined));
  assert.equal(job.wakes, false, "the tool keeps its own wait");
  assert.ok(job.webhook);
  assert.equal(call.subscriptions.length, 1);
  assert.equal(call.unsubscribes.length, 0, "kept: a listener started after the result still gets the job's end");
  await withCall(wake, call, () => job.done());
  await withCall(wake, call, () => job.done());
  assert.equal(call.unsubscribes.length, 1, "the wait returned the result: ended, once");
});

test("an SDK without call.wakes (0.11.1): the tool waits as before, and a result returned in the call ends the subscription", async () => {
  const { wake, jobs } = await on({ wakes: undefined });
  const client = await connect(jobs);
  jobStatus = "completed";
  const result = await client.callTool({ name: "create_crawl", arguments: crawlArgs });
  assert.notEqual(result.isError, true);
  assert.match(result.content[0].text, /page/, "Olostep's own wait returned the pages");
  assert.ok(checks.length > 0, "it waited");
  assert.equal(wake.subscriptions.length, 1);
  assert.equal(wake.subscriptions.length - wake.unsubscribes.length, 0, "the pages are in the result, so nothing stays subscribed");
});

test("not confirmed, and the batch finishes in the wait: its results come back, and nothing stays subscribed", async () => {
  const { wake, jobs } = await on({ wakes: false });
  const client = await connect(jobs);
  jobStatus = "completed";
  const result = await client.callTool({ name: "batch_scrape_urls", arguments: { urls: ["https://a.com"] } });
  assert.match(result.content[0].text, /page/);
  assert.ok(checks.length > 0, "it waited");
  assert.equal(wake.subscriptions.length - wake.unsubscribes.length, 0);
});

test("a wake is confirmed only when the SDK's call.wakes is true", async () => {
  const { wakeConfirmed } = await modules();
  assert.equal(wakeConfirmed({ wakes: true }), true);
  assert.equal(wakeConfirmed({ wakes: false }), false);
  assert.equal(wakeConfirmed({}), false, "an SDK without call.wakes: wait as before");
  assert.equal(wakeConfirmed({ wakes: "true" }), false);
  // What decided it before (subscribed, and a recognized program) no longer does.
  assert.equal(wakeConfirmed({ state: "created", recognized: { harness: "claude-code", via: "client", claimed: null } }), false);
});

test("tools/list: only the two job tools change, and Wakeshift adds no tools", async () => {
  const { jobs } = await on();
  const client = await connect(jobs);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name), ["create_crawl", "batch_scrape_urls", "plain_tool"]);
  const { createCrawl } = await modules();
  const crawl = tools.find((t) => t.name === "create_crawl");
  assert.ok(crawl.description.startsWith(createCrawl.description), "Olostep's description comes first, unchanged");
  assert.ok(crawl.description.length < 2048, `${crawl.description.length} characters`);
  assert.equal(tools.find((t) => t.name === "plain_tool").description, "Does nothing.");
  // What docs/wakeshift.md says the job tools gain: three optional arguments, and nothing else.
  const off = (await (await connect(undefined)).listTools()).tools;
  for (const name of ["create_crawl", "batch_scrape_urls"]) {
    const props = (list) => Object.keys(list.find((t) => t.name === name).inputSchema.properties).sort();
    const added = props(tools).filter((p) => !props(off).includes(p));
    assert.deepEqual(added, ["conversation_id", "harness", "session_key"], name);
    const required = (list) => list.find((t) => t.name === name).inputSchema.required ?? [];
    assert.deepEqual(required(tools), required(off), `${name}: nothing new is required`);
  }
  assert.deepEqual(tools.find((t) => t.name === "plain_tool").inputSchema, off.find((t) => t.name === "plain_tool").inputSchema);
});
