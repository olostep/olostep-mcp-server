// The API returns in_progress while a job runs and completed once it ends. Any other
// status is unexpected, and an agent told to "call again" would poll it forever, so it
// is reported as an error instead.
export function isRunning(status: string): boolean {
	return status === "in_progress";
}

const NEXT_STEP = {
	crawl: "Start a new crawl with create_crawl; if it fails again, check that the start URL is reachable.",
	batch: "Start a new batch with batch_scrape_urls; if it fails again, check that the URLs are reachable.",
};

// Passes the API's status response through as is, so any reason it gives reaches the agent.
export function jobEnded(kind: "crawl" | "batch", details: Record<string, unknown>) {
	const name = kind === "crawl" ? "Crawl" : "Batch";
	return {
		isError: true,
		content: [{
			type: "text",
			text: JSON.stringify({
				...details,
				message: `${name} ended with status "${details.status || "unknown"}". ${NEXT_STEP[kind]}`,
			}, null, 2),
		}],
	};
}
