import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';
  const pathname = url.pathname;

  // Skip static assets, APIs, images, or files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract hostname without port (e.g. bhargav.localhost:3000 -> bhargav.localhost)
  const hostname = host.split(':')[0].toLowerCase();

  // Standard root hosts that should not trigger subdomain rewrites
  const rootDomains = [
    'localhost',
    '127.0.0.1',
    'maraphoto.com',
    'www.maraphoto.com',
    'meraphotoes.onrender.com',
  ];

  let subdomain: string | null = null;

  for (const root of rootDomains) {
    if (hostname.endsWith(`.${root}`)) {
      const sub = hostname.slice(0, hostname.length - root.length - 1);
      if (sub && sub !== 'www' && sub !== 'api' && sub !== 'admin' && sub !== 'mail') {
        subdomain = sub;
        break;
      }
    }
  }

  // If a valid subdomain was detected and request isn't already targeting /s/, /e/, or system paths
  if (subdomain) {
    if (
      !pathname.startsWith('/s/') &&
      !pathname.startsWith('/dashboard') &&
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/login') &&
      !pathname.startsWith('/signup') &&
      !pathname.startsWith('/auth')
    ) {
      url.pathname = `/s/${subdomain}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
