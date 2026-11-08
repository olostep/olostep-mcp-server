// The API returns in_progress while a job runs and completed once it ends. Any other
// status is unexpected, so it is reported as an error instead of a plain "call again".
export function isRunning(status: string): boolean {
	return status === "in_progress";
}

// Passes the API's status response through as is, so any reason it gives reaches the agent.
export function unexpectedStatus(kind: "crawl" | "batch", details: Record<string, unknown>) {
	const name = kind === "crawl" ? "Crawl" : "Batch";
	return {
		isError: true,
		content: [{
			type: "text",
			text: JSON.stringify({
				...details,
				message: `${name} returned an unexpected status "${details.status || "unknown"}". It may still be running: check again later with ${kind === "crawl" ? "get_crawl_results" : "get_batch_results"} instead of starting a new ${kind}.`,
			}, null, 2),
		}],
	};
}
