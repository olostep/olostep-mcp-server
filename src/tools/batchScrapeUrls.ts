import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";

const OLOSTEP_BATCH_API_URL = "https://api.olostep.com/v1/batches";

export interface BatchScrapeRequestUrl {
	url: string;
	custom_id?: string;
}

export interface OlostepBatchResponse {
	batch_id?: string;
	status?: string;
	total_urls?: number;
	created_at?: string;
	formats?: string[];
	country?: string;
	parser?: string;
	urls?: BatchScrapeRequestUrl[];
}

export const batchScrapeUrls = {
	name: "batch_scrape_urls",
	description:
		"Scrape up to 10k URLs at the same time. Perfect for large-scale data extraction.",
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
		parser: z.string().optional().describe("Optional parser ID for specialized extraction."),
	},
	handler: async (
		{
			urls_to_scrape,
			output_format,
			country,
			wait_before_scraping,
			parser,
		}: {
			urls_to_scrape: BatchScrapeRequestUrl[];
			output_format: "markdown" | "html" | "json" | "text";
			country?: string;
			wait_before_scraping?: number;
			parser?: string;
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
			const payload: Record<string, unknown> = {
				batch_array: urls_to_scrape,
				formats,
				wait_before_scraping: wait_before_scraping ?? 0,
			};
			if (country) payload.country = country;
			if (orbitKey) payload.force_connection_id = orbitKey;
			if (parser) payload.parser_extract = { parser_id: parser };

			const response = await fetch(OLOSTEP_BATCH_API_URL, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				let errorDetails: unknown = null;
				try {
					errorDetails = await response.json();
				} catch {
					// ignore
				}
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Olostep API Error: ${response.status} ${response.statusText}. Details: ${JSON.stringify(
								errorDetails,
							)}`,
						},
					],
				};
			}

			const data = (await response.json()) as OlostepBatchResponse;
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error: unknown) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Error: Failed to create batch scrape. ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
			};
		}
	},
};


