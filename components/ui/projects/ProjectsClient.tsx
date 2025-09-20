"use client";

import { useState, useMemo } from 'react';
import Masonry from '@/components/ui/projects/masonry';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export interface ProjectRecord {
  project_id: string;
  language: string;
  categories: string[];
  started: number | null;
  finished: number | null;
  title: string | null;
  title_ext: string | null;
  location: string | null;
  tags: string[] | null; // assuming Postgres text[]
  technologies: string[] | null; // assuming Postgres text[]
  description: string | null;
  image: string | null;
  url: string | null;
  height: number | null;
}

interface ProjectsClientProps {
  data: ProjectRecord[];
}

export default function ProjectsClient({ data }: ProjectsClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Build a list of unique category names as they appear in the data (already localized)
  const categories = useMemo(() => {
    const set = new Set<string>();
    data.forEach(d => {
      (d.categories || []).forEach(c => set.add(c));
    });
    const result = ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[ProjectsClient] categories tabs:', result);
    }
    return result;
  }, [data]);

  const masonryItems = useMemo(() => {
    const items = data.map(d => ({
      id: d.project_id,
      img: d.image || '/test.jpg',
      url: d.url || '',
      height: d.height || 250,
      categories: (d.categories || []), // keep original names
      title: d.title || undefined
    }));
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[ProjectsClient] masonry items sample:', items.slice(0, 6));
    }
    return items;
  }, [data]);

  const selected = useMemo(() => data.find(d => d.project_id === selectedId), [selectedId, data]);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 py-5 flex flex-col items-center">
      <div className="foggy-gradient-bg absolute inset-0 -z-20 pointer-events-none" />
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 z-10">Projects</h1>
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v)} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="gap-1 sm:gap-3 flex-wrap h-auto p-1 z-10">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="px-3 py-1 text-sm">
                {cat === 'all' ? 'All' : cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="focus-visible:outline-none">
            <Masonry
              items={masonryItems}
              ease="power3.out"
              duration={0.6}
              stagger={0.05}
              animateFrom="bottom"
              scaleOnHover
              hoverScale={0.95}
              blurToFocus
              colorShiftOnHover={false}
              activeCategory={cat === 'all' ? 'all' : cat}
              onSelect={(item) => { setSelectedId(item.id); setOpen(true); }}
            />
          </TabsContent>
        ))}
      </Tabs>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSelectedId(null); }}>
        <DialogContent large aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="font-bold flex items-center gap-2">
              {selected?.title || 'Project Details'}
              {(selected?.categories && selected.categories.length > 0) && (
                <span className="flex flex-wrap gap-1">{selected.categories.map(c => (
                  <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                ))}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-md overflow-hidden border bg-muted/30 flex items-center justify-center">
                <Image src={selected.image || '/test.jpg'} alt={selected.title || selected.project_id} width={640} height={360} className="object-cover w-full h-auto" />
              </div>
              <div className="text-sm space-y-1">
                {selected.title_ext && <p className="italic text-muted-foreground">{selected.title_ext}</p>}
                {selected.description && <p>{selected.description}</p>}
                {(selected.tags && selected.tags.length > 0) && (
                  <p><span className="font-semibold">Tags:</span> {selected.tags.join(', ')}</p>
                )}
                {(selected.technologies && selected.technologies.length > 0) && (
                  <p><span className="font-semibold">Tech:</span> {selected.technologies.join(', ')}</p>
                )}
                {selected.started && <p><span className="font-semibold">Started:</span> {selected.started}</p>}
                {selected.finished && <p><span className="font-semibold">Finished:</span> {selected.finished}</p>}
                {selected.url && <p><a className="underline text-primary" href={selected.url} target="_blank" rel="noopener noreferrer">Visit Repository</a></p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
