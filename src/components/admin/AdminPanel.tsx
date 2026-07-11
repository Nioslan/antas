"use client";

import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import type { InventoryData } from "@/types/inventory";

type AdminPanelProps = {
  initialData: InventoryData;
};

export function AdminPanel({ initialData }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-sm text-muted">Cargando...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard initialData={initialData} />;
}
