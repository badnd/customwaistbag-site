import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';

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

function isAuthorized(request) {
  const secret = process.env.CDN_PURGE_SECRET;
  const authorization = request.headers.get('authorization') || '';
  if (!secret) return false;

  const supplied = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return NextResponse.json({ ok: true, skipped: true, reason: `VERCEL_ENV=${process.env.VERCEL_ENV}` });
  }

  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
  const zoneId = process.env[zoneEnv];

  if (!token || !zoneId) {
    return NextResponse.json({ ok: true, skipped: true, reason: `Missing CLOUDFLARE_API_TOKEN or ${zoneEnv}` });
  }

  try {
    const result = await purgeCloudflare(zoneId, token);
    return NextResponse.json({ ok: true, siteHost, zoneEnv, cloudflareSuccess: result.success === true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, siteHost, zoneEnv, error: error.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, siteHost, route: '/api/purge-cdn', method: 'POST', authentication: 'Bearer token required' });
}
