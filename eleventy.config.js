import { readFileSync } from "node:fs";
import { EleventyRenderPlugin } from "@11ty/eleventy";
import { validateContent } from "./scripts/validate-content.mjs";

export default function (config) {
  config.setNunjucksEnvironmentOptions({ autoescape: true });
  config.addPlugin(EleventyRenderPlugin);
  config.addPassthroughCopy({ images: "images", bibtex: "bibtex", "src/styles.css": "stylesheet.css" });
  config.addWatchTarget("bibtex/");
  config.on("eleventy.before", () => {
    const read = (name) => JSON.parse(readFileSync(`src/_data/${name}.json`, "utf8"));
    validateContent(read("publications"), read("authors"), read("site"));
  });
  config.addFilter("bibtexText", (path) => readFileSync(`.${path}`, "utf8"));
  return { dir: { input: "src", output: "_site" }, templateFormats: ["njk"] };
}
