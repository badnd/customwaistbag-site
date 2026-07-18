import { mapLimit } from "../lib/context.mjs";

export async function run(ctx) {
  ctx.mark(9, 10, 11, 30);
  const host = new URL(ctx.site.origin).hostname;
  const targets = new Map();
  await mapLimit(ctx.urls, ctx.config.runtime.concurrencyPerSite, async (url) => {
    const page = await ctx.page(url);
    if (page.response.status !== 200) ctx.add(30, "critical", "PAGE_UNAVAILABLE", `Page returned HTTP ${page.response.status}`, { url });
    for (const link of page.html.links) {
      if (new URL(link.url).hostname !== host) continue;
      if (new URL(link.url).pathname === "/cdn-cgi/l/email-protection") continue;
      const clean = new URL(link.url); clean.search = "";
      const normalized = clean.href;
      if (!targets.has(normalized)) targets.set(normalized, []);
      targets.get(normalized).push({ source: url, area: link.area, href: link.href });
    }
  });
  await mapLimit([...targets.entries()], ctx.config.runtime.concurrencyPerSite, async ([url, sources]) => {
    const response = await ctx.client.request(url);
    if (response.status >= 400 || response.status === 0) {
      for (const source of sources.slice(0, 10)) ctx.add(source.area === "nav" || source.area === "footer" || source.area === "header" ? 10 : 9, "critical", "LINK_BROKEN", `Internal link returned HTTP ${response.status}`, { url, source: source.source, actual: `${source.area}: ${source.href}` });
    } else if (response.finalUrl !== url || response.status >= 300) {
      for (const source of sources.slice(0, 5)) ctx.add(11, "warning", "LINK_REDIRECT", "Internal link does not point directly to a 200 URL", { url, source: source.source, actual: response.finalUrl });
    }
  });
}
