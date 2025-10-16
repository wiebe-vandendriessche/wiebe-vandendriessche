import { supabase } from '@/lib/supabaseClient';
import { routing } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rss, BookOpen } from 'lucide-react';
import Image from 'next/image';
import Markdown from '@/components/ui/markdown';

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
				<div className="my-6 flex justify-center">
					<Button asChild variant="outline">
						<Link href={`/blog/rss.xml`} target="_blank" rel="noopener noreferrer">
							<Rss />
							{t('rssButton')}
						</Link>
					</Button>
				</div>
				{posts.length === 0 ? (
					<p className="text-muted-foreground">{t('empty')}</p>
				) : (
					<ul className="grid gap-4 sm:gap-6">
						{posts.map((p) => (
							<li key={`${p.post_id}:${p.language}`}>
								<Card className="overflow-hidden flex flex-col">
									<CardHeader className="border-b">
										<div className="flex items-start gap-4">
											<div className="flex-1 min-w-0">
												<CardTitle className="text-xl">
													{p.title}
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
															<Badge key={tag} variant="default">{tag}</Badge>
														))}
													</div>
												)}
											</div>
											{Array.isArray(p.images) && p.images[0] && (
												<div className="flex-shrink-0 w-50 h-25 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
													<Image
														src={p.images[0]}
														alt={p.title}
														width={500}
														height={500}
														priority={false}
													/>
												</div>
											)}
										</div>
									</CardHeader>
									<CardContent className="flex-1 flex flex-col">
										<div className="text-sm leading-6 line-clamp-3">
											<Markdown content={p.summary || ''} hideImages summaryMode />
										</div>
										<div className="mt-auto pt-3 flex justify-end">
											<Button asChild variant="default">
												<Link href={`/blog/${encodeURIComponent(p.post_id)}`}>
													<BookOpen className="mr-2 h-4 w-4" />
													{t('readArticle')}
												</Link>
											</Button>
										</div>
									</CardContent>
								</Card>
								{p.updated_at && (
									<div className="mt-3 ml-3 text-left text-xs text-muted-foreground">
										{t('lastUpdated', { date: new Date(p.updated_at).toLocaleDateString(locale) })}
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}

