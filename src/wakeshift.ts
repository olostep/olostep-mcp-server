// Wakeshift: wake the agent that started a crawl or batch when it finishes,
// instead of having it come back to get_crawl_results or get_batch_results.
// See docs/wakeshift.md.
//
// Off unless both WAKESHIFT_KEY and OLOSTEP_WEBHOOK_SECRET are set, on the
// HTTP transport. Otherwise nothing is sent to Wakeshift, and tools/list and
// every result are exactly as before.
//
// When on, create_crawl and batch_scrape_urls create each job with a
// `webhook` pointing at this server: POST /webhooks/olostep/<token>. When the
// agent left wait_for_completion_seconds at its default (or 0) and Wakeshift can wake
// its conversation, the tool subscribes the conversation to the job's end and
// returns at once instead of waiting. Olostep's backend posts its
// crawl.completed or batch.completed event when the job ends, and this server
// emits it to Wakeshift, which wakes the conversation. Otherwise the tool waits
// exactly as without Wakeshift, and the webhook matches nobody. This server
// never checks a job's status for Wakeshift: the webhook is the only signal.
//
// Olostep's webhooks aren't signed, so the token in the path is the check: an
// HMAC, under OLOSTEP_WEBHOOK_SECRET, of the job's kind, an ID this server
// generated for it, and an expiry. Only the server can make one, each is good
// for one job, and each stops working when it expires. Nothing is stored.

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Wakeshift, isWakeshiftError } from "@wakeshift/sdk";
import { z } from "zod";

/** Where Olostep posts a job's webhook: this path, then the job's token. */
export const WEBHOOK_PATH = "/webhooks/olostep";

/** How long a conversation stays subscribed, and a job's webhook works. */
const JOB_LIFETIME_SECONDS = 24 * 60 * 60;
// Olostep retries a failed delivery for 30 minutes.
const RETRY_WINDOW_SECONDS = 31 * 60;
// The tools' own default for wait_for_completion_seconds. After validation
// an agent's explicit 45 looks the same, so 45 counts as no choice.
export const DEFAULT_WAIT_SECONDS = 45;

/**
 * Whether the agent left the wait to the tool: the default, or 0 (it asked
 * not to wait, so a wake replaces nothing). Any other wait is its choice.
 */
export const waitIsOpen = (waitSeconds: number | undefined) =>
	waitSeconds === undefined || waitSeconds === DEFAULT_WAIT_SECONDS || waitSeconds === 0;

const KINDS = { crawl: "create_crawl", batch: "batch_scrape_urls" } as const;
type Kind = keyof typeof KINDS;

const count = z.number().int().nonnegative().optional();

// The parts of Olostep's webhook body this server reads. Other fields are
// ignored. Olostep's docs name the counts urls_count and items_*; what it
// sends (checked 2026-11-11) is pages_count and *_urls, so both are read.
const webhookBody = z.object({
	id: z.string().min(1).max(200),
	object: z.string().max(100),
	data: z.object({
		id: z.string().min(1).max(200),
		status: z.string().min(1).max(64),
		pages_count: count,
		urls_count: count,
		total_urls: count,
		completed_urls: count,
		failed_urls: count,
		items_total: count,
		items_completed: count,
		items_failed: count,
	}),
});

// Olostep also posts progress (event.batch.progress, status in_progress) to a
// job's webhook. Only a job's last event wakes the agent: a status on this
// list, never a .progress event. Anything else is accepted and ignored, so a
// new kind of event can't wake the agent early.
const FINAL = new Set(["completed", "failed", "canceled", "cancelled", "error", "errored", "stopped", "timed_out", "timeout"]);
export const isFinal = (object: string, status: string) => !/\.progress$/.test(object) && FINAL.has(status.toLowerCase());

const jobArgs = z.object({ job: z.string() });

/**
 * The longest a single tool call can last in each agent program Wakeshift
 * recognizes, in seconds: a client cuts off a call that waits longer.
 * Claude Code allows about 60 s per MCP call; Codex 300 s.
 */
export const CLIENT_CALL_LIMIT_SECONDS: Record<string, number> = { "claude-code": 60, codex: 300 };

/**
 * Whether the agent's own wait can't be honored in one call by its client:
 * a wait longer than the client allows is cut off anyway, so with a
 * confirmed wake the tool returns at once instead.
 */
export const waitOutlastsCall = (waitSeconds: number | undefined, harness: string | null | undefined) =>
	waitSeconds !== undefined && !!harness && harness in CLIENT_CALL_LIMIT_SECONDS && waitSeconds > CLIENT_CALL_LIMIT_SECONDS[harness];

/** What a job tool gets when Wakeshift is on. */
export interface JobWake {
	/** The URL to create the job with, as its `webhook`. */
	readonly webhook: string;
	/**
	 * The conversation is subscribed to the job's end and Wakeshift can wake
	 * it: the tool doesn't wait (wait_for_completion_seconds 0). Otherwise the
	 * tool waits as it always has, and nothing is subscribed.
	 */
	readonly wakes: boolean;
}

