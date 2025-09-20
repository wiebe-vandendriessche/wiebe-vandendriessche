import { supabase } from '@/lib/supabaseClient';
import ProjectsClient, { ProjectRecord } from '@/components/ui/projects/ProjectsClient';

interface PageProps {
    // In Next.js 15, `params` is async and must be awaited
    params: Promise<{ locale: string }>;
}

export const revalidate = 60; // cache projects for a minute

export default async function ProjectsPage({ params }: PageProps) {
    const { locale } = await params;
    // Fetch projects for the current locale/language
    const { data: projects, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('language', locale);

    if (projErr) {
        console.error('Error fetching projects', projErr.message);
        return <ProjectsClient data={[]} />;
    }

    // Resolve categories via new relations for this locale (composite key)
    const projectKeys = (projects || []).map((p: any) => p.project_id).filter(Boolean);
    let categoriesByProject: Record<string, string[]> = {};
    if (projectKeys.length) {
        const { data: rels, error: relErr } = await supabase
            .from('project_category_relations')
            .select('project_id,project_category_id,language')
            .eq('language', locale)
            .in('project_id', projectKeys);

        if (!relErr && rels && rels.length) {
            const catKeys = Array.from(new Set(rels.map((r: any) => r.project_category_id)));
            const { data: cats, error: catErr } = await supabase
                .from('project_categories')
                .select('project_category_id,name,language')
                .eq('language', locale)
                .in('project_category_id', catKeys);
            if (!catErr && cats) {
                const catsByKey = new Map<string, string>(cats.map((c: any) => [c.project_category_id, c.name]));
                for (const r of rels as any[]) {
                    const name = catsByKey.get(r.project_category_id);
                    if (!name) continue; // ensure same-language join
                    if (!categoriesByProject[r.project_id]) categoriesByProject[r.project_id] = [];
                    if (!categoriesByProject[r.project_id].includes(name)) categoriesByProject[r.project_id].push(name);
                }
            }
        }
    }

    const shaped: ProjectRecord[] = (projects as any[]).map((p) => ({
        project_id: p.project_id,
        language: p.language,
        categories: (categoriesByProject[p.project_id] || []).map((n) => String(n)),
        started: p.started ?? null,
        finished: p.finished ?? null,
        title: p.title ?? null,
        title_ext: p.title_ext ?? null,
        location: p.location ?? null,
        tags: p.tags ?? null,
        technologies: p.technologies ?? null,
        description: p.description ?? null,
        image: p.image ?? null,
        url: p.url ?? null,
        height: p.height ?? null,
    }));

    return <ProjectsClient data={shaped} />;
}
