// ============================================================
// WooCommerce Client - Integrazione WooCommerce REST API
// ============================================================

import crypto from "crypto";

export interface WooCommerceConfig {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  total_tax: string;
  date_created: string;
  payment_method: string;
  payment_method_title: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    subtotal: string;
    total: string;
    total_tax: string;
    sku: string;
    price: number;
  }>;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
  refunds: Array<{
    id: number;
    reason: string;
    total: string;
  }>;
}

export interface WooCommerceRefund {
  id: number;
  date_created: string;
  amount: string;
  reason: string;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
}

/**
 * Client per WooCommerce REST API v3
 */
export class WooCommerceClient {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(config: WooCommerceConfig) {
    this.baseUrl = config.storeUrl.replace(/\/$/, "");
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
  }

  /**
   * Recupera un ordine per ID
   */
  async getOrder(orderId: number): Promise<WooCommerceOrder> {
    return this.request<WooCommerceOrder>(`/wp-json/wc/v3/orders/${orderId}`);
  }

  /**
   * Recupera rimborsi di un ordine
   */
  async getRefunds(orderId: number): Promise<WooCommerceRefund[]> {
    return this.request<WooCommerceRefund[]>(
      `/wp-json/wc/v3/orders/${orderId}/refunds`,
    );
  }

  /**
   * Verifica la connessione WooCommerce
   */
  async verifyConnection(): Promise<{ success: boolean; storeName?: string; error?: string }> {
    try {
      const data = await this.request<{ name: string }>(`/wp-json/wc/v3/system_status`);
      return { success: true, storeName: data?.name };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connessione fallita",
      };
    }
  }

  private async request<T>(path: string): Promise<T> {
    const url = new URL(path, this.baseUrl);
    url.searchParams.set("consumer_key", this.consumerKey);
    url.searchParams.set("consumer_secret", this.consumerSecret);

    const response = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(
        `WooCommerce API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }
}

/**
 * Verifica la firma del webhook WooCommerce.
 * WooCommerce usa HMAC-SHA256 con il webhook secret.
 */
export function verifyWooCommerceWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Estrae dati ordine da un webhook WooCommerce per creare fattura
 */
export function extractOrderFromWooCommerceWebhook(payload: WooCommerceOrder) {
  const billing = payload.billing;

  // Cerca dati fiscali nei meta_data
  const meta = payload.meta_data || [];
  const findMeta = (keys: string[]): string | null => {
    for (const key of keys) {
      const found = meta.find(
        (m) => m.key.toLowerCase() === key.toLowerCase(),
      );
      if (found?.value) return found.value;
    }
    return null;
  };

  const fiscalCode = findMeta([
    "codice_fiscale",
    "fiscal_code",
    "cf",
    "_billing_codice_fiscale",
    "_billing_cf",
  ]);

  const vatNumber = findMeta([
    "partita_iva",
    "vat_number",
    "piva",
    "_billing_partita_iva",
    "_billing_vat_number",
    "_billing_piva",
    "billing_eu_vat_number",
  ]);

  const sdiCode = findMeta([
    "codice_sdi",
    "sdi_code",
    "_billing_codice_sdi",
    "codice_destinatario",
  ]);

  const pecEmail = findMeta([
    "pec",
    "pec_email",
    "_billing_pec",
    "_billing_pec_email",
  ]);

  return {
    sourceId: `woo_${payload.id}`,
    amount: parseFloat(payload.total),
    currency: payload.currency.toUpperCase(),
    customerEmail: billing.email,
    customerName: `${billing.first_name} ${billing.last_name}`.trim(),
    company: billing.company || null,
    fiscalCode,
    vatNumber,
    sdiCode,
    pecEmail,
    address: billing.address_1,
    city: billing.city,
    province: billing.state,
    zipCode: billing.postcode,
    country: billing.country || "IT",
    lineItems: payload.line_items.map((item) => ({
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: parseFloat(item.total),
      tax: parseFloat(item.total_tax),
      sku: item.sku,
    })),
    metadata: {
      wooOrderNumber: payload.number,
      wooOrderId: payload.id,
      paymentMethod: payload.payment_method,
    },
  };
}
