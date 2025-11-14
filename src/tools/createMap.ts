import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";

const OLOSTEP_MAP_API_URL = "https://api.olostep.com/v1/maps";

export interface OlostepCreateMapResponse {
	map_id?: string;
	object?: string;
	url?: string;
	total_urls?: number;
	urls?: string[];
	search_query?: string;
	top_n?: number;
	include_url_patterns?: string[];
	exclude_url_patterns?: string[];
}

export const createMap = {
	name: "create_map",
	description: "Get all URLs on a website. Extract URLs for discovery and site analysis.",
	schema: {
		website_url: z.string().url().describe("Website URL to extract links from."),
		search_query: z.string().optional().describe('Optional search query to filter URLs (e.g., "blog").'),
		top_n: z.number().int().min(1).optional().describe("Optional limit for number of URLs returned."),
		include_url_patterns: z
			.array(z.string())
			.optional()
			.describe('Optional glob patterns to include (e.g., "/blog/**").'),
		exclude_url_patterns: z
			.array(z.string())
			.optional()
			.describe('Optional glob patterns to exclude (e.g., "/admin/**").'),
	},
	handler: async (
		{
			website_url,
			search_query,
			top_n,
			include_url_patterns,
			exclude_url_patterns,
		}: {
			website_url: string;
			search_query?: string;
			top_n?: number;
			include_url_patterns?: string[];
			exclude_url_patterns?: string[];
		},
		apiKey: string,
	) => {
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const payload: Record<string, unknown> = {
				url: website_url,
			};
			if (search_query) payload.search_query = search_query;
			if (typeof top_n === "number") payload.top_n = top_n;
			if (include_url_patterns?.length) payload.include_url_patterns = include_url_patterns;
			if (exclude_url_patterns?.length) payload.exclude_url_patterns = exclude_url_patterns;

			const response = await fetch(OLOSTEP_MAP_API_URL, {
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

			const data = (await response.json()) as OlostepCreateMapResponse;
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
						text: `Error: Failed to create map. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};


