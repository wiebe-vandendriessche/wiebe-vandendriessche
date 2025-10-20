import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale) ? (rawLocale as 'en' | 'nl') : routing.defaultLocale;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  // Prefer proxying to the Supabase Edge Function (keeps canonical URL under this domain, but uses your function's logic)
  try {
    const edgeUrl = 'https://yfijwhqbnigwjnkfpxje.supabase.co/functions/v1/dynamic-worker';
    const res = await fetch(`${edgeUrl}?lang=${encodeURIComponent(locale)}`, {
      // Ensure we don't cache too long at the proxy level
      headers: { 'Accept': 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7' },
      next: { revalidate: 600 },
    });
    if (res.ok) {
      const xml = await res.text();
      console.info(`[RSS] Using Supabase Edge Function for locale=${locale}`);
      return new Response(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
          'X-RSS-Source': 'edge-function',
        },
      });
    }
    console.warn(`[RSS] Edge Function non-OK response: status=${res.status} ${res.statusText} for locale=${locale}. Falling back to local generation.`);
    // fall through to local generation if edge returns non-200
  } catch {
    console.warn(`[RSS] Edge Function failed, falling back to local generation for locale=${locale}`);
    // fall through to local generation on error
  }

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('language', locale)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    return new Response('Failed to fetch posts', { status: 500 });
  }

  // Basic XML escaping
  const esc = (s: unknown) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const channelTitle = 'Blog';
  const channelLink = `${siteUrl}/${locale}/blog`;
  const channelDesc = locale === 'nl'
    ? 'Artikelen en notities van Wiebe Vandendriessche'
    : 'Articles and notes by Wiebe Vandendriessche';

  const itemCount = (posts || []).length;
  type Post = {
    post_id: string;
    title?: string | null;
    summary?: string | null;
    published_at?: string | null;
  };

  const items = (posts || []).map((p) => {
    const post = p as Post;
    const link = `${siteUrl}/${locale}/blog/${encodeURIComponent(post.post_id)}`;
    const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString();
    return `\n    <item>
      <title>${esc(post.title || post.summary || post.post_id)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <description>${esc(post.summary || '')}</description>
      <pubDate>${esc(pubDate)}</pubDate>
    </item>`;
  }).join('');

  console.info(`[RSS] Local generation success for locale=${locale}, items=${itemCount}`);

  const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!-- rss-source: local-fallback; items: ${itemCount} -->
<rss version=\"2.0\">
  <channel>
    <title>${esc(channelTitle)}</title>
    <link>${esc(channelLink)}</link>
    <description>${esc(channelDesc)}</description>${items ? '\n' + items + '\n' : ''}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      'X-RSS-Source': 'local-fallback',
      'X-RSS-Items': String(itemCount),
    }
  });
}
