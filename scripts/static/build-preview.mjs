import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const validation = spawnSync(process.execPath, [resolve('scripts/static/validate-contract.mjs')], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
if (validation.status !== 0) {
  process.stderr.write(validation.stderr || validation.stdout);
  process.exit(validation.status || 1);
}

const site = JSON.parse(await readFile(resolve('static-pilot/data/site.json'), 'utf8'));
const routeDocument = JSON.parse(await readFile(resolve('static-pilot/data/routes.json'), 'utf8'));
const entityDocument = JSON.parse(await readFile(resolve('static-pilot/data/entities.json'), 'utf8'));
const routes = routeDocument.routes;
const output = resolve('static-pilot-dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const counts = routes.reduce((result, route) => {
  result[route.pageType] = (result[route.pageType] || 0) + 1;
  return result;
}, {});
const paired = routes.filter((route) => Object.keys(route.alternates).length === 3).length;
const englishOnly = routes.length - paired;
const rows = routes.map((route) => `<tr><td>${escapeHtml(route.path)}</td><td>${route.locale.toUpperCase()}</td><td>${escapeHtml(route.pageType)}</td><td>${escapeHtml(route.contentRef)}</td><td>${Object.keys(route.alternates).length || 0}</td></tr>`).join('');
const countCards = Object.entries(counts).map(([type, count]) => `<div class="metric"><strong>${count}</strong><span>${escapeHtml(type)}</span></div>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>CWB Static Pilot - Architecture Gate</title>
  <style>
    :root{color-scheme:light;font-family:Arial,sans-serif;color:#172033;background:#f3f6f8}*{box-sizing:border-box}body{margin:0}.top{background:#083f97;color:#fff;padding:12px 20px;font-weight:700}.shell{width:min(1160px,calc(100% - 32px));min-width:0;margin:auto}.hero{padding:54px 0 28px}.eyebrow{color:#087a54;font-weight:800;text-transform:uppercase;font-size:12px}.hero h1{font-size:clamp(32px,5vw,58px);line-height:1.02;margin:12px 0;letter-spacing:0}.hero p{max-width:760px;color:#546074;font-size:18px;line-height:1.6;overflow-wrap:anywhere}.notice{border-left:5px solid #087a54;background:#fff;padding:18px;margin:20px 0;overflow-wrap:anywhere}.notice code{overflow-wrap:anywhere}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:24px 0}.metric{min-width:0;background:#fff;border:1px solid #dbe3ea;padding:18px}.metric strong{display:block;font-size:30px;color:#083f97}.metric span{color:#657187;overflow-wrap:anywhere}.band{padding:32px 0}.band h2{font-size:26px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{min-width:0;background:#fff;border:1px solid #dbe3ea;padding:18px}.card h3{margin-top:0}.card p,.card li{color:#59667a;line-height:1.55;overflow-wrap:anywhere}.table-wrap{max-width:100%;overflow:auto;background:#fff;border:1px solid #dbe3ea}table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:11px 12px;border-bottom:1px solid #e7edf1;text-align:left;white-space:nowrap}th{background:#eaf0f8;position:sticky;top:0}.footer{padding:34px 0;color:#667287}@media(max-width:760px){.grid{grid-template-columns:1fr}.hero{padding-top:36px}.hero p{font-size:16px}}
  </style>
</head>
<body>
  <div class="top">CWB isolated static pilot - Preview only</div>
  <main>
    <section class="hero shell">
      <div class="eyebrow">Stage 2 architecture gate</div>
      <h1>Static contracts are built.<br>Public pages are not migrated yet.</h1>
      <p>This noindex Preview proves the dependency-free build path, frozen 54-URL contract, bilingual pairing rules, and human approval boundaries for future agent-assisted publishing.</p>
      <div class="notice"><strong>Production is untouched.</strong> This Preview is anchored to production commit <code>${site.baseline.productionCommit}</code>.</div>
      <div class="metrics">${countCards}<div class="metric"><strong>${routeDocument.routes.length}</strong><span>frozen routes</span></div><div class="metric"><strong>${entityDocument.entities.length}</strong><span>content entities</span></div></div>
    </section>
    <section class="band shell">
      <h2>Architecture decisions</h2>
      <div class="grid">
        <article class="card"><h3>Structured content</h3><p>Products and articles have versioned JSON Schemas, provenance, asset hashes, OCR status, EN/RU content, and explicit review state.</p></article>
        <article class="card"><h3>SEO invariants</h3><p>${paired} routes preserve EN/RU/x-default triplets. ${englishOnly} current English-only blog routes intentionally keep no hreflang. Canonicals stay HTTPS + www + no trailing slash.</p></article>
        <article class="card"><h3>Human gates</h3><p>Production promotion, deletion, URL changes, redirects, cross-site moves, contact changes, credentials, quotes, and delivery commitments remain human-only.</p></article>
      </div>
    </section>
    <section class="band shell">
      <h2>Frozen route contract</h2>
      <div class="table-wrap"><table><thead><tr><th>Path</th><th>Locale</th><th>Type</th><th>Entity</th><th>Hreflang</th></tr></thead><tbody>${rows}</tbody></table></div>
    </section>
  </main>
  <footer class="footer shell">Contract v${site.contractVersion}. No public content migration or Production promotion is part of this stage.</footer>
</body>
</html>`;

const health = {
  ok: true,
  generatedAt: new Date().toISOString(),
  baselineCommit: site.baseline.productionCommit,
  routes: routes.length,
  entities: entityDocument.entities.length,
  pairedHreflangRoutes: paired,
  englishOnlyRoutes: englishOnly,
  nextRuntime: false,
  reactRuntime: false,
  previewNoindex: true
};

await Promise.all([
  writeFile(resolve(output, 'index.html'), html, 'utf8'),
  writeFile(resolve(output, 'contract-health.json'), `${JSON.stringify(health, null, 2)}\n`, 'utf8'),
  writeFile(resolve(output, 'route-manifest.json'), `${JSON.stringify(routeDocument, null, 2)}\n`, 'utf8'),
  writeFile(resolve(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8'),
  writeFile(resolve(output, '404.html'), '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Not found</title><h1>Not found</h1>', 'utf8')
]);

console.log(validation.stdout.trim());
console.log(`Built dependency-free Preview in ${output}.`);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
