import * as cheerio from "cheerio";
import { redirectChain } from "../lib/http.mjs";
import { mapLimit } from "../lib/context.mjs";

function sameUrl(a, b) {
  const left = new URL(a); const right = new URL(b);
  return left.origin === right.origin && (left.pathname || "/") === (right.pathname || "/") && left.search === right.search;
}

export async function run(ctx) {
  ctx.mark(1, 2, 3, 4, 5, 6, 7, 8);
  const canonical = new URL(ctx.site.origin);
  if (!ctx.site.testMode) {
    const probes = [
      [1, `https://${canonical.hostname.replace(/^www\./, "")}/`, "non-www"],
      [2, `http://${canonical.hostname}/`, "HTTP"],
      [3, new URL(ctx.config.probes.uppercasePath, ctx.site.origin).href, "uppercase path"]
    ];
    for (const [check, url, label] of probes) {
      const chain = await redirectChain(ctx.client, url);
      const last = chain.at(-1);
      if (chain.length < 2 || ![301, 308].includes(chain[0].status) || !last?.url.startsWith(ctx.site.origin)) {
        ctx.add(check, "critical", "CANONICAL_REDIRECT", `${label} probe must permanently redirect (301/308) to the canonical origin`, { url, actual: JSON.stringify(chain) });
      }
      if (chain.length > 2) ctx.add(4, "warning", "REDIRECT_CHAIN", `${label} uses ${chain.length - 1} redirect hops`, { url, actual: JSON.stringify(chain) });
    }
  }

  const sitemapUrl = new URL("/sitemap.xml", ctx.site.origin).href;
  const sitemap = await ctx.client.request(sitemapUrl);
  if (sitemap.status !== 200) {
    ctx.add(5, "critical", "SITEMAP_UNAVAILABLE", `Sitemap returned HTTP ${sitemap.status}`, { url: sitemapUrl });
    return;
  }
  const xml = cheerio.load(sitemap.body, { xmlMode: true });
  const urls = xml("url > loc").map((_, el) => xml(el).text().trim()).get().filter(Boolean);
  if (!urls.length) ctx.add(5, "critical", "SITEMAP_EMPTY", "Sitemap has no URL entries", { url: sitemapUrl });
  ctx.urls = [...new Set(urls)];
  const originHost = canonical.hostname;
  await mapLimit(ctx.urls, ctx.config.runtime.concurrencyPerSite, async (url) => {
    let parsed;
    try { parsed = new URL(url); } catch { ctx.add(5, "critical", "SITEMAP_INVALID_URL", "Invalid sitemap URL", { url }); return; }
    if (parsed.hostname !== originHost || parsed.pathname !== parsed.pathname.toLowerCase()) {
      ctx.add(6, "critical", "SITEMAP_NONCANONICAL", "Sitemap URL is not canonical www/lowercase", { url });
    }
    if (parsed.pathname.startsWith("/ru/") && parsed.pathname !== "/ru/" && parsed.pathname.endsWith("/")) {
      ctx.add(7, "critical", "RU_TRAILING_SLASH", "Russian sitemap URL has a trailing slash", { url });
    }
    const response = await ctx.client.request(url);
    if (response.status !== 200 || !sameUrl(response.finalUrl, url)) {
      ctx.add(6, "critical", "SITEMAP_URL_STATUS", `Sitemap URL must directly return 200; got ${response.status}`, { url, actual: response.finalUrl });
    }
  });
  const previousCount = ctx.previous.sitemapCount;
  if (Number.isFinite(previousCount) && previousCount > 0) {
    const delta = Math.abs(ctx.urls.length - previousCount);
    const percent = (delta / previousCount) * 100;
    if (delta >= ctx.config.runtime.sitemapDeltaMinimumUrls && percent >= ctx.config.runtime.sitemapDeltaWarningPercent) {
      ctx.add(8, "warning", "SITEMAP_COUNT_DELTA", `Sitemap count changed ${previousCount} -> ${ctx.urls.length} (${percent.toFixed(1)}%)`, { url: sitemapUrl });
    }
  }
}
