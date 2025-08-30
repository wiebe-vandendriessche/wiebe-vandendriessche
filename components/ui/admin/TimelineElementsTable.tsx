"use client"

import * as React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell,
    TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    VisibilityState,
    SortingState,
    ColumnFiltersState,
} from "@tanstack/react-table";
import { CreateTimelineElementDialog } from "@/components/ui/admin/CreateTimelineElementDialog";
import { EditTimelineElementDialog } from "@/components/ui/admin/EditTimelineElementDialog";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type TimelineElementTableRow = {
    id: number;
    projectid: string;
    language: string;
    categorie: string;
    title: string;
    location: string;
    started: string;
    finished: string;
    description: string;
    description_ext?: string;
    tags?: string[];
    logos?: string[];
    image_ext?: string;
};

export function TimelineElementsTable() {
    const [elements, setElements] = React.useState<TimelineElementTableRow[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "id", desc: false }
    ]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [deletingIds, setDeletingIds] = useState<number[]>([]);
    const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchElements() {
            setLoading(true);
            const { data, error } = await supabase.from("timeline_elements").select("*");
            if (!error && data) setElements(data);
            setLoading(false);
        }
        fetchElements();
    }, []);

    const refresh = async () => {
        const { data, error } = await supabase.from("timeline_elements").select("*");
        if (!error && data) setElements(data as any);
    };

    const handleDelete = async (id: number) => {
        if (deletingIds.includes(id)) return;
        setDeletingIds(prev => [...prev, id]);
        const { error } = await supabase.from("timeline_elements").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete timeline element");
        } else {
            setElements(prev => prev.filter(e => e.id !== id));
            toast.success("Timeline element deleted");
        }
        setDeletingIds(prev => prev.filter(x => x !== id));
        setDeleteDialogId(null);
    };

    const columns: ColumnDef<TimelineElementTableRow>[] = [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "projectid", header: "Project ID" },
        { accessorKey: "language", header: "Language" },
        { accessorKey: "categorie", header: "Categorie" },
        { accessorKey: "title", header: "Title" },
        { accessorKey: "location", header: "Location" },
        { accessorKey: "started", header: "Started" },
        { accessorKey: "finished", header: "Finished" },
        { accessorKey: "description", header: "Description" },
        { accessorKey: "description_ext", header: "Description Ext" },
        { accessorKey: "tags", header: "Tags", cell: ({ row }) => row.original.tags?.join(", ") ?? "" },
        { accessorKey: "logos", header: "Logos", cell: ({ row }) => row.original.logos ? row.original.logos.join(", ") : "" },
        { accessorKey: "image_ext", header: "Image Ext" },
        {
            id: "actions",
            enableHiding: false,
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const id = row.original.id;
                const isDeleting = deletingIds.includes(id);
                return (
                    <div className="flex gap-2 justify-end">
                        <EditTimelineElementDialog element={row.original as any} onUpdated={refresh} />
                        <AlertDialog open={deleteDialogId === id} onOpenChange={(open) => setDeleteDialogId(open ? id : null)}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Timeline Element</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this timeline element? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction disabled={isDeleting} onClick={() => handleDelete(id)}>
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                );
            },
            meta: { sticky: true }
        },
    ];

    const table = useReactTable({
        data: elements,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <div className="w-full">
                    <div className="flex items-center gap-2 py-2">
                <Input
                    placeholder="Filter title..."
                    value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("title")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                        <CreateTimelineElementDialog onCreated={refresh} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div
                className="overflow-hidden rounded-sm border bg-card/20"
            >
                <Table className="min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={header.id === "actions" ? "sticky right-0 bg-card z-10" : ""}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={cell.column.id === "actions" ? "sticky right-0 bg-card z-10" : ""}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

