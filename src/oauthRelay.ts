import { createHmac, timingSafeEqual } from "node:crypto";

// Local tools (Copilot CLI, Codex, Gemini CLI...) sign in through a callback on
// 127.0.0.1 with a new random port each time. Cognito only accepts exact
// callback URLs, so for those we hand Cognito our own fixed callback and pass
// the result on to the tool's local port. Only loopback addresses are relayed.

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const STATE_TTL_MS = 10 * 60 * 1000;

export function isLoopbackRedirect(uri: string): boolean {
    let url: URL;
    try {
        url = new URL(uri);
    } catch {
        return false;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (!LOOPBACK_HOSTS.has(url.hostname)) return false;
    if (url.username || url.password || url.hash) return false;
    return true;
}

type RelayState = { r: string; s: string; e: number };

function sign(payload: string, key: string): string {
    return createHmac("sha256", key).update(payload).digest("base64url");
}

// Packs the tool's own redirect and state into the state we send to Cognito,
// signed so nobody can swap in a different redirect on the way back.
export function packState(redirectUri: string, clientState: string, key: string, now = Date.now()): string {
    const body: RelayState = { r: redirectUri, s: clientState, e: now + STATE_TTL_MS };
    const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
    return `${payload}.${sign(payload, key)}`;
}

export function unpackState(state: string, key: string, now = Date.now()): { redirectUri: string; clientState: string } | null {
    if (state.length > 4096) return null;
    const dot = state.lastIndexOf(".");
    if (dot <= 0) return null;
    const payload = state.slice(0, dot);
    const given = Buffer.from(state.slice(dot + 1));
    const expected = Buffer.from(sign(payload, key));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    let body: RelayState;
    try {
        body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
        return null;
    }
    if (typeof body.r !== "string" || typeof body.s !== "string" || typeof body.e !== "number") return null;
    if (body.e < now || !isLoopbackRedirect(body.r)) return null;
    return { redirectUri: body.r, clientState: body.s };
}
