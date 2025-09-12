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

    // Resolve categories via relations for this locale
    const projectIds = (projects || []).map((p: any) => p.id).filter(Boolean);
    let categoriesByProject: Record<number, string[]> = {};
    if (projectIds.length) {
        const { data: rels, error: relErr } = await supabase
            .from('project_categorie_relations')
            .select('project_id,category_id')
            .in('project_id', projectIds);

        if (!relErr && rels && rels.length) {
            const catIds = Array.from(new Set(rels.map((r: any) => r.category_id)));
            const { data: cats, error: catErr } = await supabase
                .from('project_categories')
                .select('id,name,language')
                .eq('language', locale)
                .in('id', catIds);
            if (!catErr && cats) {
                const catsById = new Map<number, string>(cats.map((c: any) => [c.id, c.name]));
                for (const r of rels as any[]) {
                    const name = catsById.get(r.category_id);
                    if (!name) continue; // skip categories in other languages
                    if (!categoriesByProject[r.project_id]) categoriesByProject[r.project_id] = [];
                    if (!categoriesByProject[r.project_id].includes(name)) categoriesByProject[r.project_id].push(name);
                }
            }
        }
    }

    const shaped: ProjectRecord[] = (projects as any[]).map((p) => ({
        projectid: p.projectid,
        language: p.language,
        categories: (categoriesByProject[p.id] || []).map((n) => String(n)),
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
