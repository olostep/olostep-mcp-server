// How crawl and batch tools report job states, against a local stub of the API.
// Run with: npm run build && npm run test:job-status

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";

let server;
let handler;

before(async () => {
  server = createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    const { status = 200, body } = handler(url, request.method);
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.OLOSTEP_API_URL = `http://127.0.0.1:${server.address().port}/v1`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

const tools = async () => ({
  ...(await import("../build/tools/getBatchResults.js")),
  ...(await import("../build/tools/getCrawlResults.js")),
  ...(await import("../build/tools/batchScrapeUrls.js")),
  ...(await import("../build/tools/createCrawl.js")),
});

const text = (result) => result.content[0].text;

// An unexpected status may still be running, so the agent should check the same job again
// rather than start a new one.
function assertCheckAgainLater(result, getter) {
  assert.match(text(result), /unexpected status/);
  assert.match(text(result), new RegExp(`check again later with ${getter}`));
  assert.doesNotMatch(text(result), /Start a new/);
  assert.doesNotMatch(text(result), /again in ~10 seconds/);
}

// Answers every job-status request with `job`, and everything else like a finished job with one page.
function jobApi(job) {
  handler = (url, method) => {
    if (method === "POST") return { body: { id: "job_1", status: "in_progress" } };
    if (url.pathname.endsWith("/retrieve")) return { body: { markdown_content: "page" } };
    if (url.pathname.endsWith("/pages")) return { body: { pages: [{ url: "https://a.com", retrieve_id: "r0" }] } };
    if (url.pathname.endsWith("/items")) return { body: { items: [{ url: "https://a.com", retrieve_id: "r0" }] } };
    return typeof job === "function" ? job() : { body: job };
  };
}

test("get_crawl_results reports an unexpected crawl status as an error with the API's details", async () => {
  const { getCrawlResults } = await tools();
  jobApi({ id: "job_1", status: "failed", error: "start_url could not be reached" });
  const result = await getCrawlResults.handler({ crawl_id: "job_1" }, "key");
  assert.equal(result.isError, true);
  assert.match(text(result), /"status": "failed"/);
  assert.match(text(result), /start_url could not be reached/);
  assertCheckAgainLater(result, "get_crawl_results");
});

test("get_batch_results reports an unexpected batch status as an error with the API's details", async () => {
  const { getBatchResults } = await tools();
  jobApi({ id: "job_1", status: "failed", reason: "not enough resources" });
  const result = await getBatchResults.handler({ batch_id: "job_1" }, "key");
  assert.equal(result.isError, true);
  assert.match(text(result), /"status": "failed"/);
  assert.match(text(result), /not enough resources/);
  assertCheckAgainLater(result, "get_batch_results");
});

test("any status other than in_progress or completed ends the job", async () => {
  const { getCrawlResults } = await tools();
  jobApi({ id: "job_1", status: "cancelled" });
  const result = await getCrawlResults.handler({ crawl_id: "job_1" }, "key");
  assert.equal(result.isError, true);
  assert.match(text(result), /cancelled/);
});

test("in_progress jobs keep the same call-again message", async () => {
  const { getCrawlResults, getBatchResults } = await tools();
  jobApi({ id: "job_1", status: "in_progress", pages_count: 2, max_pages: 10 });
  const crawl = await getCrawlResults.handler({ crawl_id: "job_1" }, "key");
  assert.equal(crawl.isError, undefined);
  assert.equal(text(crawl), JSON.stringify({
    crawl_id: "job_1",
    status: "in_progress",
    pages_completed: 2,
    pages_total: 10,
    message: "Crawl is still in_progress. Call get_crawl_results again in ~10 seconds.",
  }, null, 2));

  jobApi({ id: "job_1", status: "in_progress", total_urls: 3, completed_urls: 1 });
  const batch = await getBatchResults.handler({ batch_id: "job_1" }, "key");
  assert.equal(batch.isError, undefined);
  assert.equal(text(batch), JSON.stringify({
    batch_id: "job_1",
    status: "in_progress",
    total_urls: 3,
    completed_urls: 1,
    message: "Batch is still in_progress. Call get_batch_results again in ~10 seconds.",
  }, null, 2));
});

test("completed jobs return each page with its url and title", async () => {
  const { getCrawlResults, getBatchResults } = await tools();
  jobApi({ id: "job_1", status: "completed", total_urls: 1 });
  const crawl = await getCrawlResults.handler({ crawl_id: "job_1" }, "key");
  assert.equal(crawl.isError, undefined);
  assert.equal(text(crawl), JSON.stringify({
    crawl_id: "job_1",
    status: "completed",
    pages_returned: 1,
    has_more: false,
    pages: [{ url: "https://a.com", title: "page", markdown_content: "page" }],
  }, null, 2));

  const batch = await getBatchResults.handler({ batch_id: "job_1" }, "key");
  assert.equal(batch.isError, undefined);
  assert.equal(text(batch), JSON.stringify({
    batch_id: "job_1",
    status: "completed",
    total_urls: 1,
    items_returned: 1,
    has_more: false,
    items: [{ url: "https://a.com", title: "page", markdown_content: "page" }],
  }, null, 2));
});

test("listing pages or items after completion surfaces the HTTP status", async () => {
  const { getCrawlResults, getBatchResults } = await tools();
  handler = (url) =>
    url.pathname.endsWith("/pages") || url.pathname.endsWith("/items")
      ? { status: 500, body: { error: "boom" } }
      : { body: { id: "job_1", status: "completed" } };
  const crawl = await getCrawlResults.handler({ crawl_id: "job_1" }, "key");
  assert.equal(crawl.isError, true);
  assert.match(text(crawl), /500/);
  const batch = await getBatchResults.handler({ batch_id: "job_1" }, "key");
  assert.equal(batch.isError, true);
  assert.match(text(batch), /500/);
});

// The inline waits poll every 5s, so a job that ends on the first poll should come back
// in about 5s, well before the 60s wait.
async function timed(fn) {
  const start = Date.now();
  const result = await fn();
  return { result, seconds: (Date.now() - start) / 1000 };
}

test("create_crawl stops waiting on an unexpected status", async () => {
  const { createCrawl } = await tools();
  jobApi({ id: "job_1", status: "failed" });
  const { result, seconds } = await timed(() =>
    createCrawl.handler({ url: "https://a.com", output_format: "markdown", wait_for_completion_seconds: 60 }, "key"));
  assert.ok(seconds < 10, `took ${seconds}s`);
  assert.equal(result.isError, true);
  assert.match(text(result), /"status": "failed"/);
  assert.doesNotMatch(text(result), /still running/);
  assertCheckAgainLater(result, "get_crawl_results");
});

test("create_crawl reports a failed status check with its HTTP status and the crawl id", async () => {
  const { createCrawl } = await tools();
  jobApi(() => ({ status: 401, body: { error: "Invalid API key" } }));
  const { result, seconds } = await timed(() =>
    createCrawl.handler({ url: "https://a.com", output_format: "markdown", wait_for_completion_seconds: 60 }, "key"));
  assert.ok(seconds < 10, `took ${seconds}s`);
  assert.equal(result.isError, true);
  assert.match(text(result), /401/);
  assert.match(text(result), /job_1/);
  assert.doesNotMatch(text(result), /still running/);
});

test("batch_scrape_urls stops waiting on an unexpected status", async () => {
  const { batchScrapeUrls } = await tools();
  jobApi({ id: "job_1", status: "failed", reason: "not enough resources" });
  const { result, seconds } = await timed(() =>
    batchScrapeUrls.handler({ urls: ["https://a.com"], output_format: "markdown", wait_for_completion_seconds: 60 }, "key"));
  assert.ok(seconds < 10, `took ${seconds}s`);
  assert.equal(result.isError, true);
  assert.match(text(result), /"status": "failed"/);
  assert.match(text(result), /not enough resources/);
  assertCheckAgainLater(result, "get_batch_results");
});

test("batch_scrape_urls reports a failed status check with its HTTP status and the batch id", async () => {
  const { batchScrapeUrls } = await tools();
  jobApi(() => ({ status: 500, body: { error: "boom" } }));
  const { result, seconds } = await timed(() =>
    batchScrapeUrls.handler({ urls: ["https://a.com"], output_format: "markdown", wait_for_completion_seconds: 60 }, "key"));
  assert.ok(seconds < 10, `took ${seconds}s`);
  assert.equal(result.isError, true);
  assert.match(text(result), /500/);
  assert.match(text(result), /job_1/);
  assert.doesNotMatch(text(result), /still processing/);
});
