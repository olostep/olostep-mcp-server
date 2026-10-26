#!/usr/bin/env node
// OAuth loopback relay test. Runs the HTTP server against a fake Cognito and
// walks every path: metadata, registration, authorize, callback and token.
// Needs a build first (npm run build). No real Cognito or API key used.

import http from "node:http";
import { spawn } from "node:child_process";
import process from "node:process";

const FAKE_PORT = 4911;
const SERVER_PORT = 4912;
const FAKE = `http://localhost:${FAKE_PORT}`;
const SERVER = `http://localhost:${SERVER_PORT}`;
const CLIENT_ID = "test-client";
const CLAUDE_CB = "https://claude.ai/api/mcp/auth_callback";
const LOOPBACK_CB = "http://127.0.0.1:53408/";

let lastTokenForm = null;
const fake = http.createServer((req, res) => {
  if (req.url === "/.well-known/openid-configuration") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ authorization_endpoint: `${FAKE}/oauth2/authorize`, token_endpoint: `${FAKE}/oauth2/token`, jwks_uri: `${FAKE}/jwks` }));
    return;
  }
  if (req.url === "/oauth2/token" && req.method === "POST") {
    let body = "";
    req.on("data", c => (body += c));
    req.on("end", () => {
      lastTokenForm = Object.fromEntries(new URLSearchParams(body));
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ access_token: "fake-access", token_type: "Bearer" }));
    });
    return;
  }
  res.statusCode = 404;
  res.end();
});

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures++;
}

function startServer(extraEnv) {
  const proc = spawn(process.execPath, ["build/index.js"], {
    env: {
      ...process.env,
      TRANSPORT: "http",
      PORT: String(SERVER_PORT),
      MCP_OAUTH_AUTHORIZATION_SERVER_URL: FAKE,
      MCP_OAUTH_RESOURCE_URL: "",
      MCP_OAUTH_REGISTER_CLIENT_ID: CLIENT_ID,
      MCP_OAUTH_REGISTER_CLIENT_SECRET: "test-secret",
      MCP_OAUTH_REGISTER_REDIRECT_URIS: CLAUDE_CB,
      ...extraEnv,
    },
    stdio: "ignore",
  });
  return proc;
}

