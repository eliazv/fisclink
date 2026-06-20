"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function Header({ title }: { title?: string }) {
  return (
    <header className="bg-background/60 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-md">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {title && <span className="text-sm font-semibold">{title}</span>}
      </div>
    </header>
  );
}
