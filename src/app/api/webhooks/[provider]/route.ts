// ============================================================
// Webhook Multi-Provider - /api/webhooks/[provider]
// ============================================================
// Gestisce webhook da Stripe, Shopify, WooCommerce, PayPal
// attraverso un unico endpoint dinamico.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSupportedProvider } from "@/lib/providers";
import { verifyStripeWebhook, extractOrderFromCheckoutSession, extractOrderFromPaymentIntent } from "@/lib/stripe/client";
import { verifyShopifyWebhook, extractOrderFromShopifyWebhook } from "@/lib/shopify/client";
import { verifyWooCommerceWebhook, extractOrderFromWooCommerceWebhook } from "@/lib/woocommerce/client";
import { decryptApiKey } from "@/lib/crypto";
import { enqueueInvoiceProcess, enqueueRefundProcess } from "@/lib/queue";
import type { SourceType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!isSupportedProvider(provider)) {
    return NextResponse.json(
      { error: `Provider '${provider}' non supportato. Supportati: stripe, shopify, woocommerce, paypal` },
      { status: 400 },
    );
  }

  try {
    const body = await req.text();

    switch (provider) {
      case "stripe":
        return handleStripeWebhook(req, body);
      case "shopify":
        return handleShopifyWebhook(req, body);
      case "woocommerce":
        return handleWooCommerceWebhook(req, body);
      case "paypal":
        return NextResponse.json(
          { error: "PayPal integration coming soon" },
          { status: 501 },
        );
      default:
        return NextResponse.json({ error: "Provider sconosciuto" }, { status: 400 });
    }
  } catch (error) {
    console.error(`Webhook ${provider} error:`, error);
    return NextResponse.json(
      { error: "Errore nell'elaborazione del webhook" },
      { status: 500 },
    );
  }
}

// ============================================================
// STRIPE HANDLER
// ============================================================
async function handleStripeWebhook(req: NextRequest, body: string) {
  // Cerca tutti i merchant con Stripe configurato
  const merchants = await prisma.merchant.findMany({
    where: {
      isActive: true,
      stripeWebhookSecretEnc: { not: null },
    },
  });

  for (const merchant of merchants) {
    try {
      const webhookSecret = await decryptApiKey(merchant.stripeWebhookSecretEnc!);
      const sig = req.headers.get("stripe-signature");
      if (!sig) continue;

      const event = verifyStripeWebhook(body, sig, webhookSecret);
      if (!event) continue;

      // Evento verificato per questo merchant
      await processStripeEvent(event, merchant.id);

      return NextResponse.json({ received: true, provider: "stripe", merchantId: merchant.id });
    } catch {
      // Non è per questo merchant, prova il prossimo
      continue;
    }
  }

  return NextResponse.json({ error: "Nessun merchant corrisponde" }, { status: 400 });
}

async function processStripeEvent(event: { type: string; data: { object: Record<string, unknown> } }, merchantId: string) {
  const obj = event.data.object;

  if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
    const orderData = event.type === "checkout.session.completed"
      ? extractOrderFromCheckoutSession(obj)
      : extractOrderFromPaymentIntent(obj);

    if (!orderData) return;

    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: { merchantId_email: { merchantId, email: orderData.customerEmail } },
      create: {
        merchantId,
        email: orderData.customerEmail,
        name: orderData.customerName,
        fiscalCode: orderData.fiscalCode,
        vatNumber: orderData.vatNumber,
        sdiCode: orderData.sdiCode,
        address: orderData.address,
        city: orderData.city,
        province: orderData.province,
        zipCode: orderData.zipCode,
        country: orderData.country || "IT",
        customerType: orderData.vatNumber ? "BUSINESS" : "PRIVATE",
      },
      update: {
        name: orderData.customerName || undefined,
        fiscalCode: orderData.fiscalCode || undefined,
        vatNumber: orderData.vatNumber || undefined,
      },
    });

    // Create invoice (idempotent)
    const invoice = await prisma.invoice.create({
      data: {
        merchantId,
        customerId: customer.id,
        sourceType: "STRIPE" as SourceType,
        sourceId: orderData.sourceId,
        amount: orderData.amount,
        currency: orderData.currency,
        description: orderData.description || `Ordine ${orderData.sourceId}`,
        lineItems: orderData.lineItems as unknown as Record<string, unknown>,
        status: "VALIDATING",
      },
    }).catch(() => null); // Ignora duplicati (idempotenza)

    if (invoice) {
      await enqueueInvoiceProcess(invoice.id);
      await prisma.auditLog.create({
        data: {
          merchantId,
          invoiceId: invoice.id,
          action: "WEBHOOK_RECEIVED",
          details: `Stripe ${event.type} → Fattura creata`,
          level: "INFO",
        },
      });
    }
  }

  if (event.type === "charge.refunded") {
    await processRefund(merchantId, "STRIPE", obj);
  }
}

