import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";
import { getBatchResults } from "./getBatchResults.js";

const OLOSTEP_API_URL = "https://api.olostep.com/v1";

export interface BatchScrapeRequestUrl {
	url: string;
	custom_id?: string;
}

export const batchScrapeUrls = {
	name: "batch_scrape_urls",
	description:
    "Scrape a known list of URLs (up to 10,000) in one async job, for example URLs from a CSV or from search results. " +
    "Waits up to `wait_for_completion_seconds` (default 45) and returns the scraped content when the batch finishes in that time. " +
    "Larger batches (usually 5-8 min) return a batch_id instead, and `get_batch_results` returns their content once done.",
	schema: {
		urls: z
			.array(
				z.union([
					z.string().url(),
					z.object({ url: z.string().url(), custom_id: z.string().optional() }),
				]),
			)
			.min(1)
			.max(10000)
			.optional()
			.describe('Array of URLs to scrape — plain URL strings, or objects with "url" and optional "custom_id".'),
		urls_to_scrape: z
			.array(
				z.object({
					url: z.string().url(),
					custom_id: z.string().optional(),
				}),
			)
			.min(1)
			.max(10000)
			.optional()
			.describe('Alias for `urls`.'),
		output_format: z
			.enum(["markdown", "html", "json", "text"])
			.default("markdown")
			.describe('Choose format for all URLs. Default: "markdown".'),
		country: z
			.string()
			.optional()
			.describe("Optional country code for location-specific scraping."),
		wait_before_scraping: z
			.number()
			.int()
			.min(0)
			.max(10000)
			.default(0)
			.describe("Wait time in milliseconds before scraping each URL."),
		parser: z.string().optional().describe("Optional parser ID for specialized extraction (e.g. @olostep/google-search)."),
		wait_for_completion_seconds: z
			.number()
			.int()
			.min(0)
			.max(900)
			.default(45)
			.describe(
				"Seconds to wait for the batch to finish and return its content in this call. 0 returns the batch_id right away.",
			),
	},
	handler: async (
		{
			urls,
			urls_to_scrape,
			output_format,
			country,
			wait_before_scraping,
			parser,
			wait_for_completion_seconds,
		}: {
			urls?: (string | BatchScrapeRequestUrl)[];
			urls_to_scrape?: BatchScrapeRequestUrl[];
			output_format: "markdown" | "html" | "json" | "text";
			country?: string;
			wait_before_scraping?: number;
			parser?: string;
			wait_for_completion_seconds?: number;
		},
		apiKey: string,
		orbitKey?: string,
	) => {
		const rawUrls = urls ?? urls_to_scrape;
		if (!rawUrls || rawUrls.length === 0) {
			return { isError: true, content: [{ type: "text", text: "Error: 'urls' is required (a non-empty array of URLs)." }] };
		}
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const formats: string[] = [output_format];
			const items = rawUrls.map((item) =>
				typeof item === "string"
					? { url: item }
					: { url: item.url, ...(item.custom_id && { custom_id: item.custom_id }) },
			);

			const payload: Record<string, unknown> = {
				items,
				formats,
				wait_before_scraping: wait_before_scraping ?? 0,
			};
			if (country) payload.country = country;
			if (orbitKey) payload.force_connection_id = orbitKey;
			if (parser) payload.parser = { id: parser };

			const response = await fetch(`${OLOSTEP_API_URL}/batches`, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				let errorDetails: unknown = null;
				try { errorDetails = await response.json(); } catch { /* ignore */ }
				return {
					isError: true,
					content: [{
						type: "text",
						text: `Olostep API Error: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorDetails)}`,
					}],
				};
			}

			const data = (await response.json()) as Record<string, unknown>;
			const batchId = (data.id || data.batch_id) as string | undefined;

			const waitSeconds = wait_for_completion_seconds ?? 45;
			if (waitSeconds > 0 && batchId) {
				const pollIntervalMs = 5_000;
				const deadline = Date.now() + waitSeconds * 1000;

				while (Date.now() < deadline) {
					await new Promise((r) => setTimeout(r, pollIntervalMs));

					const statusRes = await fetch(
						`${OLOSTEP_API_URL}/batches/${encodeURIComponent(batchId)}`,
						{ method: "GET", headers },
					);
					if (!statusRes.ok) break;

					const statusData = (await statusRes.json()) as Record<string, unknown>;
					const status = String(statusData.status || "").toLowerCase();

					if (status === "completed") {
						// Hand back the content directly instead of asking for a second call.
						const totalUrls = Number(statusData.total_urls ?? 20) || 20;
						return await getBatchResults.handler(
							{ batch_id: batchId, formats: [output_format], items_limit: Math.min(totalUrls, 20) },
							apiKey,
						);
					}
					if (status === "failed") {
						return {
							content: [{
								type: "text",
								text: JSON.stringify({
									...statusData,
									message: "Batch failed.",
								}, null, 2),
							}],
						};
					}
				}

				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							...data,
							message: `Batch still processing after ${waitSeconds}s. Call get_batch_results with batch_id "${batchId}" to check again later.`,
						}, null, 2),
					}],
				};
			}

			return {
				content: [{
					type: "text",
					text: JSON.stringify({
						...data,
						message: `Batch created. Call get_batch_results with batch_id "${batchId}" to retrieve results once completed (~5-8 min).`,
					}, null, 2),
				}],
			};
		} catch (error: unknown) {
			return {
				isError: true,
				content: [{
					type: "text",
					text: `Error: Failed to create batch scrape. ${error instanceof Error ? error.message : String(error)}`,
				}],
			};
		}
	},
};
