import { supabase } from '@/lib/supabaseClient';
import TimelineClient from '@/components/ui/timeline/TimelineClient';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const revalidate = 60;

export default async function TimelinePage({ params }: PageProps) {
  const { locale } = await params;

  type Row = {
    timelineid: string;
    language: string;
    categorie: string;
    order?: number | null;
    title: string;
    location: string;
    started: string | null;
    finished: string | null;
    description: string | null;
    description_ext?: string | null;
    image_ext?: string[] | null;
    tags?: string[] | null;
    logos?: string[] | null;
  };

  let rows: Row[] = [];
  try {
    const { data, error } = await supabase
      .from('timeline_elements')
      .select('*')
      .eq('language', locale)
      .order('categorie', { ascending: true })
      .order('order', { ascending: true, nullsFirst: false })
      .order('timelineid', { ascending: true });
    if (error) {
      console.warn('Supabase fetch error timeline_elements:', error.message);
    } else if (data) {
      rows = data as Row[];
    }
  } catch (e) {
    console.warn('Supabase fetch exception timeline_elements:', e);
  }

  const buildDate = (r: Row) => {
    if (r.started && r.finished) {
      if (r.started === r.finished) return r.started;
      return `${r.started} – ${r.finished}`;
    }
    return r.started || r.finished || '';
  };

  const catNormalize = (value: string) => value.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const catMap: Record<string, 'workExperience' | 'education' | 'hobbies' | undefined> = {
    workexperience: 'workExperience',
    workexp: 'workExperience',
    education: 'education',
    hobby: 'hobbies',
    hobbies: 'hobbies',
  };

  const categorized = rows.reduce<Record<string, any[]>>((acc, r) => {
    const norm = catNormalize(r.categorie);
    const key = catMap[norm];
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      timelineid: r.timelineid,
      order: r.order ?? null,
      date: buildDate(r),
      title: r.title,
      subtitle: r.location || '',
      description: r.description || '',
      description_ext: r.description_ext || '',
      image_ext: Array.isArray(r.image_ext) ? r.image_ext : (typeof r.image_ext === 'string' && r.image_ext ? [r.image_ext] : []),
      tags: r.tags || [],
      logos: r.logos || [],
    });
    return acc;
  }, {} as Record<string, any[]>);

  // Sort and remove timelineid/order from payload
  (['workExperience', 'education', 'hobbies'] as const).forEach((cat) => {
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].sort((a: any, b: any) => {
      const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return (a.timelineid || '').localeCompare(b.timelineid || '');
    });
    categorized[cat] = categorized[cat].map(({ order, timelineid, ...rest }) => rest);
  });

  return (
    // Render client component with server-fetched data (keeps same behavior as projects page)
    <TimelineClient
      workExperience={categorized['workExperience'] || []}
      education={categorized['education'] || []}
      hobbies={categorized['hobbies'] || []}
    />
  );
}