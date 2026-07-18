import crypto from "node:crypto";

export function issue(check, severity, code, site, message, details = {}) {
  const normalized = { check, severity, code, site, message, ...details };
  normalized.fingerprint = crypto.createHash("sha1").update(JSON.stringify([site, code, details.url || "", details.source || "", message])).digest("hex").slice(0, 16);
  return normalized;
}

export const severityRank = { critical: 0, warning: 1, info: 2 };
