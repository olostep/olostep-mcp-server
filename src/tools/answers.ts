import { z } from "zod";
import { Headers } from "node-fetch";
import fetch from "node-fetch";

const OLOSTEP_ANSWERS_API_URL = "https://api.olostep.com/v1/answers";

export interface OlostepAnswersResponse {
	answer_id?: string;
	object?: string;
	task?: string;
	result?: unknown;
	sources?: string[] | Array<{ url: string; title?: string }>;
	created?: string;
}

export const answers = {
	name: "answers",
	description:
		"Answer a factual question using web search, optionally shaped into a flat JSON object of fields " +
		"(returned with sources and citations). Best for a bounded, factual answer (e.g. a company's founding " +
		"year, a product's current price). It is NOT reliable for enumerating a live list from a page (e.g. " +
		"'the latest N blog posts with titles and dates') — for that, use create_map or get_webpage_content on " +
		"the page and read the results instead.",
	schema: {
		task: z.string().describe("Question or task to answer using web data."),
		json: z
			.union([z.string(), z.record(z.any())])
			.optional()
			.describe(
				'Optional shape for the answer: a flat JSON object of the fields you want. ' +
				'Example: { "book_title": "", "author": "", "release_date": "" }. ' +
				'Keep it flat — deeply nested shapes or long lists are unreliable.',
			),
	},
	handler: async (
		{ task, json }: { task: string; json?: Record<string, unknown> | string },
		apiKey: string,
	) => {
		try {
			const headers = new Headers({
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			});

			const payload: Record<string, unknown> = { task };
			if (typeof json !== "undefined") {
				payload.json = json;
			}

			const response = await fetch(OLOSTEP_ANSWERS_API_URL, {
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

			const data = (await response.json()) as OlostepAnswersResponse;
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
						text: `Error: Failed to get answer. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};


