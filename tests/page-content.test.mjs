// Tests for build/tools/pageContent.js: per-page url, title and content cap.
// Run with: npm run build && npm run test:page-content

import { test } from "node:test";
import assert from "node:assert/strict";

const { DEFAULT_MAX_CHARACTERS, pageTitle, shapePage } = await import("../build/tools/pageContent.js");

test("short pages come back whole, with url and title first", () => {
	const page = shapePage({ markdown_content: "# Example Domain\n\nBody", custom_id: "a" }, { url: "https://example.com" });
	assert.deepEqual(Object.keys(page).slice(0, 2), ["url", "title"]);
	assert.equal(page.url, "https://example.com");
	assert.equal(page.title, "Example Domain");
	assert.equal(page.markdown_content, "# Example Domain\n\nBody");
	assert.equal(page.truncated, undefined);
});

test("long content is cut at the default cap and links to the full text", () => {
	const long = "x".repeat(DEFAULT_MAX_CHARACTERS + 500);
	const page = shapePage({ markdown_content: long, markdown_hosted_url: "https://files.example/full.md" });
	assert.equal(page.markdown_content.length, DEFAULT_MAX_CHARACTERS);
	assert.deepEqual(page.truncated, [{
		field: "markdown_content",
		returned_characters: DEFAULT_MAX_CHARACTERS,
		total_characters: DEFAULT_MAX_CHARACTERS + 500,
		full_text_url: "https://files.example/full.md",
	}]);
	assert.match(page.truncation_note, /max_characters/);
});

test("maxCharacters raises or lowers the cap", () => {
	const page = shapePage({ text_content: "abcdefghij" }, { maxCharacters: 4 });
	assert.equal(page.text_content, "abcd");
	assert.equal(page.truncated[0].total_characters, 10);
	assert.equal(page.truncated[0].full_text_url, undefined);
});

test("title and full-text URL come from the source response when the page keeps fewer fields", () => {
	const source = {
		html_content: "<html><head><title> Docs Home </title></head></html>",
		markdown_hosted_url: "https://files.example/md",
	};
	const page = shapePage({ markdown_content: "y".repeat(50) }, { url: "https://docs.example", maxCharacters: 10, source });
	assert.equal(page.title, "Docs Home");
	assert.equal(page.html_content, undefined);
	assert.equal(page.truncated[0].full_text_url, "https://files.example/md");
});

test("json content is never cut", () => {
	const json = { items: "z".repeat(100) };
	const page = shapePage({ json_content: json }, { maxCharacters: 10 });
	assert.equal(page.json_content, json);
	assert.equal(page.truncated, undefined);
});

test("pageTitle skips blank lines and strips heading and link syntax", () => {
	assert.equal(pageTitle({ markdown_content: "\n\n## [Pricing](https://a.com/pricing)\nmore" }), "Pricing");
	assert.equal(pageTitle({}), undefined);
});

test("an escaped heading is read, and a long first line gives no title", () => {
	assert.equal(pageTitle({ markdown_content: "\\# Olostep Docs\nbody" }), "Olostep Docs");
	assert.equal(pageTitle({ markdown_content: "word ".repeat(60) }), undefined);
});
