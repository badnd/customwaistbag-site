import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'static-pilot');
const load = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };

const [site, routeDocument, entityDocument, productExample, articleExample, publishJob, postDeployExample] = await Promise.all([
  load('data/site.json'),
  load('data/routes.json'),
  load('data/entities.json'),
  load('data/examples/product.example.json'),
  load('data/examples/article.example.json'),
  load('data/examples/publish-job.example.json'),
  load('data/examples/post-deploy-result.example.json')
]);

const routes = routeDocument.routes;
const entities = entityDocument.entities;
const routeByPath = new Map(routes.map((route) => [route.path, route]));
const entityById = new Map(entities.map((entity) => [entity.id, entity]));
const requiredHumanOnly = [
  'publish-production',
  'delete-or-unpublish',
  'change-published-url',
  'cross-site-migration',
  'change-contact-details',
  'rotate-or-use-credentials'
];

check(site.siteId === 'customwaistbag', 'siteId must be customwaistbag');
check(site.origin === 'https://www.customwaistbag.com', 'origin must be the canonical www HTTPS origin');
check(site.publishing.previewNoindex === true, 'Preview must remain noindex');
check(site.publishing.productionPromotion === 'human-only', 'Production promotion must be human-only');
check(site.analytics.measurementId === 'G-Z2YYZR4LL0', 'GA4 measurement id must match the approved CWB property');
check(JSON.stringify(site.analytics.inquiryEvents) === JSON.stringify(['inquiry_form_submit', 'whatsapp_click', 'mailto_click']), 'GA4 inquiry events are incomplete');
check(site.analytics.collectPii === false, 'Inquiry analytics may not collect PII');
check(site.postDeploy.indexNow.failurePolicy === 'non-blocking-visible-failure', 'IndexNow failure policy must remain visible and non-blocking');
check(site.postDeploy.indexNow.skippedIsSuccess === false, 'IndexNow skipped may not be reported as success');
check(site.postDeploy.cdnPurge.skippedIsSuccess === false, 'CDN purge skipped may not be reported as success');
check(routes.length === site.baseline.expectedPublicRoutes, `Expected ${site.baseline.expectedPublicRoutes} routes, found ${routes.length}`);
check(routeByPath.size === routes.length, 'Route paths must be unique');
check(new Set(routes.map((route) => route.outputFile)).size === routes.length, 'Output files must be unique');
check(new Set(routes.map((route) => route.canonical)).size === routes.length, 'Canonicals must be unique');
check(entityById.size === entities.length, 'Entity ids must be unique');
for (const action of requiredHumanOnly) check(site.approvalPolicy.humanOnlyActions.includes(action), `Missing human-only action: ${action}`);

for (const route of routes) {
  const expectedCanonical = `${site.origin}${route.path === '/' ? '/' : route.path}`;
  check(route.path === '/' || !route.path.endsWith('/'), `${route.path}: trailing slash is forbidden`);
  check(route.canonical === expectedCanonical, `${route.path}: canonical mismatch`);
  check(route.baseline.status === 200, `${route.path}: baseline must be direct 200`);
  check(/^[a-f0-9]{64}$/.test(route.baseline.htmlSha256), `${route.path}: invalid HTML SHA256`);
  check(/^[a-f0-9]{64}$/.test(route.baseline.bodyTextSha256), `${route.path}: invalid body SHA256`);
  check(route.seo.title && route.seo.description && route.seo.h1, `${route.path}: incomplete SEO contract`);
  check(entityById.has(route.contentRef), `${route.path}: missing entity ${route.contentRef}`);

  const alternateKeys = Object.keys(route.alternates).sort();
  if (alternateKeys.length) {
    check(JSON.stringify(alternateKeys) === JSON.stringify(['en', 'ru', 'x-default']), `${route.path}: alternates must be en/ru/x-default`);
    for (const [lang, url] of Object.entries(route.alternates)) {
      const alternatePath = new URL(url).pathname.replace(/\/$/, '') || '/';
      check(routeByPath.has(alternatePath), `${route.path}: ${lang} alternate does not resolve to a frozen route`);
    }
    const enPath = new URL(route.alternates.en).pathname.replace(/\/$/, '') || '/';
    const ruPath = new URL(route.alternates.ru).pathname.replace(/\/$/, '') || '/';
    const enRoute = routeByPath.get(enPath);
    const ruRoute = routeByPath.get(ruPath);
    check(enRoute?.alternates?.ru === route.alternates.ru, `${route.path}: EN/RU alternates are not symmetric`);
    check(ruRoute?.alternates?.en === route.alternates.en, `${route.path}: RU/EN alternates are not symmetric`);
    check(route.alternates['x-default'] === route.alternates.en, `${route.path}: x-default must equal EN`);
  } else {
    check(route.pageType === 'blog-index' || route.pageType === 'blog-article', `${route.path}: only current English-only blog routes may omit alternates`);
  }
}

