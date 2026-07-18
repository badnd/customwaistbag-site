import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import englishData from '@tesseract.js-data/eng';

const cwd = process.cwd();
const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const option = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};
const options = (flag) => argv.flatMap((value, index) => value === flag && argv[index + 1] ? [argv[index + 1]] : []);
const resolveFromCwd = (value) => path.resolve(cwd, value);
const dictionaryPath = resolveFromCwd(option('--dictionary', 'scripts/image-ocr-dictionary.json'));
const exemptionsPath = resolveFromCwd(option('--exemptions', 'scripts/image-ocr-exemptions.json'));
const baselinePath = resolveFromCwd(option('--baseline', 'scripts/image-ocr-baseline.json'));
const reportDir = resolveFromCwd(option('--report-dir', 'artifacts/image-ocr-audit'));
const sourceRoots = (options('--source-root').length ? options('--source-root') : ['public']).map(resolveFromCwd);
const rasterExtensions = new Set(['.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp']);
const manualReviewPattern = /(?:poster|banner|brochure|spec|parameter|detail|collage|logo|certificate|certification|trust|frame|mockup|video|fullprint|prepress|cutter)/i;

function readJson(filePath, fallback) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback;
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function bitsToHex(bits) {
  let value = 0n;
  for (const bit of bits) value = (value << 1n) | BigInt(bit);
  return value.toString(16).padStart(Math.ceil(bits.length / 4), '0');
}

async function perceptualHash(buffer) {
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

function walk(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (entry.isFile() && (rasterExtensions.has(path.extname(entry.name).toLowerCase()) || path.extname(entry.name).toLowerCase() === '.svg')) files.push(absolute);
  }
  return files;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[|]/g, 'I')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripSvgText(buffer) {
  return normalizeText(buffer.toString('utf8').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' '));
}

function ruleFindings(text, dictionary) {
  const normalized = normalizeText(text);
  const upper = normalized.toUpperCase();
  const findings = [];
  for (const rule of dictionary.rules || []) {
    const match = normalized.match(new RegExp(rule.pattern, 'iu'));
    if (match) findings.push({ ruleId: rule.id, label: rule.label, evidence: match[0] });
  }

  const approvedEmails = new Set((dictionary.approvedContacts?.emails || []).map((value) => value.toLowerCase()));
  for (const email of normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu) || []) {
    if (!approvedEmails.has(email.toLowerCase())) findings.push({ ruleId: 'contact-email', label: 'Unapproved email address', evidence: email });
  }

  const approvedPhones = new Set((dictionary.approvedContacts?.phones || []).map((value) => value.replace(/\D/g, '')));
  const contactPattern = /(?:TEL(?:EPHONE)?|PHONE|MOBILE|WHATSAPP|WECHAT)\s*[:：]?\s*(\+?[\d\s()\-]{8,24})/giu;
  for (const match of normalized.matchAll(contactPattern)) {
    const digits = match[1].replace(/\D/g, '');
    if (digits.length >= 8 && !approvedPhones.has(digits)) findings.push({ ruleId: 'contact-phone', label: 'Unapproved phone number', evidence: match[0] });
  }

  if (upper.includes('LOW MOQ') && !upper.includes('MOQ FROM 50')) {
    findings.push({ ruleId: 'moq-vague-low', label: 'Unqualified low-MOQ claim', evidence: 'LOW MOQ' });
  }
  return findings;
}

async function exemptionFor(image, ruleId, exemptions) {
  const candidates = (exemptions.exemptions || []).filter((item) => item.sha256 === image.hash && (item.ruleIds || []).includes(ruleId));
  if (!candidates.length) return null;
  image.phash ||= await perceptualHash(image.buffer);
  return candidates.find((item) => item.phash && item.phash === image.phash && item.reason) || null;
}

