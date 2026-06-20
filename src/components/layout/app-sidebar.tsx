"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronsDown, LogOut, Moon, Settings, Sun, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { navGroups } from "@/config/nav-config";

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile, state } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const [merchantName, setMerchantName] = useState("Account");

  const closeMobile = () => setOpenMobile(false);

  useEffect(() => {
    async function fetchMerchant() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.name) setMerchantName(data.name);
        }
      } catch {
        // silenzioso: badge resta su "Account"
      }
    }
    fetchMerchant();
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:pt-4">
        <div className="py-1 group-data-[collapsible=icon]:py-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:hidden"
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-sidebar-accent p-1">
              <Image src="/fisclink.png" alt="FiscLink" fill className="object-contain" />
            </div>
            <span className="text-lg font-black tracking-tight">FiscLink</span>
          </Link>
          <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-sidebar-accent p-1">
              <Image src="/fisclink.png" alt="FiscLink" fill className="object-contain" />
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {navGroups.map((group) => (
          <SidebarGroup
            key={group.label ?? "ungrouped"}
            className={group.label === "Sistema" ? "mt-auto py-0" : "py-0"}
          >
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.url, item.exact)}
                  >
                    <Link href={item.url} onClick={closeMobile}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:p-2">
        <SidebarGroup className="py-0 group-data-[collapsible=icon]:p-0">
          <SidebarMenu>
            <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
              <SidebarMenuButton
                tooltip="Tema"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? <Moon /> : <Sun />}
                <span>Tema</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
                    <User className="size-4" />
                  </div>
                  {state === "expanded" && (
                    <span className="truncate text-sm font-semibold">{merchantName}</span>
                  )}
                  <ChevronsDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="font-normal">{merchantName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <Settings className="mr-2 size-4" />
                    Impostazioni
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
