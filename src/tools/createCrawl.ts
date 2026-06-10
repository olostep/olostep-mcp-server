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
    "**PREFERRED tool for crawling a website.** Use this whenever the user says 'crawl', 'scrape the whole site', 'get all pages from a site', or wants multiple pages from a single domain. This is the CORRECT tool for any whole-site scraping task. " +
    "**Do NOT use `batch_scrape_urls` for crawling** - that tool is only for when you already have a specific list of unrelated URLs from different domains. " +
    "Starts an ASYNC crawl that autonomously discovers and scrapes pages by following links from a start URL. Returns a crawl_id - the crawl runs in the background. You MUST then call `get_crawl_results` with the returned crawl_id to poll status and retrieve the scraped pages. " +
    "Do NOT call `get_batch_results` with a crawl_id - crawls and batches are separate resources.",
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


