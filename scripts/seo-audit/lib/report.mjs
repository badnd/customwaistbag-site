import fs from "node:fs/promises";
import path from "node:path";
import { severityRank } from "./issues.mjs";

const CHECK_COUNT = 33;
const esc = (value = "") => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");

export async function writeReport({ results, previous, reportDir, startedAt, durationMs }) {
  await fs.mkdir(reportDir, { recursive: true });
  const currentFingerprints = new Set(results.flatMap((result) => result.issues.map((item) => item.fingerprint)));
  const oldFingerprints = new Set(previous.issueFingerprints || []);
  const newCount = [...currentFingerprints].filter((item) => !oldFingerprints.has(item)).length;
  const fixedCount = [...oldFingerprints].filter((item) => !currentFingerprints.has(item)).length;
  const lines = [
    "# Automated SEO Audit Report", "",
    `- Started: ${startedAt.toISOString()}`,
    `- Duration: ${(durationMs / 1000).toFixed(1)} seconds`,
    `- Trend: ${newCount} new, ${fixedCount} fixed, ${currentFingerprints.size} current issues`, "",
    "## Site Summary", "",
    "| Site | Status | Passed | Failed | Critical | Warnings | Sitemap URLs |",
    "|---|---:|---:|---:|---:|---:|---:|"
  ];
  for (const result of results) {
    const failed = new Set(result.issues.map((item) => item.check)).size;
    const critical = result.issues.filter((item) => item.severity === "critical").length;
    const warnings = result.issues.filter((item) => item.severity === "warning").length;
    lines.push(`| ${result.site.origin} | ${critical ? "RED" : warnings ? "YELLOW" : "GREEN"} | ${CHECK_COUNT - failed} | ${failed} | ${critical} | ${warnings} | ${result.sitemapCount} |`);
  }
  lines.push("", "## Findings", "");
  const issues = results.flatMap((result) => result.issues).sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.check - b.check);
  if (!issues.length) lines.push("All 33 checks passed for all configured sites.");
  else {
    lines.push("| Severity | Check | Code | Site / URL | Source | Expected / Finding | Actual |", "|---|---:|---|---|---|---|---|");
    for (const item of issues) lines.push(`| ${item.severity.toUpperCase()} | ${item.check} | ${item.code} | ${esc(item.url || item.site)} | ${esc(item.source)} | ${esc(item.message || item.expected)} | ${esc(item.actual)} |`);
  }
  lines.push("", "## Skipped By Design", "");
  for (const result of results) for (const note of result.notes || []) lines.push(`- ${result.site.origin}: ${note}`);
  lines.push("", "## Trend Details", "", `- New fingerprints: ${newCount}`, `- Fixed fingerprints: ${fixedCount}`, `- Previous run available: ${oldFingerprints.size ? "yes" : "no (baseline created)"}`, "");
  const content = `${lines.join("\n")}\n`;
  const stamp = startedAt.toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const file = path.join(reportDir, `seo-audit-${stamp}.md`);
  await fs.writeFile(file, content, "utf8");
  await fs.writeFile(path.join(reportDir, "latest.md"), content, "utf8");
  return { file, content, currentFingerprints: [...currentFingerprints], newCount, fixedCount };
}
