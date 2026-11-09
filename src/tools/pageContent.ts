// Shared shaping for scraped page content: every page comes back with its URL and
// a title, and long content is cut so a single page cannot flood the model's
// context. When content is cut, the result says so and points to the full text.

/** Default per-page content cap, in characters. */
export const DEFAULT_MAX_CHARACTERS = 20_000;

const MAX_TITLE_CHARACTERS = 150;

const CONTENT_FIELDS =["markdown_content", "html_content", "text_content"] as const;
type ContentField = (typeof CONTENT_FIELDS)[number];

// Where the API stores the full text of each content field.
const HOSTED_FIELD: Record<ContentField, string> = {
	markdown_content: "markdown_hosted_url",
	html_content: "html_hosted_url",
	text_content: "text_hosted_url",
};

/**
 * Best-effort page title. Olostep's markdown starts with the page's <title> line,
 * so the first non-empty line (without heading marks or link syntax) is used; for
 * HTML the <title> element is read.
 */
export function pageTitle(page: Record<string, unknown>): string | undefined {
	const html = page.html_content;
	if (typeof html === "string") {
		const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
		if (match?.[1]?.trim()) return match[1].trim().slice(0, MAX_TITLE_CHARACTERS);
	}
	const markdown = page.markdown_content ?? page.text_content;
	if (typeof markdown === "string") {
		for (const raw of markdown.split("\n")) {
			const line = raw.replace(/^\\?#+\s*/, "").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
			if (!line) continue;
			// A long first line is body text, not a title: return none rather than a wrong one.
			return line.length <= MAX_TITLE_CHARACTERS ? line : undefined;
		}
	}
	return undefined;
}

/**
 * Return a copy of `page` with `url` and `title` set and each text content field
 * cut to `maxCharacters`. Cut fields are listed under `truncated`, each with the
 * full length and, when the API stored one, the URL of the full text.
 *
 * `source` is the full API response the page came from, when `page` keeps only
 * some of its fields: the title and full-text URLs are read from it.
 */
export function shapePage(
	page: Record<string, unknown>,
	{
		url,
		maxCharacters = DEFAULT_MAX_CHARACTERS,
		source = page,
	}: { url?: string; maxCharacters?: number; source?: Record<string, unknown> } = {},
): Record<string, unknown> {
	const title = pageTitle(source);
	const { url: pageUrl, ...rest } = page;
	// url and title first, so they lead the JSON the model reads.
	const shaped: Record<string, unknown> = { url: url ?? pageUrl, ...(title && { title }), ...rest };
	const truncated: Record<string, unknown>[] = [];
	for (const field of CONTENT_FIELDS) {
		const value = page[field];
		if (typeof value !== "string" || value.length <= maxCharacters) continue;
		shaped[field] = value.slice(0, maxCharacters);
		const fullTextUrl = page[HOSTED_FIELD[field]] ?? source[HOSTED_FIELD[field]];
		truncated.push({
			field,
			returned_characters: maxCharacters,
			total_characters: value.length,
			...(typeof fullTextUrl === "string" && fullTextUrl && { full_text_url: fullTextUrl }),
		});
	}
	if (truncated.length > 0) {
		shaped.truncated = truncated;
		shaped.truncation_note =
			`Content was cut at ${maxCharacters} characters. Read the rest from full_text_url, ` +
			"or call scrape_website on this URL with a higher max_characters.";
	}
	return shaped;
}
