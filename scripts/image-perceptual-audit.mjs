import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sites = [
  { key: 'nameerbag', origin: 'https://www.nameerbag.com' },
  { key: 'junyibags', origin: 'https://www.junyibags.com' },
  { key: 'custombackpackfactory', origin: 'https://www.custombackpackfactory.com' },
  { key: 'customwaistbag', origin: 'https://www.customwaistbag.com' }
];
const exactPhotoThreshold = { phash: 6, dhash: 8, ratio: 0.08 };
const transformedThreshold = { phash: 12, dhash: 20, ratio: 0.15 };
const args = process.argv.slice(2);
const selfTestEnabled = args.includes('--self-test');
const scanEnabled = args.includes('--scan') || (!selfTestEnabled && !args.includes('--candidate'));
const candidateIndex = args.indexOf('--candidate');
const candidatePath = candidateIndex >= 0 ? args[candidateIndex + 1] : null;

function decodeEntities(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&#x2F;', '/').replaceAll('&#47;', '/');
}

function normalizeImageUrl(raw, pageUrl) {
  try {
    const decoded = decodeEntities(raw.trim());
    if (!decoded || decoded.startsWith('data:')) return null;
    const url = new URL(decoded, pageUrl);
    if (url.pathname === '/_next/image' && url.searchParams.get('url')) {
      return new URL(url.searchParams.get('url'), pageUrl).href;
    }
    if (!/\.(?:avif|webp|png|jpe?g)$/i.test(url.pathname)) return null;
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

function extractImageUrls(html, pageUrl) {
  const candidates = [];
  const mediaTags = html.match(/<(?:img|source|link)\b[^>]*>/gi) || [];
  for (const tag of mediaTags) {
    for (const match of tag.matchAll(/\b(?:src|srcset|data-src|href)=(?:"([^"]+)"|'([^']+)')/gi)) {
      const value = match[1] || match[2] || '';
      for (const source of value.split(',').map((part) => part.trim().split(/\s+/)[0])) candidates.push(source);
    }
  }
  for (const match of html.matchAll(/\burl\((?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\)/gi)) {
    candidates.push(match[1] || match[2] || match[3] || '');
  }
  return [...new Set(candidates.map((item) => normalizeImageUrl(item, pageUrl)).filter(Boolean))];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'CBF-Perceptual-Image-Audit/1.0' },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function sitemapPages(origin, sitemapUrl = `${origin}/sitemap.xml`, seen = new Set()) {
  if (seen.has(sitemapUrl)) return [];
  seen.add(sitemapUrl);
  const xml = await fetchText(sitemapUrl);
  const locations = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => decodeEntities(match[1].trim()));
  const childSitemaps = locations.filter((url) => /sitemap[^/]*\.xml(?:\?|$)/i.test(url));
  if (!childSitemaps.length) return locations.filter((url) => url.startsWith(origin));
  const nested = await Promise.all(childSitemaps.map((url) => sitemapPages(origin, url, seen)));
  return nested.flat();
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function bitsToHex(bits) {
  let value = 0n;
  for (const bit of bits) value = (value << 1n) | BigInt(bit);
  return value.toString(16).padStart(Math.ceil(bits.length / 4), '0');
}

function hamming(left, right) {
  let value = BigInt(`0x${left}`) ^ BigInt(`0x${right}`);
  let count = 0;
  while (value) {
    count += Number(value & 1n);
    value >>= 1n;
  }
  return count;
}

async function dHash(buffer) {
  const { data } = await sharp(buffer).rotate().resize(9, 8, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
  const bits = [];
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) bits.push(data[y * 9 + x] > data[y * 9 + x + 1] ? 1 : 0);
  }
  return bitsToHex(bits);
}

async function pHash(buffer) {
  const size = 32;
  const low = 8;
  const { data } = await sharp(buffer).rotate().resize(size, size, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
  const coefficients = [];
  for (let u = 0; u < low; u += 1) {
    for (let v = 0; v < low; v += 1) {
      let sum = 0;
      for (let x = 0; x < size; x += 1) {
        const cosX = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size));
        for (let y = 0; y < size; y += 1) {
          sum += data[y * size + x] * cosX * Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
        }
      }
      coefficients.push(sum);
    }
  }
  const ac = coefficients.slice(1);
  const median = [...ac].sort((a, b) => a - b)[Math.floor(ac.length / 2)];
  return bitsToHex(coefficients.map((value, index) => (index === 0 ? 0 : value > median ? 1 : 0)));
}

async function fingerprint(buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    sha256: crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase(),
    phash: await pHash(buffer),
    dhash: await dHash(buffer),
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown'
  };
}

