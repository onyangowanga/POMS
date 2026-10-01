"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useAuth } from "@/components/auth/AuthProvider";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const isOwner = user?.role === "OWNER";
  const isJobRoute = pathname.startsWith("/dashboard/jobs");
  const isStaffReadOnlyRoute = pathname === "/dashboard/price-list" || pathname === "/dashboard/inventory";

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!isOwner && !isJobRoute && !isStaffReadOnlyRoute) router.replace("/dashboard/jobs");
  }, [isJobRoute, isLoading, isOwner, isStaffReadOnlyRoute, router, user]);

  if (isLoading || !user || (!isOwner && !isJobRoute && !isStaffReadOnlyRoute)) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading POMS...</div>;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-4 text-slate-100 sm:items-center sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-white">Aluwood Enterprises</h1>
            <p className="text-xs text-slate-400">Digital Printing · Ndaragwa House, MF24</p>
          </div>
          <div className="flex items-center gap-2 text-right sm:gap-3">
            <div className="hidden text-sm sm:block">
              <p className="font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-500">{isOwner ? "Owner / Super Admin" : "Production Staff"}</p>
            </div>
            <span className="whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              {isOwner ? "Owner View" : "Staff View"}
            </span>
            <button type="button" onClick={logout} className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800">
              Sign out
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
