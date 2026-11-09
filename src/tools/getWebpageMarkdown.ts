import { z } from "zod";
import { Headers } from 'node-fetch';
import fetch from 'node-fetch';
import { DEFAULT_MAX_CHARACTERS } from './pageContent.js';

const OLOSTEP_SCRAPE_API_URL = 'https://api.olostep.com/v1/scrapes';

export interface OlostepScrapeApiResponse {
    result?: {
        markdown_content?: string;
    };
}

export const getWebpageMarkdown = {
    name: "get_webpage_content",
    description:
        "Deprecated: use scrape_website. Kept so existing callers keep working. Returns a page's content as markdown.",
    schema: {
        url: z.string().url().optional().describe("The URL of the webpage to scrape."),
        url_to_scrape: z.string().url().optional().describe("Alias for `url`."),
        wait_before_scraping: z.number().int().min(0).default(0).describe("Time to wait in milliseconds before starting the scrape."),
        country: z.string().optional().describe("Residential country to load the request from (e.g., US, CA, GB). Optional."),
    },
    handler: async ({ url, url_to_scrape, wait_before_scraping, country }: { url?: string; url_to_scrape?: string; wait_before_scraping: number; country?: string }, apiKey: string, orbitKey?: string) => {
        const targetUrl = url ?? url_to_scrape;
        if (!targetUrl) {
            return { isError: true, content: [{ type: "text", text: "Error: a 'url' is required." }] };
        }
        try {
            const headers = new Headers({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            });

            const payload = {
                url_to_scrape: targetUrl,
                wait_before_scraping: wait_before_scraping,
                formats: ["markdown"],
                ...(country && { country: country }),
                ...(orbitKey && { force_connection_id: orbitKey })
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

            const markdown = data.result?.markdown_content;
            if (markdown) {
                const cut = markdown.length > DEFAULT_MAX_CHARACTERS;
                return {
                    content: [{
                        type: "text",
                        text: cut
                            ? `${markdown.slice(0, DEFAULT_MAX_CHARACTERS)}\n\n[Cut at ${DEFAULT_MAX_CHARACTERS} of ${markdown.length} characters. Call scrape_website with a higher max_characters for the rest.]`
                            : markdown
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
