import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";
import { DEFAULT_MAX_CHARACTERS, shapePage } from "./pageContent.js";

const OLOSTEP_SEARCHES_API_URL = "https://api.olostep.com/v1/searches";

interface SearchLink {
	url?: string;
	title?: string;
	description?: string;
	markdown_content?: string | null;
}

interface SearchResponse {
	id?: string;
	credits_consumed?: number;
	result?: {
		links?: SearchLink[];
		size_exceeded?: boolean;
		json_hosted_url?: string;
	};
}

export const searchWeb = {
	name: "search_web",
	description:
		"Use this when you need web pages on a topic and do not have a URL yet. " +
		"Returns up to `limit` results (1-25), each with its URL, title and description. " +
		"Set scrape_results to true to also get each result page's content as markdown in the same call " +
		"(each scraped page costs extra credits); otherwise pass the URLs you need to scrape_website, " +
		"or to batch_scrape_urls for many. Use include_domains to search one site. " +
		"For a direct factual answer with sources, use answers.",
	schema: {
		query: z.string().describe("Search query in natural language."),
		limit: z
			.number()
			.int()
			.min(1)
			.max(25)
			.optional()
			.default(10)
			.describe("Number of results to return, from 1 to 25. Default: 10."),
		include_domains: z
			.array(z.string())
			.optional()
			.describe("Only return results from these domains, e.g. [\"docs.olostep.com\"]."),
		exclude_domains: z
			.array(z.string())
			.optional()
			.describe("Never return results from these domains."),
		scrape_results: z
			.boolean()
			.optional()
			.default(false)
			.describe("Also scrape each result and return its content as markdown. Each scraped page uses extra credits."),
		max_characters: z
			.number()
			.int()
			.min(1)
			.optional()
			.default(DEFAULT_MAX_CHARACTERS)
			.describe("With scrape_results, the maximum characters of content returned per page. Default: 20000."),
	},
	handler: async (
		{
			query,
			limit = 10,
			include_domains,
			exclude_domains,
			scrape_results = false,
			max_characters = DEFAULT_MAX_CHARACTERS,
		}: {
			query: string;
			limit?: number;
			include_domains?: string[];
			exclude_domains?: string[];
			scrape_results?: boolean;
			max_characters?: number;
		},
		apiKey: string,
	) => {
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const payload = {
				query,
				limit,
				...(include_domains?.length && { include_domains }),
				...(exclude_domains?.length && { exclude_domains }),
				...(scrape_results && { scrape_options: { formats: ["markdown"] } }),
			};

			const response = await fetch(OLOSTEP_SEARCHES_API_URL, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				let details: unknown;
				try {
					details = await response.json();
				} catch {
					details = await response.text().catch(() => "");
				}
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Olostep API Error: ${response.status} ${response.statusText}. Details: ${JSON.stringify(details)}`,
						},
					],
				};
			}

			const data = (await response.json()) as SearchResponse;
			const links = data.result?.links ?? [];

			const results = links.map((link) => {
				const item: Record<string, unknown> = {
					url: link.url ?? "",
					title: link.title ?? "",
					description: link.description ?? "",
				};
				if (scrape_results) {
					// null when the page could not be scraped in time; keep it so the model knows.
					item.markdown_content = link.markdown_content ?? null;
					return shapePage(item, { maxCharacters: max_characters });
				}
				return item;
			});

			const output: Record<string, unknown> = {
				query,
				search_id: data.id ?? "",
				results,
				total_results: results.length,
			};
			if (data.result?.size_exceeded) {
				output.size_exceeded_note =
					"The full response was too large to return inline, so page content is missing. " +
					"Scrape the URLs you need with scrape_website.";
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(output, null, 2),
					},
				],
			};
		} catch (error: unknown) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Error: Failed to perform web search. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
