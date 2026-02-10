"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

export function MerchantBadgeClient() {
  const [name, setName] = useState("Account");

  useEffect(() => {
    async function fetchName() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.name) setName(data.name);
        }
      } catch (err) {
        console.error("Failed to fetch merchant name", err);
      }
    }
    fetchName();
  }, []);

  return (
    <div className="flex items-center gap-3 px-1 py-1 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
      <div className="flex flex-col items-end hidden sm:flex">
        <span className="text-sm font-bold text-[#0f172a]">{name}</span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
          Merchant
        </span>
      </div>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
        <User className="w-5 h-5" />
      </div>
    </div>
  );
}
