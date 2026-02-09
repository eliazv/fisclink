/**
 * Pagina Fatture - Lista tutte le fatture del merchant con fetch reale
 */

"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

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
  errorCode: string | null;
  bolloApplied: boolean;
  rejectionReason: string | null;
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

const SDI_ERROR_HELP: Record<string, string> = {
  "00200":
    "Formato file non conforme al tracciato XML. Controlla la struttura della fattura.",
  "00301":
    "Aliquota IVA 0% richiede il campo Natura IVA. Configura il mapping IVA nelle impostazioni.",
  "00305": "Codice Natura IVA non valido per l'aliquota specificata.",
  "00400": "Errore decompressione file. Riprova l'invio.",
  "00404":
    "Codice Fiscale del cessionario non valido. Verifica i dati del cliente.",
  "00409":
    "Partita IVA del cessionario non attiva in anagrafica. Verifica i dati del cliente.",
  "00471":
    "Codice Destinatario non attivo. Il cliente deve fornire un codice SDI valido o PEC.",
};

export default function InvoicesPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <InvoicesPage />
    </Suspense>
  );
}

function InvoicesPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(
    searchParams.get("filter"),
  );
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error("Errore caricamento fatture:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fatture</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total > 0
              ? `${total} fatture totali`
              : "Tutte le fatture elettroniche gestite dal connettore"}
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
        <div className="flex gap-1 flex-wrap">
          {[
            [null, "Tutte"],
            ["PENDING_DATA", "⏳ Dati mancanti"],
            ["ACCEPTED", "✅ Accettate"],
            ["SENT", "📨 Inviate"],
            ["ERROR", "⚠️ Errori"],
            ["REJECTED", "❌ Rifiutate"],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
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
              {filter
                ? "Nessuna fattura con questo filtro"
                : "Nessuna fattura ancora"}
            </p>
            <p className="text-sm mt-1">
              {filter
                ? "Prova a cambiare i filtri o la ricerca."
                : "Le fatture appariranno qui non appena riceverai un pagamento."}
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
                      € {Number(inv.amount).toFixed(2)}
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
                    <td className="px-4 py-3 max-w-[250px]">
                      {(inv.lastError || inv.rejectionReason) && (
                        <button
                          onClick={() =>
                            setSelectedError(
                              inv.id === selectedError ? null : inv.id,
                            )
                          }
                          className="text-xs text-red-600 hover:underline text-left"
                          title={inv.lastError ?? inv.rejectionReason ?? ""}
                        >
                          {inv.errorCode ? `[${inv.errorCode}] ` : ""}
                          {(inv.lastError ?? inv.rejectionReason ?? "").slice(
                            0,
                            50,
                          )}
                          ...
                        </button>
                      )}
                      {/* Pannello errore espanso con spiegazione e azione */}
                      {selectedError === inv.id &&
                        (inv.lastError || inv.rejectionReason) && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-800 font-medium mb-1">
                              Dettaglio errore:
                            </p>
                            <p className="text-xs text-red-700 mb-2">
                              {inv.lastError ?? inv.rejectionReason}
                            </p>
                            {inv.errorCode && SDI_ERROR_HELP[inv.errorCode] && (
                              <>
                                <p className="text-xs text-red-800 font-medium mb-1">
                                  💡 Come risolvere:
                                </p>
                                <p className="text-xs text-red-600">
                                  {SDI_ERROR_HELP[inv.errorCode]}
                                </p>
                              </>
                            )}
                            {!inv.errorCode &&
                              inv.status === "PENDING_DATA" && (
                                <p className="text-xs text-blue-600 font-medium">
                                  → Un Magic Link è stato inviato al cliente per
                                  raccogliere i dati fiscali.
                                </p>
                              )}
                          </div>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginazione */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Pagina {page} di {totalPages} ({total} fatture)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                ← Indietro
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Avanti →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
