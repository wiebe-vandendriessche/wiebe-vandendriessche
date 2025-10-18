"use client";

import React, { useState } from "react";
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

const langSectionSchema = z.object({
  title: z.string().min(1, "Required"),
  summary: z.string().min(1, "Required"),
  content: z.string().min(1, "Required"),
  author: z.string().optional(),
  tags: z.string().optional(),
});

const formSchema = z.object({
  postid: z.string().min(1, "Required"),
  images: z.string().optional(),
  en: langSectionSchema,
  nl: langSectionSchema,
});

type FormValues = z.infer<typeof formSchema>;

export function CreateBlogDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("en");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      postid: "",
      images: "",
      en: { title: "", summary: "", content: "", author: "", tags: "" },
      nl: { title: "", summary: "", content: "", author: "", tags: "" },
    }
  });

  const parseList = (v?: string) => {
    if (!v) return null; const t = v.trim(); if (!t) return null;
    return t.split(",").map(s => s.trim()).filter(Boolean);
  };

  const onSubmit = async (values: FormValues, mode: 'draft' | 'publish') => {
    setSubmitting(true);
    try {
      const toNull = (v?: string) => (v && v.trim() !== "" ? v : null);
      const nowIso = new Date().toISOString();
      const pubAt = mode === 'publish' ? nowIso : null;
      const shared = {
        post_id: values.postid,
        status: mode === 'publish' ? 'published' : 'draft',
        published_at: pubAt,
        updated_at: nowIso,
        images: parseList(values.images),
      } as const;
      const buildLang = (lang: "en" | "nl", section: FormValues["en"]) => ({
        ...shared,
        language: lang,
        title: section.title,
        summary: section.summary,
        content: section.content,
        author: toNull(section.author) ?? 'Wiebe Vandendriessche',
        tags: parseList(section.tags),
      });
      const rows = [buildLang("en", values.en), buildLang("nl", values.nl)];
      const { error } = await supabase.from("blog_posts").insert(rows);
      if (error) throw error;
      toast.success(mode === 'publish' ? "Published EN + NL blog posts" : "Saved draft (EN + NL)");
      onCreated?.();
      setTimeout(() => { setOpen(false); form.reset(); }, 500);
    } catch (e: any) {
      toast.error(e.message || "Failed to create blog posts");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) form.reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">New Post</Button>
      </DialogTrigger>
      <DialogContent large>
        <DialogHeader>
          <DialogTitle>Create Blog Post</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit((v) => onSubmit(v, 'draft'))(); }} className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField name="postid" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Post ID *</FormLabel>
                  <FormControl><Input placeholder="unique id" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="images" control={form.control} render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Images (comma paths)</FormLabel>
                  <FormControl><Input placeholder="/img1.jpg, /img2.jpg" {...field} /></FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground mt-1">
                    Images listed here can be referenced in the markdown content. The first image will be used as the blog post banner.
                  </div>
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
                    <FormField name={`${lang}.content` as const} control={form.control} render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <FormLabel>Content ({lang.toUpperCase()}) *</FormLabel>
                          <span className="text-xs text-muted-foreground">Tip: This field uses <b>Markdown</b>. To display an image, use: <code>![](/path/to/image.jpg)</code></span>
                        </div>
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
              <Button type="button" variant="secondary" disabled={submitting} onClick={form.handleSubmit((v) => onSubmit(v, 'draft'))}>{submitting ? "Saving..." : "Save Draft"}</Button>
              <Button type="button" disabled={submitting} onClick={form.handleSubmit((v) => onSubmit(v, 'publish'))}>{submitting ? "Publishing..." : "Publish"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
