"use client"

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AdminLoginForm } from '@/components/ui/admin/AdminLoginForm';
import { supabase } from '@/lib/supabaseClient';
import { TimelineElementsTable } from '@/components/ui/admin/TimelineElementsTable';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return (
      <div className="flex justify-center items-center">
        <div className="max-w-lg w-full relative p-3">
          <div className="foggy-gradient-bg absolute inset-0 w-full h-full" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-6">Admin Login</h2>
            <AdminLoginForm onSuccess={async () => {
              const { data } = await supabase.auth.getUser();
              setUser(data.user ?? null);
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
          <h2 className="text-2xl font-bold mb-6">Timeline Elements Admin</h2>
          <p className="mb-4">Logged in as {user?.email}</p>
          <TimelineElementsTable />
        </div>
      </div>
    </div>
  );
}
