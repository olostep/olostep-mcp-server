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
	follow_links?: boolean;
	created?: string;
	formats?: string[];
	country?: string;
	parser?: string;
}

export const createCrawl = {
	name: "create_crawl",
	description:
		"Autonomously discover and scrape entire websites by following links from a start URL.",
	schema: {
		start_url: z.string().url().describe("Starting URL for the crawl."),
		max_pages: z.number().int().min(1).default(10).describe("Maximum number of pages to crawl."),
		follow_links: z.boolean().default(true).describe("Whether to follow links found on pages."),
		output_format: z
			.enum(["markdown", "html", "json", "text"])
			.default("markdown")
			.describe('Format for scraped content. Default: "markdown".'),
		country: z.string().optional().describe("Optional country code for location-specific crawling."),
		parser: z.string().optional().describe("Optional parser ID for specialized content extraction."),
	},
	handler: async (
		{
			start_url,
			max_pages,
			follow_links,
			output_format,
			country,
			parser,
		}: {
			start_url: string;
			max_pages?: number;
			follow_links?: boolean;
			output_format: "markdown" | "html" | "json" | "text";
			country?: string;
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
				start_url,
				max_pages: max_pages ?? 10,
				follow_links: follow_links ?? true,
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


