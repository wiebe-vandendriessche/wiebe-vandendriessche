import { supabase } from '@/lib/supabaseClient';
import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';
import Link from 'next/link';

type BlogPost = {
	post_id: string;
	language: string;
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
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Blog</h1>
			{posts.length === 0 ? (
				<p className="text-muted-foreground">No posts yet.</p>
			) : (
				<ul className="space-y-6">
					{posts.map((p) => (
						<li key={`${p.post_id}:${p.language}`} className="border rounded-md p-4 bg-card/30">
							<div className="flex items-start justify-between gap-4">
								<div>
									<h2 className="text-xl font-semibold">
										<Link href={`/${locale}/blog/${encodeURIComponent(p.post_id)}`} className="hover:underline">
											{p.summary}
										</Link>
									</h2>
									<p className="text-sm text-muted-foreground mt-1">
										{p.author} • {p.published_at ? new Date(p.published_at).toLocaleDateString(locale) : ''}
									</p>
									{p.tags && p.tags.length > 0 && (
										<div className="flex flex-wrap gap-2 mt-2">
											{p.tags.map((t) => (
												<span key={t} className="text-xs px-2 py-0.5 rounded-full bg-secondary/60">{t}</span>
											))}
										</div>
									)}
									<p className="mt-3 text-sm leading-6 line-clamp-3 whitespace-pre-line">{p.content}</p>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

