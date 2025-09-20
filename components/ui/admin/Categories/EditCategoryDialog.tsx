"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type CategoryRow = { name: string; language: string; project_category_id: string };

interface Props { categorieId: string; onUpdated?: () => void; initialTab?: 'en' | 'nl' }

export function EditCategoryDialog({ categorieId, onUpdated, initialTab = 'en' }: Props) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(categorieId);
  const [enName, setEnName] = useState("");
  const [nlName, setNlName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'en' | 'nl'>(initialTab);

  useEffect(() => {
    if (!open) return;
    (async () => {
      // Load latest rows for this categorieId
      const { data, error } = await supabase
        .from('project_categories')
        .select('language,name,project_category_id')
        .eq('project_category_id', categorieId);
      if (error) {
        toast.error(error.message || 'Failed to load category');
        return;
      }
      const en = (data as any[]).find(r => r.language === 'en') as CategoryRow | undefined;
      const nl = (data as any[]).find(r => r.language === 'nl') as CategoryRow | undefined;
      setKey(categorieId);
      setEnName(en?.name || '');
      setNlName(nl?.name || '');
      setTab(initialTab);
    })();
  }, [open, categorieId, initialTab]);

  const submit = async () => {
  if (!key.trim()) { toast.error("project_category_id is required"); return; }
    if (!enName.trim() && !nlName.trim()) { toast.error("Provide at least one language name"); return; }
    setSubmitting(true);
    try {
      // Load latest rows for this original group
      const { data: existing, error: fetchErr } = await supabase
        .from('project_categories')
        .select('language')
        .eq('project_category_id', categorieId);
      if (fetchErr) throw fetchErr;
      const exByLang = new Set<string>();
      for (const r of (existing as any[]) || []) exByLang.add(r.language);

      // Prepare operations for EN
      if (enName.trim()) {
  const enPayload = { project_category_id: key.trim(), language: 'en', name: enName.trim() } as const;
        const enExists = exByLang.has('en');
        if (enExists) {
          const { error } = await supabase
            .from('project_categories')
            .update(enPayload)
            .eq('project_category_id', categorieId)
            .eq('language', 'en');
          if (error) throw error;
        } else {
          const { error } = await supabase.from('project_categories').insert(enPayload);
          if (error) throw error;
        }
      } else {
        const enExists = exByLang.has('en');
        if (enExists) {
          const { error } = await supabase
            .from('project_categories')
            .delete()
            .eq('project_category_id', categorieId)
            .eq('language', 'en');
          if (error) throw error;
        }
      }

      // NL
      if (nlName.trim()) {
  const nlPayload = { project_category_id: key.trim(), language: 'nl', name: nlName.trim() } as const;
        const nlExists = exByLang.has('nl');
        if (nlExists) {
          const { error } = await supabase
            .from('project_categories')
            .update(nlPayload)
            .eq('project_category_id', categorieId)
            .eq('language', 'nl');
          if (error) throw error;
        } else {
          const { error } = await supabase.from('project_categories').insert(nlPayload);
          if (error) throw error;
        }
      } else {
        const nlExists = exByLang.has('nl');
        if (nlExists) {
          const { error } = await supabase
            .from('project_categories')
            .delete()
            .eq('project_category_id', categorieId)
            .eq('language', 'nl');
          if (error) throw error;
        }
      }

  toast.success('Category saved');
      if (onUpdated) await onUpdated();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally { setSubmitting(false); }
  };

  return (
  <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">project_category_id *</label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'en' | 'nl')}>
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="nl">Dutch</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-3">
              <label className="block text-sm font-medium mb-1">Name (EN)</label>
              <Input value={enName} onChange={(e) => setEnName(e.target.value)} />
            </TabsContent>
            <TabsContent value="nl" className="mt-3">
              <label className="block text-sm font-medium mb-1">Name (NL)</label>
              <Input value={nlName} onChange={(e) => setNlName(e.target.value)} />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
