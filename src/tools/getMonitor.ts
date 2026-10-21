import { z } from "zod";
import fetch, { Headers } from "node-fetch";

const MONITORS_BASE_URL = "https://api.olostep.com/v1/monitors";

export const getMonitor = {
	name: "get_monitor",
	description:
		"Retrieve a single monitor by ID, including its schedule, current status, last-run result, and total snapshot count.",
	schema: {
		monitor_id: z
			.string()
			.startsWith("monitor_")
			.describe('The monitor ID returned by create_monitor (starts with "monitor_").'),
		include_total_count: z
			.boolean()
			.optional()
			.describe("Set to false to skip the snapshot count query and reduce latency. Default: true."),
	},
	handler: async (
		params: { monitor_id: string; include_total_count?: boolean },
		apiKey: string,
	) => {
		try {
			const url = new URL(`${MONITORS_BASE_URL}/${params.monitor_id}`);
			if (params.include_total_count === false) {
				url.searchParams.set("include_total_count", "false");
			}

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
						text: `Error: Failed to get monitor. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
