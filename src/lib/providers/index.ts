// ============================================================
// Provider Registry - Gestione multi-provider webhooks
// ============================================================
// Ogni provider (Stripe, Shopify, WooCommerce, PayPal) ha un handler
// che verifica la firma del webhook, estrae i dati e li normalizza.

import type { NextRequest } from "next/server";

export type ProviderType = "stripe" | "shopify" | "woocommerce" | "paypal";

export interface NormalizedOrderData {
  sourceType: "STRIPE" | "SHOPIFY" | "WOOCOMMERCE" | "PAYPAL";
  sourceId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  company: string | null;
  fiscalCode: string | null;
  vatNumber: string | null;
  sdiCode: string | null;
  pecEmail: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  zipCode: string | null;
  country: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    tax: number;
    sku?: string;
  }>;
  metadata: Record<string, unknown>;
  isRefund: boolean;
  refundData?: {
    originalSourceId: string;
    refundId: string;
    amount: number;
    reason?: string;
  };
}

export interface WebhookResult {
  success: boolean;
  event: string;
  orders: NormalizedOrderData[];
  merchantId?: string; // Se il provider manda il merchant (es. nel metadata)
  error?: string;
}

export interface ProviderHandler {
  /** Verifica la firma del webhook */
  verifySignature(
    req: NextRequest,
    body: string,
    secret: string,
  ): Promise<boolean>;
  /** Processa il webhook e restituisce dati normalizzati */
  processWebhook(req: NextRequest, body: string): Promise<WebhookResult>;
}

/**
 * Verifica se un provider è supportato
 */
export function isSupportedProvider(
  provider: string,
): provider is ProviderType {
  return ["stripe", "shopify", "woocommerce", "paypal"].includes(
    provider.toLowerCase(),
  );
}

/**
 * Mappa il tipo provider al SourceType del DB
 */
export function providerToSourceType(
  provider: ProviderType,
): "STRIPE" | "SHOPIFY" | "WOOCOMMERCE" | "PAYPAL" {
  const map: Record<
    ProviderType,
    "STRIPE" | "SHOPIFY" | "WOOCOMMERCE" | "PAYPAL"
  > = {
    stripe: "STRIPE",
    shopify: "SHOPIFY",
    woocommerce: "WOOCOMMERCE",
    paypal: "PAYPAL",
  };
  return map[provider];
}
