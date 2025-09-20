"use client";

import React, { useState } from "react";
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

// Language specific slice
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
  // categorie removed; relations will be created separately
  started: z.string().optional(), // numeric year
  finished: z.string().optional(),
  image: z.string().optional(),
  url: z.string().optional(),
  height: z.string().min(1, "Required"),
  en: langSectionSchema,
  nl: langSectionSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface CreateProjectDialogProps { onCreated?: () => void }

export function CreateProjectDialog({ onCreated }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("en");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectid: "",
      started: "",
      finished: "",
      image: "",
      url: "",
      height: "",
      en: { title: "", title_ext: "", location: "", description: "", tags: "", technologies: "" },
      nl: { title: "", title_ext: "", location: "", description: "", tags: "", technologies: "" },
    }
  });

  const parseList = (value?: string) => {
    if (!value) return null; const trimmed = value.trim(); if (!trimmed) return null;
    return trimmed.split(",").map(s => s.trim()).filter(Boolean);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const toNull = (v?: string) => (v && v.trim() !== "" ? v : null);
      const shared = {
        project_id: values.projectid,
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
      const rows = [buildLang("en", values.en), buildLang("nl", values.nl)];
      const { error } = await supabase.from("projects").insert(rows);
      if (error) throw error;
      toast.success("Created EN + NL project entries");
      if (onCreated) onCreated();
      setTimeout(() => { setOpen(false); form.reset(); }, 700);
    } catch (e: any) {
      toast.error(e.message || "Failed to create project");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) form.reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">Create</Button>
      </DialogTrigger>
      <DialogContent large>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        {submitting ? (
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
                    <FormControl><Input placeholder="unique id" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="started" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Started (year)</FormLabel>
                    <FormControl><Input placeholder="2024" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="finished" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finished (year)</FormLabel>
                    <FormControl><Input placeholder="2025" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="image" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Path</FormLabel>
                    <FormControl><Input placeholder="/test.jpg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="url" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (repo/site)</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="height" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Masonry Height *</FormLabel>
                    <FormControl><Input placeholder="200" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
