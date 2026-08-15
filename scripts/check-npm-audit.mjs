import { spawnSync } from "node:child_process";

const acceptedAdvisories = new Map([
  ["sharp", new Set(["GHSA-F88M-G3JW-G9CJ"])],
  ["nanoid", new Set([
    "GHSA-28WG-GHJ8-5HJV",
    "GHSA-2V37-7H3G-55P8",
  ])],
  ["postcss", new Set([
    "GHSA-6G55-P6WH-862Q",
    "GHSA-R28C-9Q8G-F849",
  ])],
]);

const acceptedRiskNotes = new Map([
  [
    "sharp",
    "No next/image/sharp usage, image-upload endpoint or untrusted image processing exists in this static export.",
  ],
  [
    "nanoid",
    "The affected generators require attacker-controlled zero/negative size input. This project does not import/call nanoid; it is only a transitive build dependency.",
  ],
  [
    "postcss",
    "The accepted advisories require processing attacker-controlled CSS/sourceMappingURL input. This project builds only repository-controlled CSS and has no runtime CSS-processing endpoint.",
  ],
]);

const result = spawnSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" });
let report;
try {
  report = JSON.parse(result.stdout || "{}");
} catch {
  console.error(result.stdout || result.stderr || "npm audit did not return JSON");
  process.exit(1);
}

if (!report || typeof report !== "object" || !report.metadata || !report.vulnerabilities) {
  console.error("npm audit did not return a complete vulnerability report.");
  if (report?.error) console.error(JSON.stringify(report.error, null, 2));
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities ?? {};
const memo = new Map();

function advisoryId(item) {
  const haystack = `${item?.url ?? ""} ${item?.title ?? ""}`;
  return haystack.match(/GHSA-[0-9a-z-]+/i)?.[0]?.toUpperCase() ?? null;
}

function classify(name, stack = new Set()) {
  if (memo.has(name)) return memo.get(name);
  if (stack.has(name)) return { accepted: false, reason: "dependency cycle in npm audit report" };

  const vulnerability = vulnerabilities[name];
  if (!vulnerability || !["high", "critical"].includes(vulnerability.severity)) {
    return { accepted: true, reason: "not a High/Critical finding" };
  }

  const nextStack = new Set(stack);
  nextStack.add(name);
  const relevantVia = (vulnerability.via ?? []).filter((item) => {
    if (typeof item === "string") return true;
    return item && typeof item === "object" && ["high", "critical"].includes(item.severity);
  });

  if (relevantVia.length === 0) {
    const outcome = { accepted: false, reason: "High/Critical finding has no classifiable advisory/dependency path" };
    memo.set(name, outcome);
    return outcome;
  }

  const allow = acceptedAdvisories.get(name);
  const acceptedLeafIds = [];
  const acceptedDependencies = [];

  for (const item of relevantVia) {
    if (typeof item === "string") {
      const dependency = classify(item, nextStack);
      if (!dependency.accepted) {
        const outcome = { accepted: false, reason: `via ${item}: ${dependency.reason}` };
        memo.set(name, outcome);
        return outcome;
      }
      acceptedDependencies.push(item);
      continue;
    }

    const id = advisoryId(item);
    if (!id || !allow?.has(id)) {
      const outcome = { accepted: false, reason: `unapproved advisory ${id ?? item.title ?? "unknown"}` };
      memo.set(name, outcome);
      return outcome;
    }
    acceptedLeafIds.push(id);
  }

  const outcome = {
    accepted: true,
    reason: acceptedLeafIds.length
      ? `approved advisories: ${acceptedLeafIds.join(", ")}`
      : `all High/Critical transitive paths are explicitly accepted: ${acceptedDependencies.join(", ")}`,
  };
  memo.set(name, outcome);
  return outcome;
}

const failures = [];
const acceptedFindings = [];
for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
  if (!["high", "critical"].includes(vulnerability.severity)) continue;
  const outcome = classify(name);
  if (outcome.accepted) acceptedFindings.push({ name, severity: vulnerability.severity, reason: outcome.reason });
  else failures.push({ name, severity: vulnerability.severity, reason: outcome.reason, via: vulnerability.via });
}

for (const item of acceptedFindings) {
  const projectNote = acceptedRiskNotes.get(item.name);
  if (projectNote) {
    console.warn(`Accepted static-site upstream risk: ${item.name} ${item.severity} (${item.reason}). ${projectNote}`);
  } else {
    console.warn(`Accepted transitive aggregate: ${item.name} ${item.severity} (${item.reason}).`);
  }
}

if (failures.length) {
  console.error("Unapproved High/Critical production dependency vulnerabilities:");
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log("Security audit gate: no unapproved High/Critical production findings.");
