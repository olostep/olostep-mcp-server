import { z } from "zod";
import fetch, { Headers } from "node-fetch";

const MONITORS_BASE_URL = "https://api.olostep.com/v1/monitors";

export const pauseMonitor = {
	name: "pause_monitor",
	description:
		"Pause an active monitor. The schedule stops running; existing snapshots and history are preserved. Only monitors with status 'active' can be paused. Resume with resume_monitor.",
	schema: {
		monitor_id: z
			.string()
			.startsWith("monitor_")
			.describe('The monitor ID to pause (starts with "monitor_").'),
	},
	handler: async (params: { monitor_id: string }, apiKey: string) => {
		try {
			const response = await fetch(`${MONITORS_BASE_URL}/${params.monitor_id}/pause`, {
				method: "POST",
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
						text: `Error: Failed to pause monitor. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
