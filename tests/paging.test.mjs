// Paging behaviour of get_batch_results and get_crawl_results, against a local stub of the API.
// Run with: npm run build && npm run test:paging

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";

let server;
let handler;

before(async () => {
  server = createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(handler(url)));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.OLOSTEP_API_URL = `http://127.0.0.1:${server.address().port}/v1`;
});

after(() => {
  server.closeAllConnections();
  server.close();
});

const items = (count, start = 0) =>
  Array.from({ length: count }, (_, i) => ({ url: `https://a.com/${start + i}`, retrieve_id: `r${start + i}` }));

const parse = (result) => JSON.parse(result.content[0].text);

const tools = async () => ({
  ...(await import("../build/tools/getBatchResults.js")),
  ...(await import("../build/tools/getCrawlResults.js")),
  ...(await import("../build/tools/batchScrapeUrls.js")),
});

function pagedApi(path, key, total) {
  const seen = [];
  handler = (url) => {
    if (url.pathname.endsWith("/retrieve")) return { markdown_content: url.searchParams.get("retrieve_id") };
    if (!url.pathname.endsWith(path)) return { id: "job_1", status: "completed", total_urls: total };
    const cursor = Number(url.searchParams.get("cursor"));
    const limit = Number(url.searchParams.get("limit"));
    seen.push({ cursor, limit });
    // The real API keeps returning a cursor until an empty page.
    const page = items(Math.max(0, Math.min(limit, total - cursor)), cursor);
    return { [key]: page, ...(page.length > 0 && { cursor: cursor + limit }) };
  };
  return seen;
}

test("get_batch_results reads every page through next_cursor", async () => {
  const { getBatchResults } = await tools();
  const seen = pagedApi("/items", "items", 3);

  const first = parse(await getBatchResults.handler({ batch_id: "job_1", items_limit: 2 }, "key"));
  assert.equal(first.items.length, 2);
  assert.equal(first.has_more, true);
  assert.equal(first.next_cursor, 2);

  const second = parse(await getBatchResults.handler({ batch_id: "job_1", items_limit: 2, cursor: first.next_cursor }, "key"));
  assert.equal(second.items[0].url, "https://a.com/2");
  assert.equal(second.has_more, true);

  const third = parse(await getBatchResults.handler({ batch_id: "job_1", items_limit: 2, cursor: second.next_cursor }, "key"));
  assert.deepEqual(third.items, []);
  assert.equal(third.has_more, false);
  assert.equal(third.next_cursor, undefined);
  assert.deepEqual(seen, [{ cursor: 0, limit: 2 }, { cursor: 2, limit: 2 }, { cursor: 4, limit: 2 }]);
});

test("get_batch_results keeps going after a short page", async () => {
  const { getBatchResults } = await tools();
  handler = (url) => {
    if (url.pathname.endsWith("/retrieve")) return { markdown_content: "page" };
    if (url.pathname.endsWith("/items")) return { items: items(1), cursor: 1 };
    return { id: "job_1", status: "completed", total_urls: 50 };
  };
  const result = parse(await getBatchResults.handler({ batch_id: "job_1", items_limit: 20 }, "key"));
  assert.equal(result.has_more, true);
  assert.equal(result.next_cursor, 1);
});

test("get_batch_results reports no more pages when the first page holds every URL", async () => {
  const { getBatchResults } = await tools();
  // A full page (items == limit) still gets a cursor from the real API, e.g. a 1-URL batch read with limit 1.
  handler = (url) => {
    if (url.pathname.endsWith("/retrieve")) return { markdown_content: "page" };
    if (url.pathname.endsWith("/items")) return { items: items(1), cursor: 1794146187360 };
    return { id: "job_1", status: "completed", total_urls: 1 };
  };
  const result = parse(await getBatchResults.handler({ batch_id: "job_1", items_limit: 1 }, "key"));
  assert.equal(result.items.length, 1);
  assert.equal(result.has_more, false);
  assert.equal(result.next_cursor, undefined);
});

test("get_crawl_results stops reporting more pages on an empty page", async () => {
  const { getCrawlResults } = await tools();
  pagedApi("/pages", "pages", 0);
  const result = parse(await getCrawlResults.handler({ crawl_id: "job_1", items_limit: 20 }, "key"));
  assert.equal(result.pages.length, 0);
  assert.equal(result.has_more, false);
  assert.equal(result.next_cursor, undefined);
});

test("batch_scrape_urls accepts 100k URLs and rejects more", async () => {
  const { batchScrapeUrls } = await tools();
  const urls = (count) => Array.from({ length: count }, () => "https://a.com");
  assert.equal(batchScrapeUrls.schema.urls.safeParse(urls(100_000)).success, true);
  assert.equal(batchScrapeUrls.schema.urls.safeParse(urls(100_001)).success, false);
  assert.equal(batchScrapeUrls.schema.urls_to_scrape.safeParse(urls(100_001).map((url) => ({ url }))).success, false);
});
