import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const baselinePath = process.argv[2];
const outputDirectory = process.argv[3] || 'static-pilot/data';

if (!baselinePath) {
  throw new Error('Usage: node generate-routes-from-baseline.mjs <baseline-full.json> [output-directory]');
}

const baseline = JSON.parse(await readFile(resolve(baselinePath), 'utf8'));
const origin = 'https://www.customwaistbag.com';

function pathFromUrl(url) {
  const path = new URL(url).pathname;
  return path === '/' ? '/' : path.replace(/\/$/, '');
}

function translationKey(path) {
  const englishPath = path === '/ru' ? '/' : path.replace(/^\/ru(?=\/)/, '');
  return englishPath === '/' ? 'home' : englishPath.slice(1).replaceAll('/', ':');
}

function contentRef(path, pageType) {
  const key = translationKey(path);
  if (pageType === 'product') {
    const match = key.match(/:(ydjl[0-9]+)-/i);
    return `product:${match ? match[1].toUpperCase() : key}`;
  }
  if (pageType === 'category') return `category:${key}`;
  if (pageType === 'resource-page') return `resource:${key.split(':').at(-1)}`;
  if (pageType === 'blog-article') return `blog:${key.split(':').at(-1)}`;
  if (pageType === 'resource-index') return 'hub:resources';
  if (pageType === 'blog-index') return 'hub:blog';
  return `page:${key}`;
}

function routeId(path, locale) {
  return `${translationKey(path)}:${locale}`.replace(/[^a-z0-9:_-]/g, '-');
}

function outputFile(path) {
  if (path === '/') return 'index.html';
  return `${path.slice(1)}/index.html`;
}

const routes = baseline.pages.map((page) => {
  const path = pathFromUrl(page.url);
  const locale = path === '/ru' || path.startsWith('/ru/') ? 'ru' : 'en';
  return {
    id: routeId(path, locale),
    path,
    outputFile: outputFile(path),
    locale,
    pageType: page.pageType,
    contentRef: contentRef(path, page.pageType),
    canonical: `${origin}${path === '/' ? '/' : path}`,
    alternates: Object.fromEntries(page.hreflang.map(({ lang, href }) => [lang, href])),
    seo: {
      title: page.title,
      description: page.description,
      h1: page.h1[0],
      schemaTypes: [...new Set(page.schema.flatMap((entry) => entry.types))]
    },
    baseline: {
      status: page.directStatus,
      htmlSha256: page.htmlSha256,
      bodyTextSha256: page.bodyTextSha256
    },
    lifecycle: {
      status: 'published-baseline',
      urlChangeRequiresHumanApproval: true
    }
  };
});

const entitiesByRef = new Map();
for (const route of routes) {
  const entity = entitiesByRef.get(route.contentRef) || {
    id: route.contentRef,
    kind: route.contentRef.split(':')[0],
    routes: [],
    provenance: {
      source: 'CWB Production baseline',
      productionCommit: '7b73675db9f94ac06602875f6970a7de191ee909',
      importedAs: 'architecture-reference-only'
    },
    review: {
      status: 'approved-existing-production',
      newClaimsAllowed: false
    }
  };
  entity.routes.push(route.path);
  entitiesByRef.set(route.contentRef, entity);
}

const output = resolve(outputDirectory);
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'routes.json'), `${JSON.stringify({ contractVersion: '1.0.0', routes }, null, 2)}\n`, 'utf8');
await writeFile(resolve(output, 'entities.json'), `${JSON.stringify({ contractVersion: '1.0.0', entities: [...entitiesByRef.values()] }, null, 2)}\n`, 'utf8');

console.log(`Generated ${routes.length} route records and ${entitiesByRef.size} entity records in ${output}.`);
