"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  TrendingUp,
  Rocket,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: BarChart3, label: "Dashboard", exact: true },
  { href: "/dashboard/invoices", icon: FileText, label: "Fatture" },
  { href: "/dashboard/reports", icon: TrendingUp, label: "Report" },
  { href: "/dashboard/onboarding", icon: Rocket, label: "Onboarding" },
];

const BOTTOM_ITEMS = [
  { href: "/dashboard/settings", icon: Settings, label: "Impostazioni" },
];

export function ActiveNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="p-4 space-y-2 flex flex-col h-[calc(100%-4rem)]">
      <div className="space-y-1 flex-1 text-slate-600">
        {NAV_ITEMS.map((item) => {
          const Active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                Active
                  ? "bg-[#0f172a] text-white shadow-lg shadow-slate-200"
                  : "hover:bg-slate-50 hover:text-[#0f172a]"
              }`}
            >
              <item.icon
                className={`w-4 h-4 ${Active ? "text-white" : "text-slate-400 group-hover:text-[#0f172a]"}`}
              />
              <span className="flex-1">{item.label}</span>
              {Active && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          );
        })}
      </div>
      <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
        {BOTTOM_ITEMS.map((item) => {
          const Active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                Active
                  ? "bg-[#0f172a] text-white shadow-lg shadow-slate-200"
                  : "hover:bg-slate-50 hover:text-[#0f172a]"
              }`}
            >
              <item.icon
                className={`w-4 h-4 ${Active ? "text-white" : "text-slate-400 group-hover:text-[#0f172a]"}`}
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
        <LogoutButton />
      </div>
    </nav>
  );
}

function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full group mt-1"
    >
      <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
      <span>Esci</span>
    </button>
  );
}