for (const entity of entities) {
  check(entity.routes.length > 0, `${entity.id}: entity has no routes`);
  for (const path of entity.routes) check(routeByPath.get(path)?.contentRef === entity.id, `${entity.id}: route ${path} points elsewhere`);
  check(entity.provenance.productionCommit === site.baseline.productionCommit, `${entity.id}: provenance commit mismatch`);
}

check(productExample.review.status === 'pending-human', 'Product example must stop at pending-human');
check(productExample.lifecycle.productionApproved === false, 'Product example may not approve Production');
check(productExample.locales.en && productExample.locales.ru, 'Product example must model EN and RU');
check(productExample.assets.gallery.length > 0, 'Product example must preserve a gallery');
check(Number.isInteger(productExample.displayOrder), 'Product example must carry a display order');
check(productExample.faqs.en && productExample.faqs.ru, 'Product example must model bilingual FAQ data');
check(JSON.stringify(productExample.structuredData.types) === JSON.stringify(['Product', 'FAQPage', 'BreadcrumbList']), 'Product structured-data types are incomplete');
check(productExample.discovery.hreflang.en && productExample.discovery.hreflang.ru && productExample.discovery.hreflang['x-default'], 'Product discovery contract must carry EN/RU/x-default');
for (const asset of [...productExample.assets.gallery, productExample.assets.cardImage]) {
  check(asset.originalPath && asset.r2Key, 'Every product asset must carry original and R2 paths');
  check(/^[a-f0-9]{64}$/.test(asset.sha256), 'Every product asset must carry SHA256');
  check(/^[a-f0-9]{16}$/.test(asset.pHash), 'Every product asset must carry pHash');
  check(Number.isInteger(asset.order), 'Every product asset must carry an order');
}
for (const fact of [productExample.facts.moqPolicy, productExample.facts.sampleLeadTime, productExample.facts.bulkLeadTime, ...productExample.facts.specifications]) {
  check(fact.evidence && fact.reviewStatus, 'Every product fact must carry evidence and review status');
  check(typeof fact.aiInference === 'boolean', 'Every product fact must identify AI inference state');
}
check(articleExample.review.status === 'pending-human', 'Article example must stop at pending-human');
check(articleExample.lifecycle.productionApproved === false, 'Article example may not approve Production');
check(publishJob.siteId === 'customwaistbag', 'Publish job must target CWB');
check(publishJob.approval.status === 'pending-human' && publishJob.approval.productionApproved === false, 'Publish job must stop at human approval');
check(JSON.stringify(publishJob.pipeline) === JSON.stringify(['asset-intake', 'ocr', 'draft', 'fact-review', 'localize', 'schema', 'sitemap', 'build', 'preview', 'audit', 'human-approval', 'production']), 'Publish pipeline stages are incomplete or reordered');
for (const checkName of ['ocr', 'dedup', 'pHash', 'seo', 'hreflang', 'schema']) check(publishJob.checks[checkName], `Publish job is missing ${checkName} state`);
check(postDeployExample.service === 'indexnow', 'Post-deploy example must model IndexNow');
check(postDeployExample.skipped === true && postDeployExample.ok === false, 'Skipped IndexNow example must not report success');

if (errors.length) {
  console.error(`Static contract validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const counts = routes.reduce((result, route) => {
  result[route.pageType] = (result[route.pageType] || 0) + 1;
  return result;
}, {});

console.log(JSON.stringify({
  ok: true,
  contractVersion: site.contractVersion,
  routes: routes.length,
  entities: entities.length,
  languages: site.languages.supported,
  counts,
  humanOnlyActions: site.approvalPolicy.humanOnlyActions.length,
  previewNoindex: site.publishing.previewNoindex
}, null, 2));
