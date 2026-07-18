const siteHost = 'www.customwaistbag.com';
const zoneEnv = 'CLOUDFLARE_ZONE_ID_CUSTOMWAISTBAG';

async function purgeCloudflare(zoneId, token) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purge_everything: true }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(`Cloudflare purge failed for ${siteHost}: ${response.status} ${JSON.stringify(result)}`);
  }
  return result;
}

const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const zoneId = process.env[zoneEnv];

if (!token || !zoneId) {
  console.log(`${siteHost}: Cloudflare purge skipped. Set CLOUDFLARE_API_TOKEN and ${zoneEnv} if this domain is proxied through Cloudflare.`);
  process.exit(0);
}

await purgeCloudflare(zoneId, token);
console.log(`${siteHost}: Cloudflare purge_everything completed.`);
