/**
 * Client Fatture in Cloud API v2
 * Gestisce creazione e invio fatture elettroniche
 *
 * Documentazione: https://developers.fattureincloud.it/
 */

import { decryptApiKey } from "@/lib/crypto";
import { prisma } from "@/lib/db";

const FIC_BASE_URL = "https://api-v2.fattureincloud.it";

interface FicConfig {
  apiKey: string;
  companyId: string;
}

// ============================================================
// HTTP Client base
// ============================================================

async function ficRequest<T>(
  config: FicConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${FIC_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new FicApiError(
      `Fatture in Cloud API error: ${response.status} ${response.statusText}`,
      response.status,
      errorBody,
    );
  }

  return response.json();
}

export class FicApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: string,
  ) {
    super(message);
    this.name = "FicApiError";
  }

  /**
   * Ritorna un messaggio di errore comprensibile per il merchant.
   */
  toHumanMessage(): string {
    try {
      const body = JSON.parse(this.responseBody);
      if (body.error?.message) return body.error.message;
      if (body.message) return body.message;
    } catch {
      // ignore
    }

    switch (this.statusCode) {
      case 401:
        return "Chiave API Fatture in Cloud non valida o scaduta. Verifica le impostazioni.";
      case 403:
        return "Non hai i permessi per questa operazione su Fatture in Cloud.";
      case 404:
        return "Risorsa non trovata su Fatture in Cloud. Verifica l'ID azienda.";
      case 422:
        return "Dati fattura non validi. Controlla tutti i campi obbligatori.";
      case 429:
        return "Troppi richieste a Fatture in Cloud. Riproveremo tra poco.";
      default:
        return `Errore di comunicazione con Fatture in Cloud (codice ${this.statusCode}).`;
    }
  }
}

// ============================================================
// Recupera configurazione per un merchant
// ============================================================

async function getFicConfigForMerchant(
  merchantId: string,
): Promise<FicConfig | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { ficApiKeyEnc: true, ficCompanyId: true },
  });

  if (!merchant?.ficApiKeyEnc || !merchant?.ficCompanyId) return null;

  const apiKey = decryptApiKey(merchant.ficApiKeyEnc);
  if (!apiKey) return null;

  return { apiKey, companyId: merchant.ficCompanyId };
}

// ============================================================
// Tipi per Fatture in Cloud API
// ============================================================

export interface FicInvoiceItem {
  product_id?: number;
  code?: string;
  name: string;
  description?: string;
  net_price: number;
  qty: number;
  vat: {
    id: number; // ID aliquota IVA in FiC
    value?: number; // Percentuale IVA
    description?: string;
    is_disabled?: boolean;
  };
  not_taxable?: boolean;
}

export interface FicInvoicePayload {
  data: {
    type: "issued_document";
    entity: {
      name: string;
      vat_number?: string;
      tax_code?: string;
      address_street?: string;
      address_city?: string;
      address_province?: string;
      address_postal_code?: string;
      address_country?: string;
      ei_code?: string; // Codice Destinatario SDI
      certified_email?: string; // PEC
    };
    date: string; // YYYY-MM-DD
    number?: number;
    currency?: { id: string };
    language?: { code: string };
    items_list: FicInvoiceItem[];
    // Bollo
    stamp_duty?: number;
    // Regime forfettario / note
    ei_raw?: Record<string, unknown>;
    notes?: string;
    // Impostazioni e-invoice
    e_invoice?: boolean;
    ei_data?: {
      // Dati per fattura elettronica
      stamp_duty?: number;
      vat_kind?: string; // Natura IVA
      payment_method?: string;
    };
  };
}

export interface FicInvoiceResponse {
  data: {
    id: number;
    type: string;
    number: number;
    date: string;
    amount_net: number;
    amount_vat: number;
    amount_gross: number;
    ei_status?: string;
    ei_raw?: Record<string, unknown>;
  };
}

// ============================================================
// CRUD Fatture
// ============================================================

/**
 * Crea una fattura su Fatture in Cloud.
 */
export async function createInvoice(
  merchantId: string,
  payload: FicInvoicePayload,
): Promise<FicInvoiceResponse> {
  const config = await getFicConfigForMerchant(merchantId);
  if (!config) {
    throw new Error(
      "Configurazione Fatture in Cloud mancante per questo merchant",
    );
  }

  return ficRequest<FicInvoiceResponse>(
    config,
    "POST",
    `/c/${config.companyId}/issued_documents`,
    payload,
  );
}

