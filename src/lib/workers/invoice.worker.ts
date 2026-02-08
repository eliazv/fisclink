/**
 * Worker per l'elaborazione delle fatture
 *
 * Workflow:
 * 1. Riceve l'invoiceId
 * 2. Carica i dati dal DB
 * 3. Valida i dati fiscali del cliente
 * 4. Se dati mancanti → crea Magic Link + invia email
 * 5. Se dati validi → costruisce payload FiC + crea fattura + invia allo SDI
 */

import { prisma } from "@/lib/db";
import { validateFiscalData, type FiscalData } from "@/lib/validators/fiscal";
import {
  calculateBollo,
  getDicituraForfettario,
  REGIMI_FISCALI,
} from "@/lib/bollo";
import {
  buildFicInvoicePayload,
  createInvoice,
  sendToSDI,
  FicApiError,
} from "@/lib/fatture-in-cloud/client";
import {
  enqueueInvoiceSend,
  enqueueMagicLinkSend,
  scheduleMagicLinkReminder,
  type InvoiceProcessJobData,
} from "@/lib/queue";
import { nanoid } from "nanoid";

/**
 * Processa una fattura: valida dati, crea su FiC, gestisce magic link.
 */
export async function processInvoice(
  data: InvoiceProcessJobData,
): Promise<void> {
  const { invoiceId, merchantId } = data;

  // 1. Carica fattura e merchant
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, merchant: true },
  });

  if (!invoice) {
    throw new Error(`Fattura ${invoiceId} non trovata`);
  }

  if (!invoice.merchant) {
    throw new Error(`Merchant ${merchantId} non trovato`);
  }

  const merchant = invoice.merchant;

  // 2. Prepara i dati fiscali del cliente
  const fiscalData: FiscalData = {
    fiscalCode: invoice.customer?.fiscalCode,
    vatNumber: invoice.customer?.vatNumber,
    name: invoice.customer?.name,
    address: invoice.customer?.address,
    city: invoice.customer?.city,
    province: invoice.customer?.province,
    zipCode: invoice.customer?.zipCode,
    country: invoice.customer?.country ?? "IT",
    sdiCode: invoice.customer?.sdiCode,
    pecEmail: invoice.customer?.pecEmail,
    customerType: invoice.customer?.customerType as FiscalData["customerType"],
  };

  // 3. Valida i dati fiscali
  const validation = validateFiscalData(fiscalData);

  await logAudit(merchantId, invoiceId, "VALIDATION_RUN", {
    valid: validation.valid,
    errors: validation.errors,
    missingFields: validation.missingFields,
  });

  // 4. Se dati mancanti → Magic Link
  if (!validation.valid) {
    await handleMissingData(invoice, merchant, validation);
    return;
  }

  // 5. Dati validi → Crea fattura su Fatture in Cloud
  await createAndSendInvoice(invoice, merchant, fiscalData);
}

/**
 * Gestisce il caso di dati fiscali mancanti/errati.
 * Crea un Magic Link e invia l'email al cliente.
 */
async function handleMissingData(
  invoice: Awaited<ReturnType<typeof prisma.invoice.findUnique>> & {
    customer: unknown;
  },
  merchant: {
    id: string;
    name: string;
    logoUrl: string | null;
    brandColor: string | null;
  },
  validation: { errors: string[]; missingFields: string[] },
): Promise<void> {
  // Se non abbiamo l'email del cliente, non possiamo inviare nulla
  const sourceData = invoice!.sourceData as Record<string, unknown> | null;
  const customerEmail =
    (invoice as unknown as { customer?: { email?: string } })?.customer
      ?.email ?? (sourceData?.customerEmail as string | undefined);

  if (!customerEmail) {
    await prisma.invoice.update({
      where: { id: invoice!.id },
      data: {
        status: "ERROR",
        lastError:
          "Impossibile recuperare i dati fiscali: email del cliente mancante. " +
          "Errori: " +
          validation.errors.join("; "),
      },
    });

    await logAudit(merchant.id, invoice!.id, "MISSING_DATA_NO_EMAIL", {
      errors: validation.errors,
    });
    return;
  }

  // Aggiorna stato fattura
  await prisma.invoice.update({
    where: { id: invoice!.id },
    data: {
      status: "PENDING_DATA",
      lastError: `Dati mancanti: ${validation.missingFields.join(", ")}`,
    },
  });

  // Crea il magic link
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 giorni

  const magicLink = await prisma.magicLink.create({
    data: {
      token,
      merchantId: merchant.id,
      invoiceId: invoice!.id,
      customerId:
        (invoice as unknown as { customerId?: string })?.customerId ??
        undefined,
      expiresAt,
    },
  });

  // Accoda invio email
  await enqueueMagicLinkSend({
    magicLinkId: magicLink.id,
    invoiceId: invoice!.id,
    merchantId: merchant.id,
    customerEmail,
  });

  // Programma reminder dopo 2 giorni
  await scheduleMagicLinkReminder(
    {
      magicLinkId: magicLink.id,
      invoiceId: invoice!.id,
      merchantId: merchant.id,
      reminderNumber: 1,
    },
    2 * 24 * 60 * 60 * 1000, // 2 giorni
  );

  await logAudit(merchant.id, invoice!.id, "MAGIC_LINK_CREATED", {
    token,
    customerEmail,
    missingFields: validation.missingFields,
  });
}

