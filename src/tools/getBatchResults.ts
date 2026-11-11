import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";
import { isRunning, unexpectedStatus } from "./jobStatus.js";
import { DEFAULT_MAX_CHARACTERS, shapePage } from "./pageContent.js";

const OLOSTEP_API_URL = process.env.OLOSTEP_API_URL ?? "https://api.olostep.com/v1";

interface BatchStatusResponse {
	id?: string;
	batch_id?: string;
	status?: string;
	total_urls?: number;
	completed_urls?: number;
}

interface BatchItem {
	custom_id?: string;
	url?: string;
	retrieve_id?: string;
}

interface RetrieveResponse {
	markdown_content?: string;
	html_content?: string;
	json_content?: unknown;
	text_content?: string;
	markdown_hosted_url?: string;
	html_hosted_url?: string;
	text_hosted_url?: string;
}

export const getBatchResults = {
	name: "get_batch_results",
	description:
		"Use this to get the content of a batch started with batch_scrape_urls, using its batch_id. " +
		"While the batch is in_progress it returns the status: call again in about 10 seconds. " +
		"Once completed it returns each URL's url, title and content, up to `items_limit` per call; " +
		"when `has_more` is true, pass `next_cursor` for the rest. " +
		"Do not start a new batch to check on one that is still running.",
	schema: {
		batch_id: z
			.string()
			.min(1)
			.describe("The batch_id (or id) returned from batch_scrape_urls."),
		formats: z
			.array(z.enum(["markdown", "html", "json", "text"]))
			.default(["markdown"])
			.describe('Content formats to retrieve per URL. Default: ["markdown"].'),
		items_limit: z
			.number()
			.int()
			.min(1)
			.max(100)
			.default(20)
			.describe("Max number of items to retrieve content for per call (1-100). Default: 20."),
		cursor: z
			.number()
			.int()
			.min(0)
			.default(0)
			.describe("Pagination cursor. Pass next_cursor from the previous result to get the next pages. Default: 0 (first page)."),
		max_characters: z
			.number()
			.int()
			.min(500)
			.default(DEFAULT_MAX_CHARACTERS)
			.describe(`Max characters of content per URL (default ${DEFAULT_MAX_CHARACTERS}). Longer pages are cut and link to their full text.`),
	},
	handler: async (
		{
			batch_id,
			formats,
			items_limit,
			cursor,
			max_characters,
		}: {
			batch_id: string;
			formats?: string[];
			items_limit?: number;
			cursor?: number;
			max_characters?: number;
		},
		apiKey: string,
	) => {
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const statusRes = await fetch(
				`${OLOSTEP_API_URL}/batches/${encodeURIComponent(batch_id)}`,
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

			const status = (await statusRes.json()) as BatchStatusResponse;
			const batchStatus = (status.status || "").toLowerCase();

			if (batchStatus !== "completed") {
				if (!isRunning(batchStatus)) return unexpectedStatus("batch", { batch_id: status.id || status.batch_id, ...status });
				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							batch_id: status.id || status.batch_id,
							status: status.status,
							total_urls: status.total_urls,
							completed_urls: status.completed_urls,
							message: `Batch is still ${status.status}. Call get_batch_results again in ~10 seconds.`,
						}, null, 2),
					}],
				};
			}

			const limit = items_limit ?? 20;
			const itemsRes = await fetch(
				`${OLOSTEP_API_URL}/batches/${encodeURIComponent(batch_id)}/items?cursor=${cursor ?? 0}&limit=${limit}`,
				{ method: "GET", headers },
			);

			if (!itemsRes.ok) {
				return {
					isError: true,
					content: [{
						type: "text",
						text: JSON.stringify({
							batch_id: status.id || status.batch_id,
							status: "completed",
							message: `Batch completed but fetching its items failed: ${itemsRes.status} ${itemsRes.statusText}. Call get_batch_results again to retry.`,
						}, null, 2),
					}],
				};
			}

			const itemsData = (await itemsRes.json()) as { items?: BatchItem[]; cursor?: number | null };
			const items = itemsData.items ?? [];

			const retrieveFormats = (formats && formats.length > 0) ? formats : ["markdown"];
			const formatsParam = retrieveFormats.map(f => `formats[]=${encodeURIComponent(f)}`).join("&");

			// The API returns a cursor whenever a page is full, even if nothing is left, so the listing
			// can end on an empty page. If the first page already holds every URL, there is nothing more.
			const firstPageHasAll = !cursor && typeof status.total_urls === "number" && items.length >= status.total_urls;
			const hasMore = !firstPageHasAll && items.length > 0 && itemsData.cursor !== undefined && itemsData.cursor !== null;

			const results = await Promise.all(
				items.map(async (item) => {
					if (!item.retrieve_id) {
						return { custom_id: item.custom_id, url: item.url, error: "No retrieve_id" };
					}
					try {
						const retrieveRes = await fetch(
							`${OLOSTEP_API_URL}/retrieve?retrieve_id=${encodeURIComponent(item.retrieve_id)}&${formatsParam}`,
							{ method: "GET", headers },
						);
						if (!retrieveRes.ok) {
							return { custom_id: item.custom_id, url: item.url, error: `Retrieve failed: ${retrieveRes.status}` };
						}
						const content = (await retrieveRes.json()) as RetrieveResponse;
						const result: Record<string, unknown> = {
							custom_id: item.custom_id,
							url: item.url,
						};
						// The retrieve API can return more formats than asked for; keep only the requested ones.
						if (retrieveFormats.includes("markdown") && content.markdown_content) result.markdown_content = content.markdown_content;
						if (retrieveFormats.includes("html") && content.html_content) result.html_content = content.html_content;
						if (retrieveFormats.includes("json") && content.json_content) result.json_content = content.json_content;
						if (retrieveFormats.includes("text") && content.text_content) result.text_content = content.text_content;
						return shapePage(result, { url: item.url, maxCharacters: max_characters, source: content as Record<string, unknown> });
					} catch {
						return { custom_id: item.custom_id, url: item.url, error: "Retrieve request failed" };
					}
				}),
			);

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						batch_id: status.id || status.batch_id,
						status: "completed",
						total_urls: status.total_urls,
						items_returned: results.length,
						has_more: hasMore,
						...(hasMore && { next_cursor: itemsData.cursor }),
						items: results,
					}, null, 2),
				}],
			};
		} catch (error: unknown) {
			return {
				isError: true,
				content: [{
					type: "text",
					text: `Error: Failed to get batch results. ${error instanceof Error ? error.message : String(error)}`,
				}],
			};
		}
	},
};
