import { NextResponse } from 'next/server';

const CANONICAL_HOST = 'www.customwaistbag.com';
const APEX_HOST = 'customwaistbag.com';

function canonicalPath(pathname) {
  if (pathname.startsWith('/_next') || pathname.startsWith('/assets') || /\.[^/]+$/.test(pathname)) {
    return pathname;
  }
  return pathname.toLowerCase();
}

export function proxy(request) {
  const host = request.headers.get('host')?.toLowerCase().split(':')[0];
  const pathname = request.nextUrl.pathname;
  const targetPath = canonicalPath(pathname);
  const needsWww = host === APEX_HOST;
  const needsLowercase = targetPath !== pathname;

  if ((host === APEX_HOST || host === CANONICAL_HOST) && (needsWww || needsLowercase)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    url.pathname = targetPath;
    return NextResponse.redirect(url, 301);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/:path*']
};
