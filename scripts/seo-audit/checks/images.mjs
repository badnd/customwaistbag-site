import { mapLimit } from "../lib/context.mjs";

export async function run(ctx) {
  ctx.mark(33);
  const targets = new Map();
  await mapLimit(ctx.urls, ctx.config.runtime.concurrencyPerSite, async (pageUrl) => {
    const page = await ctx.page(pageUrl);
    for (const image of page.html.images) {
      if (!targets.has(image.url)) targets.set(image.url, []);
      targets.get(image.url).push({ pageUrl, ...image });
    }
  });

  await mapLimit([...targets.entries()], ctx.config.runtime.concurrencyPerSite, async ([imageUrl, sources]) => {
    const response = await ctx.client.request(imageUrl, { readBody: false, redirect: "manual" });
    const byPage = new Map();
    for (const source of sources) {
      if (!byPage.has(source.pageUrl)) byPage.set(source.pageUrl, []);
      byPage.get(source.pageUrl).push(source);
    }
    if (response.status !== 200) {
      for (const [pageUrl, pageSources] of byPage) {
        ctx.add(33, "critical", "IMAGE_UNAVAILABLE", `Referenced image returned HTTP ${response.status}`, {
          url: imageUrl,
          source: pageUrl,
          actual: [...new Set(pageSources.map((source) => `${source.element}[${source.attribute}]=${source.src}`))].join("; ")
        });
      }
      return;
    }
    const contentType = response.headers["content-type"] || "";
    if (contentType && !contentType.toLowerCase().startsWith("image/")) {
      for (const [pageUrl] of byPage) {
        ctx.add(33, "warning", "IMAGE_CONTENT_TYPE", "Image URL did not return an image content type", {
          url: imageUrl,
          source: pageUrl,
          actual: contentType
        });
      }
    }
  });
}
