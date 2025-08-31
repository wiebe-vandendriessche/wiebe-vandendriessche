"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const langSectionSchema = z.object({
  title: z.string().min(1, "Required"),
  title_ext: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  technologies: z.string().optional(),
});

const formSchema = z.object({
  projectid: z.string().min(1, "Required"),
  categorie: z.string().min(1, "Required"),
  started: z.string().optional(),
  finished: z.string().optional(),
  image: z.string().optional(),
  url: z.string().optional(),
  height: z.string().optional(),
  en: langSectionSchema,
  nl: langSectionSchema,
});

type FormValues = z.infer<typeof formSchema>;

export interface ProjectRowForEdit {
  id: number; // assumption: projects table has id
  projectid: string;
  language: string;
  categorie: string;
  started: number | null;
  finished: number | null;
  title: string | null;
  title_ext: string | null;
  location: string | null;
  tags: string[] | null;
  technologies: string[] | null;
  description: string | null;
  image: string | null;
  url: string | null;
  height: number | null;
}

interface EditProjectDialogProps { project: ProjectRowForEdit; onUpdated?: () => void }

export function EditProjectDialog({ project, onUpdated }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(project.language as "en" | "nl");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enId, setEnId] = useState<number | null>(project.language === 'en' ? project.id : null);
  const [nlId, setNlId] = useState<number | null>(project.language === 'nl' ? project.id : null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectid: project.projectid,
      categorie: project.categorie,
      started: project.started ? String(project.started) : "",
      finished: project.finished ? String(project.finished) : "",
      image: project.image || "",
      url: project.url || "",
      height: project.height ? String(project.height) : "",
      en: { title: "", title_ext: "", location: "", description: "", tags: "", technologies: "" },
      nl: { title: "", title_ext: "", location: "", description: "", tags: "", technologies: "" },
    }
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("projects").select("*").eq("projectid", project.projectid);
      if (error) {
        toast.error("Failed to load project");
        setLoading(false); return;
      }
      const enRow: any = data.find(r => r.language === 'en');
      const nlRow: any = data.find(r => r.language === 'nl');
      if (enRow) setEnId(enRow.id); else setEnId(null);
      if (nlRow) setNlId(nlRow.id); else setNlId(null);
      const shared: any = enRow || nlRow || project;
      form.reset({
        projectid: shared.projectid,
        categorie: shared.categorie,
        started: shared.started ? String(shared.started) : "",
        finished: shared.finished ? String(shared.finished) : "",
        image: shared.image || "",
        url: shared.url || "",
        height: shared.height ? String(shared.height) : "",
        en: {
          title: enRow?.title || "",
          title_ext: enRow?.title_ext || "",
            location: enRow?.location || "",
            description: enRow?.description || "",
            tags: (enRow?.tags || []).join(", "),
            technologies: (enRow?.technologies || []).join(", "),
        },
        nl: {
          title: nlRow?.title || "",
          title_ext: nlRow?.title_ext || "",
            location: nlRow?.location || "",
            description: nlRow?.description || "",
            tags: (nlRow?.tags || []).join(", "),
            technologies: (nlRow?.technologies || []).join(", "),
        }
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parseList = (value?: string) => {
    if (!value) return null; const trimmed = value.trim(); if (!trimmed) return null;
    return trimmed.split(",").map(s => s.trim()).filter(Boolean);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const toNull = (v?: string) => (v && v.trim() !== "" ? v : null);
      const shared = {
        projectid: values.projectid,
        categorie: values.categorie,
        started: values.started && values.started.trim() !== '' ? Number(values.started) : null,
        finished: values.finished && values.finished.trim() !== '' ? Number(values.finished) : null,
        image: toNull(values.image),
        url: toNull(values.url),
        height: values.height && values.height.trim() !== '' ? Number(values.height) : null,
      } as const;
      const buildLang = (lang: "en" | "nl", section: FormValues["en"]) => ({
        ...shared,
        language: lang,
        title: section.title,
        title_ext: toNull(section.title_ext),
        location: toNull(section.location),
        description: toNull(section.description),
        tags: parseList(section.tags),
        technologies: parseList(section.technologies),
      });
      const enUpdate = buildLang("en", values.en);
      const nlUpdate = buildLang("nl", values.nl);

      if (enId) {
        const { error } = await supabase.from("projects").update(enUpdate).eq("id", enId);
        if (error) throw error;
      } else if (values.en.title.trim()) {
        const { error } = await supabase.from("projects").insert(enUpdate);
        if (error) throw error;
      }
      if (nlId) {
        const { error } = await supabase.from("projects").update(nlUpdate).eq("id", nlId);
        if (error) throw error;
      } else if (values.nl.title.trim()) {
        const { error } = await supabase.from("projects").insert(nlUpdate);
        if (error) throw error;
      }
      toast.success("Project updated");
      if (onUpdated) onUpdated();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update project");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) form.reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent large>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
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
            <div className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2 md:col-span-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className={i >= 3 ? 'h-24 w-full' : 'h-10 w-full'} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField name="projectid" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project ID *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="categorie" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AI">AI</SelectItem>
                          <SelectItem value="3D">3D</SelectItem>
                          <SelectItem value="webapp">webapp</SelectItem>
                          <SelectItem value="thesis">thesis</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="started" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Started (year)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="finished" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finished (year)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="image" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="url" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="height" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Masonry Height</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Tabs value={activeTab} onValueChange={val => setActiveTab(val as any)}>
                <TabsList>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="nl">Dutch</TabsTrigger>
                </TabsList>
                {(["en", "nl"] as const).map(lang => (
                  <TabsContent key={lang} value={lang} className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField name={`${lang}.title` as const} control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Title ({lang.toUpperCase()}) *</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name={`${lang}.title_ext` as const} control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Extended Title ({lang.toUpperCase()})</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name={`${lang}.location` as const} control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location ({lang.toUpperCase()})</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
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
                      <FormField name={`${lang}.technologies` as const} control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Technologies ({lang.toUpperCase()}) (comma)</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField name={`${lang}.description` as const} control={form.control} render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description ({lang.toUpperCase()})</FormLabel>
                          <FormControl>
                            <textarea className="border bg-background rounded-md p-2 text-sm w-full min-h-[120px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
