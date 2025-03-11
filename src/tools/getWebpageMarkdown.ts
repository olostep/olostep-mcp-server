import { z } from "zod";
import { Headers } from 'node-fetch';
import fetch from 'node-fetch';

export const OLOSTEP_SCRAPE_API_URL = 'https://api.olostep.com/v1/scrapes';

export interface OlostepScrapeApiResponse {
    result?: {
        markdown_content?: string;
    };
}

export const getWebpageMarkdown = {
    name: "get_webpage_content",
    description: "Retrieve content of a webpage in markdown",
    schema: {
        url_to_scrape: z.string().url().describe("The URL of the webpage to scrape."),
        wait_before_scraping: z.number().int().min(0).default(0).describe("Time to wait in milliseconds before starting the scrape."),
        country: z.string().optional().describe("Residential country to load the request from (e.g., US, CA, GB). Optional."),
    },
    handler: async ({ url_to_scrape, wait_before_scraping, country }: { url_to_scrape: string; wait_before_scraping: number; country?: string }, apiKey: string) => {
        try {
            const headers = new Headers({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            });

            const payload = {
                url_to_scrape: url_to_scrape,
                wait_before_scraping: wait_before_scraping,
                formats: ["markdown"],
                ...(country && { country: country })
            };

            const response = await fetch(OLOSTEP_SCRAPE_API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                return {
                    isError: true,
                    content: [{
                        type: "text",
                        text: `Olostep API Error: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorDetails)}`
                    }]
                };
            }

            const data = await response.json() as OlostepScrapeApiResponse;

            if (data.result?.markdown_content) {
                return {
                    content: [{
                        type: "text",
                        text: data.result.markdown_content
                    }]
                };
            } else {
                return {
                    isError: true,
                    content: [{
                        type: "text",
                        text: "Error: No markdown content found in Olostep API response."
                    }]
                };
            }

        } catch (error: unknown) {
            console.error("Error scraping webpage:", error);
            return {
                isError: true,
                content: [{
                    type: "text",
                    text: `Error: Failed to scrape webpage. ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }
    }
};
