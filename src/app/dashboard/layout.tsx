import type { Metadata } from "next";

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
          <span className="text-lg font-bold text-gray-900">
            ⚡ FiscLink
          </span>
        </div>
        <nav className="p-4 space-y-1">
          <NavItem href="/dashboard" icon="📊" label="Dashboard" />
          <NavItem href="/dashboard/invoices" icon="📄" label="Fatture" />
          <NavItem href="/dashboard/customers" icon="👥" label="Clienti" />
          <NavItem href="/dashboard/reports" icon="📈" label="Report" />
          <NavItem href="/dashboard/activity" icon="📋" label="Attività" />
          <div className="pt-4 mt-4 border-t border-gray-200">
            <NavItem
              href="/dashboard/settings"
              icon="⚙️"
              label="Impostazioni"
            />
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="md:ml-64">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="md:hidden">
            <span className="text-lg font-bold">⚡ CF</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Merchant Demo</span>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
              M
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}
