import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { supabase } from '@/lib/supabaseClient';

// Unified timeline element row definition matching the proposed schema
// Table name assumed: timeline_elements
// Composite PK: (timelineid text, language enum)
// Columns: timelineid, language, categorie,
// title, location, started, finished, description
// Additional optional columns (not required now) could be: logos text[] / meta jsonb
type TimelineElementRow = {
    timelineid: string;
    language: string;
    categorie: string;
    order?: number | null; // new per-category ordering
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

export default getRequestConfig(async ({ requestLocale }) => {
    // Typically corresponds to the `[locale]` segment
    const requested = await requestLocale;
    const locale = hasLocale(routing.locales, requested)
        ? requested
        : routing.defaultLocale;

    // Load static messages
    const baseMessages = (await import(`../messages/${locale}.json`)).default as Record<string, any>;

    // Fetch unified timeline elements for current locale.
    let rows: TimelineElementRow[] = [];
    try {
        const { data, error } = await supabase
            .from('timeline_elements')
            .select('*')
            .eq('language', locale)
            // Order primarily by category then by provided order then by timelineid for stability
            .order('categorie', { ascending: true })
            .order('order', { ascending: true, nullsFirst: false })
            .order('timelineid', { ascending: true });
        if (error) {
            console.warn('Supabase fetch error timeline_elements:', error.message);
        } else if (data) {
            rows = data as TimelineElementRow[];
            console.log(`Fetched ${rows.length} timeline_elements for locale ${locale}`);
        }
    } catch (e) {
        console.warn('Supabase fetch exception timeline_elements:', e);
    }

    // Helper to build date label from started/finished
    const buildDate = (r: TimelineElementRow) => {
        if (r.started && r.finished) {
            if (r.started === r.finished) return r.started;
            return `${r.started} – ${r.finished}`;
        }
        return r.started || r.finished || '';
    };

    // Debug: log all fetched rows
    if (rows.length) {
        console.log('TimelineElement raw rows:', rows.map(r => ({
            timelineid: r.timelineid,
            language: r.language,
            categorie: r.categorie,
            title: r.title,
            location: r.location,
            started: r.started,
            finished: r.finished,
            description: r.description
        })));
    } else {
        console.warn('No timeline_elements rows fetched for locale', locale);
    }

    const catNormalize = (value: string) => value.replace(/[^a-zA-Z]/g, '').toLowerCase();
    const catMap: Record<string, 'workexperience' | 'education' | 'hobbies' | undefined> = {
        workexperience: 'workexperience',
        workexp: 'workexperience',
        education: 'education',
        hobby: 'hobbies',
        hobbies: 'hobbies'
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
    }, {});

    // Sort each category by explicit order (ascending), fallback timelineid
    Object.keys(categorized).forEach(cat => {
        categorized[cat].sort((a: any, b: any) => {
            const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
            const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
            if (ao !== bo) return ao - bo;
            return (a.timelineid || '').localeCompare(b.timelineid || '');
        });
        categorized[cat] = categorized[cat].map(({ order, timelineid, ...rest }) => rest);
    });

    // Merge into messages under Timeline namespace
    const messages = {
        ...baseMessages,
        Timeline: {
            ...(baseMessages as any).Timeline,
            workExperience: categorized['workexperience'] || [],
            education: categorized['education'] || [],
            hobbies: categorized['hobbies'] || []
        }
    };

    return { locale, messages };
});