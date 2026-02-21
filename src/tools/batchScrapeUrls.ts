import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";

const OLOSTEP_API_URL = "https://api.olostep.com/v1";

export interface BatchScrapeRequestUrl {
	url: string;
	custom_id?: string;
}

export const batchScrapeUrls = {
	name: "batch_scrape_urls",
	description:
		"Scrape up to 10k URLs at the same time. Perfect for large-scale data extraction. Returns a batch_id immediately. Use get_batch_results with the batch_id to fetch the scraped content once the batch completes (~5-8 min). Set wait_for_completion_seconds to poll automatically.",
	schema: {
		urls_to_scrape: z
			.array(
				z.object({
					url: z.string().url(),
					custom_id: z.string().optional(),
				}),
			)
			.min(1)
			.max(10000)
			.describe('JSON array of objects with "url" and optional "custom_id".'),
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
			.max(300)
			.default(0)
			.describe(
				"Seconds to wait for batch completion. If >0, polls every 10s until done or timeout, then returns status. Use 0 to return immediately with batch_id (then call get_batch_results later). Recommended: 60 for small batches, 0 for large ones.",
			),
	},
	handler: async (
		{
			urls_to_scrape,
			output_format,
			country,
			wait_before_scraping,
			parser,
			wait_for_completion_seconds,
		}: {
			urls_to_scrape: BatchScrapeRequestUrl[];
			output_format: "markdown" | "html" | "json" | "text";
			country?: string;
			wait_before_scraping?: number;
			parser?: string;
			wait_for_completion_seconds?: number;
		},
		apiKey: string,
		orbitKey?: string,
	) => {
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const formats: string[] = [output_format];
			const items = urls_to_scrape.map((item) => ({
				url: item.url,
				...(item.custom_id && { custom_id: item.custom_id }),
			}));

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

			const waitSeconds = wait_for_completion_seconds ?? 0;
			if (waitSeconds > 0 && batchId) {
				const pollIntervalMs = 10_000;
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

					if (status === "completed" || status === "failed") {
						return {
							content: [{
								type: "text",
								text: JSON.stringify({
									...statusData,
									message: status === "completed"
										? "Batch completed. Call get_batch_results with this batch_id to retrieve scraped content."
										: "Batch failed.",
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
