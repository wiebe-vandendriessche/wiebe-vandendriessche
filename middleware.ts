import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(req: NextRequest) {
    // Allow OPTIONS requests to pass through (CORS preflight, browser navigation)
    if (req.method === 'OPTIONS') {
        return NextResponse.next();
    }
    const url = new URL(req.url);
    const pathname = url.pathname;
    const isApi = pathname.startsWith('/api');

    // For non-API routes, run next-intl first for locale routing
    const intlResponse = !isApi ? intlMiddleware(req) : undefined;

    // NOTE: Middleware runs on the Edge Runtime. Avoid Node APIs/libraries here.
    // Only handle i18n routing and let auth be enforced in server components/routes.
    return intlResponse ?? NextResponse.next();
}

export const config = {
    // Apply to all non-static routes for i18n, plus specifically to admin API routes
    matcher: [
        '/((?!api|trpc|auth|_next|_vercel|.*\\..*).*)', // exclude /auth to avoid interfering with OAuth callback
        '/api/admin/:path*' // secure admin API endpoints if added later
    ]
};