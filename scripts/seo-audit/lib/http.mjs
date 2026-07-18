const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class HttpClient {
  constructor({ timeoutMs = 15000, retries = 2, concurrency = 6 } = {}) {
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.concurrency = concurrency;
    this.cache = new Map();
    this.active = 0;
    this.queue = [];
  }

  async request(url, options = {}) {
    const key = `${options.method || "GET"}:${url}:${options.redirect || "follow"}:${options.readBody === false ? "headers" : "body"}`;
    if (!options.noCache && this.cache.has(key)) return this.cache.get(key);
    const task = this.#enqueue(() => this.#attempt(url, options));
    if (!options.noCache) this.cache.set(key, task);
    return task;
  }

  async #attempt(url, options) {
    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(url, {
          method: options.method || "GET",
          redirect: options.redirect || "follow",
          signal: controller.signal,
          headers: { "user-agent": "Nameer-SEO-Audit/1.0", accept: "text/html,application/xml;q=0.9,*/*;q=0.8", ...(options.headers || {}) }
        });
        const skipBody = options.method === "HEAD" || options.readBody === false;
        const body = skipBody ? "" : await response.text();
        if (skipBody) await response.body?.cancel();
        clearTimeout(timer);
        return { url, finalUrl: response.url, status: response.status, ok: response.ok, headers: Object.fromEntries(response.headers), body };
      } catch (error) {
        clearTimeout(timer);
        lastError = error;
        if (attempt < this.retries) await sleep(300 * (attempt + 1));
      }
    }
    return { url, finalUrl: url, status: 0, ok: false, headers: {}, body: "", error: String(lastError) };
  }

  #enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.#drain();
    });
  }

  #drain() {
    while (this.active < this.concurrency && this.queue.length) {
      const job = this.queue.shift();
      this.active += 1;
      job.fn().then(job.resolve, job.reject).finally(() => {
        this.active -= 1;
        this.#drain();
      });
    }
  }
}

export async function redirectChain(client, url, maxHops = 8) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop < maxHops; hop += 1) {
    const result = await client.request(current, { redirect: "manual", noCache: true });
    chain.push({ url: current, status: result.status, location: result.headers.location || "" });
    if (result.status < 300 || result.status >= 400 || !result.headers.location) break;
    current = new URL(result.headers.location, current).href;
  }
  return chain;
}
