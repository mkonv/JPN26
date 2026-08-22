import { spawnSync } from "node:child_process";

const accepted = new Map([
  ["sharp", new Set(["GHSA-f88m-g3jw-g9cj"])],
]);

const result = spawnSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" });
let report;
try { report = JSON.parse(result.stdout || "{}"); } catch {
  console.error(result.stdout || result.stderr || "npm audit did not return JSON");
  process.exit(1);
}

if (!report || typeof report !== "object" || !report.metadata || !report.vulnerabilities) {
  console.error("npm audit did not return a complete vulnerability report.");
  if (report?.error) console.error(JSON.stringify(report.error, null, 2));
  if (result.stderr) console.error(result.stderr.trim());
  process.exit(1);
}

const failures = [];
const acceptedFindings = [];
for (const [name, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
  if (!["high", "critical"].includes(vulnerability.severity)) continue;
  const advisories = (vulnerability.via ?? []).filter((item) => typeof item === "object");
  const allow = accepted.get(name);
  const allAccepted = advisories.length > 0 && advisories.every((item) => {
    const haystack = `${item.url ?? ""} ${item.title ?? ""}`;
    return allow && [...allow].some((id) => haystack.includes(id));
  });
  if (allAccepted) acceptedFindings.push({ name, severity: vulnerability.severity, advisories: [...allow] });
  else failures.push({ name, severity: vulnerability.severity, via: vulnerability.via });
}

for (const item of acceptedFindings) {
  console.warn(`Accepted static-site upstream risk: ${item.name} ${item.severity} (${item.advisories.join(", ")}). No next/image/sharp usage or untrusted image processing exists in this project.`);
}
if (failures.length) {
  console.error("Unapproved High/Critical production dependency vulnerabilities:");
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}
console.log("Security audit gate: no unapproved High/Critical production findings.");
