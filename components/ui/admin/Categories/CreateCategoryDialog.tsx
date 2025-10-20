"use client";

import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface Props { onCreated?: () => void }

export function CreateCategoryDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [enName, setEnName] = useState("");
  const [nlName, setNlName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("en");

  const reset = () => { setKey(""); setEnName(""); setNlName(""); setTab("en"); };

  const submit = async () => {
    if (!key.trim()) { toast.error("project_category_id is required"); return; }
    if (!enName.trim() && !nlName.trim()) { toast.error("Provide at least one language name"); return; }
    setSubmitting(true);
    try {
      type Row = { project_category_id: string; language: 'en' | 'nl'; name: string };
      const rows: Row[] = [];
      if (enName.trim()) rows.push({ project_category_id: key.trim(), language: 'en', name: enName.trim() });
      if (nlName.trim()) rows.push({ project_category_id: key.trim(), language: 'nl', name: nlName.trim() });
      const { error } = await supabase.from('project_categories').insert(rows);
      if (error) throw error;
      toast.success('Category created');
      if (onCreated) await onCreated();
      setOpen(false); reset();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Create failed';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">Add Category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">project_category_id *</label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. ai, 3d, webapp" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="nl">Dutch</TabsTrigger>
            </TabsList>
            <TabsContent value="en" className="mt-3">
              <label className="block text-sm font-medium mb-1">Name (EN)</label>
              <Input value={enName} onChange={(e) => setEnName(e.target.value)} placeholder="AI" />
            </TabsContent>
            <TabsContent value="nl" className="mt-3">
              <label className="block text-sm font-medium mb-1">Name (NL)</label>
              <Input value={nlName} onChange={(e) => setNlName(e.target.value)} placeholder="AI" />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
