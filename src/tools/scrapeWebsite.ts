import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";

const OLOSTEP_SCRAPE_API_URL = "https://api.olostep.com/v1/scrapes";

export interface OlostepScrapeResponse {
	result?: {
		id?: string;
		url?: string;
		markdown_content?: string;
		html_content?: string;
		json_content?: string;
		text_content?: string;
		status?: string;
		timestamp?: string;
		screenshot_hosted_url?: string;
		page_metadata?: unknown;
	};
}

export const scrapeWebsite = {
	name: "scrape_website",
	description:
		"Extract content from a single URL. Supports multiple formats and JavaScript rendering.",
	schema: {
		url_to_scrape: z.string().url().describe("The URL of the website you want to scrape."),
		output_format: z
			.enum(["markdown", "html", "json", "text"])
			.default("markdown")
			.describe('Choose format ("html", "markdown", "json", or "text"). Default: "markdown"'),
		country: z
			.string()
			.optional()
			.describe("Optional country code (e.g., US, GB, CA) for location-specific scraping."),
		wait_before_scraping: z
			.number()
			.int()
			.min(0)
			.max(10000)
			.default(0)
			.describe("Wait time in milliseconds before scraping (0-10000). Useful for dynamic content."),
		parser: z
			.string()
			.optional()
			.describe('Optional parser ID for specialized extraction (e.g., "@olostep/amazon-product").'),
	},
	handler: async (
		{
			url_to_scrape,
			output_format,
			country,
			wait_before_scraping,
			parser,
		}: {
			url_to_scrape: string;
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
			const body: Record<string, unknown> = {
				url_to_scrape,
				formats,
				wait_before_scraping: wait_before_scraping ?? 0,
			};
			if (country) body.country = country;
			if (orbitKey) body.force_connection_id = orbitKey;
			if (parser) {
				// Include parser-based extraction alongside selected format
				body.parser_extract = { parser_id: parser };
			}

			const response = await fetch(OLOSTEP_SCRAPE_API_URL, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				let errorDetails: unknown = null;
				try {
					errorDetails = await response.json();
				} catch {
					// ignore JSON parse error for non-JSON error bodies
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

			const data = (await response.json()) as OlostepScrapeResponse;
			// Return the full result object so callers can access id/url/status/contents
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data.result ?? {}, null, 2),
					},
				],
			};
		} catch (error: unknown) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Error: Failed to scrape website. ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				],
			};
		}
	},
};