/**
 * Whether a subscription will wake its conversation, from what the SDK says
 * today: a conversation subscription (created or renewed) for an agent
 * program Wakeshift recognized. Not: an MCP Events client's (native: it wakes
 * only if the client takes up the voucher), "unavailable", or an agent
 * Wakeshift didn't recognize.
 */
export function wakeConfirmed(sub: { state: string; recognized?: { harness: string | null } | null }): boolean {
	return (sub.state === "created" || sub.state === "renewed") && !!sub.recognized?.harness;
}

const crawlPayload = z.object({
	crawl_id: z.string(),
	status: z.string(),
	pages: z.number().optional(),
});

const batchPayload = z.object({
	batch_id: z.string(),
	status: z.string(),
	urls: z.number().optional(),
	completed: z.number().optional(),
	failed: z.number().optional(),
});

// Only safe characters from a posted value reach the agent's line.
const plain = (s: string) => s.replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 64);
const counted = (n: number | undefined, one: string, many = one) => (n === undefined ? "" : `, ${n} ${n === 1 ? one : many}`);

/**
 * Olostep's events on a Wakeshift client, signing with `secret`; job webhooks
 * go to `publicOrigin` (this server's public URL, from configuration, never
 * from a request). Tests pass the SDK's test client.
 */
export function jobWakes(wake: Wakeshift, secret: string, publicOrigin: string) {
	const base = new URL(publicOrigin).origin;
	const crawlCompleted = wake.defineEvent("crawl.completed", {
		description: "An Olostep crawl finished",
		args: jobArgs,
		payload: crawlPayload,
		text: (p) => `Crawl ${plain(p.crawl_id)} finished: ${plain(p.status)}${counted(p.pages, "page", "pages")}.`,
	});
	const batchCompleted = wake.defineEvent("batch.completed", {
		description: "An Olostep batch finished",
		args: jobArgs,
		payload: batchPayload,
		text: (p) =>
			`Batch ${plain(p.batch_id)} finished: ${plain(p.status)}${counted(p.completed, "completed")}${counted(p.failed, "failed")}.`,
	});
	const kindOf: Record<string, Kind> = { create_crawl: "crawl", batch_scrape_urls: "batch" };

	const mac = (kind: Kind, job: string, expires: number) =>
		createHmac("sha256", secret).update(`olostep-webhook\n${kind}\n${job}\n${expires}`).digest("base64url");

	/** The token for one job: kind.job.expires.mac. */
	function token(kind: Kind, job: string, expires: number): string {
		return `${kind}.${job}.${expires}.${mac(kind, job, expires)}`;
	}

	/** The job a token names, if this server made it and it hasn't expired. */
	function check(tok: string, now = Math.floor(Date.now() / 1000)): { kind: Kind; job: string } | undefined {
		const parts = tok.split(".");
		if (parts.length !== 4) return undefined;
		const [kind, job, exp, given] = parts;
		if (!(kind in KINDS) || !/^[0-9a-f-]{36}$/.test(job) || !/^\d{1,12}$/.test(exp)) return undefined;
		if (now > Number(exp)) return undefined;
		const want = Buffer.from(mac(kind as Kind, job, Number(exp)));
		const got = Buffer.from(given);
		if (got.length !== want.length || !timingSafeEqual(got, want)) return undefined;
		return { kind: kind as Kind, job };
	}

	/**
	 * For a call of a job tool: the webhook to create the job with, and
	 * whether Wakeshift replaces the tool's own wait. It does only when the
	 * agent left the wait at its default or 0 and the conversation's wake is
	 * confirmed (wakeConfirmed); then the conversation is subscribed to the
	 * job's end. Otherwise nothing is subscribed (one that won't wake is
	 * ended again) and the tool behaves exactly as without Wakeshift.
	 * Undefined when Wakeshift is off or the tool doesn't start a job. It
	 * never throws, so Wakeshift never changes a tool's result.
	 */
	async function start(tool: string, waitSeconds: number | undefined): Promise<JobWake | undefined> {
		const kind = kindOf[tool];
		if (!kind || !wake.enabled) return undefined;
		const event = kind === "crawl" ? crawlCompleted : batchCompleted;
		const job = randomUUID();
		const expires = Math.floor(Date.now() / 1000) + JOB_LIFETIME_SECONDS + RETRY_WINDOW_SECONDS;
		// The webhook goes with the job either way: without a subscription it wakes nobody.
		const webhook = `${base}${WEBHOOK_PATH}/${token(kind, job, expires)}`;
		// The agent chose how long to wait. Respect it, unless its client can't
		// hold a call that long (checked once the wake is confirmed, below).
		const chosen = !waitIsOpen(waitSeconds);
		let call: ReturnType<typeof wake.currentCall>;
		try {
			call = wake.currentCall();
		} catch (err) {
			if (!isWakeshiftError(err, "no_call")) warn("couldn't find the tool call", err);
			return { webhook, wakes: false };
		}
		try {
			const sub = await call.subscribe(event, { job }, { once: true, ttl: JOB_LIFETIME_SECONDS });
			if (wakeConfirmed(sub) && (!chosen || waitOutlastsCall(waitSeconds, "recognized" in sub ? sub.recognized?.harness : null))) return { webhook, wakes: true };
			// Subscribed, but it won't wake (an MCP Events client's voucher, an
			// agent Wakeshift didn't recognize): end it, and wait as before.
			if (sub.state !== "unavailable" && sub.state !== "disabled") await call.unsubscribe(event, { job });
		} catch (err) {
			// Wakeshift down or refusing: wait as before.
			warn("couldn't subscribe the conversation to its job", err);
		}
		return { webhook, wakes: false };
	}

	/**
	 * Handles one POST to WEBHOOK_PATH/<token>: checks the token and body, and
	 * emits the job's event. Kept apart from Express so it can be tested.
	 */
	async function receive(tok: string, body: unknown): Promise<{ status: number; body?: Record<string, unknown> }> {
		const target = check(tok);
		if (!target) return { status: 404, body: { error: "unknown_webhook" } };
		const parsed = webhookBody.safeParse(body);
		if (!parsed.success) return { status: 400, body: { error: "invalid_body" } };
		const { id, object, data } = parsed.data;
		// Progress, or a status that isn't a final one: accepted, so Olostep
		// doesn't retry it, and nothing wakes.
		if (!isFinal(object, data.status)) {
			if (!/\.progress$/.test(object)) info(`ignored a job webhook with status "${plain(data.status)}", which isn't a final one`);
			return { status: 204 };
		}
		// Olostep's event ID is the same on every retry, so a retry emits once.
		const emitId = "olostep-" + createHash("sha256").update(`${target.job}\n${id}`).digest("hex");
		try {
			if (target.kind === "crawl") {
				const pages = data.pages_count ?? data.urls_count;
				await crawlCompleted.emit(
					{ job: target.job },
					{ crawl_id: data.id, status: data.status, ...(pages !== undefined && { pages }) },
					{ id: emitId },
				);
			} else {
				await batchCompleted.emit(
					{ job: target.job },
					{
						batch_id: data.id,
						status: data.status,
						...defined({
							urls: data.total_urls ?? data.items_total,
							completed: data.completed_urls ?? data.items_completed,
							failed: data.failed_urls ?? data.items_failed,
						}),
					},
					{ id: emitId },
				);
			}
		} catch (err) {
			// Wakeshift unreachable or refused: Olostep retries, and the emit ID keeps that to one wake.
			warn("couldn't emit a job's end", err);
			return { status: 502, body: { error: "emit_failed" } };
		}
		return { status: 204 };
	}

	/** Attaches Wakeshift to one MCP server, with no tools of its own. */
	function attach(server: Parameters<Wakeshift["attach"]>[0]) {
		return wake.attach(server, {
			wrap: { create_crawl: [crawlCompleted], batch_scrape_urls: [batchCompleted] },
			builtinTools: false,
		});
	}

	return {
		crawlCompleted,
		batchCompleted,
		attach,
		/** The tools that start a job, and so take a JobWake. */
		startsJob: (tool: string) => tool in kindOf,
		start,
		receive,
		/** @internal for tests */
		token,
	};
}

