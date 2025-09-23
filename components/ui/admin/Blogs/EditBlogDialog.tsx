"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const langSectionSchema = z.object({
  summary: z.string().min(1, "Required"),
  content: z.string().min(1, "Required"),
  author: z.string().optional(),
  tags: z.string().optional(),
  images: z.string().optional(),
});

const formSchema = z.object({
  postid: z.string().min(1, "Required"),
  en: langSectionSchema,
  nl: langSectionSchema,
});

type FormValues = z.infer<typeof formSchema>;

export interface BlogRowForEdit {
  post_id: string;
  language: string; // en|nl
  content: string;
  summary: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author: string;
  images: string[] | null;
  tags: string[] | null;
}

export function EditBlogDialog({ post, onUpdated }: { post: BlogRowForEdit; onUpdated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(post.language as "en" | "nl");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enExists, setEnExists] = useState<boolean>(post.language === 'en');
  const [nlExists, setNlExists] = useState<boolean>(post.language === 'nl');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postid: post.post_id,
      en: { summary: '', content: '', author: '', tags: '', images: '' },
      nl: { summary: '', content: '', author: '', tags: '', images: '' },
    }
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('post_id', post.post_id);
      if (error) { toast.error('Failed to load post'); setLoading(false); return; }
      const enRow: any = data?.find(r => r.language === 'en');
      const nlRow: any = data?.find(r => r.language === 'nl');
      setEnExists(!!enRow);
      setNlExists(!!nlRow);
      const shared: any = enRow || nlRow || post;
      form.reset({
        postid: shared.post_id ?? post.post_id,
        en: {
          summary: enRow?.summary || '',
          content: enRow?.content || '',
          author: enRow?.author || '',
          tags: (enRow?.tags || []).join(', '),
          images: (enRow?.images || []).join(', '),
        },
        nl: {
          summary: nlRow?.summary || '',
          content: nlRow?.content || '',
          author: nlRow?.author || '',
          tags: (nlRow?.tags || []).join(', '),
          images: (nlRow?.images || []).join(', '),
        },
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parseList = (v?: string) => {
    if (!v) return null; const t = v.trim(); if (!t) return null;
    return t.split(',').map(s => s.trim()).filter(Boolean);
  };

  const onSubmit = async (values: FormValues, mode: 'draft' | 'publish') => {
    setSubmitting(true);
    try {
      const toNull = (v?: string) => (v && v.trim() !== '' ? v : null);
      const nowIso = new Date().toISOString();
      const pubAt = mode === 'publish' ? nowIso : null;
      const shared = {
        post_id: values.postid,
        status: mode === 'publish' ? 'published' : 'draft',
        published_at: pubAt,
        updated_at: nowIso,
      } as const;
      const buildLang = (lang: 'en' | 'nl', section: FormValues['en']) => ({
        ...shared,
        language: lang,
        summary: section.summary,
        content: section.content,
        author: toNull(section.author) ?? 'Wiebe Vandendriessche',
        tags: parseList(section.tags),
        images: parseList(section.images),
      });
      const enUpdate = buildLang('en', values.en);
      const nlUpdate = buildLang('nl', values.nl);

      if (enExists) {
        const { error } = await supabase
          .from('blog_posts')
          .update(enUpdate)
          .eq('post_id', post.post_id)
          .eq('language', 'en');
        if (error) throw error;
      } else if (values.en.summary.trim()) {
        const { error } = await supabase.from('blog_posts').insert(enUpdate);
        if (error) throw error;
      }

      if (nlExists) {
        const { error } = await supabase
          .from('blog_posts')
          .update(nlUpdate)
          .eq('post_id', post.post_id)
          .eq('language', 'nl');
        if (error) throw error;
      } else if (values.nl.summary.trim()) {
        const { error } = await supabase.from('blog_posts').insert(nlUpdate);
        if (error) throw error;
      }

      toast.success(mode === 'publish' ? 'Post published' : 'Draft saved');
      onUpdated?.();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update post');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) form.reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent large>
        <DialogHeader>
          <DialogTitle>Edit Blog Post</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit((v) => onSubmit(v, 'draft'))(); }} className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField name="postid" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Post ID *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="nl">Dutch</TabsTrigger>
                </TabsList>
                {(['en', 'nl'] as const).map(lang => (
                  <TabsContent key={lang} value={lang} className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField name={`${lang}.summary` as const} control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Summary ({lang.toUpperCase()}) *</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name={`${lang}.author` as const} control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author ({lang.toUpperCase()})</FormLabel>
                          <FormControl><Input placeholder="Wiebe Vandendriessche" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name={`${lang}.tags` as const} control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Tags ({lang.toUpperCase()}) (comma)</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name={`${lang}.images` as const} control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Images ({lang.toUpperCase()}) (comma)</FormLabel>
                          <FormControl><Input placeholder="/img1.jpg, /img2.jpg" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name={`${lang}.content` as const} control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Content ({lang.toUpperCase()}) *</FormLabel>
                          <FormControl>
                            <textarea className="border bg-background rounded-md p-2 text-sm w-full min-h-[160px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="button" variant="secondary" disabled={submitting} onClick={form.handleSubmit((v) => onSubmit(v, 'draft'))}>{submitting ? 'Saving...' : 'Save Draft'}</Button>
                <Button type="button" disabled={submitting} onClick={form.handleSubmit((v) => onSubmit(v, 'publish'))}>{submitting ? 'Publishing...' : 'Publish'}</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
