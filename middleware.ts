import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(req: NextRequest) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const isApi = pathname.startsWith('/api');

    // For non-API routes, run next-intl first for locale routing
    const intlResponse = !isApi ? intlMiddleware(req) : undefined;

    // Only protect admin paths (localized app routes) and '/api/admin' backend routes.
    // Expect pattern: '/:locale/admin/...'
    const pathSegments = pathname.split('/').filter(Boolean);
    const isLocalizedAdminPath = !isApi && pathSegments.length > 1 && pathSegments[1] === 'admin';
    const isAdminIndex = isLocalizedAdminPath && pathSegments.length === 2; // '/:locale/admin'
    const isAdminApiPath = isApi && (pathname === '/api/admin' || pathname.startsWith('/api/admin/'));

    if (!isLocalizedAdminPath && !isAdminApiPath) {
        return intlResponse ?? NextResponse.next();
    }

    // Prepare a mutable response to set cookies coming from Supabase SSR client
    const res = NextResponse.next({ request: { headers: req.headers } });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookies) {
                    cookies.forEach(({ name, value, options }) => {
                        res.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Use getUser to securely validate user from Supabase Auth server
    const { data: { user }, error } = await supabase.auth.getUser();

    // redirect to login if no user
    if (!user) {
        if (isAdminApiPath) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
        // Allow the admin index to render the login form
        if (isAdminIndex) {
            return intlResponse ?? NextResponse.next();
        }
        // For any nested admin paths, redirect to localized admin index (login)
        return NextResponse.redirect(new URL(`/${pathSegments[0]}/admin`, req.url));
    }

    // check if the user is the admin by UUID from secure server env var
    const adminUUID = process.env.SUPABASE_ADMIN_UUID;
    if (!adminUUID || user.id !== adminUUID) {
        if (isAdminApiPath) {
            return new NextResponse('Forbidden', { status: 403 });
        }
        // Redirect non-admin users to localized home
        return NextResponse.redirect(new URL(`/${pathSegments[0]}`, req.url));
    }

    // Merge intl response headers/cookies into res to preserve locale changes
    // If intlResponse is a Response, copy its headers (like locale redirects)
    if (intlResponse && intlResponse.headers) {
        intlResponse.headers.forEach((value, key) => {
            res.headers.set(key, value);
        });
    }

    return res;
}

export const config = {
    // Apply to all non-static routes for i18n, plus specifically to admin API routes
    matcher: [
        '/((?!api|trpc|auth|_next|_vercel|.*\\..*).*)', // exclude /auth to avoid interfering with OAuth callback
        '/api/admin/:path*' // secure admin API endpoints if added later
    ]
};