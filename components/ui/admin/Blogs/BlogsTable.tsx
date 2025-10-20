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
import { CreateBlogDialog } from "./CreateBlogDialog";
import { EditBlogDialog } from "./EditBlogDialog";

export type BlogRow = {
  post_id: string;
  language: string; // en|nl
  title: string;
  content: string;
  summary: string;
  status: string; // draft|published
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author: string;
  images: string[] | null;
  tags: string[] | null;
};

export function BlogsTable() {
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: "post_id", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
  const { data } = await supabase.from("blog_posts").select("*");
  if (data) setRows(data as BlogRow[]);
      setLoading(false);
    })();
  }, []);

  const refresh = async () => {
    const { data } = await supabase.from("blog_posts").select("*");
    if (data) setRows(data as BlogRow[]);
  };

  const handleDelete = async (post_id: string, language: string) => {
    const key = `${post_id}:${language}`;
    setDeletingKey(key);
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("post_id", post_id)
      .eq("language", language);
    if (error) toast.error("Failed to delete post");
    else {
      setRows(prev => prev.filter(p => !(p.post_id === post_id && p.language === language)));
      toast.success("Deleted");
    }
    setDeletingKey(null);
  };

  const columns: ColumnDef<BlogRow>[] = [
    { accessorKey: "post_id", header: "Post ID" },
    { accessorKey: "language", header: "Language" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "summary", header: "Summary" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "published_at", header: "Published", cell: ({ row }) => row.original.published_at ? new Date(row.original.published_at).toLocaleDateString() : "" },
    { accessorKey: "author", header: "Author" },
    { accessorKey: "tags", header: "Tags", cell: ({ row }) => row.original.tags?.join(", ") ?? "" },
    { accessorKey: "images", header: "Images", cell: ({ row }) => row.original.images?.length ?? 0 },
    { id: "actions", enableHiding: false, header: () => <div className="text-right">Actions</div>, cell: ({ row }) => {
      const { post_id, language } = row.original;
      const key = `${post_id}:${language}`;
      const isDeleting = deletingKey === key;
      return (
        <div className="flex gap-2 justify-end">
          <EditBlogDialog post={row.original} onUpdated={refresh} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                <AlertDialogDescription>Delete this single-language entry? This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={isDeleting} onClick={() => handleDelete(post_id, language)}>{isDeleting ? "Deleting..." : "Delete"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }, meta: { sticky: true } },
  ];

  const table = useReactTable({
    data: rows,
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

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-10 py-2">
        <Input placeholder="Filter title..." value={(table.getColumn("title")?.getFilterValue() as string) ?? ""} onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)} className="max-w-sm" />
        <CreateBlogDialog onCreated={refresh} />
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
                const skeletonWidths: Record<string,string> = { post_id: 'w-32', language: 'w-16', title: 'w-64', summary: 'w-64', status: 'w-24', published_at: 'w-24', author: 'w-40', tags: 'w-40', images: 'w-12', actions: 'w-24' };
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
