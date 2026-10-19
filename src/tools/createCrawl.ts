import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";
import { getCrawlResults } from "./getCrawlResults.js";

const OLOSTEP_CRAWL_API_URL = "https://api.olostep.com/v1/crawls";

export interface OlostepCrawlResponse {
	id?: string;
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
    "Waits up to `wait_for_completion_seconds` (default 45) and returns the scraped pages when the crawl finishes in that time. Larger crawls return a crawl_id instead, and `get_crawl_results` returns their pages once done. " +
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
		wait_for_completion_seconds: z
			.number()
			.int()
			.min(0)
			.max(300)
			.default(45)
			.describe("Seconds to wait for the crawl to finish and return its pages in this call. 0 returns the crawl_id right away."),
	},
	handler: async (
		{
			url,
			start_url,
			max_pages,
			output_format,
			country,
			parser,
			wait_for_completion_seconds,
		}: {
			url?: string;
			start_url?: string;
			max_pages?: number;
			output_format: "markdown" | "html" | "json" | "text";
			country?: string;
			parser?: string;
			wait_for_completion_seconds?: number;
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

			// Wait for small crawls and hand back the pages directly, so the caller
			// doesn't need a second call for the common case.
			const waitSeconds = wait_for_completion_seconds ?? 45;
			const crawlId = data.id ?? data.crawl_id;
			if (waitSeconds > 0 && crawlId) {
				const deadline = Date.now() + waitSeconds * 1000;
				while (Date.now() < deadline) {
					await new Promise((r) => setTimeout(r, 5_000));
					const res = await getCrawlResults.handler(
						{ crawl_id: crawlId, formats: [output_format], items_limit: Math.min(max_pages ?? 10, 20) },
						apiKey,
					);
					if (res.isError) break;
					let status = "";
					try { status = String(JSON.parse(res.content[0].text).status ?? ""); } catch { /* keep polling */ }
					if (status === "completed") return res;
				}
				return {
					content: [{
						type: "text",
						text: JSON.stringify({
							...data,
							message: `Crawl still running after ${waitSeconds}s. get_crawl_results with crawl_id "${crawlId}" returns the pages once it finishes.`,
						}, null, 2),
					}],
				};
			}

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


