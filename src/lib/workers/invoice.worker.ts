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
import { validateVatVIES, isEUCountry } from "@/lib/validators/vies";
import { classifySale, getOSSInvoiceNote } from "@/lib/oss";
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

    const customerCountry = (fiscalData.country ?? "IT").toUpperCase();
    const isB2B = !!fiscalData.vatNumber;

    // --- VIES: Verifica P.IVA reale nel registro europeo ---
    if (fiscalData.vatNumber && isEUCountry(customerCountry)) {
      try {
        const viesResult = await validateVatVIES(
          customerCountry,
          fiscalData.vatNumber.replace(/^[A-Z]{2}/i, ""),
        );

        await logAudit(merchant.id, invoice.id, "VIES_VALIDATION", {
          valid: viesResult.valid,
          countryCode: viesResult.countryCode,
          name: viesResult.name,
          error: viesResult.error,
        });

        if (!viesResult.valid && !viesResult.error) {
          // P.IVA non valida nel registro VIES (non è un errore di rete)
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "ERROR",
              lastError: `P.IVA ${customerCountry}${fiscalData.vatNumber} non trovata nel registro VIES. Verificare i dati con il cliente.`,
            },
          });
          return;
        }
      } catch {
        // Fail-open: se VIES è irraggiungibile, procediamo
        await logAudit(merchant.id, invoice.id, "VIES_VALIDATION_SKIPPED", {
          reason: "VIES non raggiungibile, si procede con validazione formale",
        });
      }
    }

    // --- OSS: Classificazione vendita ---
    const ossClassification = classifySale(
      "IT",
      customerCountry,
      isB2B,
      merchant.taxRegime,
    );
    const ossNote = getOSSInvoiceNote(ossClassification);

    // Aggiorna campi OSS sulla fattura
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        ossApplicable: ossClassification.ossReportable,
        customerCountry,
        saleType: ossClassification.saleType,
        ossVatRate: ossClassification.vatRate ?? undefined,
        ossNote: ossNote || null,
      },
    });

    await logAudit(merchant.id, invoice.id, "OSS_CLASSIFICATION", {
      saleType: ossClassification.saleType,
      vatRate: ossClassification.vatRate,
      ossReportable: ossClassification.ossReportable,
      sendToSDI: ossClassification.sendToSDI,
    });

    // Se la fattura OSS non va allo SDI (EU B2C OSS regime ordinario)
    // la creiamo comunque su FiC ma non inviamo allo SDI
    const skipSDI = !ossClassification.sendToSDI;

    // --- TaxMapping: cerca mapping personalizzato ---
    let actualVatNature = invoice.vatNature;

    if (ossClassification.vatNature) {
      actualVatNature = ossClassification.vatNature;
    } else {
      const regime = REGIMI_FISCALI[merchant.taxRegime];
      actualVatNature = actualVatNature ?? regime?.vatNature ?? null;
    }

    // Cerca un TaxMapping specifico del merchant
    const taxMapping = await prisma.taxMapping.findFirst({
      where: {
        merchantId: merchant.id,
        OR: [{ stripeTaxCode: invoice.sourceId }, { isDefault: true }],
      },
      orderBy: { isDefault: "asc" }, // Priorità al match specifico
    });

    if (taxMapping) {
      if (taxMapping.ficVatNature) {
        actualVatNature = taxMapping.ficVatNature;
      }
    }

    // Determina natura IVA dal regime fiscale
    const vatNature = actualVatNature;

    // Calcola bollo
    const bolloCalc = calculateBollo(
      Number(invoice.amount),
      vatNature,
      merchant.taxRegime,
    );

    const bolloAmount = bolloCalc.required ? bolloCalc.amount : 0;

    // Dicitura obbligatoria (combina regime + OSS)
    let notes = "";
    if (merchant.taxRegime === "RF19") {
      notes = getDicituraForfettario();
    }
    if (ossNote) {
      notes = notes ? `${notes}\n${ossNote}` : ossNote;
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

    // Se vendita OSS B2C (non va allo SDI), segna come SENT senza invio
    if (skipSDI) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      await logAudit(merchant.id, invoice.id, "SDI_SKIPPED_OSS", {
        reason: "Vendita OSS B2C — fattura non inviata allo SDI",
        saleType: ossClassification.saleType,
      });
      return;
    }

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
