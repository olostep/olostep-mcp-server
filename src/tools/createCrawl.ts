import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";

const OLOSTEP_CRAWL_API_URL = "https://api.olostep.com/v1/crawls";

export interface OlostepCrawlResponse {
	crawl_id?: string;
	object?: string;
	status?: string;
	start_url?: string;
	max_pages?: number;
	created?: string;
	formats?: string[];
	country?: string;
	parser?: string;
}

export const createCrawl = {
	name: "create_crawl",
	description:
    "Crawl a website from a start URL: follows links on the same site and scrapes each page it finds, up to `max_pages`. Suited to getting many pages from one site, such as a docs section or a blog. " +
    "Runs async and returns a crawl_id. `get_crawl_results` returns the crawl status and scraped pages for that crawl_id. " +
    "Crawls and batches are separate resources, so a crawl_id works with `get_crawl_results`, not `get_batch_results`.",
	schema: {
		url: z.string().url().optional().describe("Starting URL for the crawl."),
		start_url: z.string().url().optional().describe("Alias for `url`."),
		max_pages: z.number().int().min(1).default(10).describe("Maximum number of pages to crawl. Set to 1 to scrape only the start URL."),
		output_format: z
			.enum(["markdown", "html", "json", "text"])
			.default("markdown")
			.describe('Format for scraped content. Default: "markdown".'),
		country: z.string().optional().describe("Optional country code for location-specific crawling."),
		parser: z.string().optional().describe("Optional parser ID for specialized content extraction."),
	},
	handler: async (
		{
			url,
			start_url,
			max_pages,
			output_format,
			country,
			parser,
		}: {
			url?: string;
			start_url?: string;
			max_pages?: number;
			output_format: "markdown" | "html" | "json" | "text";
			country?: string;
			parser?: string;
		},
		apiKey: string,
		orbitKey?: string,
	) => {
		const targetUrl = url ?? start_url;
		if (!targetUrl) {
			return { isError: true, content: [{ type: "text", text: "Error: a 'url' is required." }] };
		}
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const formats: string[] = [output_format];
			const payload: Record<string, unknown> = {
				start_url: targetUrl,
				max_pages: max_pages ?? 10,
				formats,
			};
			if (country) payload.country = country;
			if (orbitKey) payload.force_connection_id = orbitKey;
			if (parser) payload.parser_extract = { parser_id: parser };

			const response = await fetch(OLOSTEP_CRAWL_API_URL, {
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

			const data = (await response.json()) as OlostepCrawlResponse;
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
						text: `Error: Failed to create crawl. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};


