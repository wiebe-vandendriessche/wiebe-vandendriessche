"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type ProjectRow = { id: number; projectid: string; language: string; title: string | null };
type CategoryRow = { id: number; name: string; language: string; project_category_id: string };

type ProjectGroup = {
    projectid: string;
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
    const [selectedByProject, setSelectedByProject] = useState<Record<string, Set<string>>>({}); // projectid -> set(project_category_id)
    const [loading, setLoading] = useState(true);
    const [savingFor, setSavingFor] = useState<string | null>(null);
    const [filterProject, setFilterProject] = useState("");

    const load = async () => {
        setLoading(true);
        // Load all projects in both languages
        const { data: projs, error: pErr } = await supabase
            .from("projects").select("id,projectid,language,title");
        if (pErr) {
            toast.error(pErr.message);
            setLoading(false); return;
        }
        const byProjectId = new Map<string, ProjectGroup>();
        for (const p of (projs as any as ProjectRow[]) || []) {
            const g = byProjectId.get(p.projectid) || {
                projectid: p.projectid,
                displayTitle: "",
            };
            if (p.language === 'en') g.en = p; else if (p.language === 'nl') g.nl = p;
            g.displayTitle = g.displayTitle || p.title || p.projectid;
            byProjectId.set(p.projectid, g);
        }
        const groups = Array.from(byProjectId.values()).sort((a, b) => a.projectid.localeCompare(b.projectid));
        setProjectGroups(groups);

        // Load categories in both languages and group by project_category_id
        const { data: cats, error: cErr } = await supabase
            .from("project_categories").select("id,name,language,project_category_id");
        if (cErr) {
            toast.error(cErr.message);
            setLoading(false); return;
        }
        const byCatKey = new Map<string, LogicalCategory>();
        const idToProjectCategoryId = new Map<number, string>();
        for (const c of (cats as any as CategoryRow[]) || []) {
            const lc = byCatKey.get(c.project_category_id) || {
                project_category_id: c.project_category_id,
                displayName: c.name || c.project_category_id,
            };
            if (c.language === 'en') lc.en = c; else if (c.language === 'nl') lc.nl = c;
            // prefer English name for display, fallback NL, then key
            lc.displayName = lc.en?.name || lc.nl?.name || c.project_category_id;
            byCatKey.set(c.project_category_id, lc);
            idToProjectCategoryId.set(c.id, c.project_category_id);
        }
        const logical = Array.from(byCatKey.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
        setLogicalCategories(logical);

        // Load existing relations for all language-specific project ids
        const allProjectIds = groups.flatMap(g => [g.en?.id, g.nl?.id].filter(Boolean)) as number[];
        let selected: Record<string, Set<string>> = {};
        if (allProjectIds.length) {
            const { data: rels, error: rErr } = await supabase
                .from("project_categorie_relations")
                .select("project_id,category_id")
                .in("project_id", allProjectIds);
            if (rErr) {
                toast.error(rErr.message);
            } else {
                for (const g of groups) {
                    const set = new Set<string>();
                    const idsForGroup = (rels as any[]).filter(r => r.project_id === g.en?.id || r.project_id === g.nl?.id);
                    for (const r of idsForGroup) {
                        const key = idToProjectCategoryId.get(r.category_id);
                        if (key) set.add(key);
                    }
                    selected[g.projectid] = set;
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
            g.projectid.toLowerCase().includes(f) || (g.displayTitle || "").toLowerCase().includes(f)
        );
    }, [projectGroups, filterProject]);

    const toggle = (projectid: string, catKey: string) => {
        setSelectedByProject(prev => {
            const copy: Record<string, Set<string>> = { ...prev };
            const set = new Set(copy[projectid] || []);
            if (set.has(catKey)) set.delete(catKey); else set.add(catKey);
            copy[projectid] = set; return copy;
        });
    };

    const saveProject = async (group: ProjectGroup) => {
        const enId = group.en?.id || null;
        const nlId = group.nl?.id || null;
        if (!enId && !nlId) return;
        try {
            setSavingFor(group.projectid);
            const selectedKeys = Array.from(selectedByProject[group.projectid] || []);

            // Build map from project_category_id -> language-specific category ids
            const keyToCatIds: Record<string, { en?: number; nl?: number }> = {};
            for (const lc of logicalCategories) {
                keyToCatIds[lc.project_category_id] = { en: lc.en?.id, nl: lc.nl?.id } as any;
            }

            // For each language-specific project row present, compute diff and apply
            const applyFor = async (projId: number, lang: 'en' | 'nl') => {
                // Fetch existing relations for this project
                const { data: existing, error } = await supabase
                    .from("project_categorie_relations")
                    .select("category_id")
                    .eq("project_id", projId);
                if (error) throw error;
                const existingSet = new Set(((existing as any[]) || []).map(r => r.category_id as number));
                // Desired numeric category ids for this lang
                const desiredIds = selectedKeys
                    .map(k => keyToCatIds[k]?.[lang])
                    .filter((v): v is number => typeof v === 'number');
                const desiredSet = new Set(desiredIds);
                const toAdd = desiredIds.filter(id => !existingSet.has(id));
                const toRemove = Array.from(existingSet).filter(id => !desiredSet.has(id));
                if (toAdd.length) {
                    const rows = toAdd.map(id => ({ project_id: projId, category_id: id }));
                    const { error: addErr } = await supabase.from("project_categorie_relations").insert(rows);
                    if (addErr) throw addErr;
                }
                if (toRemove.length) {
                    const { error: delErr } = await supabase
                        .from("project_categorie_relations")
                        .delete()
                        .eq("project_id", projId)
                        .in("category_id", toRemove);
                    if (delErr) throw delErr;
                }
            };

            if (enId) await applyFor(enId, 'en');
            if (nlId) await applyFor(nlId, 'nl');

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
                                <TableRow key={g.projectid}>
                                    <TableCell>{g.projectid}</TableCell>
                                    <TableCell>{g.displayTitle || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-3">
                                            {logicalCategories.map(c => {
                                                const checked = !!selectedByProject[g.projectid]?.has(c.project_category_id);
                                                return (
                                                    <label key={c.project_category_id} className="inline-flex items-center gap-2 border rounded px-2 py-1 text-sm cursor-pointer select-none">
                                                        <Checkbox checked={checked} onCheckedChange={() => toggle(g.projectid, c.project_category_id)} />
                                                        <span>{c.displayName}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right sticky right-0 bg-card z-10">
                                        <Button size="sm" onClick={() => saveProject(g)} disabled={savingFor === g.projectid}>
                                            {savingFor === g.projectid ? "Saving..." : "Save"}
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
