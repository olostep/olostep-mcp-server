import { z } from "zod";
import { Headers } from 'node-fetch';
import fetch from 'node-fetch';

const OLOSTEP_MAP_API_URL = 'https://api.olostep.com/v1/maps';

export interface OlostepMapApiResponse {
    urls_count: number;
    urls: string[];
}

export const getWebsiteMap = {
    name: "get_website_urls",
    description: "Search and retrieve relevant URLs from a website",
    schema: {
        url: z.string().url().describe("The URL of the website to map."),
        search_query: z.string().describe("The search query to sort URLs by."),
    },
    handler: async ({ url, search_query }: { url: string; search_query: string }, apiKey: string) => {
        try {
            const headers = new Headers({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            });

            const payload = {
                url: url,
                search_query: search_query,
                top_n: 100
            };

            const response = await fetch(OLOSTEP_MAP_API_URL, {
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

            const data = await response.json() as OlostepMapApiResponse;

            if (data.urls && data.urls.length > 0) {
                return {
                    content: [{
                        type: "text",
                        text: `Found ${data.urls_count} URLs matching your query:\n\n${data.urls.join('\n')}`
                    }]
                };
            } else {
                return {
                    content: [{
                        type: "text",
                        text: "No URLs found matching your search query."
                    }]
                };
            }

        } catch (error: unknown) {
            return {
                isError: true,
                content: [{
                    type: "text",
                    text: `Error: Failed to fetch website map. ${error instanceof Error ? error.message : String(error)}`
                }]
            };
        }
    }
};
