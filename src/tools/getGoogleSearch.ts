import { z } from "zod";
import { Headers } from 'node-fetch';
import fetch from 'node-fetch';

const OLOSTEP_SCRAPE_API_URL = 'https://api.olostep.com/v1/scrapes';

interface GoogleSearchResponse {
    result?: {
        json_content?: string;
    };
}

export const getGoogleSearch = {
    name: "google_search",
    description: "Retrieve structured data from Google search results",
    schema: {
        query: z.string().describe("The search query to perform"),
        country: z.string().optional().default("US").describe("Country code for localized results (e.g., US, GB)")
    },
    handler: async ({ query, country }: { query: string; country?: string }, apiKey: string, orbitKey?: string) => {
        try {
            const headers = new Headers({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            });

            const searchUrl = new URL('https://www.google.com/search');
            searchUrl.searchParams.append('q', query);
            if (country) searchUrl.searchParams.append('gl', country);

            const payload = {
                formats: ["parser_extract"],
                parser_extract: { parser_id: "@olostep/google-search" },
                url_to_scrape: searchUrl.toString(),
                wait_before_scraping: 0,
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

            const data = await response.json() as GoogleSearchResponse;
            
            if (data.result?.json_content) {
                const parsedContent = JSON.parse(data.result.json_content);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(parsedContent, null, 2)
                    }]
                };
            } else {
                return {
                    isError: true,
                    content: [{
                        type: "text",
                        text: "Error: No search results found in Olostep API response."
                    }]
                };
            }

        } catch (error: unknown) {
            return {
                isError: true,
                content: [{
                    type: "text",
                    text: `Error: Failed to perform Google search. ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }
    }
};
