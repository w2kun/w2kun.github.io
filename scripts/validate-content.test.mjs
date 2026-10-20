import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateContent } from "./validate-content.mjs";

const read = (name) => JSON.parse(readFileSync(new URL(`../src/_data/${name}.json`, import.meta.url), "utf8"));
const authors = read("authors");
const site = read("site");
const publications = read("publications");

test("current content is complete and local resources exist", () => {
  validateContent(publications, authors, site);
});

for (const [name, mutate, error] of [
  ["duplicate IDs", (p) => p.push(p[0]), /Duplicate publication ID/],
  ["missing title", (p) => p[0].title = "", /title/],
  ["unknown author", (p) => p[0].authors[0].id = "unknown", /unknown author/],
  ["missing image", (p) => p[0].images[0].src = "/missing.png", /Missing file/],
  ["missing citation", (p) => p[0].id = "missing", /BibTeX path must match/],
  ["empty link", (p) => p[0].links.push({ label: "Code", url: "" }), /nonempty text/],
  ["script URL", (p) => p[0].url = "javascript:alert(1)", /Unsupported URL/],
  ["path traversal", (p) => p[0].images[0].src = "/../outside.png", /Path escapes site/],
  ["incomplete swap", (p) => p[0].imageLayout = "swap", /swap needs two images/],
  ["string author flag", (p) => p[0].authors[0].corresponding = "false", /must be boolean/],
]) {
  test(`rejects ${name}`, () => {
    const data = structuredClone(publications);
    mutate(data);
    assert.throws(() => validateContent(data, authors, site), error);
  });
}

test("optional author links and text-only papers are supported", () => {
  const data = structuredClone(publications);
  data[0].images = [];
  validateContent(data, authors, site);
});