// ============================================================
// SHOPIFY HANDLER
// ============================================================
async function handleShopifyWebhook(req: NextRequest, body: string) {
  const shopDomain = req.headers.get("x-shopify-shop-domain");
  const topic = req.headers.get("x-shopify-topic");
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

  if (!shopDomain || !topic || !hmacHeader) {
    return NextResponse.json({ error: "Header Shopify mancanti" }, { status: 400 });
  }

  // Trova merchant per domain
  // In futuro: aggiungere campo shopifyDomain al merchant
  const merchants = await prisma.merchant.findMany({
    where: { isActive: true },
  });

  for (const merchant of merchants) {
    // Verifica firma webhook (il secret è memorizzato come shopifyWebhookSecretEnc)
    // Per ora: verifica se il merchant ha Shopify configurato
    // TODO: aggiungere shopifyWebhookSecretEnc al schema Merchant
    try {
      const verified = verifyShopifyWebhook(body, hmacHeader, process.env.SHOPIFY_WEBHOOK_SECRET || "");
      if (!verified) continue;

      const payload = JSON.parse(body);

      if (topic === "orders/paid" || topic === "orders/create") {
        const orderData = extractOrderFromShopifyWebhook(payload);
        await processNormalizedOrder(merchant.id, "SHOPIFY", orderData);
      }

      if (topic === "refunds/create") {
        await processRefund(merchant.id, "SHOPIFY", payload);
      }

      return NextResponse.json({ received: true, provider: "shopify" });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ received: true });
}

// ============================================================
// WOOCOMMERCE HANDLER
// ============================================================
async function handleWooCommerceWebhook(req: NextRequest, body: string) {
  const signature = req.headers.get("x-wc-webhook-signature");
  const source = req.headers.get("x-wc-webhook-source");
  const topic = req.headers.get("x-wc-webhook-topic");

  if (!signature || !topic) {
    return NextResponse.json({ error: "Header WooCommerce mancanti" }, { status: 400 });
  }

  // Verifica firma
  const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || "";
  const verified = verifyWooCommerceWebhook(body, signature, webhookSecret);
  if (!verified) {
    return NextResponse.json({ error: "Firma webhook non valida" }, { status: 401 });
  }

  const payload = JSON.parse(body);

  // Trova merchant per source URL
  // TODO: matching merchant per store URL
  const merchant = await prisma.merchant.findFirst({
    where: { isActive: true },
  });

  if (!merchant) {
    return NextResponse.json({ error: "Merchant non trovato" }, { status: 404 });
  }

  if (topic === "order.completed" || topic === "order.payment_complete") {
    const orderData = extractOrderFromWooCommerceWebhook(payload);
    await processNormalizedOrder(merchant.id, "WOOCOMMERCE" as SourceType, orderData);
  }

  if (topic === "order.refunded") {
    await processRefund(merchant.id, "WOOCOMMERCE" as SourceType, payload);
  }

  return NextResponse.json({ received: true, provider: "woocommerce", source });
}

// ============================================================
// SHARED HELPERS
// ============================================================

