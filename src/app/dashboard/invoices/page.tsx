/**
 * Pagina Fatture - Lista tutte le fatture del merchant
 */

"use client";

import { useEffect, useState } from "react";

interface Invoice {
  id: string;
  status: string;
  sourceType: string;
  sourceId: string;
  invoiceNumber: string | null;
  amount: number;
  currency: string;
  description: string | null;
  lastError: string | null;
  bolloApplied: boolean;
  customer: {
    name: string | null;
    email: string;
    fiscalCode: string | null;
    vatNumber: string | null;
  } | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
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
  ERROR: "bg-orange-100 text-orange-800",
  FAILED: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_DATA: "Dati mancanti",
  VALIDATING: "In validazione",
  READY: "Pronta",
  SENDING: "In invio",
  SENT: "Inviata SDI",
  ACCEPTED: "Accettata",
  REJECTED: "Rifiutata",
  ERROR: "Errore",
  FAILED: "Fallita",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Demo: dati statici. In produzione: fetch da /api/invoices
    setInvoices([]);
    setLoading(false);
  }, [filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fatture</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tutte le fatture elettroniche gestite dal connettore
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cerca per email, nome, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex gap-1">
          {[
            [null, "Tutte"],
            ["PENDING_DATA", "⏳ Dati mancanti"],
            ["ACCEPTED", "✅ Accettate"],
            ["ERROR", "⚠️ Errori"],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              onClick={() => setFilter(value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === value
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400">
            <p className="text-5xl mb-3">📄</p>
            <p className="text-lg font-medium text-gray-600">
              Nessuna fattura ancora
            </p>
            <p className="text-sm mt-1">
              Le fatture appariranno qui non appena riceverai un pagamento
              Stripe.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Stato</th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Cliente
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Importo
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    N. Fattura
                  </th>
                  <th className="px-4 py-3 font-medium text-gray-500">Bollo</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 font-medium text-gray-500">
                    Errore
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[inv.status] ??
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {inv.customer?.name ?? "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {inv.customer?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      € {inv.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {inv.invoiceNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {inv.bolloApplied ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          2,00€
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {inv.lastError && (
                        <p
                          className="text-xs text-red-600 truncate"
                          title={inv.lastError}
                        >
                          {inv.lastError}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