export type JobWakes = ReturnType<typeof jobWakes>;

/**
 * The server's jobs, or undefined when Wakeshift is off. Needs WAKESHIFT_KEY,
 * OLOSTEP_WEBHOOK_SECRET (at least 32 characters) and this server's public
 * URL: OLOSTEP_PUBLIC_URL, or else MCP_OAUTH_RESOURCE_URL's origin. Says why
 * when only some are set, and nothing when neither of the first two is.
 */
export function jobWakesFromEnv(env = process.env): JobWakes | undefined {
	const key = env.WAKESHIFT_KEY?.trim();
	const secret = env.OLOSTEP_WEBHOOK_SECRET?.trim();
	const origin = env.OLOSTEP_PUBLIC_URL?.trim() || env.MCP_OAUTH_RESOURCE_URL?.trim();
	if (!key && !secret) return undefined;
	if (!key) {
		info("OLOSTEP_WEBHOOK_SECRET is set but WAKESHIFT_KEY isn't, so job wakes are off.");
		return undefined;
	}
	if (!secret || secret.length < 32) {
		info("WAKESHIFT_KEY is set but OLOSTEP_WEBHOOK_SECRET isn't (at least 32 characters), so job wakes are off.");
		return undefined;
	}
	if (!origin || !/^https?:\/\//.test(origin)) {
		info("WAKESHIFT_KEY is set but OLOSTEP_PUBLIC_URL (this server's public URL) isn't, so job wakes are off.");
		return undefined;
	}
	return jobWakes(new Wakeshift({ key }), secret, origin);
}

/** The fields that have a value. */
function defined<T extends Record<string, unknown>>(o: T): Partial<T> {
	return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function log(level: string, message: string, extra: Record<string, unknown> = {}) {
	process.stderr.write(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...extra }) + "\n");
}

const info = (message: string) => log("info", `wakeshift: ${message}`);

// Only the kind of error: never a URL, token or key.
const warn = (message: string, err: unknown) =>
	log("warn", `wakeshift: ${message}`, { error: err instanceof Error ? err.name : typeof err });
