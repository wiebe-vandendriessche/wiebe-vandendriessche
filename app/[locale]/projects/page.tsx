import { supabase } from '@/lib/supabaseClient';
import ProjectsClient, { ProjectRecord } from '@/components/ui/projects/ProjectsClient';

interface PageProps {
    params: { locale: string };
}

export const revalidate = 60; // cache projects for a minute

export default async function ProjectsPage({ params }: PageProps) {
    const { locale } = params;
    // Fetch projects for the current locale/language
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('language', locale);

    if (error) {
        console.error('Error fetching projects', error.message);
    }

    return <ProjectsClient data={(data as ProjectRecord[]) || []} />;
}
