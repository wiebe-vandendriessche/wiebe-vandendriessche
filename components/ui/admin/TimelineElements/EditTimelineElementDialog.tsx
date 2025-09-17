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

// Reuse schema from create component (duplicated here to keep file self-contained)
const langSectionSchema = z.object({
    title: z.string().min(1, "Required"),
    location: z.string().min(1, "Required"),
    description: z.string().optional(),
    description_ext: z.string().optional(),
    tags: z.string().optional(),
});

const formSchema = z.object({
    timelineid: z.string().min(1, "Required"),
    categorie: z.string().min(1, "Required"),
    order: z.string().optional(),
    started: z.string().optional(),
    finished: z.string().optional(),
    image_ext: z.string().optional(),
    logos: z.string().optional(),
    en: langSectionSchema,
    nl: langSectionSchema,
});

type FormValues = z.infer<typeof formSchema>;

export interface TimelineElementRowForEdit {
    id: number;
    timelineid: string;
    language: string;
    categorie: string;
    title: string;
    location: string;
    started: string | null;
    finished: string | null;
    description: string | null;
    description_ext: string | null;
    tags: string[] | null;
    logos: string[] | null;
    image_ext: string | null;
    order?: number | null;
}

interface EditTimelineElementDialogProps {
    element: TimelineElementRowForEdit; // one of the two language rows
    onUpdated?: () => void;
}

export function EditTimelineElementDialog({ element, onUpdated }: EditTimelineElementDialogProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(element.language as "en" | "nl");
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    // Keep ids for both languages (could be identical row or missing other language)
    const [enId, setEnId] = useState<number | null>(element.language === "en" ? element.id : null);
    const [nlId, setNlId] = useState<number | null>(element.language === "nl" ? element.id : null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            timelineid: element.timelineid,
            categorie: element.categorie,
            started: element.started ?? "",
            finished: element.finished ?? "",
            image_ext: element.image_ext ?? "",
            logos: (element.logos ?? []).join(", "),
            order: element.order ? String(element.order) : "",
            en: { title: "", location: "", description: "", description_ext: "", tags: "" },
            nl: { title: "", location: "", description: "", description_ext: "", tags: "" },
        },
    });

    // Populate both languages when dialog opens (fetch by timelineid for freshest data)
    useEffect(() => {
        if (!open) return;
        (async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("timeline_elements")
                .select("*")
                .eq("timelineid", element.timelineid);
            if (error) {
                toast.error("Failed to load element");
                setLoading(false);
                return;
            }
            const enRow = data.find(r => r.language === "en");
            const nlRow = data.find(r => r.language === "nl");
            if (enRow) setEnId(enRow.id); else setEnId(null);
            if (nlRow) setNlId(nlRow.id); else setNlId(null);
            // Use whichever row we clicked for shared fallback
            const shared = enRow || nlRow || element;
            form.reset({
                timelineid: shared.timelineid,
                categorie: shared.categorie,
                started: shared.started || "",
                finished: shared.finished || "",
                image_ext: shared.image_ext || "",
                logos: (shared.logos || []).join(", "),
                order: shared.order ? String(shared.order) : "",
                en: {
                    title: enRow?.title || "",
                    location: enRow?.location || "",
                    description: enRow?.description || "",
                    description_ext: enRow?.description_ext || "",
                    tags: (enRow?.tags || []).join(", "),
                },
                nl: {
                    title: nlRow?.title || "",
                    location: nlRow?.location || "",
                    description: nlRow?.description || "",
                    description_ext: nlRow?.description_ext || "",
                    tags: (nlRow?.tags || []).join(", "),
                },
            });
            setLoading(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const parseList = (value?: string) => {
        if (!value) return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        return trimmed.split(",").map(s => s.trim()).filter(Boolean);
    };

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true);
        try {
            const toNull = (v?: string) => (v && v.trim() !== "" ? v : null);
            const baseShared = {
                timelineid: values.timelineid,
                categorie: values.categorie,
                started: toNull(values.started),
                finished: toNull(values.finished),
                image_ext: parseList(values.image_ext),
                logos: parseList(values.logos),
                order: values.order && values.order.trim() !== '' ? Number(values.order) : null,
            } as const;

            const buildLang = (lang: "en" | "nl", section: FormValues["en"]) => ({
                ...baseShared,
                language: lang,
                title: section.title,
                location: section.location,
                description: toNull(section.description),
                description_ext: toNull(section.description_ext),
                tags: parseList(section.tags),
            });
            const enUpdate = buildLang("en", values.en);
            const nlUpdate = buildLang("nl", values.nl);

            if (enId) {
                const { error } = await supabase.from("timeline_elements").update(enUpdate).eq("id", enId);
                if (error) throw error;
            } else if (values.en.title.trim()) {
                const { error } = await supabase.from("timeline_elements").insert(enUpdate);
                if (error) throw error;
            }
            if (nlId) {
                const { error } = await supabase.from("timeline_elements").update(nlUpdate).eq("id", nlId);
                if (error) throw error;
            } else if (values.nl.title.trim()) {
                const { error } = await supabase.from("timeline_elements").insert(nlUpdate);
                if (error) throw error;
            }

            toast.success("Timeline element updated");
            if (onUpdated) onUpdated();
            setOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to update");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { form.reset(); } }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
            </DialogTrigger>
            <DialogContent large>
                <DialogHeader>
                    <DialogTitle>Edit Timeline Element</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
                        <div className="grid gap-4 md:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className={i === 5 ? 'md:col-span-2 space-y-2' : 'space-y-2'}>
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-40" />
                            <div className="grid gap-4 md:grid-cols-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className={i === 0 || i > 1 ? 'md:col-span-2 space-y-2' : 'space-y-2'}>
                                        <Skeleton className="h-4 w-40" />
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
                <FormField name="timelineid" control={form.control} render={({ field }) => (
                                    <FormItem>
                    <FormLabel>Timeline ID *</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="categorie" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categorie *</FormLabel>
                                        <FormControl>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="workexperience">workexperience</SelectItem>
                                                    <SelectItem value="education">education</SelectItem>
                                                    <SelectItem value="hobbies">hobbies</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="order" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Order (per category)</FormLabel>
                                        <FormControl><Input placeholder="e.g. 1" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="started" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Started</FormLabel>
                                        <FormControl><Input placeholder="YYYY-MM" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="finished" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Finished</FormLabel>
                                        <FormControl><Input placeholder="YYYY-MM" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="image_ext" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Image Ext (comma separated)</FormLabel>
                                        <FormControl><Input placeholder="/images/img1.jpg, /images/img2.jpg" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="logos" control={form.control} render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Logos (comma separated)</FormLabel>
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
                                            <FormField name={`${lang}.location` as const} control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Location ({lang.toUpperCase()}) *</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField name={`${lang}.tags` as const} control={form.control} render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Tags ({lang.toUpperCase()}) (comma separated)</FormLabel>
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
                                            <FormField name={`${lang}.description_ext` as const} control={form.control} render={({ field }) => (
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel>Extended Description ({lang.toUpperCase()})</FormLabel>
                                                    <FormControl>
                                                        <textarea className="border bg-background rounded-md p-2 text-sm w-full min-h-[120px]" placeholder="optional" {...field} />
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
