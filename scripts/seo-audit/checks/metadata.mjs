import { mapLimit } from "../lib/context.mjs";

function sameUrl(a, b) {
  const left = new URL(a); const right = new URL(b);
  return left.origin === right.origin && (left.pathname || "/") === (right.pathname || "/") && left.search === right.search;
}

function languagePair(ctx, url) {
  const parsed = new URL(url);
  const path = parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");
  const isRussian = path === "/ru" || path.startsWith("/ru/");
  const englishPath = isRussian ? (path.slice(3) || "/") : path;
  const russianPath = englishPath === "/" ? "/ru" : `/ru${englishPath}`;
  const configured = new Set(ctx.site.multilingualPaths || []);
  const english = new URL(englishPath, ctx.site.origin).href;
  const russian = new URL(russianPath, ctx.site.origin).href;
  const counterpart = isRussian ? english : russian;
  const sitemapHasCounterpart = ctx.urls.some((candidate) => sameUrl(candidate, counterpart));
  return {
    covered: configured.has(englishPath) || sitemapHasCounterpart,
    configured: configured.has(englishPath),
    sitemapHasCounterpart,
    isRussian,
    englishPath,
    russianPath,
    counterpart,
    expected: { en: english, ru: russian, "x-default": english }
  };
}

export async function run(ctx) {
  ctx.mark(12, 13, 14, 15, 16, 31, 32);
  const titles = new Map();
  const descriptions = new Map();
  let hreflangSkipped = 0;
  let hreflangChecked = 0;
  await mapLimit(ctx.urls, ctx.config.runtime.concurrencyPerSite, async (url) => {
    const { response, html } = await ctx.page(url);
    if (!html.canonical) ctx.add(12, "critical", "CANONICAL_MISSING", "Canonical tag is missing", { url });
    else {
      if (!sameUrl(html.canonical, url)) ctx.add(12, "critical", "CANONICAL_NOT_SELF", "Canonical is not self-referencing", { url, actual: html.canonical });
      const target = await ctx.client.request(html.canonical);
      if (target.status !== 200 || target.finalUrl !== html.canonical) ctx.add(12, "critical", "CANONICAL_NOT_200", "Canonical target is not a direct 200", { url, actual: `${target.status} ${target.finalUrl}` });
    }

    const pair = languagePair(ctx, url);
    if (pair.covered) {
      hreflangChecked += 1;
      if (pair.configured && !pair.sitemapHasCounterpart) ctx.add(13, "critical", "HREFLANG_PAIR_NOT_IN_SITEMAP", "Configured translation counterpart is missing from sitemap", { url, expected: pair.counterpart });
      for (const lang of ["en", "ru", "x-default"]) {
        const actual = html.alternates[lang];
        const expected = pair.expected[lang];
        if (!actual) {
          ctx.add(13, "critical", "HREFLANG_MISSING", `Missing hreflang=${lang}`, { url, expected });
          continue;
        }
        if (!sameUrl(actual, expected)) ctx.add(13, "critical", "HREFLANG_WRONG_TARGET", `hreflang=${lang} points to the wrong URL`, { url, expected, actual });
        const target = await ctx.client.request(actual);
        if (target.status !== 200 || target.finalUrl !== actual) ctx.add(13, "critical", "HREFLANG_NOT_DIRECT_200", `hreflang=${lang} must be a direct 200`, { url, expected: actual, actual: `${target.status} ${target.finalUrl}` });
        const pathname = new URL(actual).pathname;
        if (lang === "ru" && pathname !== "/ru" && pathname.endsWith("/")) ctx.add(13, "critical", "RU_HREFLANG_TRAILING_SLASH", "Russian hreflang URL must not end with a slash", { url, actual });
      }
    } else hreflangSkipped += 1;

    if (url.includes("/ru") && !sameUrl(html.canonical, url)) ctx.add(15, "critical", "RU_CANONICAL", "Russian page canonical must reference itself", { url, actual: html.canonical });
    const pagePath = new URL(url).pathname;
    const expectedLang = pagePath === "/ru" || pagePath.startsWith("/ru/") ? "ru" : "en";
    if (!html.lang.startsWith(expectedLang)) ctx.add(16, "warning", "HTML_LANG", `Expected html lang=${expectedLang}`, { url, actual: html.lang || "missing" });
    if (html.robots.includes("noindex") || (response.headers["x-robots-tag"] || "").toLowerCase().includes("noindex")) ctx.add(31, "critical", "UNEXPECTED_NOINDEX", "Sitemap page is marked noindex", { url });
    if (!html.title) ctx.add(32, "critical", "TITLE_MISSING", "Title is missing", { url });
    if (!html.description) ctx.add(32, "warning", "META_DESCRIPTION_MISSING", "Meta description is missing", { url });
    if (html.title) { if (!titles.has(html.title)) titles.set(html.title, []); titles.get(html.title).push(url); }
    if (html.description) { if (!descriptions.has(html.description)) descriptions.set(html.description, []); descriptions.get(html.description).push(url); }
  });

  ctx.note(`${hreflangChecked} multilingual pages received direct-target and reciprocal hreflang checks; ${hreflangSkipped} pages were skipped.`);
  for (const [value, urls] of titles) if (urls.length > 1) ctx.add(32, "warning", "TITLE_DUPLICATE", `Duplicate title on ${urls.length} pages`, { url: urls[0], actual: `${value} | ${urls.join(", ")}` });
  for (const [value, urls] of descriptions) if (urls.length > 1) ctx.add(32, "warning", "META_DESCRIPTION_DUPLICATE", `Duplicate meta description on ${urls.length} pages`, { url: urls[0], actual: `${value} | ${urls.join(", ")}` });

  await mapLimit(ctx.urls, ctx.config.runtime.concurrencyPerSite, async (url) => {
    const { html } = await ctx.page(url);
    const pair = languagePair(ctx, url);
    if (!pair.covered) return;
    const targetLang = pair.isRussian ? "en" : "ru";
    const returnLang = pair.isRussian ? "ru" : "en";
    const targetUrl = html.alternates[targetLang];
    if (!targetUrl) return;
    const target = await ctx.page(targetUrl);
    if (target.response.status !== 200 || !target.html.alternates[returnLang] || !sameUrl(target.html.alternates[returnLang], url)) {
      ctx.add(14, "critical", "HREFLANG_NOT_RECIPROCAL", `${targetLang} alternate is not reciprocal`, { url, actual: targetUrl });
    }
  });
}
