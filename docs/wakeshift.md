# Job webhooks: waking the agent when a crawl or batch finishes

`create_crawl` and `batch_scrape_urls` can wake the agent that started a job when the job finishes, even if its conversation has gone idle, instead of making it wait or come back to check. They do it through [Wakeshift](https://wakeshift.ai): the tool subscribes the agent's conversation to the job's end and returns at once, and this server emits a `crawl.completed` or `batch.completed` event when it learns the job ended.

This server never checks a job's status to find that out. **The only signal is the webhook Olostep's backend already sends** when a crawl or batch completes. The tool creates the job with a `webhook` that points back at this server, and the backend's completion post is what wakes the agent.

**Nothing changes until it's turned on.** Without the settings below, the server sends nothing to Wakeshift, `tools/list` and every result are exactly as before, and the webhook route doesn't exist.

## Turning it on

On the hosted server (the HTTP transport), set:

| Variable | What it is |
| --- | --- |
| `WAKESHIFT_KEY` | The key of a Wakeshift app made for this server, from Wakeshift's console. |
| `OLOSTEP_WEBHOOK_SECRET` | A random secret of at least 32 characters, used only by this server to sign each job's webhook URL. `openssl rand -hex 32` makes one. Every instance needs the same value. |
| `OLOSTEP_PUBLIC_URL` | This server's public URL, such as `https://mcp.olostep.com`: job webhooks go to its origin. Optional when `MCP_OAUTH_RESOURCE_URL` is set, as on the hosted server; its origin is used then. Never taken from a request's headers, which a caller controls. |

Olostep's backend must be able to reach that origin.

Turning it on needs Node.js 20.19 or later (or 22.12 or later), which Wakeshift's SDK requires; the Docker images' `node:20-alpine` is. Without `WAKESHIFT_KEY` the SDK isn't loaded at all, so the server runs on the Node versions it supports today.

The stdio transport doesn't offer it: Olostep's backend can't reach a process on someone's computer.

## What the backend sends

Nothing new. For each crawl or batch a job tool creates with a `webhook`, the backend's existing `crawl.completed` or `batch.completed` delivery is the hook ([Olostep's webhook docs](https://docs.olostep.com/api-reference/common/webhooks)):

```http
POST /webhooks/olostep/<token>
Content-Type: application/json

{
  "id": "event_x9y8z7w6v5u4t3s2",
  "object": "event.crawl.completed",
  "timestamp": 1737570000000,
  "delivery_attempt": "1/5",
  "data": {
    "id": "crawl_abc789",
    "object": "crawl",
    "status": "completed",
    "urls_count": 87
  }
}
```

### When it fires

Once per job, when the job reaches a final state: a crawl when every discovered page has been processed, and a batch when every item has completed or failed.

**Progress posts are accepted and ignored.** Olostep also posts `event.batch.progress` (with `status: "in_progress"`) to a batch's webhook, which its docs don't list (seen 2026-11-11). The route answers those `204` without emitting, so they're never retried and never wake the agent. It emits only for an event whose `object` doesn't end in `.progress` and whose `status` is a final one: `completed`, `failed`, `canceled` (or `cancelled`), `error`, `errored`, `stopped`, `timed_out` or `timeout`. Any other status is accepted, ignored and logged, so a new kind of event can't wake the agent early; a new final status needs adding to that list.

**One request: send it when a job fails, too.** Olostep's docs describe the webhook only for completion. A crawl or batch that fails as a whole (it can't start, is canceled, or errors out) should post to its `webhook` as well, with the same envelope and its final status:

```json
{
  "id": "event_f1e2d3c4b5a69788",
  "object": "event.crawl.failed",
  "timestamp": 1737570000000,
  "delivery_attempt": "1/5",
  "data": {
    "id": "crawl_abc789",
    "object": "crawl",
    "status": "failed"
  }
}
```

The route reads only `id`, `data.id` and `data.status`, so `object` can be `event.crawl.failed` or `event.crawl.completed`, and `status` any final status (`failed`, `canceled`). The agent then reads `Crawl crawl_abc789 finished: failed.` and checks the job with `get_crawl_results`. Until failed jobs send this, a failed job wakes nobody: the agent's subscription runs out after a day, and the agent can still check the job with `get_crawl_results` or `get_batch_results`, as it would without Wakeshift.

### The fields this server reads

| Field | Type | Use |
| --- | --- | --- |
| `id` | string, up to 200 characters | The delivery's event ID, the same on every retry. It becomes the emit's ID, so a retried delivery wakes the agent once. |
| `data.id` | string, up to 200 characters | The `crawl_id` or `batch_id`, which the agent passes to `get_crawl_results` or `get_batch_results`. |
| `data.status` | string, up to 64 characters | The job's final status. |
| `object` | string | The event type. `.progress` events don't wake anyone (above). |
| `data.pages_count` (or `data.urls_count`) | integer, optional | A crawl's page count. |
| `data.total_urls`, `data.completed_urls`, `data.failed_urls` (or `data.items_total`, `data.items_completed`, `data.items_failed`) | integers, optional | A batch's counts. |

Olostep's docs name the counts `urls_count` and `items_*`; what its backend sent on 2026-11-11 was `pages_count` and `*_urls`. The route reads either, preferring what the backend sends.

