import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";

const OLOSTEP_API_URL = "https://api.olostep.com/v1";

interface CrawlStatusResponse {
	id?: string;
	crawl_id?: string;
	object?: string;
	status?: string;
	start_url?: string;
	max_pages?: number;
	pages_count?: number;
	pages_completed?: number;
	pages_total?: number;
	created?: string;
}

interface CrawlPage {
	url?: string;
	retrieve_id?: string;
	custom_id?: string;
}

interface CrawlPagesResponse {
	pages?: CrawlPage[];
	items?: CrawlPage[];
	cursor?: number;
}

interface RetrieveResponse {
	markdown_content?: string;
	html_content?: string;
	json_content?: unknown;
	text_content?: string;
}

export const getCrawlResults = {
	name: "get_crawl_results",
	description:
		"Retrieve the status and scraped pages for a crawl job. Pass the crawl_id returned by create_crawl. If the crawl is still in_progress, returns the current status so you can call again later (poll every ~10 seconds). Once completed, returns the list of discovered pages with their scraped content in the requested formats. This is the REQUIRED companion to create_crawl — create_crawl only kicks off the async job, this tool is how you actually get the content.",
	schema: {
		crawl_id: z
			.string()
			.min(1)
			.describe("The crawl_id (or id) returned from create_crawl."),
		formats: z
			.array(z.enum(["markdown", "html", "json", "text"]))
			.default(["markdown"])
			.describe('Content formats to retrieve per page. Default: ["markdown"].'),
		items_limit: z
			.number()
			.int()
			.min(1)
			.max(100)
			.default(20)
			.describe("Max number of pages to retrieve content for (1-100). Default: 20."),
		cursor: z
			.number()
			.int()
			.min(0)
			.default(0)
			.describe("Pagination cursor for list-pages. Default: 0 (first page)."),
		search_query: z
			.string()
			.optional()
			.describe("Optional filter to rank/select pages by relevance to a query."),
	},
	handler: async (
		{
			crawl_id,
			formats,
			items_limit,
			cursor,
			search_query,
		}: {
			crawl_id: string;
			formats?: string[];
			items_limit?: number;
			cursor?: number;
			search_query?: string;
		},
		apiKey: string,
	) => {
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const statusRes = await fetch(
				`${OLOSTEP_API_URL}/crawls/${encodeURIComponent(crawl_id)}`,
				{ method: "GET", headers },
			);

			if (!statusRes.ok) {
				let errorDetails: unknown = null;
				try { errorDetails = await statusRes.json(); } catch { /* ignore */ }
				return {
					isError: true,
					content: [{
						type: "text",
						text: `Olostep API Error: ${statusRes.status} ${statusRes.statusText}. Details: ${JSON.stringify(errorDetails)}`,
					}],
				};
			}

			const status = (await statusRes.json()) as CrawlStatusResponse;
			const crawlStatus = (status.status || "").toLowerCase();
			const resolvedId = status.id || status.crawl_id || crawl_id;

			if (crawlStatus !== "completed") {
				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							crawl_id: resolvedId,
							status: status.status,
							pages_completed: status.pages_completed ?? status.pages_count,
							pages_total: status.pages_total ?? status.max_pages,
							message: `Crawl is still ${status.status}. Call get_crawl_results again in ~10 seconds.`,
						}, null, 2),
					}],
				};
			}

			const limit = items_limit ?? 20;
			const startCursor = cursor ?? 0;
			const params = new URLSearchParams({
				cursor: String(startCursor),
				limit: String(limit),
			});
			if (search_query) params.set("search_query", search_query);

			const pagesRes = await fetch(
				`${OLOSTEP_API_URL}/crawls/${encodeURIComponent(crawl_id)}/pages?${params.toString()}`,
				{ method: "GET", headers },
			);

			if (!pagesRes.ok) {
				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							crawl_id: resolvedId,
							status: "completed",
							message: "Crawl completed but failed to list pages.",
						}, null, 2),
					}],
				};
			}

			const pagesData = (await pagesRes.json()) as CrawlPagesResponse;
			const pages = pagesData.pages ?? pagesData.items ?? [];

			const retrieveFormats = (formats && formats.length > 0) ? formats : ["markdown"];
			const formatsParam = retrieveFormats.map(f => `formats[]=${encodeURIComponent(f)}`).join("&");

			const results = await Promise.all(
				pages.map(async (page) => {
					if (!page.retrieve_id) {
						return { url: page.url, custom_id: page.custom_id, error: "No retrieve_id" };
					}
					try {
						const retrieveRes = await fetch(
							`${OLOSTEP_API_URL}/retrieve?retrieve_id=${encodeURIComponent(page.retrieve_id)}&${formatsParam}`,
							{ method: "GET", headers },
						);
						if (!retrieveRes.ok) {
							return { url: page.url, custom_id: page.custom_id, error: `Retrieve failed: ${retrieveRes.status}` };
						}
						const content = (await retrieveRes.json()) as RetrieveResponse;
						const result: Record<string, unknown> = {
							url: page.url,
							custom_id: page.custom_id,
						};
						if (content.markdown_content) result.markdown_content = content.markdown_content;
						if (content.html_content) result.html_content = content.html_content;
						if (content.json_content) result.json_content = content.json_content;
						if (content.text_content) result.text_content = content.text_content;
						return result;
					} catch {
						return { url: page.url, custom_id: page.custom_id, error: "Retrieve request failed" };
					}
				}),
			);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						crawl_id: resolvedId,
						status: "completed",
						pages_returned: results.length,
						next_cursor: pagesData.cursor,
						has_more: pagesData.cursor !== undefined,
						pages: results,
					}, null, 2),
				}],
			};
		} catch (error: unknown) {
			return {
				isError: true,
				content: [{
					type: "text",
					text: `Error: Failed to get crawl results. ${error instanceof Error ? error.message : String(error)}`,
				}],
			};
		}
	},
};
