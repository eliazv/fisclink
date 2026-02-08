/**
 * Webhook Stripe
 *
 * Endpoint: POST /api/webhooks/stripe
 *
 * Riceve gli eventi da Stripe e avvia il workflow di fatturazione.
 * Gestisce:
 * - checkout.session.completed
 * - payment_intent.succeeded
 *
 * Importante: usa il raw body per verificare la firma.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { decryptApiKey } from "@/lib/crypto";
import {
  extractOrderFromCheckoutSession,
  extractOrderFromPaymentIntent,
  type StripeOrderData,
} from "@/lib/stripe/client";
import { enqueueInvoiceProcess, enqueueRefundProcess } from "@/lib/queue";

export const runtime = "nodejs";

// Disabilita il body parser di Next.js per i webhook
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Leggi il raw body
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    // 2. Identifica il merchant dall'header custom o dal webhook endpoint
    // Approccio: ogni merchant ha un webhook endpoint dedicato con il suo ID
    // nel query parameter: /api/webhooks/stripe?merchant=xxx
    const merchantId = request.nextUrl.searchParams.get("merchant");

    if (!merchantId) {
      return NextResponse.json(
        { error: "Missing merchant parameter" },
        { status: 400 },
      );
    }

    // 3. Recupera il webhook secret del merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId, isActive: true },
      select: {
        id: true,
        stripeWebhookSecretEnc: true,
        stripeApiKeyEnc: true,
        taxRegime: true,
      },
    });

    if (!merchant?.stripeWebhookSecretEnc) {
      return NextResponse.json(
        { error: "Merchant not found or not configured" },
        { status: 404 },
      );
    }

    const webhookSecret = decryptApiKey(merchant.stripeWebhookSecretEnc);
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Invalid webhook configuration" },
        { status: 500 },
      );
    }

    // 4. Verifica la firma del webhook
    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid signature";
      console.error("[Webhook] Signature verification failed:", message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 },
      );
    }

    // 5. Gestisci gli eventi rilevanti
    let orderData: StripeOrderData | null = null;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Solo se il pagamento è stato completato
        if (session.payment_status === "paid") {
          orderData = extractOrderFromCheckoutSession(session);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        orderData = extractOrderFromPaymentIntent(paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        return await handleRefund(charge, merchant.id);
      }

      default:
        // Evento non gestito → 200 OK (Stripe non ritenta)
        return NextResponse.json({ received: true, handled: false });
    }

    if (!orderData) {
      return NextResponse.json({ received: true, handled: false });
    }

    // 6. Idempotenza: controlla se la fattura esiste già
    const existing = await prisma.invoice.findUnique({
      where: {
        merchantId_sourceType_sourceId: {
          merchantId: merchant.id,
          sourceType: "STRIPE",
          sourceId: orderData.paymentIntentId,
        },
      },
    });

    if (existing) {
      // Fattura già processata → 200 OK
      return NextResponse.json({
        received: true,
        handled: true,
        invoiceId: existing.id,
        note: "Already processed (idempotent)",
      });
    }

    // 7. Cerca o crea il customer
    let customerId: string | undefined;
    if (orderData.customerEmail) {
      const customer = await prisma.customer.upsert({
        where: {
          merchantId_email: {
            merchantId: merchant.id,
            email: orderData.customerEmail,
          },
        },
        update: {
          name: orderData.customerName ?? undefined,
          fiscalCode: orderData.fiscalCode ?? undefined,
          vatNumber: orderData.vatNumber ?? undefined,
          address: orderData.address?.line1 ?? undefined,
          city: orderData.address?.city ?? undefined,
          province: orderData.address?.state ?? undefined,
          zipCode: orderData.address?.postalCode ?? undefined,
          country: orderData.address?.country ?? undefined,
        },
        create: {
          merchantId: merchant.id,
          email: orderData.customerEmail,
          name: orderData.customerName,
          fiscalCode: orderData.fiscalCode,
          vatNumber: orderData.vatNumber,
          address: orderData.address?.line1,
          city: orderData.address?.city,
          province: orderData.address?.state,
          zipCode: orderData.address?.postalCode,
          country: orderData.address?.country ?? "IT",
          customerType: orderData.vatNumber ? "BUSINESS" : "PRIVATE",
        },
      });
      customerId = customer.id;
    }

    // 8. Crea il record fattura
    const invoice = await prisma.invoice.create({
      data: {
        merchantId: merchant.id,
        customerId,
        sourceType: "STRIPE",
        sourceId: orderData.paymentIntentId,
        sourceData: JSON.parse(JSON.stringify(orderData)),
        status: "VALIDATING",
        amount: orderData.amount / 100, // Stripe usa centesimi
        currency: orderData.currency,
        description: orderData.description,
      },
    });

    // 9. Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        invoiceId: invoice.id,
        action: "WEBHOOK_RECEIVED",
        details: `Pagamento Stripe ricevuto: ${(orderData.amount / 100).toFixed(2)} ${orderData.currency}`,
        metadata: {
          eventType: event.type,
          paymentIntentId: orderData.paymentIntentId,
          customerEmail: orderData.customerEmail,
        },
      },
    });

    // 10. Accoda il job di elaborazione
    await enqueueInvoiceProcess({
      invoiceId: invoice.id,
      merchantId: merchant.id,
      sourceType: "STRIPE",
      sourceId: orderData.paymentIntentId,
    });

    return NextResponse.json({
      received: true,
      handled: true,
      invoiceId: invoice.id,
    });
  } catch (error) {
    console.error("[Webhook] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ============================================================
// Handler Rimborsi → Nota di Credito
// ============================================================

async function handleRefund(
  charge: Stripe.Charge,
  merchantId: string,
): Promise<NextResponse> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    return NextResponse.json({
      received: true,
      handled: false,
      note: "No payment_intent on charge",
    });
  }

  // Trova la fattura originale per questo payment_intent
  const originalInvoice = await prisma.invoice.findUnique({
    where: {
      merchantId_sourceType_sourceId: {
        merchantId,
        sourceType: "STRIPE",
        sourceId: paymentIntentId,
      },
    },
  });

  if (!originalInvoice) {
    return NextResponse.json({
      received: true,
      handled: false,
      note: "No matching invoice for refund",
    });
  }

  // Processa ogni refund sulla charge
  const refunds = charge.refunds?.data ?? [];
  const results: string[] = [];

  for (const refund of refunds) {
    // Idempotenza: controlla se la credit note esiste già
    const existing = await prisma.creditNote.findUnique({
      where: {
        merchantId_sourceType_sourceRefundId: {
          merchantId,
          sourceType: "STRIPE",
          sourceRefundId: refund.id,
        },
      },
    });

    if (existing) {
      results.push(`${refund.id}: already processed`);
      continue;
    }

    // Crea il record CreditNote
    const creditNote = await prisma.creditNote.create({
      data: {
        merchantId,
        originalInvoiceId: originalInvoice.id,
        sourceType: "STRIPE",
        sourceRefundId: refund.id,
        sourceData: JSON.parse(JSON.stringify(refund)),
        amount: refund.amount / 100, // Stripe usa centesimi
        currency: refund.currency,
        reason: refund.reason ?? "Rimborso Stripe",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        merchantId,
        invoiceId: originalInvoice.id,
        action: "REFUND_RECEIVED",
        details: `Rimborso Stripe ricevuto: ${(refund.amount / 100).toFixed(2)} ${refund.currency}`,
        metadata: {
          refundId: refund.id,
          creditNoteId: creditNote.id,
          chargeId: charge.id,
        },
      },
    });

    // Accoda il job per creare la Nota di Credito su FiC
    await enqueueRefundProcess({
      creditNoteId: creditNote.id,
      merchantId,
      originalInvoiceId: originalInvoice.id,
      stripeRefundId: refund.id,
      amount: refund.amount / 100,
    });

    results.push(`${refund.id}: queued`);
  }

  return NextResponse.json({
    received: true,
    handled: true,
    refunds: results,
  });
}