/**
 * Invia una fattura allo SDI tramite Fatture in Cloud.
 */
export async function sendToSDI(
  merchantId: string,
  documentId: number,
): Promise<{ data: { date: string; status: string } }> {
  const config = await getFicConfigForMerchant(merchantId);
  if (!config) {
    throw new Error("Configurazione Fatture in Cloud mancante");
  }

  return ficRequest(
    config,
    "POST",
    `/c/${config.companyId}/issued_documents/${documentId}/e_invoice/send`,
    {},
  );
}

/**
 * Verifica lo stato di invio SDI di una fattura.
 */
export async function getSDIStatus(
  merchantId: string,
  documentId: number,
): Promise<{ data: { ei_status: string } }> {
  const config = await getFicConfigForMerchant(merchantId);
  if (!config) {
    throw new Error("Configurazione Fatture in Cloud mancante");
  }

  return ficRequest(
    config,
    "GET",
    `/c/${config.companyId}/issued_documents/${documentId}/e_invoice`,
  );
}

/**
 * Verifica la connessione con Fatture in Cloud e ritorna le info azienda.
 */
export async function verifyConnection(
  merchantId: string,
): Promise<{ connected: boolean; companyName?: string; error?: string }> {
  try {
    const config = await getFicConfigForMerchant(merchantId);
    if (!config) {
      return { connected: false, error: "Chiavi API non configurate" };
    }

    const result = await ficRequest<{
      data: { name: string; id: number };
    }>(config, "GET", `/c/${config.companyId}/company/info`);

    return {
      connected: true,
      companyName: result.data.name,
    };
  } catch (error) {
    if (error instanceof FicApiError) {
      return { connected: false, error: error.toHumanMessage() };
    }
    return { connected: false, error: "Errore di connessione" };
  }
}

// ============================================================
// Helper per costruire il payload fattura
// ============================================================

export interface InvoiceBuildParams {
  customerName: string;
  customerVatNumber?: string | null;
  customerFiscalCode?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerProvince?: string | null;
  customerZipCode?: string | null;
  customerCountry?: string;
  customerSdiCode?: string | null;
  customerPecEmail?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatId?: number;
    vatRate?: number;
  }>;
  taxRegime: string;
  vatNature?: string | null;
  bolloAmount?: number;
  notes?: string;
  date?: string; // YYYY-MM-DD
}

/**
 * Costruisce il payload per Fatture in Cloud a partire dai dati normalizzati.
 */
export function buildFicInvoicePayload(
  params: InvoiceBuildParams,
): FicInvoicePayload {
  const date = params.date ?? new Date().toISOString().split("T")[0];

  const items: FicInvoiceItem[] = params.items.map((item) => ({
    name: item.description,
    net_price: item.unitPrice,
    qty: item.quantity,
    vat: {
      id: item.vatId ?? 0, // 0 = IVA da configurare
      value: item.vatRate,
    },
  }));

  const entity: FicInvoicePayload["data"]["entity"] = {
    name: params.customerName,
    address_country: params.customerCountry ?? "IT",
  };

  if (params.customerVatNumber) entity.vat_number = params.customerVatNumber;
  if (params.customerFiscalCode) entity.tax_code = params.customerFiscalCode;
  if (params.customerAddress) entity.address_street = params.customerAddress;
  if (params.customerCity) entity.address_city = params.customerCity;
  if (params.customerProvince)
    entity.address_province = params.customerProvince;
  if (params.customerZipCode)
    entity.address_postal_code = params.customerZipCode;
  if (params.customerSdiCode) entity.ei_code = params.customerSdiCode;
  if (params.customerPecEmail) entity.certified_email = params.customerPecEmail;

  const payload: FicInvoicePayload = {
    data: {
      type: "issued_document",
      entity,
      date,
      items_list: items,
      e_invoice: true,
      currency: { id: "EUR" },
      language: { code: "it" },
    },
  };

  // Bollo virtuale
  if (params.bolloAmount && params.bolloAmount > 0) {
    payload.data.stamp_duty = params.bolloAmount;
  }

  // Note (es. dicitura regime forfettario)
  if (params.notes) {
    payload.data.notes = params.notes;
  }

  return payload;
}
