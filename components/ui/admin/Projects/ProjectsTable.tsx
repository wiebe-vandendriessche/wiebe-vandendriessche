"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table, TableHeader, TableBody, TableRow, TableCell, TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
  ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable, VisibilityState, SortingState, ColumnFiltersState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CreateProjectDialog } from "@/components/ui/admin/Projects/CreateProjectDialog";
import { EditProjectDialog } from "@/components/ui/admin/Projects/EditProjectDialog";

export type ProjectTableRow = {
  project_id: string;
  language: string;
  // categorie removed; categories managed via relations table
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
};

export function ProjectsTable() {
  const [projects, setProjects] = useState<ProjectTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: "project_id", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [deletingKeys, setDeletingKeys] = useState<string[]>([]); // key = `${project_id}:${language}`
  const [deleteDialogKey, setDeleteDialogKey] = useState<string | null>(null);
  // Category filtering moved out; relations-based filtering can be added later

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("projects").select("*");
      if (!error && data) setProjects(data as any);
      setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    const { data, error } = await supabase.from("projects").select("*");
    if (!error && data) setProjects(data as any);
  };

  const handleDelete = async (project_id: string, language: string) => {
    const key = `${project_id}:${language}`;
    if (deletingKeys.includes(key)) return;
    setDeletingKeys(prev => [...prev, key]);
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("project_id", project_id)
      .eq("language", language);
    if (error) toast.error("Failed to delete project entry");
    else {
      setProjects(prev => prev.filter(p => !(p.project_id === project_id && p.language === language)));
      toast.success("Project entry deleted");
    }
    setDeletingKeys(prev => prev.filter(x => x !== key));
    setDeleteDialogKey(null);
  };

  const columns: ColumnDef<ProjectTableRow>[] = [
    { accessorKey: "project_id", header: "Project ID" },
    { accessorKey: "language", header: "Language" },
    { accessorKey: "started", header: "Started" },
    { accessorKey: "finished", header: "Finished" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "title_ext", header: "Title Ext" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "tags", header: "Tags", cell: ({ row }) => row.original.tags?.join(", ") ?? "" },
    { accessorKey: "technologies", header: "Tech", cell: ({ row }) => row.original.technologies?.join(", ") ?? "" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "image", header: "Image" },
    { accessorKey: "url", header: "URL" },
    { accessorKey: "height", header: "Height" },
    { id: "actions", enableHiding: false, header: () => <div className="text-right">Actions</div>, cell: ({ row }) => {
      const { project_id, language } = row.original;
      const key = `${project_id}:${language}`;
      const isDeleting = deletingKeys.includes(key);
      return (
        <div className="flex gap-2 justify-end">
          <EditProjectDialog project={row.original as any} onUpdated={refresh} />
          <AlertDialog open={deleteDialogKey === key} onOpenChange={(open) => setDeleteDialogKey(open ? key : null)}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to delete this project entry (single language)? This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={isDeleting} onClick={() => handleDelete(project_id, language)}>{isDeleting ? "Deleting..." : "Delete"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }, meta: { sticky: true } },
  ];

  const table = useReactTable({
    data: projects,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  // Category chips disabled for now (relations needed). To be implemented with join if desired.

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-10 py-2">
        <Input placeholder="Filter title..." value={(table.getColumn("title")?.getFilterValue() as string) ?? ""} onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)} className="max-w-sm" />
        <CreateProjectDialog onCreated={refresh} />
  {/* Category filter UI removed; relations-based UI can be reintroduced */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">Columns <ChevronDown /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns().filter(c => c.getCanHide()).map(col => (
              <DropdownMenuCheckboxItem key={col.id} className="capitalize" checked={col.getIsVisible()} onCheckedChange={(v) => col.toggleVisibility(!!v)}>{col.id}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-hidden rounded-sm border bg-card/20">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id} className={header.id === 'actions' ? 'sticky right-0 bg-card z-10' : ''}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              (() => {
                const skeletonWidths: Record<string,string> = { project_id: 'w-32', language: 'w-16', categorie: 'w-20', started: 'w-16', finished: 'w-16', title: 'w-44', title_ext: 'w-48', location: 'w-40', tags: 'w-40', technologies: 'w-48', description: 'w-64', image: 'w-32', url: 'w-48', height: 'w-16', actions: 'w-24' };
                return Array.from({ length: 10 }).map((_, r) => (
                  <TableRow key={r} className="h-12">
                    {columns.map((col, cIdx) => (
                      <TableCell key={col.id || cIdx} className={col.id === 'actions' ? 'sticky right-0 bg-card z-10' : ''}>
                        {col.id === 'actions' ? (
                          <div className="flex justify-end gap-2"><Skeleton className="h-8 w-14" /><Skeleton className="h-8 w-16" /></div>
                        ) : <Skeleton className={`h-4 ${skeletonWidths[col.id as string] || 'w-24'}`} />}
                      </TableCell>
                    ))}
                  </TableRow>
                ));
              })()
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className={cell.column.id === 'actions' ? 'sticky right-0 bg-card z-10' : ''}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
        </div>
      </div>
    </div>
  );
}
