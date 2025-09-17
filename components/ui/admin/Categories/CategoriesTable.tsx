"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { EditCategoryDialog } from "./EditCategoryDialog";

type CategoryRow = { id: number; name: string; language: string; project_category_id: string };

export function CategoriesTable() {
    const [rows, setRows] = useState<CategoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("project_categories")
            .select("id,name,language,project_category_id")
            .order('project_category_id', { ascending: true })
            .order('language', { ascending: true });
        if (error) {
            toast.error("Failed to load categories");
            setLoading(false); return;
        }
        setRows(((data as any) || []) as CategoryRow[]);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const f = filter.trim().toLowerCase();
        if (!f) return rows;
        return rows.filter(r =>
            String(r.id).includes(f) ||
            (r.name || '').toLowerCase().includes(f) ||
            (r.language || '').toLowerCase().includes(f) ||
            (r.project_category_id || '').toLowerCase().includes(f)
        );
    }, [filter, rows]);

    const deleteRow = async (id: number) => {
        try {
            setDeletingId(id);
            const { error: delErr } = await supabase
                .from("project_categories")
                .delete()
                .eq("id", id);
            if (delErr) throw delErr;
            toast.success("Category row deleted");
            await load();
        } catch (e: any) {
            toast.error(e.message || "Delete failed");
        } finally { setDeletingId(null); }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
                <Input placeholder="Filter by key or name..." value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
                <div className="ml-auto">
                    <CreateCategoryDialog onCreated={load} />
                </div>
            </div>

            <div className="overflow-hidden rounded-sm border bg-card/20">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">ID</TableHead>
                            <TableHead className="w-56">project_category_id</TableHead>
                            <TableHead className="w-24">language</TableHead>
                            <TableHead>name</TableHead>
                            <TableHead className="text-right w-30 sticky right-0 bg-card z-10">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                    <TableCell className="text-right w-30 sticky right-0 bg-card z-10"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filtered.length ? (
                            filtered.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{r.id}</TableCell>
                                    <TableCell>{r.project_category_id}</TableCell>
                                    <TableCell>{r.language}</TableCell>
                                    <TableCell>{r.name}</TableCell>
                                    <TableCell className="text-right sticky right-0 bg-card z-10">
                                        <div className="flex justify-end gap-2">
                                            <EditCategoryDialog categorieId={r.project_category_id} initialTab={r.language as 'en' | 'nl'} onUpdated={load} />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={deletingId === r.id}>
                                                        {deletingId === r.id ? "Deleting..." : "Delete"}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete category row</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This deletes only this language row. Relations to this row may be removed if enforced by FK.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteRow(r.id)} disabled={deletingId === r.id}>
                                                            {deletingId === r.id ? "Deleting..." : "Delete"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-16">No categories</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
