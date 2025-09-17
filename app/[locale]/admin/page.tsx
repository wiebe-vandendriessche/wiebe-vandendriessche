"use client"

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AdminLoginForm } from '@/components/ui/admin/AdminLoginForm';
import { TimelineElementsTable } from '@/components/ui/admin/TimelineElements/TimelineElementsTable';
import { ProjectsTable } from '@/components/ui/admin/Projects/ProjectsTable';
import { ProjectCategoryRelations } from '@/components/ui/admin/ProjectCategoryRelations/ProjectCategoryRelations';
import { CategoriesTable } from '@/components/ui/admin/Categories/CategoriesTable';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      const adminUUID = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_UUID;
      const { data: { user } } = await supabase.auth.getUser();
      if (user && adminUUID && user.id === adminUUID) {
        setUser(user);
      } else if (user && adminUUID && user.id !== adminUUID) {
        // Auto sign out if a non-admin user somehow had a session
        await supabase.auth.signOut();
      }
      setLoading(false);
    })();
  }, []);

  // Keep page minimal during session check; AdminLoginForm handles its own skeleton
  if (loading) return null;

  if (!user) {
    return (
      <div className="flex justify-center items-center">
        <div className="max-w-lg w-full relative p-3">
          <div className="foggy-gradient-bg absolute inset-0 w-full h-full" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
            <AdminLoginForm onSuccess={async () => {
              const { data } = await supabase.auth.getUser();
              const adminUUID = process.env.NEXT_PUBLIC_SUPABASE_ADMIN_UUID;
              if (data.user && adminUUID && data.user.id === adminUUID) {
                setUser(data.user);
              }
            }} />
          </div>
        </div>
      </div>
    );
  }

  // Placeholder for timeline element form
  return (
    <div className="flex justify-center items-center">
      <div className="max-w-6xl w-full relative p-3">
        <div className="foggy-gradient-bg absolute inset-0 w-full h-full" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-6">Admin</h2>
          <div className="mb-4 flex items-center gap-4">
            <p>Logged in as {user?.email}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signOut();
                  if (error) throw error;
                  setUser(null);
                  toast.success('Logged out');
                } catch (e: any) {
                  toast.error(e.message || 'Logout failed');
                }
              }}
            >Logout</Button>
          </div>
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="timeline">Timeline Elements</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="relations">Project Relations</TabsTrigger>
              <TabsTrigger value="categories">Project Categories</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="space-y-4">
              <TimelineElementsTable />
            </TabsContent>
            <TabsContent value="projects" className="space-y-4">
              <ProjectsTable />
            </TabsContent>
            <TabsContent value="relations" className="space-y-4">
              <ProjectCategoryRelations />
            </TabsContent>
            <TabsContent value="categories" className="space-y-4">
              <CategoriesTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
