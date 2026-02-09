import type { Metadata } from "next";
import Link from "next/link";
import { ActiveNav } from "./nav-client";

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30 hidden md:block">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ⚡ FiscLink
          </Link>
        </div>
        <ActiveNav />
      </aside>

      {/* Main content */}
      <main className="md:ml-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="md:hidden">
            <Link href="/" className="text-lg font-bold">
              ⚡ CF
            </Link>
          </div>
          <div className="flex-1" />
          <MerchantBadge />
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function MerchantBadge() {
  // Server component: il nome viene inserito lato client
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500" id="merchant-name">
        Account
      </span>
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
        <span>M</span>
      </div>
    </div>
  );
}
