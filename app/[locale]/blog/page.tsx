import { supabase } from '@/lib/supabaseClient';
import { routing } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import Link from 'next/link';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rss } from 'lucide-react';
import Image from 'next/image';

type BlogPost = {
	post_id: string;
	language: string;
	title: string;
	content: string;
	summary: string;
	status: string;
	created_at: string;
	updated_at: string;
	published_at: string | null;
	author: string;
	images: string[] | null;
	tags: string[] | null;
};

export const dynamic = 'force-dynamic';

export default async function BlogIndex({ params }: { params: Promise<{ locale: string }> }) {
	const { locale: rawLocale } = await params;
	const locale = hasLocale(routing.locales, rawLocale)
		? (rawLocale as 'en' | 'nl')
		: routing.defaultLocale;

	const t = await getTranslations('Blog');

	let posts: BlogPost[] = [];
	try {
		const { data, error } = await supabase
			.from('blog_posts')
			.select('*')
			.eq('language', locale)
			.eq('status', 'published')
			.not('published_at', 'is', null)
			.order('published_at', { ascending: false });
		if (!error && data) posts = data as BlogPost[];
	} catch (e) {
		// ignore and render empty state
	}

	return (
		<section className="relative w-full max-w-4xl mx-auto px-4 py-5">
			<div className="foggy-gradient-bg absolute inset-0 -z-20 pointer-events-none" />
			<div className="relative z-10">
				<header className="mb-6 text-center">
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('title')}</h1>
					<p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{t('description')}</p>
				</header>
				{posts.length === 0 ? (
					<p className="text-muted-foreground">{t('empty')}</p>
				) : (
					<ul className="grid gap-4 sm:gap-6">
						{posts.map((p) => (
							<li key={`${p.post_id}:${p.language}`}>
								<Card className={`overflow-hidden ${(p.images && p.images.length > 0) ? 'pt-0' : ''}`}>
									{((p.images && p.images.length > 0) ? p.images[0] : null) && (
										<div className="relative w-full h-40 sm:h-48 overflow-hidden border-b">
											<Image
												src={(p.images && p.images.length > 0) ? p.images[0] : '/test.jpg'}
												alt={p.title || 'Blog post image'}
												fill
												className="object-cover"
												sizes="(max-width: 768px) 100vw, 768px"
												priority={false}
											/>
										</div>
									)}
									<CardHeader className="border-b">
										<CardTitle className="text-xl">
											<Link href={`/${locale}/blog/${encodeURIComponent(p.post_id)}`} className="hover:underline">
												{p.title}
											</Link>
										</CardTitle>
										<CardDescription>
											{p.author}
											{p.published_at && (
												<>
													{' '}•{' '}
													{new Date(p.published_at).toLocaleDateString(locale)}
												</>
											)}
										</CardDescription>
										{p.tags && p.tags.length > 0 && (
											<div className="mt-2 flex flex-wrap gap-2">
												{p.tags.map((tag) => (
													<Badge key={tag} variant="secondary">{tag}</Badge>
												))}
											</div>
										)}
									</CardHeader>
									<CardContent>
										<p className="text-sm leading-6 line-clamp-3 whitespace-pre-line">{p.summary}</p>
									</CardContent>
									<CardFooter className="border-t justify-between">
										<div className="text-xs text-muted-foreground">
											{p.updated_at ? t('lastUpdated', { date: new Date(p.updated_at).toLocaleDateString(locale) }) : ''}
										</div>
										<CardAction>
											<Button asChild>
												<Link href={`/${locale}/blog/${encodeURIComponent(p.post_id)}`}>
													{t('readArticle')}
												</Link>
											</Button>
										</CardAction>
									</CardFooter>
								</Card>
							</li>
						))}
					</ul>
				)}
				<div className="mt-8 flex justify-center">
					<Button asChild variant="outline">
						<Link href={`/${locale}/blog/rss.xml`} target="_blank" rel="noopener noreferrer">
							<Rss />
							{t('rssButton')}
						</Link>
					</Button>
				</div>
			</div>
		</section>
	);
}

