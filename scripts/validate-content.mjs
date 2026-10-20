import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { resolve, sep } from "node:path";

export function validateContent(publications, authors, site, root = ".") {
  const nonempty = (value, label) => assert(typeof value === "string" && value.trim(), `${label}: expected nonempty text`);
  const externalURL = (value) => {
    nonempty(value, "URL");
    assert(["http:", "https:"].includes(new URL(value).protocol), `Unsupported URL: ${value}`);
  };
  const localFile = (value) => {
    nonempty(value, "File path");
    assert(value.startsWith("/") && !value.startsWith("//"), `Expected root-relative file: ${value}`);
    const file = resolve(root, `.${value}`);
    assert(file.startsWith(resolve(root) + sep), `Path escapes site: ${value}`);
    assert(statSync(file, { throwIfNoEntry: false })?.isFile(), `Missing file: ${value}`);
  };
  const link = (value) => value.startsWith("/") ? localFile(value) : externalURL(value);

  nonempty(site.name, "Site name");
  nonempty(site.displayName, "Display name");
  nonempty(site.description, "Description");
  externalURL(site.url);
  localFile(site.photo);
  assert(Object.hasOwn(authors, site.authorId), "Unknown site authorId");
  assert(!site.analyticsId || /^G-[A-Z0-9]+$/.test(site.analyticsId), "Invalid Google Analytics ID");
  for (const item of site.links) {
    nonempty(item.label, "Profile link label");
    if (item.url.startsWith("mailto:")) assert(/^mailto:[^\s@]+@[^\s@]+$/.test(item.url), "Invalid email link");
    else externalURL(item.url);
  }
  for (const author of Object.values(authors)) {
    nonempty(author.name, "Author name");
    if (author.url !== undefined) externalURL(author.url);
  }
  assert(Array.isArray(publications) && publications.length, "No publications");
  const ids = new Set();
  for (const paper of publications) {
    assert(typeof paper.id === "string" && /^[a-z0-9_-]+$/.test(paper.id), `Invalid publication ID: ${paper.id}`);
    assert(!ids.has(paper.id), `Duplicate publication ID: ${paper.id}`);
    ids.add(paper.id);
    for (const field of ["title", "venue", "summary"]) nonempty(paper[field], `${paper.id}.${field}`);
    externalURL(paper.url);
    assert(Number.isInteger(paper.year) && paper.year >= 1900 && paper.year <= 2100, `${paper.id}: invalid year`);
    assert(Array.isArray(paper.authors) && paper.authors.length, `${paper.id}: missing authors`);
    for (const entry of paper.authors) {
      assert(Object.hasOwn(authors, entry.id), `${paper.id}: unknown author ${entry.id}`);
      for (const flag of ["corresponding", "equalContribution"]) {
        assert(entry[flag] === undefined || typeof entry[flag] === "boolean", `${paper.id}: ${flag} must be boolean`);
      }
    }
    assert(Array.isArray(paper.images), `${paper.id}: images must be an array`);
    assert(["stack", "swap"].includes(paper.imageLayout), `${paper.id}: invalid image layout`);
    assert(paper.imageLayout !== "swap" || paper.images.length === 2, `${paper.id}: swap needs two images`);
    for (const image of paper.images) {
      localFile(image.src);
      nonempty(image.alt, `${paper.id}: image alt`);
    }
    assert(Array.isArray(paper.links), `${paper.id}: links must be an array`);
    for (const item of paper.links) {
      nonempty(item.label, `${paper.id}: link label`);
      link(item.url);
    }
    assert(paper.bibtex === `/bibtex/${paper.id}.bib`, `${paper.id}: BibTeX path must match ID`);
    localFile(paper.bibtex);
    if (paper.award !== undefined) nonempty(paper.award, `${paper.id}: award`);
  }
}
