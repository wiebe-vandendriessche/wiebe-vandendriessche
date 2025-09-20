"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type ProjectRow = { project_id: string; language: string; title: string | null };
type CategoryRow = { name: string; language: string; project_category_id: string };

type ProjectGroup = {
    project_id: string;
    en?: ProjectRow;
    nl?: ProjectRow;
    displayTitle: string;
};

type LogicalCategory = {
    project_category_id: string;
    en?: CategoryRow;
    nl?: CategoryRow;
    displayName: string;
};

export function ProjectCategoryRelations() {
    const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
    const [logicalCategories, setLogicalCategories] = useState<LogicalCategory[]>([]);
    const [selectedByProject, setSelectedByProject] = useState<Record<string, Set<string>>>({}); // project_id (logical) -> set(project_category_id)
    const [loading, setLoading] = useState(true);
    const [savingFor, setSavingFor] = useState<string | null>(null);
    const [filterProject, setFilterProject] = useState("");

    const load = async () => {
        setLoading(true);
        // Load all projects in both languages
        const { data: projs, error: pErr } = await supabase
            .from("projects").select("project_id,language,title");
        if (pErr) {
            toast.error(pErr.message);
            setLoading(false); return;
        }
        const byProjectId = new Map<string, ProjectGroup>();
        for (const p of (projs as any as ProjectRow[]) || []) {
            const g = byProjectId.get(p.project_id) || {
                project_id: p.project_id,
                displayTitle: "",
            };
            if (p.language === 'en') g.en = p; else if (p.language === 'nl') g.nl = p;
            g.displayTitle = g.displayTitle || p.title || p.project_id;
            byProjectId.set(p.project_id, g);
        }
        const groups = Array.from(byProjectId.values()).sort((a, b) => a.project_id.localeCompare(b.project_id));
        setProjectGroups(groups);

        // Load categories in both languages and group by project_category_id
        const { data: cats, error: cErr } = await supabase
            .from("project_categories").select("project_category_id,name,language");
        if (cErr) {
            toast.error(cErr.message);
            setLoading(false); return;
        }
        const byCatKey = new Map<string, LogicalCategory>();
        for (const c of (cats as any as CategoryRow[]) || []) {
            const lc = byCatKey.get(c.project_category_id) || {
                project_category_id: c.project_category_id,
                displayName: c.name || c.project_category_id,
            };
            if (c.language === 'en') lc.en = c; else if (c.language === 'nl') lc.nl = c;
            // prefer English name for display, fallback NL, then key
            lc.displayName = lc.en?.name || lc.nl?.name || c.project_category_id;
            byCatKey.set(c.project_category_id, lc);
        }
        const logical = Array.from(byCatKey.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
        setLogicalCategories(logical);

        // Load existing relations for all projects (both languages), key by logical project_id
        let selected: Record<string, Set<string>> = {};
        const projectKeys = groups.map(g => g.project_id);
        if (projectKeys.length) {
            const { data: rels, error: rErr } = await supabase
                .from("project_category_relations")
                .select("project_id,project_category_id,language")
                .in("project_id", projectKeys);
            if (rErr) toast.error(rErr.message);
            else {
                for (const g of groups) {
                    const set = new Set<string>();
                    const rowsForGroup = (rels as any[]).filter(r => r.project_id === g.project_id);
                    for (const r of rowsForGroup) set.add(r.project_category_id as string);
                    selected[g.project_id] = set;
                }
            }
        }
        setSelectedByProject(selected);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filteredGroups = useMemo(() => {
        const f = filterProject.trim().toLowerCase();
        if (!f) return projectGroups;
        return projectGroups.filter(g =>
            g.project_id.toLowerCase().includes(f) || (g.displayTitle || "").toLowerCase().includes(f)
        );
    }, [projectGroups, filterProject]);

    const toggle = (project_id: string, catKey: string) => {
        setSelectedByProject(prev => {
            const copy: Record<string, Set<string>> = { ...prev };
            const set = new Set(copy[project_id] || []);
            if (set.has(catKey)) set.delete(catKey); else set.add(catKey);
            copy[project_id] = set; return copy;
        });
    };

    const saveProject = async (group: ProjectGroup) => {
    const hasEn = !!group.en;
    const hasNl = !!group.nl;
    if (!hasEn && !hasNl) return;
        try {
            setSavingFor(group.project_id);
            const selectedKeys = Array.from(selectedByProject[group.project_id] || []);

            // For each language-specific project row present, compute diff and apply
            const applyFor = async (projKey: string, lang: 'en' | 'nl') => {
                // Fetch existing relations for this project+language
                const { data: existing, error } = await supabase
                    .from("project_category_relations")
                    .select("project_category_id")
                    .eq("project_id", projKey)
                    .eq("language", lang);
                if (error) throw error;
                const existingSet = new Set(((existing as any[]) || []).map(r => r.project_category_id as string));
                // Desired category keys for this lang
                const desiredKeys = selectedKeys;
                const desiredSet = new Set(desiredKeys);
                const toAdd = desiredKeys.filter(k => !existingSet.has(k));
                const toRemove = Array.from(existingSet).filter(k => !desiredSet.has(k));
                if (toAdd.length) {
                    const rows = toAdd.map(k => ({ project_id: projKey, project_category_id: k, language: lang }));
                    const { error: addErr } = await supabase.from("project_category_relations").insert(rows);
                    if (addErr) throw addErr;
                }
                if (toRemove.length) {
                    const { error: delErr } = await supabase
                        .from("project_category_relations")
                        .delete()
                        .eq("project_id", projKey)
                        .eq("language", lang)
                        .in("project_category_id", toRemove);
                    if (delErr) throw delErr;
                }
            };

            if (hasEn) await applyFor(group.project_id, 'en');
            if (hasNl) await applyFor(group.project_id, 'nl');

            toast.success("Relations saved for EN/NL");
        } catch (e: any) {
            toast.error(e.message || "Save failed");
        } finally { setSavingFor(null); }
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap items-center gap-10 py-2">
                <Input placeholder="Filter title..." value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="max-w-xs" />
            </div>
            <div className="overflow-hidden rounded-sm border bg-card/20">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-56">Project ID</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="min-w-[300px]">Categories</TableHead>
                            <TableHead className="text-right sticky right-0 bg-card z-10">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                                    <TableCell className="text-right sticky right-0 bg-card z-10"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredGroups.length ? (
                            filteredGroups.map(g => (
                                <TableRow key={g.project_id}>
                                    <TableCell>{g.project_id}</TableCell>
                                    <TableCell>{g.displayTitle || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-3">
                                            {logicalCategories.map(c => {
                                                const checked = !!selectedByProject[g.project_id]?.has(c.project_category_id);
                                                return (
                                                    <label key={c.project_category_id} className="inline-flex items-center gap-2 border rounded px-2 py-1 text-sm cursor-pointer select-none">
                                                        <Checkbox checked={checked} onCheckedChange={() => toggle(g.project_id, c.project_category_id)} />
                                                        <span>{c.displayName}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right sticky right-0 bg-card z-10">
                                        <Button size="sm" onClick={() => saveProject(g)} disabled={savingFor === g.project_id}>
                                            {savingFor === g.project_id ? "Saving..." : "Save"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-16 text-center">No projects</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
