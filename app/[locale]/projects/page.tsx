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
    type ProjectRow = { project_id: string; language: string } & Record<string, unknown>;
    const projectKeys = (projects || []).map((p) => (p as ProjectRow).project_id).filter(Boolean);
    const categoriesByProject: Record<string, string[]> = {};
    if (projectKeys.length) {
        const { data: rels, error: relErr } = await supabase
            .from('project_category_relations')
            .select('project_id,project_category_id,language')
            .eq('language', locale)
            .in('project_id', projectKeys);

        if (!relErr && rels && rels.length) {
            type RelRow = { project_id: string; project_category_id: string };
            const catKeys = Array.from(new Set((rels as RelRow[]).map((r) => r.project_category_id)));
            const { data: cats, error: catErr } = await supabase
                .from('project_categories')
                .select('project_category_id,name,language')
                .eq('language', locale)
                .in('project_category_id', catKeys);
            if (!catErr && cats) {
                type CatRow = { project_category_id: string; name: string };
                const catsByKey = new Map<string, string>((cats as CatRow[]).map((c) => [c.project_category_id, c.name]));
                for (const r of rels as RelRow[]) {
                    const name = catsByKey.get(r.project_category_id);
                    if (!name) continue; // ensure same-language join
                    if (!categoriesByProject[r.project_id]) categoriesByProject[r.project_id] = [];
                    if (!categoriesByProject[r.project_id].includes(name)) categoriesByProject[r.project_id].push(name);
                }
            }
        }
    }

    const shaped: ProjectRecord[] = (projects as ProjectRow[]).map((p) => ({
        project_id: String((p as ProjectRow).project_id),
        language: String((p as ProjectRow).language),
        categories: (categoriesByProject[p.project_id] || []).map((n) => String(n)),
        started: (p as { started?: number | null }).started ?? null,
        finished: (p as { finished?: number | null }).finished ?? null,
        title: (p as { title?: string | null }).title ?? null,
        title_ext: (p as { title_ext?: string | null }).title_ext ?? null,
        location: (p as { location?: string | null }).location ?? null,
        tags: (p as { tags?: string[] | null }).tags ?? null,
        technologies: (p as { technologies?: string[] | null }).technologies ?? null,
        description: (p as { description?: string | null }).description ?? null,
        image: (p as { image?: string | null }).image ?? null,
        url: (p as { url?: string | null }).url ?? null,
        height: (p as { height?: number | null }).height ?? null,
    }));

    return <ProjectsClient data={shaped} />;
}