Other fields are ignored, so the backend can add fields freely. The body must be JSON, at most 100 KB (the bodies seen were 572–766 bytes). Don't put page content in it: the agent reads results with the job tools, through the user's own credentials.

What reaches the agent is only the IDs, status and counts above, in a line such as `Crawl crawl_abc789 finished: completed, 87 pages.` Characters other than letters, digits and `_.:-` are dropped from the ID and status.

### The answer

| Status | Meaning | Retry? |
| --- | --- | --- |
| `204` | Emitted (or already emitted for this event ID). | No |
| `400` | The body isn't a JSON event with `id`, `data.id` and `data.status`. | No: it won't succeed |
| `404` | The token isn't valid: altered, for another server, or expired. | No |
| `502` | Wakeshift couldn't take the emit. | Yes, and the event ID keeps it to one wake. |

### Retries: one request

When Wakeshift is unreachable after a conversation was subscribed, the route answers `502`, and the agent is woken once Wakeshift is back, as long as the backend is still retrying. That's the only way a wake missed during an outage is recovered: the agent isn't waiting on the job any more. Today's retries (5 attempts over about 30 minutes) cover a short outage. **Please retry a failed delivery with backoff for up to an hour, and document the retry policy** (the attempts, the window, and which answers count as failed), so a server receiving these knows what it can rely on.

## How the URL is checked

Olostep's webhooks aren't signed, so the URL itself is the credential. Its last segment, the token, is `<kind>.<job>.<expires>.<mac>`:

- `kind`: `crawl` or `batch`.
- `job`: a UUID this server generates for the job when the tool is called. Olostep's own ID exists only after the create call, and the webhook has to be in it, so the conversation is subscribed under this UUID instead.
- `expires`: Unix seconds, a day plus Olostep's 30-minute retry window after the job starts.
- `mac`: the base64url HMAC-SHA256, under `OLOSTEP_WEBHOOK_SECRET`, of `olostep-webhook\n<kind>\n<job>\n<expires>`.

The route recomputes the HMAC and compares it in constant time, then checks the expiry. Only this server can make a valid token, each one wakes only the conversation that started its job, and it stops working when it expires. Nothing is stored, so any instance can receive any job's webhook. Don't log these URLs: until it expires, anyone holding one can report that job as finished.

### When Olostep signs its webhooks

Olostep's docs list signed webhooks as coming soon. When they ship, the route should also check the signature, with the signing secret in a new variable, and refuse unsigned posts. [Standard Webhooks](https://www.standardwebhooks.com) (`webhook-id`, `webhook-timestamp` and `webhook-signature` headers, HMAC-SHA256 of `id.timestamp.body`) has libraries for most languages and is what Wakeshift's own receivers accept. The per-job token stays, since it's what ties a post to one job.

## What the server does with it

1. A job tool is called. If the agent left `wait_for_completion_seconds` at its default, or set it to 0 (no wait), the tool subscribes the calling conversation to `crawl.completed` or `batch.completed` with `{ job: <uuid> }`, once, for at most a day.
2. **If Wakeshift will wake that conversation,** the tool creates the job with `webhook` set to `<origin>/webhooks/olostep/<token>` and returns at once, without its usual wait: the result is the new job's ID, and the agent can go idle. If the job can't be created, the tool's error ends the subscription.
3. Olostep's backend posts the job's end. The route checks the token and the body, and emits the event to the job's UUID with `id` set from the delivery's `id`.
4. Wakeshift wakes the conversation, which reads the line and fetches the results with `get_crawl_results` or `get_batch_results`. Delivering it ends the subscription.

**Otherwise the tool behaves exactly as without Wakeshift:** it waits up to `wait_for_completion_seconds` as it always has, returns the results if the job finishes in that time, and nothing is subscribed. That's the case when:

- the agent chose its own wait (any value but the default 45 or 0; an explicit 45 can't be told from the default, so it counts as the default, and 0 asks for no wait, so a wake replaces nothing);
- Wakeshift can't be reached, or refuses the subscribe;
- Wakeshift can't wake the conversation. Today that's decided from what Wakeshift's SDK reports on the subscribe: a conversation subscription for an agent program it recognized counts as a wake. An MCP Events client's subscription (ChatGPT's), which wakes only if the client takes up the voucher, doesn't, and neither does an agent it didn't recognize. A subscription made that won't wake is ended again before the tool waits.

The job gets its `webhook` in every case; when nothing is subscribed, the route still emits, and no conversation is woken.

## A note on agent-chosen waits

In our tests (Claude Code 2.1.319 and 2.1.321, November 2026), Claude Code often picked its own `wait_for_completion_seconds` for a 100-page crawl, 60 or 120 seconds: longer than its own timeout for a tool call. The call timed out on Claude Code's side before the result came back, so the agent never saw the crawl's ID, and it called `create_crawl` again with 0, which started a second, duplicate crawl. This change doesn't touch that, but it's worth knowing: a wait capped below the clients' tool-call timeouts (about 60 seconds), or a result that names the job when a wait is cut short, would avoid the duplicate job and its credits.

## Testing it

`npm run test:wakeshift` runs the tools, the token check and the route against a local stub of the API and Wakeshift's offline test client: no keys and no network.
