"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "@/lib/clsx";
import { useAuth } from "@/components/auth/AuthProvider";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "🏠" },
  { href: "/dashboard/jobs", label: "Job Orders", icon: "🧾" },
  { href: "/dashboard/jobs/new", label: "New Job Order", icon: "➕" },
  { href: "/dashboard/clients", label: "Clients", icon: "👥" },
  { href: "/dashboard/price-list", label: "Price List", icon: "💰" },
  { href: "/dashboard/inventory", label: "Inventory", icon: "📦" },
  { href: "/dashboard/finance", label: "Finance", icon: "📊" },
  { href: "/dashboard/staff", label: "Staff", icon: "🧑‍💼" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const visibleItems = user?.role === "OWNER" ? NAV_ITEMS : NAV_ITEMS.filter((item) => ["/dashboard/jobs", "/dashboard/jobs/new", "/dashboard/price-list", "/dashboard/inventory"].includes(item.href));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          <Image src="/favicon/apple-touch-icon.png" alt="POMS logo" width={44} height={44} className="rounded-xl" priority />
          <div>
            <p className="text-lg font-bold text-slate-900">POMS</p>
            <p className="text-xs text-slate-500">Aluwood Enterprises</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="dashboard-navigation"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
        >
          <span className={clsx("h-0.5 w-5 bg-current transition", isOpen && "translate-y-2 rotate-45")} />
          <span className={clsx("h-0.5 w-5 bg-current transition", isOpen && "opacity-0")} />
          <span className={clsx("h-0.5 w-5 bg-current transition", isOpen && "-translate-y-2 -rotate-45")} />
        </button>
      </div>
      <nav id="dashboard-navigation" className={clsx("gap-1 overflow-x-auto p-2 sm:p-3 lg:block lg:space-y-1", isOpen ? "flex flex-col" : "hidden lg:block")}>
        {visibleItems.map((item) => {
          const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition lg:w-full",
                isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-slate-200 p-4 text-xs text-slate-500 lg:block">
        Ndaragwa House, Mezzanine MF24
        <br />
        0720115999
      </div>
    </aside>
  );
}
