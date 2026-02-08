/**
 * Worker per l'elaborazione dei rimborsi → Note di Credito (TD04)
 *
 * Workflow:
 * 1. Riceve creditNoteId dal job
 * 2. Carica la CreditNote e la fattura originale dal DB
 * 3. Costruisce il payload Nota di Credito per Fatture in Cloud
 * 4. Crea la NC su FiC e la invia allo SDI
 * 5. Aggiorna lo stato nel DB
 */

import { prisma } from "@/lib/db";
import {
  createCreditNote,
  sendToSDI,
  FicApiError,
} from "@/lib/fatture-in-cloud/client";
import type { RefundProcessJobData } from "@/lib/queue";

/**
 * Processa un rimborso: crea Nota di Credito su FiC e invia allo SDI.
 */
export async function processRefund(data: RefundProcessJobData): Promise<void> {
  const { creditNoteId, merchantId, originalInvoiceId } = data;

  // 1. Carica la credit note e la fattura originale
  const creditNote = await prisma.creditNote.findUnique({
    where: { id: creditNoteId },
    include: {
      originalInvoice: {
        include: { customer: true, merchant: true },
      },
    },
  });

  if (!creditNote) {
    throw new Error(`CreditNote ${creditNoteId} non trovata`);
  }

  const invoice = creditNote.originalInvoice;
  if (!invoice) {
    throw new Error(`Fattura originale ${originalInvoiceId} non trovata`);
  }

  const merchant = invoice.merchant;
  if (!merchant) {
    throw new Error(`Merchant ${merchantId} non trovato`);
  }

  const customer = invoice.customer;

  // 2. Aggiorna stato → CREATING
  await prisma.creditNote.update({
    where: { id: creditNoteId },
    data: { status: "CREATING" },
  });

  await logAudit(merchantId, invoice.id, "CREDIT_NOTE_CREATING", {
    creditNoteId,
    refundId: data.stripeRefundId,
    amount: data.amount,
  });

  try {
    // 3. Costruisci payload Nota di Credito
    const date = new Date().toISOString().split("T")[0];
    const amount = Number(creditNote.amount);

    const payload = {
      data: {
        type: "credit_note" as const,
        entity: {
          name: customer?.name ?? "Cliente",
          vat_number: customer?.vatNumber ?? undefined,
          tax_code: customer?.fiscalCode ?? undefined,
          address_street: customer?.address ?? undefined,
          address_city: customer?.city ?? undefined,
          address_province: customer?.province ?? undefined,
          address_postal_code: customer?.zipCode ?? undefined,
          address_country: customer?.country ?? "IT",
          ei_code: customer?.sdiCode ?? undefined,
          certified_email: customer?.pecEmail ?? undefined,
        },
        date,
        items_list: [
          {
            name: `Nota di Credito - Rif. fattura ${invoice.invoiceNumber ?? invoice.id}`,
            net_price: amount,
            qty: 1,
            vat: {
              id: 0, // FiC: 0 = da configurare (verrà risolto dal TaxMapping)
              value: invoice.vatRate ? Number(invoice.vatRate) : undefined,
            },
          },
        ],
        e_invoice: true,
        currency: { id: "EUR" },
        language: { code: "it" },
        notes: creditNote.reason
          ? `Rimborso: ${creditNote.reason}`
          : `Nota di credito per rimborso Stripe ${data.stripeRefundId}`,
      },
    };

    // 4. Crea la Nota di Credito su Fatture in Cloud
    const ficResponse = await createCreditNote(merchantId, payload);
    const ficDocumentId = ficResponse.data.id;

    // 5. Invia allo SDI
    await sendToSDI(merchantId, ficDocumentId);

    // 6. Aggiorna stato → SENT
    await prisma.creditNote.update({
      where: { id: creditNoteId },
      data: {
        status: "SENT",
        ficDocumentId: String(ficDocumentId),
        sentAt: new Date(),
      },
    });

    await logAudit(merchantId, invoice.id, "CREDIT_NOTE_SENT", {
      creditNoteId,
      ficDocumentId,
      amount,
    });
  } catch (error) {
    const errorMessage =
      error instanceof FicApiError
        ? error.toHumanMessage()
        : error instanceof Error
          ? error.message
          : "Errore sconosciuto";

    await prisma.creditNote.update({
      where: { id: creditNoteId },
      data: {
        status: "ERROR",
        lastError: errorMessage,
        retryCount: { increment: 1 },
      },
    });

    await logAudit(merchantId, invoice.id, "CREDIT_NOTE_ERROR", {
      creditNoteId,
      error: errorMessage,
    });

    throw error; // BullMQ retry
  }
}

// ============================================================
// Helper
// ============================================================

async function logAudit(
  merchantId: string,
  invoiceId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        merchantId,
        invoiceId,
        action,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        level: action.includes("ERROR") ? "ERROR" : "INFO",
      },
    });
  } catch {
    console.error(`[RefundWorker] Failed to log audit: ${action}`);
  }
}
