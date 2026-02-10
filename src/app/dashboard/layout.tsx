import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ActiveNav } from "./nav-client";
import { Bell, Search } from "lucide-react";
import { MerchantBadgeClient } from "./merchant-badge-client";

export const metadata: Metadata = {
  title: "Dashboard | FiscLink",
  description: "Gestisci le tue fatture elettroniche automatiche",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-30 hidden lg:block shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div className="h-20 flex items-center px-8 border-b border-slate-50">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-shadow bg-slate-50 p-1">
              <Image
                src="/fisclink.png"
                alt="FiscLink Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-black tracking-tight text-[#0f172a]">
              FiscLink
            </span>
          </Link>
        </div>
        <ActiveNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/fisclink.png" alt="Logo" width={28} height={28} />
              <span className="text-xl font-black text-[#0f172a] tracking-tight">
                FiscLink
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center bg-slate-100/50 px-4 py-2 rounded-2xl w-96 border border-slate-100 focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca fatture, clienti..."
              className="bg-transparent border-none outline-none text-sm ml-3 w-full placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="relative p-2 text-slate-400 hover:text-[#0f172a] hover:bg-slate-50 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-100 mx-1"></div>
            <MerchantBadgeClient />
          </div>
        </header>

        {/* Page content */}
        <div className="p-8 max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}

// MerchantBadge rimosso in favore di MerchantBadgeClient
