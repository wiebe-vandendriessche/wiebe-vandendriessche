"use client"

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
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
import { CreateTimelineElementDialog } from "@/components/ui/admin/TimelineElements/CreateTimelineElementDialog";
import { EditTimelineElementDialog } from "@/components/ui/admin/TimelineElements/EditTimelineElementDialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLocale } from "next-intl";

type RawRow = {
    timelineid: string;
    language: string;
    categorie: string;
    order?: number | null;
    title: string;
    location: string;
    started: string | null;
    finished: string | null;
    description: string | null;
    description_ext?: string | null;
    tags?: string[] | null;
    logos?: string[] | null;
    image_ext?: string[] | null;
};

type GroupedRow = {
    timelineid: string;
    categorie: string;
    order?: number | null;
    shared: {
        started: string | null;
        finished: string | null;
        logos?: string[] | null;
        image_ext?: string[] | null;
    };
    en?: {
        title: string;
        location: string;
        description: string | null;
        description_ext?: string | null;
        tags?: string[] | null;
    };
    nl?: {
        title: string;
        location: string;
        description: string | null;
        description_ext?: string | null;
        tags?: string[] | null;
    };
};

export function TimelineElementsTable() {
    const locale = useLocale();
    const [rowsRaw, setRowsRaw] = React.useState<RawRow[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: "categorie", desc: false },
        { id: "order", desc: false },
    ]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    useEffect(() => {
        const fetchElements = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("timeline_elements")
                .select("*")
                .order("categorie", { ascending: true })
                .order("order", { ascending: true, nullsFirst: false })
                .order("timelineid", { ascending: true });
            if (!error && data) setRowsRaw((data as RawRow[]) ?? []);
            setLoading(false);
        };
        fetchElements();
    }, []);

    const refresh = async () => {
        const { data, error } = await supabase
            .from("timeline_elements")
            .select("*")
            .order("categorie", { ascending: true })
            .order("order", { ascending: true, nullsFirst: false })
            .order("timelineid", { ascending: true });
    if (!error && data) setRowsRaw((data as RawRow[]) ?? []);
    };

    const handleDelete = async (timelineid: string) => {
        if (deletingIds.includes(timelineid)) return;
        setDeletingIds(prev => [...prev, timelineid]);
        const { error } = await supabase
            .from("timeline_elements")
            .delete()
            .eq("timelineid", timelineid);
        if (error) {
            toast.error("Failed to delete timeline element");
        } else {
            setRowsRaw(prev => prev.filter(r => r.timelineid !== timelineid));
            toast.success("Timeline element deleted");
        }
        setDeletingIds(prev => prev.filter(x => x !== timelineid));
        setDeleteDialogId(null);
    };

    const elements: GroupedRow[] = useMemo(() => {
        const map = new Map<string, GroupedRow>();
        for (const r of rowsRaw) {
            const lang = (r.language === "nl" ? "nl" : "en") as "en" | "nl";
            const g = map.get(r.timelineid);
            const langBlock = {
                title: r.title,
                location: r.location,
                description: r.description,
                description_ext: r.description_ext,
                tags: r.tags,
            };
            if (!g) {
                map.set(r.timelineid, {
                    timelineid: r.timelineid,
                    categorie: r.categorie,
                    order: r.order ?? null,
                    shared: {
                        started: r.started,
                        finished: r.finished,
                        logos: r.logos ?? null,
                        image_ext: r.image_ext ?? null,
                    },
                    [lang]: langBlock,
                } as GroupedRow);
            } else {
                if (lang === 'en') g.en = langBlock; else g.nl = langBlock;
                g.shared = {
                    started: g.shared.started ?? r.started,
                    finished: g.shared.finished ?? r.finished,
                    logos: g.shared.logos ?? r.logos ?? null,
                    image_ext: g.shared.image_ext ?? r.image_ext ?? null,
                };
                map.set(r.timelineid, g);
            }
        }
        return Array.from(map.values());
    }, [rowsRaw]);

    const columns: ColumnDef<GroupedRow>[] = [
        {
            accessorKey: "categorie",
            header: "Categorie",
            filterFn: (row, columnId, filterValue: string[]) => {
                if (!filterValue) return true;
                if (filterValue.length === 0) return false;
                const value = row.getValue<string>(columnId);
                return filterValue.includes(value);
            },
        },
        { accessorKey: "order", header: "Order" },
        { accessorKey: "timelineid", header: "Timeline ID" },
        {
            id: "title",
            header: "Title",
            accessorFn: (r) => (locale === "nl" ? r.nl?.title : r.en?.title) || "",
        },
        {
            id: "location",
            header: "Location",
            accessorFn: (r) => (locale === "nl" ? r.nl?.location : r.en?.location) || "",
        },
        { id: "started", header: "Started", accessorFn: (r) => r.shared.started || "" },
        { id: "finished", header: "Finished", accessorFn: (r) => r.shared.finished || "" },
        {
            id: "description",
            header: "Description",
            accessorFn: (r) => (locale === "nl" ? r.nl?.description : r.en?.description) || "",
        },
        {
            id: "tags",
            header: "Tags",
            cell: ({ row }) => {
                const r = row.original;
                const list = locale === "nl" ? r.nl?.tags : r.en?.tags;
                return list?.join(", ") || "";
            },
        },
        { id: "logos", header: "Logos", cell: ({ row }) => row.original.shared.logos?.join(", ") || "" },
        { id: "image_ext", header: "Image Ext", cell: ({ row }) => row.original.shared.image_ext?.join(", ") || "" },
        {
            id: "actions",
            enableHiding: false,
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const r = row.original;
                const timelineid = r.timelineid;
                const isDeleting = deletingIds.includes(timelineid);
                const currentLang = (locale === "nl" ? "nl" : "en") as "en" | "nl";
                return (
                    <div className="flex gap-2 justify-end">
                        <EditTimelineElementDialog
                            element={{
                                timelineid,
                                language: currentLang,
                                categorie: r.categorie,
                                title: (currentLang === 'nl' ? r.nl?.title : r.en?.title) || "",
                                location: (currentLang === 'nl' ? r.nl?.location : r.en?.location) || "",
                                started: r.shared.started,
                                finished: r.shared.finished,
                                description: (currentLang === 'nl' ? r.nl?.description : r.en?.description) || "",
                                description_ext: (currentLang === 'nl' ? r.nl?.description_ext : r.en?.description_ext) || "",
                                tags: (currentLang === 'nl' ? r.nl?.tags : r.en?.tags) || [],
                                logos: r.shared.logos || [],
                                image_ext: null,
                                order: r.order ?? null,
                            }}
                            onUpdated={refresh}
                        />
                        <AlertDialog open={deleteDialogId === timelineid} onOpenChange={(open) => setDeleteDialogId(open ? timelineid : null)}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isDeleting}>
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Timeline Element</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete both EN and NL entries for this timeline ID? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction disabled={isDeleting} onClick={() => handleDelete(timelineid)}>
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                );
            },
            meta: { sticky: true },
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

    const categories = React.useMemo(
        () => Array.from(new Set(elements.map(e => e.categorie).filter(Boolean))).sort(),
        [elements]
    );

    const [categoriesInitialized, setCategoriesInitialized] = useState(false);
    useEffect(() => {
        if (!categoriesInitialized && categories.length > 0) {
            setSelectedCategories(categories);
            setCategoriesInitialized(true);
        }
    }, [categories, categoriesInitialized]);

    useEffect(() => {
        table.getColumn("categorie")?.setFilterValue(selectedCategories);
    }, [selectedCategories, table]);

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap items-center gap-10 py-2">
                <Input
                    placeholder="Filter title..."
                    value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                    onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
                    className="max-w-sm"
                />
                <CreateTimelineElementDialog onCreated={refresh} />
                {categories.length > 0 && categories.map(cat => {
                    const checked = selectedCategories.includes(cat);
                    const id = `cat-${cat}`;
                    return (
                        <div key={cat} className="flex items-center gap-1 text-xs">
                            <Checkbox id={id} checked={checked} onCheckedChange={() => toggleCategory(cat)} className="size-4" />
                            <Label htmlFor={id} className="cursor-pointer leading-none">{cat}</Label>
                        </div>
                    );
                })}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            >
                                {column.id}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="overflow-hidden rounded-sm border bg-card/20">
                <Table className="min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className={header.id === "actions" ? "sticky right-0 bg-card z-10" : ""}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            (() => {
                                const skeletonWidths: Record<string, string> = {
                                    timelineid: 'w-28',
                                    categorie: 'w-24',
                                    order: 'w-16',
                                    title: 'w-44',
                                    location: 'w-40',
                                    started: 'w-20',
                                    finished: 'w-20',
                                    description: 'w-64',
                                    tags: 'w-40',
                                    logos: 'w-48',
                                    image_ext: 'w-28',
                                    actions: 'w-24',
                                };
                                const rows = 10;
                                return Array.from({ length: rows }).map((_, r) => (
                                    <TableRow key={r} className="h-12">
                                        {columns.map((col, cIdx) => (
                                            <TableCell key={col.id || cIdx} className={col.id === 'actions' ? 'sticky right-0 bg-card z-10' : ''}>
                                                {col.id === 'actions' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Skeleton className="h-8 w-14" />
                                                        <Skeleton className="h-8 w-16" />
                                                    </div>
                                                ) : (
                                                    <Skeleton className={`h-4 ${skeletonWidths[col.id as string] || 'w-24'}`} />
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ));
                            })()
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={cell.column.id === "actions" ? "sticky right-0 bg-card z-10" : ""}>
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
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

