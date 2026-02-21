import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";

const OLOSTEP_API_URL = "https://api.olostep.com/v1";

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
}

export const getBatchResults = {
	name: "get_batch_results",
	description:
		"Retrieve the status and scraped content for a batch job. Pass the batch_id returned by batch_scrape_urls. If the batch is completed, returns the scraped content for each URL. If still in_progress, returns the current status so you can call again later.",
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
			.describe("Max number of items to retrieve content for (1-100). Default: 20."),
	},
	handler: async (
		{
			batch_id,
			formats,
			items_limit,
		}: {
			batch_id: string;
			formats?: string[];
			items_limit?: number;
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
				`${OLOSTEP_API_URL}/batches/${encodeURIComponent(batch_id)}/items?cursor=0&limit=${limit}`,
				{ method: "GET", headers },
			);

			if (!itemsRes.ok) {
				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							batch_id: status.id || status.batch_id,
							status: "completed",
							message: "Batch completed but failed to fetch items.",
						}, null, 2),
					}],
				};
			}

			const itemsData = (await itemsRes.json()) as { items?: BatchItem[]; cursor?: number };
			const items = itemsData.items ?? [];

			const retrieveFormats = (formats && formats.length > 0) ? formats : ["markdown"];
			const formatsParam = retrieveFormats.map(f => `formats[]=${encodeURIComponent(f)}`).join("&");

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
						if (content.markdown_content) result.markdown_content = content.markdown_content;
						if (content.html_content) result.html_content = content.html_content;
						if (content.json_content) result.json_content = content.json_content;
						if (content.text_content) result.text_content = content.text_content;
						return result;
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
						has_more: itemsData.cursor !== undefined,
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
