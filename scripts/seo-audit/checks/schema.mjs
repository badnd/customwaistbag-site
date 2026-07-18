import { flattenJsonLd } from "../lib/html.mjs";
import { mapLimit } from "../lib/context.mjs";

function types(node) { return Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]]; }
function nodes(html) { return html.jsonLd.flatMap(flattenJsonLd); }

export async function run(ctx) {
  ctx.mark(27, 28, 29);
  let organizationFound = false;
  await mapLimit(ctx.urls, ctx.config.runtime.concurrencyPerSite, async (url) => {
    const { html } = await ctx.page(url);
    const all = nodes(html);
    for (const bad of all.filter((node) => node.__parseError)) ctx.add(29, "critical", "JSONLD_INVALID", "Invalid JSON-LD syntax", { url, actual: bad.__parseError });
    const products = all.filter((node) => types(node).includes("Product"));
    const isProductPage = new URL(url).pathname.startsWith("/products/");
    if (isProductPage && !products.length) ctx.add(27, "critical", "PRODUCT_SCHEMA_MISSING", "Product page has no Product schema", { url });
    for (const product of products) {
      const offers = Array.isArray(product.offers) ? product.offers : [product.offers].filter(Boolean);
      const prices = offers.flatMap((offer) => [offer.price, offer.lowPrice, offer.highPrice]).filter((value) => value !== undefined);
      if (!prices.length || prices.some((value) => Number(value) !== 0)) ctx.add(27, "critical", "PRODUCT_SCHEMA_PRICE", "Product schema inquiry price must be zero", { url, actual: JSON.stringify(prices) });
      else if (!prices.some((value) => String(value) === "0.00")) ctx.add(27, "warning", "PRODUCT_SCHEMA_PRICE_FORMAT", "Product schema zero price should use the exact string 0.00", { url, actual: JSON.stringify(prices) });
    }
    const organizations = all.filter((node) => types(node).some((type) => ["Organization", "LocalBusiness", "Corporation"].includes(type)));
    if (organizations.length) organizationFound = true;
    for (const org of organizations) {
      const serialized = JSON.stringify(org).toLowerCase();
      if (!serialized.includes(ctx.config.rules.contacts.email.toLowerCase()) && !serialized.includes("nameer")) ctx.add(28, "warning", "ORGANIZATION_CONTACT", "Organization schema does not contain the approved company/contact details", { url });
    }
    for (const faq of all.filter((node) => types(node).includes("FAQPage"))) {
      const entries = Array.isArray(faq.mainEntity) ? faq.mainEntity : [];
      const valid = entries.length && entries.every((entry) => entry?.["@type"] === "Question" && entry.name && entry.acceptedAnswer?.text);
      if (!valid) ctx.add(29, "critical", "FAQ_SCHEMA_INVALID", "FAQPage schema has invalid Question/acceptedAnswer entries", { url });
    }
  });
  if (!organizationFound) ctx.add(28, "critical", "ORGANIZATION_SCHEMA_MISSING", "No Organization schema found in sitemap pages", { url: ctx.site.origin });
}