async function waitUp() {
  for (let i = 0; i < 200; i++) {
    try {
      const r = await fetch(`${SERVER}/health`);
      if (r.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error("server did not start");
}

const get = (path) => fetch(`${SERVER}${path}`, { redirect: "manual" });
const register = (uris) => fetch(`${SERVER}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ redirect_uris: uris }) });
const token = (form) => fetch(`${SERVER}/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(form).toString() });
const authorizeQuery = (redirect, extra = {}) => "/authorize?" + new URLSearchParams({ response_type: "code", client_id: CLIENT_ID, redirect_uri: redirect, state: "client-state-1", code_challenge: "abc123", code_challenge_method: "S256", scope: "olostep/api", ...extra });

await new Promise(r => fake.listen(FAKE_PORT, r));

// Relay on
let server = startServer({ MCP_OAUTH_RELAY_LOOPBACK: "true" });
try {
  await waitUp();

  const meta = await (await get("/.well-known/oauth-authorization-server")).json();
  check("metadata points authorize at this server", meta.authorization_endpoint === `${SERVER}/authorize`, meta.authorization_endpoint);
  check("metadata points token at this server", meta.token_endpoint === `${SERVER}/token`, meta.token_endpoint);

  check("register loopback http", (await register([LOOPBACK_CB])).status === 201);
  check("register loopback https", (await register(["https://127.0.0.1:53409/"])).status === 201);
  check("register localhost with path", (await register(["http://localhost:61000/mcp/oauth/callback"])).status === 201);
  check("register fixed claude callback", (await register([CLAUDE_CB])).status === 201);
  check("register unknown site rejected", (await register(["https://evil.example/cb"])).status === 400);
  check("register lookalike host rejected", (await register(["http://127.0.0.1.evil.example/cb"])).status === 400);

  let r = await get(authorizeQuery(CLAUDE_CB));
  let loc = new URL(r.headers.get("location") ?? "http://x/");
  check("fixed callback passes straight to Cognito", r.status === 302 && loc.origin === FAKE && loc.searchParams.get("redirect_uri") === CLAUDE_CB && loc.searchParams.get("state") === "client-state-1");

  r = await get(authorizeQuery(LOOPBACK_CB));
  loc = new URL(r.headers.get("location") ?? "http://x/");
  const relayState = loc.searchParams.get("state");
  check("loopback sent to Cognito with our callback", r.status === 302 && loc.origin === FAKE && loc.searchParams.get("redirect_uri") === `${SERVER}/oauth/callback`);
  check("loopback keeps PKCE challenge", loc.searchParams.get("code_challenge") === "abc123");
  check("loopback state is wrapped", !!relayState && relayState !== "client-state-1");

  check("loopback without PKCE rejected", (await get(authorizeQuery(LOOPBACK_CB, { code_challenge: "" }))).status === 400);
  check("loopback with plain PKCE rejected", (await get(authorizeQuery(LOOPBACK_CB, { code_challenge_method: "plain" }))).status === 400);
  check("unknown redirect rejected, no redirect", (await get(authorizeQuery("https://evil.example/cb"))).status === 400);
  check("unknown client rejected", (await get(authorizeQuery(LOOPBACK_CB, { client_id: "other" }))).status === 400);

  r = await get(`/oauth/callback?code=the-code&state=${encodeURIComponent(relayState)}`);
  loc = new URL(r.headers.get("location") ?? "http://x/");
  check("callback forwards code to the local port", r.status === 302 && `${loc.origin}${loc.pathname}` === "http://127.0.0.1:53408/" && loc.searchParams.get("code") === "the-code" && loc.searchParams.get("state") === "client-state-1");

  r = await get(`/oauth/callback?error=access_denied&state=${encodeURIComponent(relayState)}`);
  loc = new URL(r.headers.get("location") ?? "http://x/");
  check("callback forwards errors", r.status === 302 && loc.searchParams.get("error") === "access_denied");

  const tampered = relayState.slice(0, -2) + (relayState.endsWith("AA") ? "BB" : "AA");
  check("tampered state rejected", (await get(`/oauth/callback?code=x&state=${encodeURIComponent(tampered)}`)).status === 400);
  check("missing state rejected", (await get(`/oauth/callback?code=x`)).status === 400);

  r = await token({ grant_type: "authorization_code", code: "the-code", redirect_uri: LOOPBACK_CB, client_id: CLIENT_ID, client_secret: "test-secret", code_verifier: "verifier" });
  check("token relay returns Cognito response", r.status === 200 && (await r.json()).access_token === "fake-access");
  check("token relay swaps loopback redirect for ours", lastTokenForm?.redirect_uri === `${SERVER}/oauth/callback`, lastTokenForm?.redirect_uri);
  check("token relay keeps code_verifier", lastTokenForm?.code_verifier === "verifier");

  await token({ grant_type: "authorization_code", code: "c2", redirect_uri: CLAUDE_CB, client_id: CLIENT_ID });
  check("token for fixed callback unchanged", lastTokenForm?.redirect_uri === CLAUDE_CB);

  await token({ grant_type: "refresh_token", refresh_token: "rt", client_id: CLIENT_ID });
  check("refresh token passes through", lastTokenForm?.grant_type === "refresh_token" && lastTokenForm?.refresh_token === "rt");

  lastTokenForm = null;
  r = await token({ grant_type: "refresh_token", refresh_token: "rt", client_id: "someone-else" });
  check("token for another client rejected", r.status === 401 && lastTokenForm === null);
  r = await token({ grant_type: "refresh_token", refresh_token: "rt" });
  check("token without client rejected", r.status === 401);
  r = await fetch(`${SERVER}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:test-secret`).toString("base64") },
    body: "grant_type=refresh_token&refresh_token=rt",
  });
  check("token with Basic auth for our client works", r.status === 200);

  // The client secret is public via /register, so it must not be usable to forge state.
  const { packState } = await import("../build/oauthRelay.js");
  const { createHash } = await import("node:crypto");
  const guessedKey = createHash("sha256").update("loopback-relay:test-secret").digest("hex");
  const forged = packState("http://127.0.0.1:9/", "x", guessedKey);
  check("state signed with the client secret is rejected", (await get(`/oauth/callback?code=x&state=${encodeURIComponent(forged)}`)).status === 400);
  check("oversized state rejected", (await get(`/oauth/callback?code=x&state=${"a".repeat(5000)}.b`)).status === 400);
} finally {
  server.kill();
}

// Relay off: behaviour must match today
await new Promise(r => setTimeout(r, 300));
server = startServer({ MCP_OAUTH_RELAY_LOOPBACK: "" });
try {
  await waitUp();
  const meta = await (await get("/.well-known/oauth-authorization-server")).json();
  check("relay off: authorize goes to Cognito", meta.authorization_endpoint === `${FAKE}/oauth2/authorize`);
  check("relay off: token goes to Cognito", meta.token_endpoint === `${FAKE}/oauth2/token`);
  check("relay off: loopback registration rejected", (await register([LOOPBACK_CB])).status === 400);
  check("relay off: /authorize not mounted", (await get(authorizeQuery(LOOPBACK_CB))).status === 404);
} finally {
  server.kill();
  fake.close();
}

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