async function createOcrWorker() {
  const workerOptions = {
    langPath: englishData.langPath,
    gzip: englishData.gzip,
    cachePath: path.join(os.tmpdir(), 'codex-image-ocr-cache'),
  };
  if (has('--verbose')) workerOptions.logger = (message) => process.stdout.write(`OCR ${message.status} ${Math.round((message.progress || 0) * 100)}%\n`);
  return createWorker(englishData.code, 1, workerOptions);
}

async function recognize(worker, item) {
  if (item.kind === 'svg') return { text: stripSvgText(item.buffer), confidence: 100 };
  const result = await worker.recognize(item.buffer);
  return { text: normalizeText(result.data.text), confidence: Number(result.data.confidence || 0) };
}

function localItems() {
  const items = [];
  for (const root of sourceRoots) {
    for (const filePath of walk(root)) {
      const buffer = fs.readFileSync(filePath);
      items.push({
        source: path.relative(cwd, filePath).replace(/\\/g, '/'),
        buffer,
        hash: sha256(buffer),
        kind: path.extname(filePath).toLowerCase() === '.svg' ? 'svg' : 'raster',
        manualReview: manualReviewPattern.test(filePath),
      });
    }
  }
  return items;
}

function decodeXml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

async function onlineItems() {
  const sites = ['https://www.nameerbag.com', 'https://www.junyibags.com', 'https://www.custombackpackfactory.com'];
  const imageUrls = new Set();
  for (const site of sites) {
    const sitemapResponse = await fetch(`${site}/sitemap.xml`);
    if (!sitemapResponse.ok) throw new Error(`OCR online crawl could not fetch ${site}/sitemap.xml: ${sitemapResponse.status}`);
    const sitemap = await sitemapResponse.text();
    const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => decodeXml(match[1]));
    for (const page of pages) {
      const response = await fetch(page);
      if (!response.ok) throw new Error(`OCR online crawl could not fetch ${page}: ${response.status}`);
      const html = await response.text();
      for (const match of html.matchAll(/<(?:img|source)\b[^>]*?\b(?:src|srcset)=["']([^"']+)["']/gi)) {
        for (const candidate of match[1].split(',').map((part) => part.trim().split(/\s+/)[0])) imageUrls.add(new URL(candidate, page).href);
      }
      for (const match of html.matchAll(/<meta\b[^>]*?(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*?content=["']([^"']+)["']/gi)) imageUrls.add(new URL(match[1], page).href);
    }
  }

  const items = [];
  for (const url of imageUrls) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OCR online image fetch failed: ${response.status} ${url}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    items.push({ source: url, buffer, hash: sha256(buffer), kind: contentType.includes('svg') || url.toLowerCase().includes('.svg') ? 'svg' : 'raster', manualReview: manualReviewPattern.test(url) });
  }
  return items;
}

function findingFingerprint(hash, ruleId, evidence) {
  return sha256(Buffer.from(`${hash}|${ruleId}|${normalizeText(evidence).toUpperCase()}`));
}

function writeReport({ dictionary, scanned, skipped, findings, exempted, manualReview, sources }) {
  fs.mkdirSync(reportDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `image-ocr-audit-${stamp}.md`);
  const lines = [
    '# Image OCR Guard Report',
    '',
    '> OCR can miss stylized, low-contrast, artistic, or logo-only text. A green OCR result does not prove an image is compliant and does not replace human visual review.',
    '',
    'High-risk areas requiring human inspection include artistic typography and small parameters on product posters, MOQ/size/material/process text, text inside video frames, and certification marks presented as logos.',
    '',
    `- Dictionary version: ${dictionary.version}`,
    `- Sources collected: ${sources}`,
    `- Unique hashes OCR-scanned: ${scanned}`,
    `- Known hashes skipped in preflight: ${skipped}`,
    `- Blocking findings: ${findings.length}`,
    `- Exempted reviewed findings: ${exempted.length}`,
    '',
    '## Blocking findings',
    '',
    ...(findings.length ? findings.map((item) => `- \`${item.ruleId}\` in \`${item.source}\`: \`${item.evidence}\` (OCR confidence ${item.confidence.toFixed(1)}%)`) : ['- None.']),
    '',
    '## Recorded hash-bound exemptions',
    '',
    ...(exempted.length ? exempted.map((item) => `- \`${item.ruleId}\` in \`${item.source}\`: ${item.reason} (SHA-256 \`${item.sha256}\`, pHash \`${item.phash}\`)`) : ['- None used in this run.']),
    '',
    '## Suggested human visual review list',
    '',
    'This is a filename-based review queue only. It does not decide whether printed parameters are correct.',
    '',
    ...(manualReview.length ? manualReview.sort().map((source) => `- ${source}`) : ['- None matched the high-risk filename patterns.']),
    '',
  ];
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
  return reportPath;
}

