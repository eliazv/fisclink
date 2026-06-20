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
  Plus,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  totalInvoices: number;
  pendingData: number;
  sent: number;
  accepted: number;
  errors: number;
  totalRevenue: number;
}

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
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
        </div>
        <p className="animate-pulse text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Caricamento
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Panoramica</h1>
          <p className="mt-1 text-muted-foreground">
            Monitora lo stato delle tue fatture automatiche in tempo reale.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/invoices">
            <Plus className="h-4 w-4" />
            Nuova Fattura
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fatture Totali" value={stats?.totalInvoices ?? 0} icon={FileText} />
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
        <StatCard label="Errori SDI" value={stats?.errors ?? 0} icon={AlertTriangle} color="rose" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Card className="overflow-hidden bg-foreground text-background">
            <CardContent className="relative">
              <TrendingUp className="absolute -top-10 right-0 h-48 w-48 -rotate-12 text-background/5" />
              <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-background/60">
                    Volume Fatturato Totale
                  </p>
                  <span className="text-4xl font-black tracking-tighter">
                    €{" "}
                    {(stats?.totalRevenue ?? 0).toLocaleString("it-IT", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <Button asChild variant="secondary">
                  <Link href="/dashboard/reports">
                    Analisi Dettagliata <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>Errori SDI Critici</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Richiedono la tua attenzione immediata
                  </p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/invoices?filter=ERROR">Vedi Tutti</Link>
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              {errorInvoices.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nessun errore SDI rilevato. Ottimo lavoro!
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {errorInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-col justify-between gap-4 px-6 py-4 hover:bg-muted/50 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">
                            {inv.customer?.name || inv.customer?.email || "Cliente Sconosciuto"}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">
                              #{inv.sourceId.slice(0, 10).toUpperCase()}
                            </span>
                            <span>•</span>
                            <span className="font-bold uppercase text-destructive">
                              {inv.errorCode ?? "Errore Invio"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/invoices?search=${inv.sourceId}`}>Risolvi</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" /> Attività
              </CardTitle>
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto px-2">
              {activities.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nessuna attività registrata.
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-xl px-4 py-3 hover:bg-muted/50"
                    >
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          activity.level === "ERROR"
                            ? "bg-destructive"
                            : activity.level === "WARN"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-relaxed">
                          {activity.details ?? activity.action}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleTimeString("it-IT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-muted-foreground" /> Integrazioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integrations ? (
                <div className="space-y-3">
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
                  <IntegrationRow label="Shopify" connected={false} detail="Prossimamente" disabled />
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
                    <div key={i} className="h-10 rounded-xl bg-muted" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
      className={`rounded-xl border p-3 ${disabled ? "border-dashed opacity-60" : connected ? "" : "border-dashed"}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-bold">{label}</p>
        {disabled ? (
          <Badge variant="secondary">Prossimamente</Badge>
        ) : connected ? (
          <Badge className="bg-emerald-500 text-white">Online</Badge>
        ) : (
          <Link
            href="/dashboard/settings"
            className="text-xs font-bold text-primary hover:underline"
          >
            Configura
          </Link>
        )}
      </div>
      <p className="truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "slate",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: "slate" | "amber" | "emerald" | "rose";
}) {
  const colors = {
    slate: "text-foreground bg-muted",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-right">
          <span className="text-3xl font-black tracking-tighter">{value}</span>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