interface NormalizedOrder {
  sourceId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  company: string | null;
  fiscalCode: string | null;
  vatNumber: string | null;
  sdiCode: string | null;
  pecEmail?: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  zipCode: string | null;
  country: string;
  lineItems: unknown[];
  metadata: Record<string, unknown>;
}

async function processNormalizedOrder(
  merchantId: string,
  sourceType: SourceType,
  data: NormalizedOrder,
) {
  // Upsert customer
  const customer = await prisma.customer.upsert({
    where: { merchantId_email: { merchantId, email: data.customerEmail } },
    create: {
      merchantId,
      email: data.customerEmail,
      name: data.customerName,
      fiscalCode: data.fiscalCode,
      vatNumber: data.vatNumber,
      sdiCode: data.sdiCode,
      pecEmail: data.pecEmail,
      address: data.address,
      city: data.city,
      province: data.province,
      zipCode: data.zipCode,
      country: data.country,
      customerType: data.vatNumber ? "BUSINESS" : (data.country !== "IT" ? "FOREIGN" : "PRIVATE"),
    },
    update: {
      name: data.customerName || undefined,
      fiscalCode: data.fiscalCode || undefined,
      vatNumber: data.vatNumber || undefined,
    },
  });

  // Create invoice (idempotent)
  const invoice = await prisma.invoice.create({
    data: {
      merchantId,
      customerId: customer.id,
      sourceType,
      sourceId: data.sourceId,
      amount: data.amount,
      currency: data.currency,
      description: `Ordine ${data.sourceId}`,
      lineItems: data.lineItems as unknown as Record<string, unknown>,
      sourceData: data.metadata as Record<string, unknown>,
      status: "VALIDATING",
    },
  }).catch(() => null);

  if (invoice) {
    await enqueueInvoiceProcess(invoice.id);
    await prisma.auditLog.create({
      data: {
        merchantId,
        invoiceId: invoice.id,
        action: "WEBHOOK_RECEIVED",
        details: `${sourceType} webhook → Fattura creata`,
        level: "INFO",
      },
    });
  }
}

async function processRefund(
  merchantId: string,
  sourceType: SourceType,
  data: Record<string, unknown>,
) {
  // Estrai refund ID e amount in base al provider
  let refundId: string;
  let refundAmount: number;
  let originalSourceId: string;
  let reason: string | undefined;

  if (sourceType === "STRIPE") {
    refundId = data.id as string;
    refundAmount = ((data.amount_refunded || data.amount) as number) / 100;
    originalSourceId = (data.payment_intent as string) || (data.id as string);
    reason = data.reason as string | undefined;
  } else if (sourceType === "SHOPIFY") {
    refundId = `shopify_refund_${data.id}`;
    refundAmount = parseFloat((data.transactions as Array<{ amount: string }>)?.[0]?.amount || "0");
    originalSourceId = `shopify_${data.order_id}`;
    reason = data.note as string | undefined;
  } else {
    refundId = `woo_refund_${data.id}`;
    refundAmount = parseFloat(data.amount as string || "0");
    originalSourceId = `woo_${data.order_id || data.parent_id}`;
    reason = data.reason as string | undefined;
  }

  // Trova fattura originale
  const originalInvoice = await prisma.invoice.findFirst({
    where: { merchantId, sourceId: originalSourceId },
  });

  if (!originalInvoice) {
    console.warn(`Refund: fattura originale non trovata per ${originalSourceId}`);
    return;
  }

  // Crea credit note (idempotent)
  const creditNote = await prisma.creditNote.create({
    data: {
      merchantId,
      originalInvoiceId: originalInvoice.id,
      sourceType,
      sourceRefundId: refundId,
      amount: refundAmount,
      currency: originalInvoice.currency,
      reason,
      status: "PENDING",
    },
  }).catch(() => null);

  if (creditNote) {
    await enqueueRefundProcess(creditNote.id);
    await prisma.auditLog.create({
      data: {
        merchantId,
        invoiceId: originalInvoice.id,
        action: "REFUND_RECEIVED",
        details: `${sourceType} rimborso €${refundAmount} → Nota di credito creata`,
        level: "INFO",
      },
    });
  }
}
