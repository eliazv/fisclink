import type { LucideIcon } from "lucide-react";
import { BarChart3, FileText, TrendingUp, Rocket, Settings } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Principale",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: BarChart3, exact: true },
      { title: "Fatture", url: "/dashboard/invoices", icon: FileText },
      { title: "Report", url: "/dashboard/reports", icon: TrendingUp },
      { title: "Onboarding", url: "/dashboard/onboarding", icon: Rocket },
    ],
  },
  {
    label: "Sistema",
    items: [{ title: "Impostazioni", url: "/dashboard/settings", icon: Settings }],
  },
];
