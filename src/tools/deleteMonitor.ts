import { z } from "zod";
import fetch, { Headers } from "node-fetch";

const MONITORS_BASE_URL = "https://api.olostep.com/v1/monitors";

export const deleteMonitor = {
	name: "delete_monitor",
	description:
		"Delete a monitor. The monitor's schedule is cancelled and it is soft-deleted (status becomes 'deleted'). This cannot be undone. Snapshot history is preserved but the monitor stops running.",
	schema: {
		monitor_id: z
			.string()
			.startsWith("monitor_")
			.describe('The monitor ID to delete (starts with "monitor_").'),
	},
	handler: async (params: { monitor_id: string }, apiKey: string) => {
		try {
			const response = await fetch(`${MONITORS_BASE_URL}/${params.monitor_id}`, {
				method: "DELETE",
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
						text: `Error: Failed to delete monitor. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
