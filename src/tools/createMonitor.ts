import { z } from "zod";
import fetch, { Headers } from "node-fetch";

const MONITORS_URL = "https://api.olostep.com/v1/monitors";

export const createMonitor = {
	name: "create_monitor",
	description:
		"Create a recurring web monitor. Olostep visits the target on a schedule, detects changes, and can notify you by email, Slack, or SMS, or POST a webhook. Returns status 'provisioning' immediately; the monitor becomes 'active' once setup completes (usually within a minute).",
	schema: {
		query: z
			.string()
			.min(1)
			.describe(
				"What to watch for — written as a natural-language question or instruction. Example: \"Has the pricing on this page changed?\" or \"Track the in-stock status of the main product.\"",
			),
		source_policy: z
			.object({
				include_urls: z
					.array(z.string().url())
					.optional()
					.describe("URLs to monitor. If omitted, Olostep infers them from the query."),
				exclude_urls: z.array(z.string().url()).optional().describe("URLs to skip."),
				include_domains: z.array(z.string()).optional().describe("Restrict monitoring to these domains."),
				exclude_domains: z.array(z.string()).optional().describe("Never visit these domains."),
			})
			.optional()
			.describe("Controls which URLs are fetched on each run."),
		frequency: z
			.string()
			.max(50)
			.optional()
			.describe(
				'How often to run. Natural language: "every hour", "every day at 9am", "every 30 minutes" (minimum 10 minutes). Defaults to "every hour".',
			),
		notification: z
			.object({
				events: z
					.array(z.enum(["changed", "first_snapshot"]))
					.optional()
					.describe(
						'Which events trigger notifications. Defaults to ["changed","first_snapshot"] when channels are set.',
					),
				channels: z
					.array(
						z.object({
							type: z.enum(["email", "slack", "sms"]).describe("Delivery channel type."),
							target: z
								.string()
								.describe(
									"Destination: an email address, a Slack webhook URL, or an E.164 phone number (+1…).",
								),
							events: z
								.array(z.enum(["changed", "first_snapshot"]))
								.optional()
								.describe("Per-channel event filter; overrides the top-level events list."),
						}),
					)
					.optional()
					.describe("Where to send notifications."),
			})
			.optional()
			.describe("Notification settings. Omit to receive no notifications."),
		webhook: z
			.object({
				url: z.string().url().describe("HTTPS endpoint that receives a POST on each monitor run."),
			})
			.optional()
			.describe("Webhook called on each run. Note: payloads are not signed."),
		output_schema: z
			.record(z.unknown())
			.optional()
			.describe(
				"Optional JSON Schema for structured data extraction from the monitored page. Example: {\"type\":\"object\",\"properties\":{\"price\":{\"type\":\"number\"}}}",
			),
		metadata: z
			.record(z.string())
			.optional()
			.describe("Key/value labels you can use to tag this monitor (up to 50 keys, 500 chars each)."),
	},
	handler: async (
		params: {
			query: string;
			source_policy?: {
				include_urls?: string[];
				exclude_urls?: string[];
				include_domains?: string[];
				exclude_domains?: string[];
			};
			frequency?: string;
			notification?: {
				events?: ("changed" | "first_snapshot")[];
				channels?: {
					type: "email" | "slack" | "sms";
					target: string;
					events?: ("changed" | "first_snapshot")[];
				}[];
			};
			webhook?: { url: string };
			output_schema?: Record<string, unknown>;
			metadata?: Record<string, string>;
		},
		apiKey: string,
	) => {
		try {
			const body: Record<string, unknown> = { query: params.query };
			if (params.source_policy) body.source_policy = params.source_policy;
			if (params.frequency) body.frequency = params.frequency;
			if (params.notification) body.notification = params.notification;
			if (params.webhook) body.webhook = params.webhook;
			if (params.output_schema) body.output_schema = params.output_schema;
			if (params.metadata) body.metadata = params.metadata;

			const response = await fetch(MONITORS_URL, {
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
						text: `Error: Failed to create monitor. ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
