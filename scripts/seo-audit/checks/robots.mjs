export async function run(ctx) {
  ctx.mark(17, 18, 19, 20, 21);
  const url = new URL("/robots.txt", ctx.site.origin).href;
  const response = await ctx.client.request(url);
  if (response.status !== 200) { ctx.add(17, "critical", "ROBOTS_UNAVAILABLE", `robots.txt returned HTTP ${response.status}`, { url }); return; }
  const body = response.body;
  const lower = body.toLowerCase();
  const wildcardBlocks = [...body.matchAll(/user-agent:[ \t]*\*([\s\S]*?)(?=user-agent:|$)/ig)].map((match) => match[1]);
  if (wildcardBlocks.some((block) => /^disallow:[ \t]*\/[ \t]*$/im.test(block))) ctx.add(18, "critical", "ROBOTS_BLOCK_ALL", "robots.txt blocks all crawlers", { url });
  for (const route of ["/ru", "/products", "/blog"]) {
    const blocked = wildcardBlocks.some((block) => [...block.matchAll(/^disallow:[ \t]*(\S+)/gim)].some((match) => route.startsWith(match[1])));
    if (blocked) ctx.add(18, "critical", "ROBOTS_BLOCK_CRITICAL_PATH", `robots.txt blocks critical path ${route}`, { url, actual: route });
  }
  for (const bot of ["googlebot", "bingbot", "yandexbot"]) {
    const block = lower.match(new RegExp(`user-agent:\\s*${bot}([\\s\\S]*?)(?=user-agent:|$)`, "i"))?.[1] || "";
    if (/^disallow:[ \t]*\/[ \t]*$/im.test(block)) ctx.add(19, "critical", "ROBOTS_BLOCK_BOT", `robots.txt blocks ${bot}`, { url });
  }
  const expected = `Sitemap: ${new URL("/sitemap.xml", ctx.site.origin).href}`.toLowerCase();
  if (!lower.includes(expected)) ctx.add(20, "warning", "ROBOTS_SITEMAP", "robots.txt Sitemap directive is missing or non-canonical", { url, expected });
  if (ctx.previous.robots && ctx.previous.robots !== body) ctx.add(21, "warning", "ROBOTS_CHANGED", "robots.txt changed since the previous audit", { url });
  ctx.robots = body;
}
