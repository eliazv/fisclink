"use client";

import { useState, useEffect } from "react";

interface OverviewData {
  merchantName: string;
  merchantCompany: string;
  merchantVat: string;
  taxRegime: string;
  overview: {
    totalInvoices: number;
    accepted: number;
    rejected: number;
    pending: number;
    errors: number;
    creditNotes: number;
    revenue: number;
  };
}

interface InvoiceData {
  id: string;
  invoiceNumber: string | null;
  status: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    vatNumber: string | null;
    fiscalCode: string | null;
  } | null;
  sourceType: string;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface ErrorData {
  id: string;
  invoiceNumber: string | null;
  status: string;
  lastError: string | null;
  errorCode: string | null;
  rejectionReason: string | null;
  customer: { name: string; email: string } | null;
  amount: number;
}

export default function AccountantDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [view, setView] = useState<"overview" | "invoices" | "errors">(
    "overview",
  );
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [errors, setErrors] = useState<ErrorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token, view, month]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/accountant/${token}?view=${view}&month=${month}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (view === "overview") setOverview(data);
      if (view === "invoices") setInvoices(data.invoices || []);
      if (view === "errors") setErrors(data.errors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di caricamento");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-red-200 max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Accesso Negato
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-blue-600">⚡ FiscLink</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-500">Area Commercialista</span>
          </div>
          {overview && (
            <div className="text-sm text-gray-500">
              {overview.merchantCompany || overview.merchantName}
              {overview.merchantVat && ` — P.IVA ${overview.merchantVat}`}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Navigation + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {(["overview", "invoices", "errors"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  view === v
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {v === "overview"
                  ? "📊 Panoramica"
                  : v === "invoices"
                    ? "📄 Fatture"
                    : "⚠️ Errori"}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <a
              href={`/api/reports/monthly?month=${month}&format=pdf`}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
              target="_blank"
            >
              📥 Scarica PDF
            </a>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {view === "overview" && overview && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard
                    title="Fatture Totali"
                    value={overview.overview.totalInvoices}
                    color="blue"
                  />
                  <KpiCard
                    title="Accettate SDI"
                    value={overview.overview.accepted}
                    color="green"
                  />
                  <KpiCard
                    title="Rifiutate"
                    value={overview.overview.rejected}
                    color="red"
                  />
                  <KpiCard
                    title="Errori"
                    value={overview.overview.errors}
                    color="amber"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <KpiCard
                    title="Fatturato"
                    value={`€ ${Number(overview.overview.revenue).toFixed(2)}`}
                    color="blue"
                    large
                  />
                  <KpiCard
                    title="In Attesa"
                    value={overview.overview.pending}
                    color="yellow"
                    large
                  />
                  <KpiCard
                    title="Note di Credito"
                    value={overview.overview.creditNotes}
                    color="purple"
                    large
                  />
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">
                    Informazioni Merchant
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Ragione sociale:</span>{" "}
                      <span className="font-medium">
                        {overview.merchantCompany || overview.merchantName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">P.IVA:</span>{" "}
                      <span className="font-medium">
                        {overview.merchantVat || "N/D"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Regime:</span>{" "}
                      <span className="font-medium">{overview.taxRegime}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INVOICES */}
            {view === "invoices" && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        N°
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Importo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Stato
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Provider
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">
                          {inv.invoiceNumber || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {inv.customer?.name || inv.customer?.email || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          € {Number(inv.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {inv.sourceType}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(inv.createdAt).toLocaleDateString("it-IT")}
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-gray-400"
                        >
                          Nessuna fattura per questo periodo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ERRORS */}
            {view === "errors" && (
              <div className="space-y-3">
                {errors.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <p className="text-green-700 font-medium">
                      ✅ Nessun errore in questo periodo
                    </p>
                  </div>
                )}
                {errors.map((err) => (
                  <div
                    key={err.id}
                    className="bg-white rounded-xl border border-red-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={err.status} />
                          <span className="text-sm font-medium text-gray-900">
                            {err.invoiceNumber || "Fattura senza numero"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {err.customer?.name ||
                            err.customer?.email ||
                            "Cliente sconosciuto"}{" "}
                          — € {Number(err.amount).toFixed(2)}
                        </p>
                      </div>
                      {err.errorCode && (
                        <span className="text-xs font-mono bg-red-50 text-red-700 px-2 py-1 rounded">
                          {err.errorCode}
                        </span>
                      )}
                    </div>
                    {err.lastError && (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                        {err.lastError}
                      </p>
                    )}
                    {err.rejectionReason && (
                      <p className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        Motivo rifiuto SDI: {err.rejectionReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  color,
  large,
}: {
  title: string;
  value: string | number;
  color: string;
  large?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase">{title}</p>
      <p
        className={`${large ? "text-2xl" : "text-xl"} font-bold mt-1 ${colorMap[color] || ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    ACCEPTED: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Accettata",
    },
    SENT: { bg: "bg-blue-100", text: "text-blue-700", label: "Inviata" },
    SENDING: { bg: "bg-blue-50", text: "text-blue-600", label: "In invio" },
    PENDING_DATA: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Dati mancanti",
    },
    VALIDATING: {
      bg: "bg-indigo-100",
      text: "text-indigo-700",
      label: "Validazione",
    },
    READY: { bg: "bg-cyan-100", text: "text-cyan-700", label: "Pronta" },
    REJECTED: { bg: "bg-red-100", text: "text-red-700", label: "Rifiutata" },
    ERROR: { bg: "bg-red-50", text: "text-red-600", label: "Errore" },
    FAILED: { bg: "bg-red-200", text: "text-red-800", label: "Fallita" },
  };

  const c = config[status] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: status,
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}
