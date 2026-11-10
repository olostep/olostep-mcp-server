import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";
import { DEFAULT_MAX_CHARACTERS, shapePage } from "./pageContent.js";

const OLOSTEP_SCRAPE_API_URL = "https://api.olostep.com/v1/scrapes";

export interface OlostepScrapeResponse {
	url?: string;
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
		"Use this when you have a URL and need what is on the page. " +
		"Returns the page as clean markdown (default), html or text, with its url and title, after rendering JavaScript. " +
		"For structured fields, set output_format to \"json\" with an llm_extract schema or a parser. " +
		"Long pages are cut at max_characters (default 20,000) with a link to the full text. " +
		"For many known URLs use batch_scrape_urls; for many pages of one site use create_crawl.",
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
			.describe('Optional parser ID for specialized extraction (e.g., "@olostep/amazon-it-product").'),
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
		max_characters: z
			.number()
			.int()
			.min(500)
			.default(DEFAULT_MAX_CHARACTERS)
			.describe(`Max characters of page content to return (default ${DEFAULT_MAX_CHARACTERS}). Longer pages are cut and link to their full text; raise this to read more.`),
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
			max_characters,
		}: {
			url?: string;
			url_to_scrape?: string;
			output_format: "markdown" | "html" | "json" | "text";
			country?: string;
			wait_before_scraping?: number;
			parser?: string;
			llm_extract?: { schema?: Record<string, unknown>; prompt?: string };
			max_characters?: number;
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
			// The result object with the page's url and title first and long content cut.
			const page = shapePage((data.result ?? {}) as Record<string, unknown>, {
				url: data.url ?? targetUrl,
				maxCharacters: max_characters,
			});
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(page, null, 2),
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


