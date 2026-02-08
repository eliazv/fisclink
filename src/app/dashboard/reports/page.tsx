"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}`);
      const data = await res.json();
      if (res.ok) setReportData(data);
    } finally {
      setLoading(false);
    }
  }

  function downloadPdf() {
    window.open(`/api/reports/monthly?month=${month}&format=pdf`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Mensili</h1>
          <p className="text-sm text-gray-500 mt-1">
            Genera e scarica i report di fatturazione per il tuo commercialista
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={loadReport}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Caricamento..." : "📊 Genera Report"}
            </button>
            <button
              onClick={downloadPdf}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              📥 Scarica PDF
            </button>
          </div>
        </div>

        {reportData && (
          <div className="space-y-6">
            {/* Financial Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <SummaryCard
                title="Fatturato"
                value={`€ ${Number((reportData as Record<string, number>).totalRevenue || 0).toFixed(2)}`}
                color="blue"
              />
              <SummaryCard
                title="IVA"
                value={`€ ${Number((reportData as Record<string, number>).totalVat || 0).toFixed(2)}`}
                color="indigo"
              />
              <SummaryCard
                title="Bollo"
                value={`€ ${Number((reportData as Record<string, number>).totalBollo || 0).toFixed(2)}`}
                color="purple"
              />
              <SummaryCard
                title="Rimborsi"
                value={`€ ${Number((reportData as Record<string, number>).totalRefunds || 0).toFixed(2)}`}
                color="red"
              />
              <SummaryCard
                title="Netto"
                value={`€ ${Number((reportData as Record<string, number>).netRevenue || 0).toFixed(2)}`}
                color="green"
              />
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard title="Totale Fatture" value={(reportData as Record<string, number>).totalInvoices} color="blue" />
              <SummaryCard title="Accettate" value={(reportData as Record<string, number>).totalAccepted} color="green" />
              <SummaryCard title="Rifiutate" value={(reportData as Record<string, number>).totalRejected} color="red" />
              <SummaryCard title="Errori" value={(reportData as Record<string, number>).totalErrors} color="amber" />
            </div>

            {/* Reconciliation */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Riconciliazione</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-400">Totale Pagamenti</p>
                  <p className="text-xl font-bold text-gray-900">
                    € {Number((reportData as Record<string, number>).stripeTotal || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Totale Fatturato SDI</p>
                  <p className="text-xl font-bold text-gray-900">
                    € {Number((reportData as Record<string, number>).ficTotal || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Stato</p>
                  <p className="text-xl font-bold">
                    {(reportData as Record<string, string>).reconciliationStatus === "MATCH" && (
                      <span className="text-green-600">✅ Allineato</span>
                    )}
                    {(reportData as Record<string, string>).reconciliationStatus === "WARNING" && (
                      <span className="text-amber-600">⚠️ Discrepanza</span>
                    )}
                    {(reportData as Record<string, string>).reconciliationStatus === "MISMATCH" && (
                      <span className="text-red-600">❌ Disallineato</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-700",
    amber: "text-amber-700",
    indigo: "text-indigo-700",
    purple: "text-purple-700",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-400">{title}</p>
      <p className={`text-lg font-bold ${colorMap[color] || "text-gray-900"}`}>{value}</p>
    </div>
  );
}