function compareFingerprints(left, right) {
  const pDistance = hamming(left.phash, right.phash);
  const dDistance = hamming(left.dhash, right.dhash);
  const leftRatio = left.height ? left.width / left.height : 0;
  const rightRatio = right.height ? right.width / right.height : 0;
  const ratioDelta = Math.max(leftRatio, rightRatio) ? Math.abs(leftRatio - rightRatio) / Math.max(leftRatio, rightRatio) : 0;
  const exactBinary = left.sha256 === right.sha256;
  const samePhoto = exactBinary || (pDistance <= exactPhotoThreshold.phash && dDistance <= exactPhotoThreshold.dhash && ratioDelta <= exactPhotoThreshold.ratio);
  const transformed = !samePhoto && pDistance <= transformedThreshold.phash && dDistance <= transformedThreshold.dhash && ratioDelta <= transformedThreshold.ratio;
  return { exactBinary, samePhoto, transformed, pDistance, dDistance, ratioDelta: Number(ratioDelta.toFixed(4)) };
}

async function scanSites() {
  const failures = [];
  const usage = new Map();
  const pageCounts = {};
  for (const site of sites) {
    try {
      const pages = await sitemapPages(site.origin);
      pageCounts[site.key] = pages.length;
      await mapLimit(pages, 8, async (pageUrl) => {
        try {
          const html = await fetchText(pageUrl);
          for (const imageUrl of extractImageUrls(html, pageUrl)) {
            const item = usage.get(imageUrl) || { url: imageUrl, sites: new Set(), pages: new Set() };
            item.sites.add(site.key);
            item.pages.add(pageUrl);
            usage.set(imageUrl, item);
          }
        } catch (error) {
          failures.push({ type: 'page', url: pageUrl, error: error.message });
        }
      });
    } catch (error) {
      failures.push({ type: 'sitemap', url: `${site.origin}/sitemap.xml`, error: error.message });
    }
  }

  const images = (await mapLimit([...usage.values()], 8, async (item) => {
    try {
      const response = await fetch(item.url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const fp = await fingerprint(Buffer.from(await response.arrayBuffer()));
      return { ...item, sites: [...item.sites], pages: [...item.pages], ...fp };
    } catch (error) {
      failures.push({ type: 'image', url: item.url, sites: [...item.sites], pages: [...item.pages], error: error.message });
      return null;
    }
  })).filter(Boolean);

  const matches = [];
  for (let i = 0; i < images.length; i += 1) {
    for (let j = i + 1; j < images.length; j += 1) {
      const comparison = compareFingerprints(images[i], images[j]);
      if (!comparison.samePhoto && !comparison.transformed) continue;
      const cbfDedupVariant = /\/cbf-dedup\//i.test(images[i].url) || /\/cbf-dedup\//i.test(images[j].url);
      matches.push({
        classification: comparison.samePhoto ? (cbfDedupVariant ? 'approved-cbf-dedup-review' : 'same-photo') : 'visually-related-transformation',
        left: images[i].url,
        right: images[j].url,
        leftSites: images[i].sites,
        rightSites: images[j].sites,
        leftPages: images[i].pages,
        rightPages: images[j].pages,
        ...comparison
      });
    }
  }
  return { generatedAt: new Date().toISOString(), pageCounts, imageCount: images.length, images, matches, failures };
}

async function runFaultInjection() {
  const source = path.join(root, 'public/assets/img/factory/worker-sewing-bag.webp');
  const tempDir = path.join(root, 'artifacts/.perceptual-hash-fault-injection');
  const converted = path.join(tempDir, 'same-photo-different-format.jpg');
  await fs.rm(tempDir, { recursive: true, force: true });
  await fs.mkdir(tempDir, { recursive: true });
  try {
    const sourceBuffer = await fs.readFile(source);
    await sharp(sourceBuffer).resize({ width: 913 }).jpeg({ quality: 71 }).toFile(converted);
    const convertedBuffer = await fs.readFile(converted);
    const comparison = compareFingerprints(await fingerprint(sourceBuffer), await fingerprint(convertedBuffer));
    if (!comparison.samePhoto) throw new Error(`fault injection was not detected: ${JSON.stringify(comparison)}`);
    return { passed: true, sourceFormat: 'webp', injectedFormat: 'jpeg', ...comparison, cleaned: true };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function writeReport(report) {
  const outputDir = path.join(root, 'artifacts/image-perceptual-audit');
  await fs.mkdir(outputDir, { recursive: true });
  const stamp = report.generatedAt.replaceAll(':', '-').replaceAll('.', '-');
  const jsonPath = path.join(outputDir, `image-perceptual-audit-${stamp}.json`);
  const markdownPath = path.join(outputDir, `image-perceptual-audit-${stamp}.md`);
  const isCrossSite = (match) => new Set([...(match.leftSites || []), ...(match.rightSites || [])]).size > 1;
  const samePhoto = report.matches.filter((match) => match.samePhoto);
  const crossSite = samePhoto.filter(isCrossSite);
  const withinSite = samePhoto.filter((match) => !isCrossSite(match));
  const relatedCrossSite = report.matches.filter((match) => match.transformed && isCrossSite(match));
  const row = (match) => `| ${match.exactBinary ? 'byte-identical' : match.classification} | ${match.pDistance} | ${match.dDistance} | ${match.left}<br>${(match.leftPages || []).join('<br>')} | ${match.right}<br>${(match.rightPages || []).join('<br>')} |`;
  const crossRows = crossSite.map(row).join('\n') || '| None | - | - | - | - |';
  const relatedRows = relatedCrossSite.map(row).join('\n') || '| None | - | - | - | - |';
  const failures = report.failures.length ? report.failures.map((item) => `- ${item.type}: ${item.url} (${item.error}); pages: ${(item.pages || []).join(', ') || 'unknown'}`).join('\n') : '- None';
  const markdown = `# Perceptual Image Audit\n\nGenerated: ${report.generatedAt}\n\n## Scope\n\n- Pages: ${Object.entries(report.pageCounts).map(([key, count]) => `${key} ${count}`).join(', ')}\n- Unique page-used images: ${report.imageCount}\n- Confirmed same-photo pairs: ${samePhoto.length} (${crossSite.length} cross-site, ${withinSite.length} within-site)\n- Visually related transformation pairs: ${report.matches.filter((match) => match.transformed).length}\n- Fetch failures: ${report.failures.length}\n\n## Method\n\nSHA-256 identifies byte-identical files. A 64-bit DCT pHash plus a 64-bit dHash identifies the same photo after format conversion, resizing or recompression. Within-site reuse is counted but not listed as a cross-site issue. Files under /cbf-dedup/ are reported separately because approved crop/overlay/main-image transformations are intentional, while unmarked same-photo copies remain duplicates.\n\n## Cross-Site Confirmed Same Photos\n\nOnly cross-site pairs from the confirmed same-photo set are listed here.\n\n| Classification | pHash distance | dHash distance | Left image and pages | Right image and pages |\n|---|---:|---:|---|---|\n${crossRows}\n\n## Cross-Site Visually Related Transformations\n\nThese are outside the strict same-photo threshold but are retained for operator review.\n\n| Classification | pHash distance | dHash distance | Left image and pages | Right image and pages |\n|---|---:|---:|---|---|\n${relatedRows}\n\n## Fetch Failures\n\n${failures}\n`;
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  await fs.writeFile(markdownPath, markdown);
  return { jsonPath, markdownPath };
}

if (candidateIndex >= 0 && !candidatePath) {
  console.error('--candidate requires a local image path.');
  process.exit(1);
}

let faultInjection = null;
if (selfTestEnabled) {
  faultInjection = await runFaultInjection();
  console.log(JSON.stringify({ perceptualHashFaultInjection: faultInjection }, null, 2));
}

if (scanEnabled || candidatePath) {
  const report = await scanSites();
  if (candidatePath) {
    const candidate = await fingerprint(await fs.readFile(path.resolve(root, candidatePath)));
    const duplicates = report.images.map((image) => ({ image, comparison: compareFingerprints(candidate, image) })).filter(({ comparison }) => comparison.samePhoto);
    if (duplicates.length) {
      console.error(`Perceptual image check blocked ${candidatePath}: same photo found at:`);
      for (const { image, comparison } of duplicates) console.error(`- ${image.url} (pHash ${comparison.pDistance}, dHash ${comparison.dDistance})`);
      process.exit(1);
    }
  }
  const reportPaths = await writeReport(report);
  console.log(JSON.stringify({
    ok: true,
    sites: sites.map((site) => site.origin),
    pageCounts: report.pageCounts,
    uniquePageUsedImages: report.imageCount,
    samePhotoPairs: report.matches.filter((match) => match.samePhoto).length,
    crossSiteSamePhotoPairs: report.matches.filter((match) => match.samePhoto && new Set([...(match.leftSites || []), ...(match.rightSites || [])]).size > 1).length,
    withinSiteSamePhotoPairs: report.matches.filter((match) => match.samePhoto && new Set([...(match.leftSites || []), ...(match.rightSites || [])]).size === 1).length,
    transformedPairs: report.matches.filter((match) => match.transformed).length,
    fetchFailures: report.failures.length,
    thresholds: { exactPhotoThreshold, transformedThreshold },
    reportPaths,
    faultInjection
  }, null, 2));
}
