/**
 * Client Stripe - Gestione webhook e pagamenti
 */

import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { decryptApiKey } from "@/lib/crypto";

/**
 * Crea un client Stripe per un merchant specifico.
 */
export function createStripeClient(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
}

/**
 * Recupera il client Stripe per un merchant dal database.
 */
export async function getStripeClientForMerchant(
  merchantId: string,
): Promise<Stripe | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { stripeApiKeyEnc: true },
  });

  if (!merchant?.stripeApiKeyEnc) return null;

  const apiKey = decryptApiKey(merchant.stripeApiKeyEnc);
  if (!apiKey) return null;

  return createStripeClient(apiKey);
}

/**
 * Verifica la firma del webhook Stripe.
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  return Stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Estrae i dati rilevanti da un evento checkout.session.completed o payment_intent.succeeded.
 */
export interface StripeOrderData {
  paymentIntentId: string;
  customerEmail: string | null;
  customerName: string | null;
  amount: number; // in centesimi
  currency: string;
  description: string | null;
  metadata: Record<string, string>;
  // Dati fiscali (se presenti nei metadata di Stripe)
  fiscalCode: string | null;
  vatNumber: string | null;
  address: {
    line1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
}

/**
 * Estrae i dati dell'ordine da un PaymentIntent completato.
 */
export function extractOrderFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): StripeOrderData {
  const metadata = (paymentIntent.metadata ?? {}) as Record<string, string>;

  // Cerca dati fiscali nei metadata di Stripe
  const fiscalCode =
    metadata.fiscal_code || metadata.codice_fiscale || metadata.cf || null;

  const vatNumber =
    metadata.vat_number || metadata.partita_iva || metadata.piva || null;

  return {
    paymentIntentId: paymentIntent.id,
    customerEmail:
      typeof paymentIntent.receipt_email === "string"
        ? paymentIntent.receipt_email
        : null,
    customerName: null, // PaymentIntent non ha il nome direttamente
    amount: paymentIntent.amount,
    currency: paymentIntent.currency.toUpperCase(),
    description: paymentIntent.description,
    metadata,
    fiscalCode,
    vatNumber,
    address: null,
  };
}

/**
 * Estrae i dati dell'ordine da una checkout.session completata.
 */
export function extractOrderFromCheckoutSession(
  session: Stripe.Checkout.Session,
): StripeOrderData {
  const metadata = (session.metadata ?? {}) as Record<string, string>;

  const fiscalCode =
    metadata.fiscal_code || metadata.codice_fiscale || metadata.cf || null;

  const vatNumber =
    metadata.vat_number || metadata.partita_iva || metadata.piva || null;

  const customerDetails = session.customer_details;

  return {
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? session.id),
    customerEmail: customerDetails?.email ?? null,
    customerName: customerDetails?.name ?? null,
    amount: session.amount_total ?? 0,
    currency: (session.currency ?? "EUR").toUpperCase(),
    description: null,
    metadata,
    fiscalCode,
    vatNumber,
    address: customerDetails?.address
      ? {
          line1: customerDetails.address.line1 ?? null,
          city: customerDetails.address.city ?? null,
          state: customerDetails.address.state ?? null,
          postalCode: customerDetails.address.postal_code ?? null,
          country: customerDetails.address.country ?? null,
        }
      : null,
  };
}
