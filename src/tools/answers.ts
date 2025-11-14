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
		"Search the web and return AI-powered answers in the JSON structure you want, with sources and citations.",
	schema: {
		task: z.string().describe("Question or task to answer using web data."),
		json: z
			.union([z.string(), z.record(z.any())])
			.optional()
			.describe(
				'Optional JSON schema/object or a short description of the desired output shape. Example object: { "book_title": "", "author": "", "release_date": "" }',
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


