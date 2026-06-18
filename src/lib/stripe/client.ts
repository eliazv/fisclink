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
 * Dati normalizzati che FiscLink usa per aprire il workflow fiscale.
 *
 * Nota: il campo paymentIntentId è mantenuto per compatibilità storica, ma per
 * eventi Stripe Billing può contenere anche l'id della Stripe Invoice.
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

function getFiscalCode(metadata: Record<string, string>): string | null {
  return metadata.fiscal_code || metadata.codice_fiscale || metadata.cf || null;
}

function getVatNumber(metadata: Record<string, string>): string | null {
  return metadata.vat_number || metadata.partita_iva || metadata.piva || null;
}

/**
 * Estrae i dati dell'ordine da un PaymentIntent completato.
 */
export function extractOrderFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): StripeOrderData {
  const metadata = (paymentIntent.metadata ?? {}) as Record<string, string>;

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
    fiscalCode: getFiscalCode(metadata),
    vatNumber: getVatNumber(metadata),
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
    fiscalCode: getFiscalCode(metadata),
    vatNumber: getVatNumber(metadata),
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

/**
 * Estrae i dati da una Stripe Invoice pagata.
 *
 * Questo è l'evento più utile per abbonamenti Stripe Billing: preserva l'id
 * della invoice ricorrente, l'importo effettivamente pagato e le righe fattura.
 */
export function extractOrderFromInvoice(invoice: Stripe.Invoice): StripeOrderData {
  const metadata = (invoice.metadata ?? {}) as Record<string, string>;
  const firstLine = invoice.lines?.data?.[0];
  const customerAddress = invoice.customer_address;

  return {
    paymentIntentId: invoice.id,
    customerEmail: invoice.customer_email ?? null,
    customerName: invoice.customer_name ?? null,
    amount: invoice.amount_paid ?? invoice.total ?? 0,
    currency: (invoice.currency ?? "EUR").toUpperCase(),
    description: firstLine?.description ?? invoice.description ?? null,
    metadata,
    fiscalCode: getFiscalCode(metadata),
    vatNumber: getVatNumber(metadata),
    address: customerAddress
      ? {
          line1: customerAddress.line1 ?? null,
          city: customerAddress.city ?? null,
          state: customerAddress.state ?? null,
          postalCode: customerAddress.postal_code ?? null,
          country: customerAddress.country ?? null,
        }
      : null,
  };
}
