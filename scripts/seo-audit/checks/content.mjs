import { mapLimit } from "../lib/context.mjs";

function excerpt(text, index, length) { return text.slice(Math.max(0, index - 70), Math.min(text.length, index + length + 70)); }

export async function run(ctx) {
  ctx.mark(22, 23, 24, 25, 26);
  const rules = ctx.config.rules;
  const aggregate = [];
  await mapLimit(ctx.urls, ctx.config.runtime.concurrencyPerSite, async (url) => {
    const { response, html } = await ctx.page(url);
    const text = html.text;
    aggregate.push(response.body);
    const scrubbed = rules.contentWhitelists.reduce((value, allowed) => value.replaceAll(allowed, ""), text);
    for (const source of rules.pricePatterns) {
      const regex = new RegExp(source, "ig"); let match;
      while ((match = regex.exec(scrubbed))) ctx.add(22, "critical", "PRICE_PUBLIC", "Public price or pricing language detected", { url, actual: excerpt(scrubbed, match.index, match[0].length) });
    }
    for (const source of rules.moqRangePatterns) {
      const regex = new RegExp(source, "ig"); let match;
      while ((match = regex.exec(scrubbed))) ctx.add(23, "critical", "MOQ_RANGE", "Old MOQ range wording detected", { url, actual: excerpt(scrubbed, match.index, match[0].length) });
    }
    const certificationText = (rules.certificationWhitelists || []).reduce((value, allowed) => value.replaceAll(allowed, ""), text);
    for (const source of rules.unauthorizedCertificationPatterns || []) {
      const regex = new RegExp(source, "ig"); let match;
      while ((match = regex.exec(certificationText))) ctx.add(25, "critical", "CERTIFICATION_UNAUTHORIZED", "Unauthorized certification claim detected", { url, actual: excerpt(certificationText, match.index, match[0].length) });
    }
    if (response.body.includes("/cdn-cgi/l/email-protection")) ctx.add(26, "critical", "CF_EMAIL_PROTECTION", "Cloudflare email protection markup detected", { url });

    const numericRules = [
      [/(\d+)\+?\s*years?\b/ig, rules.approvedFactoryFacts.years, "years"],
      [/(\d[\d,]*)\s*(?:m²|sqm|square meters?)\b/ig, rules.approvedFactoryFacts.squareMeters, "square meters"],
      [/(\d[\d,]*)\+?\s*(?:employees|workers|people)\b/ig, rules.approvedFactoryFacts.people, "people"],
      [/(?:annual(?: production)? capacity|annual output).{0,25}?(\d[\d,]*)/ig, rules.approvedFactoryFacts.annualCapacity, "annual capacity"],
      [/(?:export(?:ed)? to|exports? to).{0,20}?(\d+)\+?\s*(?:countries|markets)/ig, rules.approvedFactoryFacts.exportMarkets, "export markets"]
    ];
    for (const [regex, allowed, label] of numericRules) {
      let match; while ((match = regex.exec(text))) {
        const value = Number(match[1].replaceAll(",", ""));
        const context = excerpt(text, match.index, match[0].length);
        if (/factory|manufactur|workshop|company|team/i.test(context) && !allowed.includes(value)) ctx.add(25, "warning", "FACTORY_FACT_UNAPPROVED", `Unapproved factory ${label} figure detected`, { url, actual: context });
      }
    }
  });
  const allText = aggregate.join(" ").replaceAll("\\u003e", ">").replaceAll("\\u003c", "<");
  const contacts = rules.contacts;
  for (const [field, expected] of Object.entries(contacts)) if (!allText.toLowerCase().includes(expected.toLowerCase())) ctx.add(24, "critical", "CONTACT_MISSING", `Approved ${field} was not found site-wide`, { expected });
  const emailMatches = [...new Set(allText.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/ig) || [])].filter((email) => email.toLowerCase() !== contacts.email.toLowerCase());
  if (emailMatches.length) ctx.add(24, "warning", "CONTACT_CONFLICT", "Other public email addresses detected", { actual: emailMatches.join(", ") });
}
