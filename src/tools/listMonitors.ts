import { z } from "zod";
import fetch, { Headers } from "node-fetch";

const MONITORS_URL = "https://api.olostep.com/v1/monitors";

export const listMonitors = {
	name: "list_monitors",
	description: "List all monitors for this API key. Returns each monitor's id, query, schedule, status, and last-run summary.",
	schema: {
		include_deleted: z
			.boolean()
			.optional()
			.describe("Set to true to include soft-deleted monitors in the response. Default: false."),
	},
	handler: async (
		params: { include_deleted?: boolean },
		apiKey: string,
	) => {
		try {
			const url = new URL(MONITORS_URL);
			if (params.include_deleted) url.searchParams.set("include_deleted", "true");

			const response = await fetch(url.toString(), {
				method: "GET",
				headers: new Headers({ Authorization: `Bearer ${apiKey}` }),
			});

			const data = await response.json();

			if (!response.ok) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Olostep API Error ${response.status}: ${JSON.stringify(data)}`,
						},
					],
				};
			}

			return {
				content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
			};
		} catch (error: unknown) {
			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `Error: Failed to list monitors. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
