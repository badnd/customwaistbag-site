import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { HttpClient } from "./lib/http.mjs";
import { createContext } from "./lib/context.mjs";
import { writeReport } from "./lib/report.mjs";
import * as urlAndSitemap from "./checks/url-and-sitemap.mjs";
import * as links from "./checks/links.mjs";
import * as metadata from "./checks/metadata.mjs";
import * as robots from "./checks/robots.mjs";
import * as content from "./checks/content.mjs";
import * as schema from "./checks/schema.mjs";
import * as images from "./checks/images.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const arg = (name, fallback) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : fallback; };
const configPath = path.resolve(arg("--config", path.join(root, "seo-audit.config.json")));
const reportDir = path.resolve(arg("--report-dir", path.join(root, "artifacts/seo-audit")));
const stateDir = path.resolve(arg("--state-dir", path.join(root, ".seo-audit-state")));
const config = JSON.parse(await fs.readFile(configPath, "utf8"));
let previous = {};
try { previous = JSON.parse(await fs.readFile(path.join(stateDir, "latest.json"), "utf8")); } catch {}

const startedAt = new Date();
const results = [];
for (const site of config.sites) {
  console.log(`Auditing ${site.origin}...`);
  const client = new HttpClient({ ...config.runtime, concurrency: config.runtime.concurrencyPerSite });
  const oldSite = previous.sites?.[site.origin] || {};
  const ctx = createContext(site, config, client, oldSite);
  for (const checker of [urlAndSitemap, links, metadata, robots, content, schema, images]) {
    try { await checker.run(ctx); } catch (error) { ctx.add(30, "critical", "CHECK_RUNTIME_ERROR", `${checker.constructor?.name || "Checker"} failed: ${error.stack || error}`); }
  }
  results.push({ site, issues: ctx.issues, notes: ctx.notes, sitemapCount: ctx.urls.length, robots: ctx.robots || "" });
  console.log(`  ${ctx.urls.length} URLs, ${ctx.issues.length} findings`);
}
const durationMs = Date.now() - startedAt.getTime();
const report = await writeReport({ results, previous, reportDir, startedAt, durationMs });
await fs.mkdir(stateDir, { recursive: true });
await fs.writeFile(path.join(stateDir, "latest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(), issueFingerprints: report.currentFingerprints,
  sites: Object.fromEntries(results.map((result) => [result.site.origin, { sitemapCount: result.sitemapCount, robots: result.robots }]))
}, null, 2));
console.log(`Report: ${report.file}`);
console.log(`Trend: ${report.newCount} new, ${report.fixedCount} fixed`);
const critical = results.reduce((count, result) => count + result.issues.filter((item) => item.severity === "critical").length, 0);
if (critical) { console.error(`SEO audit failed with ${critical} critical finding(s).`); process.exitCode = 1; }
