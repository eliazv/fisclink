/**
 * Dashboard principale del merchant
 * Mostra statistiche, fatture recenti, errori SDI e stato connessioni.
 * Tutti i dati provengono dal backend reale.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Activity,
  Plug,
  Gift,
  Plus,
} from "lucide-react";

interface Stats {
  totalInvoices: number;
  pendingData: number;
  sent: number;
  accepted: number;
  errors: number;
  totalRevenue: number;
}
// ... (manteniamo le altre interfacce)
interface ActivityData {
  id: string;
  action: string;
  details: string | null;
  level: string;
  createdAt: string;
}

interface ErrorInvoice {
  id: string;
  sourceId: string;
  status: string;
  lastError: string | null;
  errorCode: string | null;
  amount: number;
  customer: { name: string | null; email: string } | null;
}

interface IntegrationStatus {
  stripe: { connected: boolean; detail: string };
  fic: { connected: boolean; detail: string };
  shopify: { connected: boolean; detail: string };
  woocommerce: { connected: boolean; detail: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [errorInvoices, setErrorInvoices] = useState<ErrorInvoice[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, errorsRes, settingsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/invoices?status=ERROR&status=REJECTED&limit=5"),
          fetch("/api/settings"),
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
          setActivities(data.recentActivity || []);
        }

        if (errorsRes.ok) {
          const data = await errorsRes.json();
          setErrorInvoices(data.invoices ?? []);
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setIntegrations({
            stripe: {
              connected: data.hasStripeKey,
              detail: data.hasStripeKey
                ? "Chiavi configurate"
                : "Non configurato",
            },
            fic: {
              connected: data.hasFicToken && data.hasFicCompanyId,
              detail: data.hasFicToken ? "Token configurato" : "Token mancante",
            },
            shopify: {
              connected: false,
              detail: "Prossimamente",
            },
            woocommerce: {
              connected: false,
              detail: "Prossimamente",
            },
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#0f172a] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 font-medium animate-pulse text-sm uppercase tracking-widest">
          Caricamento
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">
            Panoramica
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Monitora lo stato delle tue fatture automatiche in tempo reale.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-2 px-5 py-3 bg-[#0f172a] text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nuova Fattura
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Fatture Totali"
          value={stats?.totalInvoices ?? 0}
          icon={FileText}
        />
        <StatCard
          label="Accettate SDI"
          value={stats?.accepted ?? 0}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          label="Dati in Sospeso"
          value={stats?.pendingData ?? 0}
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="Errori SDI"
          value={stats?.errors ?? 0}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-10">
          {/* Revenue Highlight Card */}
          <div className="relative overflow-hidden bg-[#0f172a] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-200 group">
            <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-white/10 transition-colors">
              <TrendingUp className="w-64 h-64 -mr-16 -mt-16 rotate-12" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                  Volume Fatturato Totale
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter">
                    €{" "}
                    {(stats?.totalRevenue ?? 0).toLocaleString("it-IT", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              <Link
                href="/dashboard/reports"
                className="flex items-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl font-bold transition-all border border-white/10 text-sm"
              >
                Analisi Dettagliata <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Critical Invoices Section */}
          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-rose-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0f172a]">
                    Errori SDI Critici
                  </h3>
                  <p className="text-xs text-rose-600/70 font-medium">
                    Richiedono la tua attenzione immediata
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/invoices?filter=ERROR"
                className="text-xs font-black text-rose-500 hover:text-rose-600 tracking-wider uppercase bg-rose-500/10 px-4 py-2 rounded-xl transition-colors"
              >
                Vedi Tutti
              </Link>
            </div>
            <div>
              {errorInvoices.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 font-medium italic">
                    ✓ Nessun errore SDI rilevato. Ottimo lavoro!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {errorInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="px-8 py-6 hover:bg-slate-50/80 group transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-white border border-transparent group-hover:border-slate-100 transition-colors">
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0f172a]">
                            {inv.customer?.name ||
                              inv.customer?.email ||
                              "Cliente Sconosciuto"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              #{inv.sourceId.slice(0, 10).toUpperCase()}
                            </span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <span className="text-xs font-bold text-rose-600 uppercase tracking-tighter">
                              {inv.errorCode ?? "Errore Invio"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-400 font-medium">
                            Motivazione
                          </p>
                          <p className="text-xs text-[#0f172a] font-bold max-w-[200px] truncate">
                            {inv.lastError || "Nessun dettaglio specificato"}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/invoices?search=${inv.sourceId}`}
                          className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all shadow-sm group-hover:shadow-md active:scale-95"
                        >
                          Risolvi
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-10">
          {/* Activity Timeline */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#0f172a] tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" /> Attività
              </h2>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px] p-2">
              {activities.length === 0 ? (
                <div className="p-10 text-center text-slate-300 text-sm font-medium italic">
                  Nessuna attività registrata.
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="px-6 py-4 rounded-[1.5rem] hover:bg-slate-50 transition-colors flex items-start gap-4"
                    >
                      <div
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          activity.level === "ERROR"
                            ? "bg-rose-500"
                            : activity.level === "WARN"
                              ? "bg-amber-500"
                              : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#0f172a] leading-relaxed">
                          {activity.details ?? activity.action}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                          {new Date(activity.createdAt).toLocaleTimeString(
                            "it-IT",
                            { hour: "2-digit", minute: "2-digit" },
                          )}{" "}
                          • Inviata
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Integrations Module */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-md">
            <h3 className="text-lg font-black text-[#0f172a] tracking-tight mb-6 flex items-center gap-3">
              <Plug className="w-5 h-5 text-slate-400" /> Integrazioni
            </h3>
            {integrations ? (
              <div className="space-y-4">
                <IntegrationRow
                  label="Stripe"
                  connected={integrations.stripe.connected}
                  detail={integrations.stripe.detail}
                />
                <IntegrationRow
                  label="Fatture in Cloud"
                  connected={integrations.fic.connected}
                  detail={integrations.fic.detail}
                />
                <IntegrationRow
                  label="Shopify"
                  connected={false}
                  detail="Prossimamente"
                  disabled
                />
                <IntegrationRow
                  label="WooCommerce"
                  connected={false}
                  detail="Prossimamente"
                  disabled
                />
              </div>
            ) : (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded-xl" />
                ))}
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-slate-50">
              <div className="bg-indigo-50/50 rounded-2xl p-4 flex items-start gap-4 group cursor-pointer hover:bg-indigo-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-indigo-900 font-black text-xs uppercase tracking-wider mb-1">
                    Promo Beta
                  </h4>
                  <p className="text-indigo-700/80 text-[11px] font-medium leading-[1.5]">
                    Primi 100 merchant: 3 mesi di piano Growth gratis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationRow({
  label,
  connected,
  detail,
  disabled,
}: {
  label: string;
  connected: boolean;
  detail: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-[1.25rem] border transition-all ${disabled ? "bg-slate-50/50 border-slate-100 border-dashed opacity-60" : connected ? "bg-white border-slate-100" : "bg-slate-50 border-slate-100 border-dashed"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-black text-[#0f172a]">{label}</p>
        {disabled ? (
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">
            Prossimamente
          </span>
        ) : connected ? (
          <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>{" "}
            Online
          </span>
        ) : (
          <Link
            href="/dashboard/settings"
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline px-2 py-0.5"
          >
            Configura
          </Link>
        )}
      </div>
      <p className="text-[11px] text-slate-400 font-medium truncate">
        {detail}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "slate",
  trend,
}: {
  label: string;
  value: number;
  icon: any;
  color?: "slate" | "amber" | "emerald" | "rose";
  trend?: string;
}) {
  const colors = {
    slate: "text-slate-900 bg-slate-50",
    amber: "text-amber-600 bg-amber-50",
    emerald: "text-emerald-600 bg-emerald-50",
    rose: "text-rose-600 bg-rose-50",
  };

  const ringColors = {
    slate: "ring-slate-100",
    amber: "ring-amber-100",
    emerald: "ring-emerald-100",
    rose: "ring-rose-100",
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className="relative z-10 flex items-center justify-between">
        <div
          className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center ring-[12px] ${ringColors[color]} transition-all group-hover:scale-110`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-[#0f172a] tracking-tighter">
            {value}
          </span>
          {trend && (
            <p
              className={`text-[10px] font-bold mt-1 ${trend.startsWith("+") ? "text-emerald-500" : trend === "0%" ? "text-slate-400" : "text-rose-500"}`}
            >
              {trend} vs ieri
            </p>
          )}
        </div>
      </div>
      <p className="text-xs font-bold text-slate-400 mt-6 tracking-wide uppercase">
        {label}
      </p>
    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