async function runFaultInjection(dictionary) {
  process.env.XDG_CACHE_HOME = path.join(cwd, 'artifacts', '.cache');
  fs.mkdirSync(process.env.XDG_CACHE_HOME, { recursive: true });
  const { default: sharp } = await import('sharp');
  const svg = Buffer.from('<svg width="1200" height="420" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><text x="80" y="240" font-family="Arial" font-size="110" font-weight="700" fill="black">MOQ 100 PCS</text></svg>');
  const testImage = await sharp(svg).png().toBuffer();
  const worker = await createOcrWorker();
  try {
    const result = await recognize(worker, { buffer: testImage, kind: 'raster' });
    const findings = ruleFindings(result.text, dictionary);
    if (!findings.some((item) => item.ruleId === 'moq-old-fixed')) throw new Error(`Fault injection failed. OCR text was: ${result.text}`);
    console.log(`OCR fault injection passed: ${result.text}`);
  } finally {
    await worker.terminate();
  }
}

async function main() {
  const dictionary = readJson(dictionaryPath, { rules: [] });
  const exemptions = readJson(exemptionsPath, { exemptions: [] });
  const baseline = readJson(baselinePath, { knownCleanHashes: [], knownFindingFingerprints: [] });
  if (has('--test-injection')) {
    await runFaultInjection(dictionary);
    return;
  }

  let items = localItems();
  if (has('--online')) items.push(...await onlineItems());
  const unique = new Map();
  for (const item of items) if (!unique.has(item.hash)) unique.set(item.hash, item);

  if (has('--seed-baseline')) {
    baseline.version = dictionary.version;
    baseline.knownCleanHashes = [...unique.keys()].sort();
    fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`OCR baseline seeded with ${baseline.knownCleanHashes.length} unique hashes.`);
    return;
  }

  const knownClean = new Set(baseline.knownCleanHashes || []);
  const knownFindings = new Set(baseline.knownFindingFingerprints || []);
  const queue = [...unique.values()].filter((item) => has('--scan-all') || !knownClean.has(item.hash));
  const findings = [];
  const exempted = [];
  let worker;
  try {
    if (queue.some((item) => item.kind === 'raster')) worker = await createOcrWorker();
    for (const item of queue) {
      const result = await recognize(worker, item);
      for (const finding of ruleFindings(result.text, dictionary)) {
        const exemption = await exemptionFor(item, finding.ruleId, exemptions);
        if (exemption) {
          exempted.push({ ...finding, source: item.source, reason: exemption.reason, sha256: item.hash, phash: exemption.phash });
          continue;
        }
        const fingerprint = findingFingerprint(item.hash, finding.ruleId, finding.evidence);
        if (!knownFindings.has(fingerprint)) findings.push({ ...finding, source: item.source, confidence: result.confidence, fingerprint });
      }
    }
  } finally {
    if (worker) await worker.terminate();
  }

  const manualReview = [...new Set(items.filter((item) => item.manualReview).map((item) => item.source))];
  const reportPath = writeReport({ dictionary, scanned: queue.length, skipped: unique.size - queue.length, findings, exempted, manualReview, sources: items.length });
  console.log(`OCR report: ${reportPath}`);
  if (findings.length) {
    console.error(`OCR guard blocked publication with ${findings.length} new finding(s). Human review is required; no image was deleted or modified.`);
    process.exitCode = 1;
  }
}

await main();
