import { z } from "zod";
import fetch, { Headers } from "node-fetch";

const MONITORS_BASE_URL = "https://api.olostep.com/v1/monitors";

export const getMonitorEvents = {
	name: "get_monitor_events",
	description:
		"List the snapshot history for a monitor, newest first. Each event shows whether a change was detected and a plain-language summary of what changed. Use the next_cursor for pagination.",
	schema: {
		monitor_id: z
			.string()
			.startsWith("monitor_")
			.describe('The monitor ID to fetch events for (starts with "monitor_").'),
		limit: z
			.number()
			.int()
			.min(1)
			.max(100)
			.optional()
			.describe("Number of events to return (1–100). Default: 25."),
		cursor: z
			.string()
			.optional()
			.describe("Pagination cursor from a previous response's next_cursor field."),
		status: z
			.enum(["all", "changed", "unchanged"])
			.optional()
			.describe('Filter events by change status. Default: "all".'),
	},
	handler: async (
		params: {
			monitor_id: string;
			limit?: number;
			cursor?: string;
			status?: "all" | "changed" | "unchanged";
		},
		apiKey: string,
	) => {
		try {
			const url = new URL(`${MONITORS_BASE_URL}/${params.monitor_id}/events`);
			if (params.limit) url.searchParams.set("limit", String(params.limit));
			if (params.cursor) url.searchParams.set("cursor", params.cursor);
			if (params.status && params.status !== "all") url.searchParams.set("status", params.status);

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
						text: `Error: Failed to get monitor events. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
