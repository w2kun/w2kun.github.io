import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

const root = resolve("_site");
const publications = JSON.parse(readFileSync("src/_data/publications.json", "utf8"));
const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" })[entity]);
const homepage = readFileSync(`${root}/index.html`, "utf8");
const years = [...new Set(publications.map((paper) => paper.year))].sort((a, b) => b - a);
assert.deepEqual([...homepage.matchAll(/class="year-heading">(\d+)</g)].map((match) => Number(match[1])), years, "Publication year groups differ");
const activities = JSON.parse(readFileSync("src/_data/activities.json", "utf8"));
let sampleCount = 0;
for (const role of activities.roles) {
  assert(typeof role.title === "string" && role.title.trim(), "Activity role needs a title");
  for (const entry of role.entries) {
    assert(Number.isInteger(entry.year) && entry.year >= 1900 && entry.year <= 2100, "Activity needs a valid year");
    assert(typeof entry.venue === "string" && entry.venue.trim(), "Activity needs a venue");
    assert(typeof entry.sample === "boolean", "Activity sample must explicitly be true or false");
    assert(decode(homepage).includes(entry.venue), `Missing activity: ${entry.venue}`);
    if (entry.sample) sampleCount++;
  }
}
assert.equal((homepage.match(/class="sample-label"/g) || []).length, sampleCount, "Example activities must be labelled");
for (const group of activities.reviewing) {
  assert(typeof group.title === "string" && group.title.trim(), "Reviewing group needs a title");
  for (const venue of group.venues) {
    assert(venue.name?.trim() && venue.abbreviation?.trim(), "Reviewing venue needs a name and abbreviation");
    assert(decode(homepage).includes(`title="${venue.name}"`), `Missing reviewing venue: ${venue.name}`);
  }
}
assert.equal((homepage.match(/<article\b/g) || []).length, publications.length, "Publication count differs");
for (const paper of publications) {
  assert(homepage.includes(`id="${paper.id}"`), `Missing publication: ${paper.id}`);
  assert(decode(homepage).includes(paper.title), `Missing title: ${paper.id}`);
  const citation = readFileSync(`${root}/citations/${paper.id}/index.html`, "utf8");
  const code = citation.match(/<code>([\s\S]*?)<\/code>/);
  assert(code, `Missing citation text: ${paper.id}`);
  assert.equal(decode(code[1]), readFileSync(`.${paper.bibtex}`, "utf8"), `Citation changed: ${paper.id}`);
}
let checked = 0;
for (const file of readdirSync(root, { recursive: true }).filter((file) => file.endsWith(".html"))) {
  const html = readFileSync(resolve(root, file), "utf8");
  assert(!/\b(?:onclick|href="javascript:)/.test(html), `Inline handler in ${file}`);
  for (const img of html.matchAll(/<img\b[^>]*>/g)) assert(/\balt="[^"]+"/.test(img[0]), `Missing alt in ${file}`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
    const value = decode(match[1]);
    assert(value, `Empty link in ${file}`);
    const url = new URL(value, `https://local.invalid/${file}`);
    if (url.origin !== "https://local.invalid") continue;
    let target = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    assert(target.startsWith(root + sep) || target === root, `Path escapes output: ${value}`);
    if (statSync(target, { throwIfNoEntry: false })?.isDirectory()) target = resolve(target, "index.html");
    assert(statSync(target, { throwIfNoEntry: false })?.isFile(), `${file}: missing ${value}`);
    if (url.hash && target.endsWith(".html")) {
      const targetHTML = readFileSync(target, "utf8");
      assert(targetHTML.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${file}: missing anchor ${value}`);
    }
    checked++;
  }
}
console.log(`Checked ${publications.length} publications, citation contents and ${checked} local references in ${relative(process.cwd(), root)}.`);
