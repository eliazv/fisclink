/**
 * Dashboard principale del merchant
 * Mostra statistiche, fatture recenti e log di attività.
 */

"use client";

import { useEffect, useState } from "react";

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

const STATUS_COLORS: Record<string, string> = {
  PENDING_DATA: "bg-yellow-100 text-yellow-800",
  VALIDATING: "bg-blue-100 text-blue-800",
  READY: "bg-indigo-100 text-indigo-800",
  SENDING: "bg-blue-100 text-blue-800",
  SENT: "bg-cyan-100 text-cyan-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ERROR: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_DATA: "Dati mancanti",
  VALIDATING: "In validazione",
  READY: "Pronta",
  SENDING: "In invio",
  SENT: "Inviata",
  ACCEPTED: "Accettata SDI",
  REJECTED: "Rifiutata",
  ERROR: "Errore",
  FAILED: "Fallita",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In produzione: fetch reale da /api/dashboard/stats
    // Per demo: dati statici
    setStats({
      totalInvoices: 0,
      pendingData: 0,
      sent: 0,
      accepted: 0,
      errors: 0,
      totalRevenue: 0,
    });
    setActivities([]);
    setLoading(false);
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
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

      {/* Setup guide (se non configurato) */}
      {stats?.totalInvoices === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🚀 Inizia in 3 passi
          </h2>
          <div className="space-y-4">
            <SetupStep
              number={1}
              title="Configura le chiavi API"
              description="Inserisci le tue chiavi Stripe e Fatture in Cloud nelle Impostazioni."
              done={false}
            />
            <SetupStep
              number={2}
              title="Collega il webhook Stripe"
              description="Aggiungi l'URL del webhook nel tuo dashboard Stripe."
              done={false}
            />
            <SetupStep
              number={3}
              title="Effettua un pagamento di test"
              description="Fai un pagamento di prova per verificare che tutto funzioni."
              done={false}
            />
          </div>
        </div>
      )}

      {/* Attività recente */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Attività recente
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              <p className="text-4xl mb-2">📋</p>
              <p>
                Nessuna attività ancora. Configura le integrazioni per iniziare.
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-3 flex items-center gap-3"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
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
                  {new Date(activity.createdAt).toLocaleString("it-IT")}
                </span>
              </div>
            ))
          )}
        </div>
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
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SetupStep({
  number,
  title,
  description,
  done,
}: {
  number: number;
  title: string;
  description: string;
  done: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
          done ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
        }`}
      >
        {done ? "✓" : number}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
