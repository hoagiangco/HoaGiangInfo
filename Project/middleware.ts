import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * First line of defence (edge runtime, no DB access):
 *  - keeps anonymous visitors (customers) out of /admin and the internal APIs
 *  - blocks the legacy public document folder
 *  - same-origin check for state-changing requests (CSRF)
 *
 * This only checks that a session cookie EXISTS. The real validation
 * (session in DB, not expired, user active, permission) is done by
 * lib/auth/guard.ts inside every page / route handler.
 */

const SESSION_COOKIE = 'hg_session';

/** Anonymous POSTs that are allowed (customer-facing or login). */
const PUBLIC_WRITE_PATHS = new Set([
  '/api/auth/login',
  '/api/qr/scan',
  '/api/public/feedback',
]);

function isSensitiveRead(pathname: string): boolean {
  return (
    pathname.startsWith('/api/internal/') ||
    pathname === '/api/export' ||
    pathname === '/api/analytics' ||
    pathname === '/api/qr' ||
    /^\/api\/qr\/(?!verify\/|scan)/.test(pathname)
  );
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (origin) {
    try {
      return !!host && new URL(origin).host === host;
    } catch {
      return false;
    }
  }
  // No Origin header: accept only if the browser says it is not cross-site.
  const site = request.headers.get('sec-fetch-site');
  return !site || site === 'same-origin' || site === 'none';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;

  // Legacy location of internal documents. Files now live in private storage.
  if (pathname.startsWith('/uploads/documents')) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Internal pages
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!hasSession) {
      const url = new URL('/login', request.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  // APIs
  if (pathname.startsWith('/api/')) {
    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(method);

    if (isWrite) {
      if (!sameOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!PUBLIC_WRITE_PATHS.has(pathname) && !hasSession) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (isSensitiveRead(pathname) && !hasSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/:path*', '/uploads/documents/:path*'],
};
