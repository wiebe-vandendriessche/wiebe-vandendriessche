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

// Language-specific fields (only these differ per language)
const langSectionSchema = z.object({
    title: z.string().min(1, "Required"),        // non-nullable
    location: z.string().min(1, "Required"),     // non-nullable
    description: z.string().optional(),           // nullable
    description_ext: z.string().optional(),       // nullable
    tags: z.string().optional(),                  // nullable (comma list)
});

const formSchema = z.object({
    timelineid: z.string().min(1, "Required"),
    categorie: z.string().min(1, "Required"),
    order: z.string().optional(), // numeric (per category) but capture as string then cast
    // Shared fields (copied into both language rows)
    started: z.string().optional(),
    finished: z.string().optional(),
    image_ext: z.string().optional(),
    logos: z.string().optional(), // comma separated list
    en: langSectionSchema,
    nl: langSectionSchema,
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTimelineElementDialogProps { onCreated?: () => void }

export function CreateTimelineElementDialog({ onCreated }: CreateTimelineElementDialogProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("en");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            timelineid: "",
            categorie: "",
            order: "",
            started: "",
            finished: "",
            image_ext: "",
            logos: "",
            en: { title: "", location: "", description: "", description_ext: "", tags: "" },
            nl: { title: "", location: "", description: "", description_ext: "", tags: "" },
        },
    });

    const parseList = (value?: string) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.split(",").map(s => s.trim()).filter(Boolean);
    };

    const onSubmit = async (values: FormValues) => {
        setSubmitting(true); setError(null); setSuccess(null);
        try {
            const toNull = (v?: string) => (v && v.trim() !== "" ? v : null);
            const baseShared = {
                timelineid: values.timelineid,
                categorie: values.categorie,
                order: values.order && values.order.trim() !== '' ? Number(values.order) : null,
                started: toNull(values.started),
                finished: toNull(values.finished),
                image_ext: parseList(values.image_ext),
                logos: parseList(values.logos),
            };
            const enLang = values.en; const nlLang = values.nl;
            const enRow = {
                ...baseShared,
                language: "en",
                title: enLang.title,
                location: enLang.location,
                description: toNull(enLang.description),
                description_ext: toNull(enLang.description_ext),
                tags: parseList(enLang.tags),
            };
            const nlRow = {
                ...baseShared,
                language: "nl",
                title: nlLang.title,
                location: nlLang.location,
                description: toNull(nlLang.description),
                description_ext: toNull(nlLang.description_ext),
                tags: parseList(nlLang.tags),
            };
            const { error: insertError } = await supabase.from("timeline_elements").insert([enRow, nlRow]);
            if (insertError) throw insertError;
            setSuccess("Created EN + NL entries");
            toast.success("Created EN + NL entries");
            if (onCreated) onCreated();
            setTimeout(() => { setOpen(false); form.reset(); }, 900);
        } catch (e: any) {
            setError(e.message || "Failed to create entries");
            toast.error(e.message || "Failed to create entries");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { form.reset(); setError(null); setSuccess(null); } }}>
            <DialogTrigger asChild>
                <Button size="sm">Create</Button>
            </DialogTrigger>
            <DialogContent large>
                <DialogHeader>
                    <DialogTitle>Create Timeline Element</DialogTitle>
                </DialogHeader>
                {submitting ? (
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
                    <FormControl><Input placeholder="phd_researcher" {...field} /></FormControl>
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
                                    <FormControl><Input placeholder="YYYY-MM (shared)" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField name="finished" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Finished</FormLabel>
                                    <FormControl><Input placeholder="YYYY-MM (optional)" {...field} /></FormControl>
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
                                    <FormLabel>Logos (shared, comma separated)</FormLabel>
                                    <FormControl><Input placeholder="/logos/Imec_tp.png, /logos/IDLab_tp.png" {...field} /></FormControl>
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
                            <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
