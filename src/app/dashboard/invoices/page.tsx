/**
 * Pagina Fatture - Lista tutte le fatture del merchant con fetch reale
 */

"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  magicLink: {
    id: string;
    isCompleted: boolean;
    isExpired: boolean;
    emailSentAt: string | null;
    expiresAt: string;
    createdAt: string;
  } | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

const STATUS_VARIANTS: Record<string, "secondary" | "destructive" | "default"> = {
  PENDING_DATA: "secondary",
  VALIDATING: "secondary",
  READY: "secondary",
  SENDING: "secondary",
  SENT: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
  ERROR: "destructive",
  FAILED: "destructive",
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
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
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
  const [resendingInvoiceId, setResendingInvoiceId] = useState<string | null>(
    null,
  );

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
        setInvoices(data.data ?? []);
        setTotal(data.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error("Errore caricamento fatture:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-filter-change, no external sync alternative here
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const totalPages = Math.ceil(total / 20);

  const resendMagicLink = async (invoiceId: string) => {
    setResendingInvoiceId(invoiceId);
    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}/magic-link/resend`,
        { method: "POST" },
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Reinvio non riuscito");
      }

      await fetchInvoices();
    } catch (error) {
      console.error("Errore reinvio Magic Link:", error);
    } finally {
      setResendingInvoiceId(null);
    }
  };

  const exportHref = useCallback(
    (format: "csv" | "json") => {
      const params = new URLSearchParams();
      params.set("format", format);
      if (filter) params.set("status", filter);
      if (search) params.set("search", search);
      return `/api/invoices/export?${params.toString()}`;
    },
    [filter, search],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fatture</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0
              ? `${total} fatture totali`
              : "Tutte le fatture elettroniche gestite dal connettore"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={exportHref("csv")}>Esporta CSV</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={exportHref("json")}>Esporta JSON</a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          type="text"
          placeholder="Cerca per email, nome, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <div className="flex flex-wrap gap-1">
          {[
            [null, "Tutte"],
            ["PENDING_DATA", "Dati mancanti"],
            ["ACCEPTED", "Accettate"],
            ["SENT", "Inviate"],
            ["ERROR", "Errori"],
            ["REJECTED", "Rifiutate"],
          ].map(([value, label]) => (
            <Button
              key={String(value)}
              variant={filter === value ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted-foreground">
            <p className="text-lg font-medium">
              {filter
                ? "Nessuna fattura con questo filtro"
                : "Nessuna fattura ancora"}
            </p>
            <p className="mt-1 text-sm">
              {filter
                ? "Prova a cambiare i filtri o la ricerca."
                : "Le fatture appariranno qui non appena riceverai un pagamento."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>N. Fattura</TableHead>
                <TableHead>Bollo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Magic Link</TableHead>
                <TableHead>Errore</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[inv.status] ?? "secondary"}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{inv.customer?.name ?? "N/A"}</p>
                    <p className="text-xs text-muted-foreground">{inv.customer?.email}</p>
                  </TableCell>
                  <TableCell className="font-medium">
                    € {Number(inv.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.invoiceNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    {inv.bolloApplied ? (
                      <Badge variant="outline">2,00€</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    {inv.status === "PENDING_DATA" && inv.magicLink ? (
                      <div className="space-y-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resendingInvoiceId === inv.id}
                          onClick={() => resendMagicLink(inv.id)}
                        >
                          {resendingInvoiceId === inv.id
                            ? "Reinvio..."
                            : "Reinvia"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Scade il{" "}
                          {new Date(inv.magicLink.expiresAt).toLocaleDateString(
                            "it-IT",
                          )}
                        </p>
                      </div>
                    ) : inv.status === "PENDING_DATA" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={resendingInvoiceId === inv.id}
                        onClick={() => resendMagicLink(inv.id)}
                      >
                        {resendingInvoiceId === inv.id
                          ? "Invio..."
                          : "Invia link"}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[250px] whitespace-normal">
                    {(inv.lastError || inv.rejectionReason) && (
                      <button
                        onClick={() =>
                          setSelectedError(
                            inv.id === selectedError ? null : inv.id,
                          )
                        }
                        className="text-left text-xs text-destructive hover:underline"
                        title={inv.lastError ?? inv.rejectionReason ?? ""}
                      >
                        {inv.errorCode ? `[${inv.errorCode}] ` : ""}
                        {(inv.lastError ?? inv.rejectionReason ?? "").slice(0, 50)}
                        ...
                      </button>
                    )}
                    {selectedError === inv.id &&
                      (inv.lastError || inv.rejectionReason) && (
                        <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                          <p className="mb-1 text-xs font-medium text-destructive">
                            Dettaglio errore:
                          </p>
                          <p className="mb-2 text-xs text-destructive/90">
                            {inv.lastError ?? inv.rejectionReason}
                          </p>
                          {inv.errorCode && SDI_ERROR_HELP[inv.errorCode] && (
                            <>
                              <p className="mb-1 text-xs font-medium">Come risolvere:</p>
                              <p className="text-xs text-muted-foreground">
                                {SDI_ERROR_HELP[inv.errorCode]}
                              </p>
                            </>
                          )}
                          {!inv.errorCode && inv.status === "PENDING_DATA" && (
                            <p className="text-xs font-medium text-primary">
                              Un Magic Link è stato inviato al cliente per raccogliere i dati
                              fiscali.
                            </p>
                          )}
                        </div>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <CardContent className="flex items-center justify-between border-t py-3">
            <p className="text-xs text-muted-foreground">
              Pagina {page} di {totalPages} ({total} fatture)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Indietro
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Avanti →
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
