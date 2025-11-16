import { supabase } from '@/lib/supabaseClient';
import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Markdown from '@/components/ui/markdown';

export const dynamic = 'force-dynamic';

async function getPost(post_id: string, locale: 'en' | 'nl') {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('post_id', post_id)
    .eq('language', locale)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .maybeSingle();
  if (error) return null;
  type Post = {
    post_id: string;
    language: 'en' | 'nl';
    title: string | null;
    summary: string | null;
    content: string | null;
    author: string | null;
    published_at: string | null;
    tags: string[] | null;
  };
  return data as Post;
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; post_id: string }> }) {
  const { locale: rawLocale, post_id } = await params;
  const locale = hasLocale(routing.locales, rawLocale) ? (rawLocale as 'en' | 'nl') : routing.defaultLocale;
  const post = await getPost(post_id, locale);
  const t = await getTranslations('Blog');

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  return (
    <article className="relative w-full max-w-4xl mx-auto px-4 py-5 flex flex-col items-center">
      <div className="foggy-gradient-bg absolute inset-0 -z-10 pointer-events-none" />
      <div className="relative z-10">
        <h1>{post.title ?? post.summary}</h1>
        <p className="text-sm text-muted-foreground">{post.author} • {post.published_at ? new Date(post.published_at).toLocaleDateString(locale) : ''}</p>
        <Markdown content={post.content || ''} className="leading-7" />
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.tags.map((t: string) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary/60">{t}</span>
            ))}
          </div>
        )}
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2">
              <ArrowLeft />
              {t('backToBlog')}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
