#!/usr/bin/env node
// Description goldens check.
//
// Compares the live `tools/list` output of the built MCP server to the checked-in
// `tests/description-goldens.json`. If anything has drifted, the script fails with
// a diff. To intentionally update the goldens (e.g. you reworded a tool description
// in this PR), re-run with UPDATE_GOLDENS=1:
//
//   npm run test:descriptions              # checks
//   UPDATE_GOLDENS=1 npm run test:descriptions  # writes
//
// The point of this is to make wording changes explicit: they show up as a diff
// in the goldens file, in the same PR that changed the wording.

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const goldensPath = join(__dirname, "description-goldens.json");
const modulePath = join(__dirname, "..", "build", "index.js");

async function getTools() {
  const proc = spawn(process.execPath, [modulePath], {
    env: { ...process.env, OLOSTEP_API_KEY: "fake-key-for-schema" },
    stdio: ["pipe", "pipe", "pipe"],
  });
  proc.stdout.setEncoding("utf8");
  proc.stderr.on("data", () => {});

  const pending = new Map();
  let nextId = 1;
  let buf = "";

  proc.stdout.on("data", (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) {
          const cb = pending.get(msg.id);
          pending.delete(msg.id);
          cb(msg);
        }
      } catch {
        // ignore non-JSON noise
      }
    }
  });

  const req = (method, params) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, (msg) =>
        msg.error ? reject(new Error(msg.error.message || JSON.stringify(msg.error))) : resolve(msg.result),
      );
      proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`timeout after 30s on ${method}`));
        }
      }, 30000);
    });

  try {
    await req("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "goldens", version: "1" },
    });
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
    const r = await req("tools/list", {});
    return r.tools;
  } finally {
    proc.kill();
  }
}

const tools = await getTools();
const current = Object.fromEntries(
  tools
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => [t.name, { description: t.description || "" }]),
);

const payload = { version: 1, tools: current };

if (process.env.UPDATE_GOLDENS === "1") {
  writeFileSync(goldensPath, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Updated ${goldensPath} with ${tools.length} tool descriptions.`);
  process.exit(0);
}

let golden;
try {
  golden = JSON.parse(readFileSync(goldensPath, "utf8"));
} catch {
  console.error(`error: missing or invalid ${goldensPath}. Run with UPDATE_GOLDENS=1 to create it.`);
  process.exit(2);
}

const diffs = [];
const goldenTools = golden.tools || {};
for (const name of Object.keys(current)) {
  const g = goldenTools[name];
  if (!g) {
    diffs.push(`new tool not in goldens: ${name}\n    description: ${current[name].description}`);
    continue;
  }
  if (g.description !== current[name].description) {
    diffs.push(
      `description changed for ${name}:\n  -- golden: ${JSON.stringify(g.description)}\n  ++ live:   ${JSON.stringify(current[name].description)}`,
    );
  }
}
for (const name of Object.keys(goldenTools)) {
  if (!current[name]) diffs.push(`tool in goldens but not live: ${name}`);
}

if (diffs.length === 0) {
  console.log(`OK — ${tools.length} tool descriptions match goldens.`);
  process.exit(0);
}

console.log(`FAIL — ${diffs.length} description diff(s):\n`);
for (const d of diffs) console.log(d + "\n");
console.log("If the change is intentional, update goldens with:");
console.log("  UPDATE_GOLDENS=1 node tests/check-descriptions.mjs");
process.exit(1);
