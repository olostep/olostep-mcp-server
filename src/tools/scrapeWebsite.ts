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
		url: z.string().url().optional().describe("The URL of the website you want to scrape."),
		url_to_scrape: z.string().url().optional().describe("Alias for `url`."),
		output_format: z
			.enum(["markdown", "html", "json", "text"])
			.default("markdown")
			.describe(
				'Output format. "markdown" (default), "html", and "text" need no extra config. ' +
				'"json" returns STRUCTURED data and requires either a `parser` OR an `llm_extract` schema ' +
				'describing the fields to pull. Do not request "json" on its own.',
			),
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
		llm_extract: z
			.object({
				schema: z.record(z.any()).optional(),
				prompt: z.string().optional(),
			})
			.optional()
			.describe(
				'Defines what to pull when output_format is "json". Provide a `schema` (a JSON-schema object of ' +
				'the fields you want, e.g. { "type": "object", "properties": { "title": { "type": "string" } } }) ' +
				'and/or a `prompt`. Required for JSON output unless a `parser` is given.',
			),
	},
	handler: async (
		{
			url,
			url_to_scrape,
			output_format,
			country,
			wait_before_scraping,
			parser,
			llm_extract,
		}: {
			url?: string;
			url_to_scrape?: string;
			output_format: "markdown" | "html" | "json" | "text";
			country?: string;
			wait_before_scraping?: number;
			parser?: string;
			llm_extract?: { schema?: Record<string, unknown>; prompt?: string };
		},
		apiKey: string,
		orbitKey?: string,
	) => {
		const targetUrl = url ?? url_to_scrape;
		if (!targetUrl) {
			return { isError: true, content: [{ type: "text", text: "Error: a 'url' is required." }] };
		}
		if (output_format === "json" && !parser && !llm_extract) {
			return {
				isError: true,
				content: [{
					type: "text",
					text: 'Error: output_format "json" needs a `parser` or an `llm_extract` schema ' +
						'(e.g. llm_extract: { schema: { "type": "object", "properties": { "title": { "type": "string" } } } }). ' +
						'Add one, or use "markdown"/"html"/"text".',
				}],
			};
		}
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const formats: string[] = [output_format];
			const body: Record<string, unknown> = {
				url_to_scrape: targetUrl,
				formats,
				wait_before_scraping: wait_before_scraping ?? 0,
			};
			if (country) body.country = country;
			if (orbitKey) body.force_connection_id = orbitKey;
			if (parser) {
				// Include parser-based extraction alongside selected format
				body.parser_extract = { parser_id: parser };
			}
			if (llm_extract) {
				// Schema/prompt the API uses to fill JSON output
				body.llm_extract = llm_extract;
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


