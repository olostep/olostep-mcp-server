import { z } from "zod";
import { getGoogleSearch } from "./getGoogleSearch.js";

export const searchWeb = {
	name: "search_web",
	description:
		"Search the web for a given query and return structured results (non-AI, parser-based).",
	schema: {
		query: z.string().describe("Search query"),
		country: z
			.string()
			.optional()
			.default("US")
			.describe("Optional country code for localized results (e.g., US, GB)."),
	},
	handler: async (
		{ query, country }: { query: string; country?: string },
		apiKey: string,
		orbitKey?: string,
	) => {
		// Reuse the same underlying Google parser-based search
		return getGoogleSearch.handler({ query, country }, apiKey, orbitKey);
	},
};