/**
 * Crea la fattura su Fatture in Cloud e accoda l'invio SDI.
 */
async function createAndSendInvoice(
  invoice: NonNullable<Awaited<ReturnType<typeof prisma.invoice.findUnique>>>,
  merchant: { id: string; taxRegime: string; bolloPolicy: string },
  fiscalData: FiscalData,
): Promise<void> {
  try {
    // Aggiorna stato
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "SENDING" },
    });

    // Determina natura IVA dal regime fiscale
    const regime = REGIMI_FISCALI[merchant.taxRegime];
    const vatNature = invoice.vatNature ?? regime?.vatNature ?? null;

    // Calcola bollo
    const bolloCalc = calculateBollo(
      Number(invoice.amount),
      vatNature,
      merchant.taxRegime,
    );

    const bolloAmount = bolloCalc.required ? bolloCalc.amount : 0;

    // Dicitura obbligatoria
    let notes = "";
    if (merchant.taxRegime === "RF19") {
      notes = getDicituraForfettario();
    }

    // Costruisci payload
    const lineItems = (invoice.lineItems as Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      vatRate?: number;
    }>) ?? [
      {
        description: invoice.description ?? "Servizio / Prodotto",
        quantity: 1,
        unitPrice: Number(invoice.amount),
      },
    ];

    const payload = buildFicInvoicePayload({
      customerName: fiscalData.name ?? "N/A",
      customerVatNumber: fiscalData.vatNumber ?? undefined,
      customerFiscalCode: fiscalData.fiscalCode ?? undefined,
      customerAddress: fiscalData.address ?? undefined,
      customerCity: fiscalData.city ?? undefined,
      customerProvince: fiscalData.province ?? undefined,
      customerZipCode: fiscalData.zipCode ?? undefined,
      customerCountry: fiscalData.country ?? undefined,
      customerSdiCode: fiscalData.sdiCode ?? undefined,
      customerPecEmail: fiscalData.pecEmail ?? undefined,
      items: lineItems,
      taxRegime: merchant.taxRegime,
      vatNature,
      bolloAmount,
      notes,
    });

    // Crea fattura su Fatture in Cloud
    const ficResponse = await createInvoice(merchant.id, payload);

    // Aggiorna invoice con riferimento FiC
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        ficDocumentId: String(ficResponse.data.id),
        invoiceNumber: String(ficResponse.data.number),
        bolloApplied: bolloCalc.required,
        bolloAmount: bolloAmount,
        vatNature,
        status: "READY",
      },
    });

    await logAudit(merchant.id, invoice.id, "INVOICE_CREATED_FIC", {
      ficId: ficResponse.data.id,
      number: ficResponse.data.number,
      bollo: bolloCalc,
    });

    // Accoda invio SDI
    await enqueueInvoiceSend({
      invoiceId: invoice.id,
      merchantId: merchant.id,
      ficDocumentId: ficResponse.data.id,
    });
  } catch (error) {
    const humanMessage =
      error instanceof FicApiError
        ? error.toHumanMessage()
        : error instanceof Error
          ? error.message
          : "Errore sconosciuto nella creazione della fattura";

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "ERROR",
        lastError: humanMessage,
        errorCode:
          error instanceof FicApiError ? String(error.statusCode) : "UNKNOWN",
        retryCount: { increment: 1 },
      },
    });

    await logAudit(merchant.id, invoice.id, "INVOICE_CREATE_ERROR", {
      error: humanMessage,
    });

    throw error; // Per BullMQ retry
  }
}

/**
 * Processa l'invio di una fattura allo SDI tramite Fatture in Cloud.
 */
export async function processSendToSDI(data: {
  invoiceId: string;
  merchantId: string;
  ficDocumentId: number;
}): Promise<void> {
  const { invoiceId, merchantId, ficDocumentId } = data;

  try {
    const result = await sendToSDI(merchantId, ficDocumentId);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    await logAudit(merchantId, invoiceId, "INVOICE_SENT_SDI", {
      ficDocumentId,
      sdiResponse: result,
    });
  } catch (error) {
    const humanMessage =
      error instanceof FicApiError
        ? error.toHumanMessage()
        : "Errore nell'invio allo SDI";

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "ERROR",
        lastError: humanMessage,
        retryCount: { increment: 1 },
      },
    });

    await logAudit(merchantId, invoiceId, "SDI_SEND_ERROR", {
      error: humanMessage,
    });

    throw error;
  }
}

// ============================================================
// AUDIT LOG HELPER
// ============================================================

async function logAudit(
  merchantId: string,
  invoiceId: string | null,
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
        level:
          action.includes("ERROR") || action.includes("FAIL")
            ? "ERROR"
            : action.includes("WARN")
              ? "WARN"
              : "INFO",
      },
    });
  } catch {
    console.error(`[AUDIT] Failed to log: ${action}`, metadata);
  }
}
