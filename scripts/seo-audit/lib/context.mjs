import { parseHtml } from "./html.mjs";
import { issue } from "./issues.mjs";

export function createContext(site, config, client, previous = {}) {
  const issues = [];
  const pages = new Map();
  return {
    site, config, client, previous, issues, pages, urls: [], notes: [], checksRun: new Set(),
    add(check, severity, code, message, details = {}) {
      issues.push(issue(check, severity, code, site.origin, message, details));
    },
    note(message) { this.notes.push(message); },
    mark(...ids) { ids.forEach((id) => this.checksRun.add(id)); },
    async page(url) {
      if (!pages.has(url)) {
        pages.set(url, client.request(url).then((response) => ({ response, html: parseHtml(response.body, response.finalUrl || url) })));
      }
      return pages.get(url);
    }
  };
}

export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
