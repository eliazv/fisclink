/**
 * Dashboard principale del merchant
 * Mostra statistiche, fatture recenti, errori SDI e stato connessioni.
 * Tutti i dati provengono dal backend reale.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalInvoices: number;
  pendingData: number;
  sent: number;
  accepted: number;
  errors: number;
  totalRevenue: number;
}

interface Activity {
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
  const [activities, setActivities] = useState<Activity[]>([]);
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
              connected: data.hasShopifyKey,
              detail: data.hasShopifyKey
                ? `Shop: ${data.shopifyShopDomain ?? "configurato"}`
                : "Non configurato",
            },
            woocommerce: {
              connected: data.hasWooCommerceKey,
              detail: data.hasWooCommerceKey
                ? `Store: ${data.wooCommerceStoreUrl ?? "configurato"}`
                : "Non configurato",
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Panoramica della tua fatturazione automatica
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Fatture totali"
          value={stats?.totalInvoices ?? 0}
          icon="📄"
        />
        <StatCard
          label="Accettate SDI"
          value={stats?.accepted ?? 0}
          icon="✅"
          color="text-green-600"
        />
        <StatCard
          label="Dati mancanti"
          value={stats?.pendingData ?? 0}
          icon="⏳"
          color="text-yellow-600"
        />
        <StatCard
          label="Errori"
          value={stats?.errors ?? 0}
          icon="⚠️"
          color="text-red-600"
        />
      </div>

      {/* Revenue card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-md">
        <p className="text-blue-100 text-sm">
          Fatturato totale (inviato/accettato)
        </p>
        <p className="text-3xl font-bold mt-1">
          €{" "}
          {(stats?.totalRevenue ?? 0).toLocaleString("it-IT", {
            minimumFractionDigits: 2,
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Errori SDI reali + Attività */}
        <div className="lg:col-span-2 space-y-4">
          {/* Errori SDI */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-red-50 flex justify-between items-center">
              <h3 className="font-semibold text-red-900 flex items-center gap-2 text-sm md:text-base">
                <span>⚠️</span> Errori SDI che richiedono intervento
              </h3>
              <Link
                href="/dashboard/invoices?filter=ERROR"
                className="text-xs text-red-600 font-bold hover:underline"
              >
                VEDI TUTTI →
              </Link>
            </div>
            <div className="p-0">
              {errorInvoices.length === 0 ? (
                <div className="p-8 text-center text-gray-400 italic text-sm">
                  ✓ Nessun errore SDI rilevato. Ottimo lavoro!
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {errorInvoices.map((inv) => (
                    <li
                      key={inv.id}
                      className="px-4 py-4 hover:bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-400 uppercase font-mono">
                            {inv.sourceId.slice(0, 14)}...
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {inv.customer?.name ?? inv.customer?.email ?? "N/A"}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium w-fit px-1.5 py-0.5 rounded border mb-1 ${
                            inv.status === "REJECTED"
                              ? "text-orange-600 bg-orange-50 border-orange-100"
                              : "text-red-600 bg-red-50 border-red-100"
                          }`}
                        >
                          {inv.status === "REJECTED"
                            ? "Rifiutata SDI"
                            : (inv.errorCode ?? "Errore")}
                        </span>
                        <span className="text-xs text-gray-500 line-clamp-1">
                          {inv.lastError ?? "Errore sconosciuto"}
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {inv.status === "ERROR" && (
                          <Link
                            href={`/dashboard/invoices?search=${inv.sourceId}`}
                            className="text-xs px-4 py-2 rounded-lg font-bold border bg-blue-600 text-white border-blue-600 hover:bg-blue-700 transition-all"
                          >
                            Gestisci
                          </Link>
                        )}
                        {inv.status === "REJECTED" && (
                          <Link
                            href="/dashboard/settings"
                            className="text-xs px-4 py-2 rounded-lg font-bold border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-all"
                          >
                            Configura
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Attività recente */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Attività recente
              </h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">
                  Nessuna attività registrata.
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-6 py-3 flex items-center gap-3"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        activity.level === "ERROR"
                          ? "bg-red-500"
                          : activity.level === "WARN"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {activity.details ?? activity.action}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(activity.createdAt).toLocaleTimeString("it-IT")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stato Connessioni reale */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <span>🔌</span> Stato Integrazioni
            </h3>
            {integrations ? (
              <div className="space-y-4">
                <ConnectionStatus
                  label="Stripe"
                  connected={integrations.stripe.connected}
                  detail={integrations.stripe.detail}
                />
                <ConnectionStatus
                  label="Fatture in Cloud"
                  connected={integrations.fic.connected}
                  detail={integrations.fic.detail}
                />
                <ConnectionStatus
                  label="Shopify"
                  connected={integrations.shopify.connected}
                  detail={integrations.shopify.detail}
                />
                <ConnectionStatus
                  label="WooCommerce"
                  connected={integrations.woocommerce.connected}
                  detail={integrations.woocommerce.detail}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-400">Caricamento...</p>
            )}
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
            <h4 className="text-indigo-900 font-bold text-sm mb-2">
              🎁 Promo Early Adopter
            </h4>
            <p className="text-indigo-700 text-xs leading-relaxed">
              Stai usando la versione Beta. I primi 100 merchant avranno 3 mesi
              del piano Growth gratis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionStatus({
  label,
  connected,
  detail,
}: {
  label: string;
  connected: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${connected ? "bg-green-500" : "bg-gray-300"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">{label}</p>
          {!connected && (
            <Link
              href="/dashboard/settings"
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              CONFIGURA
            </Link>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{detail}</p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
          {value}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{label}</p>
    </div>
  );
}
