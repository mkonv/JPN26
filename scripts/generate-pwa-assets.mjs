import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const outDir = new URL("../out/", import.meta.url);
const templatePath = new URL("./sw-template.js", import.meta.url);
const tripPath = new URL("../data/trip.json", import.meta.url);
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

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

function publicUrl(filePath) {
  const file = relative(outDir.pathname, filePath).split(sep).join("/");
  if (file === "index.html") return `${basePath}/` || "/";
  if (file.endsWith("/index.html")) return `${basePath}/${file.slice(0, -"index.html".length)}`;
  return `${basePath}/${file}`;
}

const cacheableExtensions = new Set([".html", ".js", ".css", ".png", ".svg", ".webmanifest", ".woff2", ".ttf"]);
const allFiles = await walk(outDir.pathname);
const cacheableFiles = allFiles.filter((file) => {
  const extension = file.slice(file.lastIndexOf("."));
  const name = relative(outDir.pathname, file).split(sep).join("/");
  return cacheableExtensions.has(extension) && name !== "sw.js";
}).sort();

const templateSource = await readFile(templatePath, "utf8");
const hash = createHash("sha256");
hash.update("sw-template.js");
hash.update(templateSource);
for (const file of cacheableFiles) {
  hash.update(relative(outDir.pathname, file));
  hash.update(await readFile(file));
}
const contentHash = hash.digest("hex").slice(0, 12);
const trip = JSON.parse(await readFile(tripPath, "utf8"));
const buildId = `${trip.meta.version.replace(/[^a-zA-Z0-9.-]/g, "-")}-${contentHash}`;
const urls = [...new Set(cacheableFiles.map(publicUrl))].sort();
const routes = urls.filter((url) => url.endsWith("/") || url.endsWith(".html"));

let template = templateSource;
template = template
  .replace("__BUILD_ID__", JSON.stringify(buildId))
  .replace("__TRIP_VERSION__", JSON.stringify(trip.meta.version))
  .replace("__PRECACHE_URLS__", JSON.stringify(urls, null, 2));

await writeFile(new URL("../out/sw.js", import.meta.url), template);
await writeFile(new URL("../out/offline-manifest.json", import.meta.url), JSON.stringify({
  buildId,
  version: trip.meta.version,
  basePath,
  generatedAt: new Date().toISOString(),
  routes,
  urls,
}, null, 2));

console.log(`PWA: ${routes.length} страниц, ${urls.length} ресурсов, ${buildId}`);
