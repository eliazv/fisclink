// ============================================================
// Shopify Client - Integrazione Shopify Admin API
// ============================================================

import crypto from "crypto";

export interface ShopifyConfig {
  shopDomain: string;      // es. "myshop.myshopify.com"
  accessToken: string;     // Admin API access token
  apiVersion?: string;     // es. "2025-01"
}

export interface ShopifyOrder {
  id: number;
  name: string;                    // "#1001"
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  currency: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  gateway: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  billing_address: {
    first_name: string;
    last_name: string;
    company: string | null;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    province_code: string;
    zip: string;
    country: string;
    country_code: string;
    phone: string | null;
  };
  shipping_address?: {
    first_name: string;
    last_name: string;
    company: string | null;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    province_code: string;
    zip: string;
    country: string;
    country_code: string;
  };
  line_items: Array<{
    id: number;
    title: string;
    variant_title: string;
    quantity: number;
    price: string;
    total_discount: string;
    sku: string;
    variant_id: number;
    product_id: number;
    tax_lines: Array<{
      title: string;
      price: string;
      rate: number;
    }>;
  }>;
  note_attributes: Array<{
    name: string;
    value: string;
  }>;
  refunds: Array<{
    id: number;
    created_at: string;
    note: string | null;
    refund_line_items: Array<{
      id: number;
      quantity: number;
      line_item_id: number;
      subtotal: string;
      total_tax: string;
    }>;
    transactions: Array<{
      id: number;
      amount: string;
      kind: string;
      gateway: string;
    }>;
  }>;
}

export interface ShopifyRefund {
  id: number;
  order_id: number;
  created_at: string;
  note: string | null;
  refund_line_items: Array<{
    id: number;
    quantity: number;
    subtotal: string;
    total_tax: string;
  }>;
  transactions: Array<{
    id: number;
    amount: string;
    kind: string;
  }>;
}

/**
 * Client per Shopify Admin REST API
 */
export class ShopifyClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(config: ShopifyConfig) {
    const apiVersion = config.apiVersion || "2025-01";
    this.baseUrl = `https://${config.shopDomain}/admin/api/${apiVersion}`;
    this.accessToken = config.accessToken;
  }

  /**
   * Recupera un ordine per ID
   */
  async getOrder(orderId: number): Promise<ShopifyOrder> {
    const data = await this.request<{ order: ShopifyOrder }>(
      `/orders/${orderId}.json`,
    );
    return data.order;
  }

  /**
   * Recupera rimborsi di un ordine
   */
  async getRefunds(orderId: number): Promise<ShopifyRefund[]> {
    const data = await this.request<{ refunds: ShopifyRefund[] }>(
      `/orders/${orderId}/refunds.json`,
    );
    return data.refunds;
  }

  /**
   * Verifica la connessione allo shop Shopify
   */
  async verifyConnection(): Promise<{ success: boolean; shopName?: string; error?: string }> {
    try {
      const data = await this.request<{ shop: { name: string } }>("/shop.json");
      return { success: true, shopName: data.shop.name };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connessione fallita",
      };
    }
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(
        `Shopify API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }
}

/**
 * Verifica la firma del webhook Shopify.
 * Shopify usa HMAC-SHA256 con base64.
 */
export function verifyShopifyWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    return false;
  }
}

/**
 * Estrae dati ordine da un webhook Shopify per creare fattura
 */
export function extractOrderFromShopifyWebhook(payload: ShopifyOrder) {
  const billing = payload.billing_address;
  const notes = payload.note_attributes || [];

  const findNote = (keys: string[]): string | null => {
    for (const key of keys) {
      const found = notes.find(
        (n) => n.name.toLowerCase() === key.toLowerCase(),
      );
      if (found?.value) return found.value;
    }
    return null;
  };

  const fiscalCode = findNote([
    "codice_fiscale",
    "fiscal_code",
    "cf",
    "Codice Fiscale",
  ]);

  const vatNumber = findNote([
    "partita_iva",
    "vat_number",
    "piva",
    "Partita IVA",
    "P.IVA",
  ]);

  const sdiCode = findNote([
    "codice_sdi",
    "sdi_code",
    "Codice SDI",
    "codice_destinatario",
  ]);

  const pecEmail = findNote([
    "pec",
    "pec_email",
    "PEC",
  ]);

  return {
    sourceId: `shopify_${payload.id}`,
    amount: parseFloat(payload.total_price),
    currency: payload.currency.toUpperCase(),
    customerEmail: payload.email || payload.customer?.email,
    customerName: billing
      ? `${billing.first_name} ${billing.last_name}`.trim()
      : `${payload.customer?.first_name || ""} ${payload.customer?.last_name || ""}`.trim(),
    company: billing?.company || null,
    fiscalCode,
    vatNumber,
    sdiCode,
    pecEmail,
    address: billing?.address1 || null,
    city: billing?.city || null,
    province: billing?.province_code || null,
    zipCode: billing?.zip || null,
    country: billing?.country_code || "IT",
    lineItems: payload.line_items.map((item) => ({
      description: item.title + (item.variant_title ? ` - ${item.variant_title}` : ""),
      quantity: item.quantity,
      unitPrice: parseFloat(item.price),
      totalPrice: parseFloat(item.price) * item.quantity - parseFloat(item.total_discount),
      tax: item.tax_lines.reduce((sum, t) => sum + parseFloat(t.price), 0),
      sku: item.sku,
    })),
    metadata: {
      shopifyOrderName: payload.name,
      shopifyOrderId: payload.id,
      shopifyOrderNumber: payload.order_number,
      gateway: payload.gateway,
    },
  };
}
