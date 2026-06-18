import { z } from "zod";
import fetch, { Headers } from "node-fetch";

const MONITORS_BASE_URL = "https://api.olostep.com/v1/monitors";

export const updateMonitor = {
	name: "update_monitor",
	description:
		"Update a monitor's frequency, notification settings, webhook, or metadata. Include only the fields you want to change. Changing frequency deletes and recreates the underlying schedule. Passing webhook: null removes the webhook. Unsupported fields are silently ignored.",
	schema: {
		monitor_id: z
			.string()
			.startsWith("monitor_")
			.describe('The monitor ID to update (starts with "monitor_").'),
		frequency: z
			.string()
			.max(50)
			.optional()
			.describe(
				'New schedule frequency in natural language, e.g. "every 6 hours" or "every day at noon". Minimum: every 10 minutes.',
			),
		notification: z
			.object({
				events: z
					.array(z.enum(["changed", "first_snapshot"]))
					.optional()
					.describe("Which events trigger notifications."),
				channels: z
					.array(
						z.object({
							type: z.enum(["email", "slack", "sms"]),
							target: z.string(),
							events: z.array(z.enum(["changed", "first_snapshot"])).optional(),
						}),
					)
					.optional()
					.describe("Where to send notifications."),
			})
			.nullable()
			.optional()
			.describe("Replace notification settings entirely. Pass null or empty to clear."),
		webhook: z
			.object({ url: z.string().url() })
			.nullable()
			.optional()
			.describe("Replace the webhook URL. Pass null to remove the webhook."),
		metadata: z
			.record(z.string())
			.optional()
			.describe(
				'Key/value labels. Merged with existing metadata (Stripe-style: pass "" as a value to delete that key).',
			),
	},
	handler: async (
		params: {
			monitor_id: string;
			frequency?: string;
			notification?: {
				events?: ("changed" | "first_snapshot")[];
				channels?: {
					type: "email" | "slack" | "sms";
					target: string;
					events?: ("changed" | "first_snapshot")[];
				}[];
			} | null;
			webhook?: { url: string } | null;
			metadata?: Record<string, string>;
		},
		apiKey: string,
	) => {
		try {
			const body: Record<string, unknown> = {};
			if (params.frequency !== undefined) body.frequency = params.frequency;
			if (params.notification !== undefined) body.notification = params.notification;
			if (params.webhook !== undefined) body.webhook = params.webhook;
			if (params.metadata !== undefined) body.metadata = params.metadata;

			if (Object.keys(body).length === 0) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "Error: No fields provided to update. Pass at least one of: frequency, notification, webhook, metadata.",
						},
					],
				};
			}

			const response = await fetch(`${MONITORS_BASE_URL}/${params.monitor_id}`, {
				method: "POST",
				headers: new Headers({
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				}),
				body: JSON.stringify(body),
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
						text: `Error: Failed to update monitor. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
