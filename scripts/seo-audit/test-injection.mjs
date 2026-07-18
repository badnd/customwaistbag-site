import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const baseConfig = JSON.parse(await fs.readFile(path.join(root, "seo-audit.config.json"), "utf8"));
await fs.mkdir(path.join(root, "artifacts"), { recursive: true });
const temp = await fs.mkdtemp(path.join(root, "artifacts", ".seo-audit-injection-"));
const server = http.createServer((request, response) => {
  const origin = `http://127.0.0.1:${server.address().port}`;
  if (request.url === "/sitemap.xml") {
    response.writeHead(200, { "content-type": "application/xml" });
    response.end(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`);
  } else if (request.url === "/") {
    response.writeHead(200, { "content-type": "text/html" });
    response.end(`<!doctype html><html lang="en"><head><title>Fixture</title><meta name="description" content="fixture"><link rel="canonical" href="${origin}/"><link rel="alternate" hreflang="en" href="${origin}/"><link rel="alternate" hreflang="ru" href="${origin}/"><link rel="alternate" hreflang="x-default" href="${origin}/"></head><body><a href="/missing">Broken fixture link</a><img src="/broken-image.jpg" alt="Broken fixture image"><video><source src="/fixture-video.mp4" type="video/mp4"></video><p>Unit price: $19.99. MOQ 50-300 pcs.</p><p>annawei@nameerbag.com 008615102249548 15102249548 Anna Wei</p></body></html>`);
  } else if (request.url === "/robots.txt") {
    response.writeHead(200, { "content-type": "text/plain" }); response.end(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  } else { response.writeHead(404); response.end("missing"); }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const config = { ...baseConfig, sites: [{ name: "Fault Injection Fixture", origin, testMode: true }], runtime: { ...baseConfig.runtime, retries: 0, timeoutMs: 3000 } };
const configPath = path.join(temp, "config.json");
await fs.writeFile(configPath, JSON.stringify(config, null, 2));
const child = spawn(process.execPath, [path.join(root, "scripts/seo-audit/index.mjs"), "--config", configPath, "--report-dir", path.join(temp, "report"), "--state-dir", path.join(temp, "state")], { stdio: "inherit" });
const exitCode = await new Promise((resolve) => child.on("exit", resolve));
server.close();
const report = await fs.readFile(path.join(temp, "report/latest.md"), "utf8");
const expected = ["LINK_BROKEN", "IMAGE_UNAVAILABLE", "PRICE_PUBLIC", "MOQ_RANGE"];
const missing = expected.filter((code) => !report.includes(code));
const videoMisclassified = report.includes("fixture-video.mp4");
if (exitCode === 0 || missing.length || videoMisclassified) {
  console.error(`Fault injection failed. Missing detections: ${missing.join(", ") || "none"}; video misclassified=${videoMisclassified}; audit exit=${exitCode}`);
  process.exitCode = 1;
} else {
  console.log(`Fault injection passed: ${expected.join(", ")}`);
  await fs.rm(temp, { recursive: true, force: true });
}
