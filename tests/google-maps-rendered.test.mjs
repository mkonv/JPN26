import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const outRoot = new URL("../out/", import.meta.url);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

test("rendered Google Maps hrefs use the documented Maps URL API", async () => {
  const htmlFiles = (await walk(outRoot.pathname)).filter((file) => file.endsWith(".html"));
  let googleMapCount = 0;

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    for (const match of html.matchAll(/href=["'](https:\/\/www\.google\.com\/maps\/[^"']+)["']/g)) {
      googleMapCount += 1;
      const raw = match[1].replaceAll("&amp;", "&");
      const url = new URL(raw);

      assert.doesNotMatch(
        url.pathname,
        /^\/maps\/place\/[^/]+\/?$/,
        `hand-built /maps/place/<text> link leaked into ${file}: ${raw}`,
      );

      if (url.pathname.startsWith("/maps/search")) {
        assert.equal(url.searchParams.get("api"), "1", `api=1 missing in ${raw}`);
        assert.ok(url.searchParams.get("query"), `query missing in ${raw}`);
      }
    }
  }

  assert.ok(googleMapCount > 40, `expected broad Google Maps coverage, found only ${googleMapCount} links`);
});
