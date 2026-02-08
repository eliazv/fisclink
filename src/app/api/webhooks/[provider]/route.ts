// ============================================================
// Webhook Multi-Provider - /api/webhooks/[provider]
// ============================================================
// Gestisce webhook da Stripe, Shopify, WooCommerce, PayPal
// attraverso un unico endpoint dinamico.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSupportedProvider } from "@/lib/providers";
import {
  verifyStripeWebhook,
  extractOrderFromCheckoutSession,
  extractOrderFromPaymentIntent,
} from "@/lib/stripe/client";
import {
  verifyShopifyWebhook,
  extractOrderFromShopifyWebhook,
} from "@/lib/shopify/client";
import {
  verifyWooCommerceWebhook,
  extractOrderFromWooCommerceWebhook,
} from "@/lib/woocommerce/client";
import { decryptApiKey } from "@/lib/crypto";
import { enqueueInvoiceProcess, enqueueRefundProcess } from "@/lib/queue";
type SourceType = "STRIPE" | "SHOPIFY" | "WOOCOMMERCE" | "PAYPAL";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!isSupportedProvider(provider)) {
    return NextResponse.json(
      {
        error: `Provider '${provider}' non supportato. Supportati: stripe, shopify, woocommerce, paypal`,
      },
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
        return handlePayPalWebhook(req, body);
      default:
        return NextResponse.json(
          { error: "Provider sconosciuto" },
          { status: 400 },
        );
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
      const webhookSecret = await decryptApiKey(
        merchant.stripeWebhookSecretEnc!,
      );
      if (!webhookSecret) continue;
      const sig = req.headers.get("stripe-signature");
      if (!sig) continue;

      const event = verifyStripeWebhook(body, sig, webhookSecret);
      if (!event) continue;

      // Evento verificato per questo merchant
      await processStripeEvent(event, merchant.id);

      return NextResponse.json({
        received: true,
        provider: "stripe",
        merchantId: merchant.id,
      });
    } catch {
      // Non è per questo merchant, prova il prossimo
      continue;
    }
  }

  return NextResponse.json(
    { error: "Nessun merchant corrisponde" },
    { status: 400 },
  );
}

async function processStripeEvent(
  event: { type: string; data: { object: unknown } },
  merchantId: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = event.data.object as any;

  if (
    event.type === "checkout.session.completed" ||
    event.type === "payment_intent.succeeded"
  ) {
    const orderData =
      event.type === "checkout.session.completed"
        ? extractOrderFromCheckoutSession(obj)
        : extractOrderFromPaymentIntent(obj);

    if (!orderData || !orderData.customerEmail) return;

    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: {
        merchantId_email: { merchantId, email: orderData.customerEmail },
      },
      create: {
        merchantId,
        email: orderData.customerEmail,
        name: orderData.customerName,
        fiscalCode: orderData.fiscalCode,
        vatNumber: orderData.vatNumber,
        address: orderData.address?.line1,
        city: orderData.address?.city,
        province: orderData.address?.state,
        zipCode: orderData.address?.postalCode,
        country: orderData.address?.country || "IT",
        customerType: orderData.vatNumber ? "BUSINESS" : "PRIVATE",
      },
      update: {
        name: orderData.customerName || undefined,
        fiscalCode: orderData.fiscalCode || undefined,
        vatNumber: orderData.vatNumber || undefined,
      },
    });

    // Create invoice (idempotent)
    const invoice = await prisma.invoice
      .create({
        data: {
          merchantId,
          customerId: customer.id,
          sourceType: "STRIPE" as SourceType,
          sourceId: orderData.paymentIntentId,
          amount: orderData.amount / 100, // Stripe usa centesimi
          currency: orderData.currency,
          description:
            orderData.description || `Pagamento ${orderData.paymentIntentId}`,
          sourceData: orderData.metadata as Record<string, unknown>,
          status: "VALIDATING",
        },
      })
      .catch(() => null); // Ignora duplicati (idempotenza)

    if (invoice) {
      await enqueueInvoiceProcess({
        invoiceId: invoice.id,
        merchantId,
        sourceType: "STRIPE",
        sourceId: orderData.paymentIntentId,
      });
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
    return NextResponse.json(
      { error: "Header Shopify mancanti" },
      { status: 400 },
    );
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
      const verified = verifyShopifyWebhook(
        body,
        hmacHeader,
        process.env.SHOPIFY_WEBHOOK_SECRET || "",
      );
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
    return NextResponse.json(
      { error: "Header WooCommerce mancanti" },
      { status: 400 },
    );
  }

  // Verifica firma
  const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || "";
  const verified = verifyWooCommerceWebhook(body, signature, webhookSecret);
  if (!verified) {
    return NextResponse.json(
      { error: "Firma webhook non valida" },
      { status: 401 },
    );
  }

  const payload = JSON.parse(body);

  // Trova merchant per source URL
  // TODO: matching merchant per store URL
  const merchant = await prisma.merchant.findFirst({
    where: { isActive: true },
  });

  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant non trovato" },
      { status: 404 },
    );
  }

  if (topic === "order.completed" || topic === "order.payment_complete") {
    const orderData = extractOrderFromWooCommerceWebhook(payload);
    await processNormalizedOrder(
      merchant.id,
      "WOOCOMMERCE" as SourceType,
      orderData,
    );
  }

  if (topic === "order.refunded") {
    await processRefund(merchant.id, "WOOCOMMERCE" as SourceType, payload);
  }

  return NextResponse.json({ received: true, provider: "woocommerce", source });
}

// ============================================================
// PAYPAL HANDLER
// ============================================================

async function handlePayPalWebhook(req: NextRequest, body: string) {
  // PayPal invia un JSON con event_type e resource
  const payload = JSON.parse(body);
  const eventType = payload.event_type as string;

  // Verifica la firma del webhook PayPal
  // PayPal usa un sistema basato su certificato con transmission-id, timestamp, webhook-id, crc32
  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const certUrl = req.headers.get("paypal-cert-url");
  const transmissionSig = req.headers.get("paypal-transmission-sig");

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl) {
    return NextResponse.json(
      { error: "Header PayPal mancanti" },
      { status: 400 },
    );
  }

  // Per la verifica in produzione: si usa l'API PayPal /v1/notifications/verify-webhook-signature
  // In dev/staging: si può verificare con il webhook ID e i parametri di trasmissione
  const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!paypalWebhookId) {
    console.error("[PayPal] PAYPAL_WEBHOOK_ID non configurato");
    return NextResponse.json(
      { error: "PayPal non configurato" },
      { status: 500 },
    );
  }

  // Verifica firma tramite API PayPal
  const isValid = await verifyPayPalWebhookSignature({
    transmissionId,
    transmissionTime,
    certUrl,
    transmissionSig,
    webhookId: paypalWebhookId,
    body,
  });

  if (!isValid) {
    return NextResponse.json(
      { error: "Firma PayPal non valida" },
      { status: 401 },
    );
  }

  // Trova il merchant (PayPal è single-merchant per webhook ID)
  const merchant = await prisma.merchant.findFirst({
    where: { isActive: true },
  });

  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant non trovato" },
      { status: 404 },
    );
  }

  const resource = payload.resource;

  switch (eventType) {
    case "CHECKOUT.ORDER.APPROVED":
    case "PAYMENT.CAPTURE.COMPLETED": {
      const orderData = extractPayPalOrder(resource, eventType);
      if (orderData) {
        await processNormalizedOrder(merchant.id, "PAYPAL", orderData);
      }
      break;
    }
    case "PAYMENT.CAPTURE.REFUNDED": {
      await processRefund(merchant.id, "PAYPAL", resource);
      break;
    }
    default:
      // Evento non gestito
      break;
  }

  return NextResponse.json({ received: true, provider: "paypal", eventType });
}

/**
 * Verifica la firma webhook PayPal chiamando l'API di verifica
 */
async function verifyPayPalWebhookSignature(params: {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  transmissionSig: string;
  webhookId: string;
  body: string;
}): Promise<boolean> {
  const paypalBaseUrl =
    process.env.PAYPAL_API_URL || "https://api-m.paypal.com";
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[PayPal] Credenziali mancanti");
    return false;
  }

  try {
    // 1. Ottieni access token
    const tokenRes = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) return false;
    const tokenData = await tokenRes.json();

    // 2. Verifica firma
    const verifyRes = await fetch(
      `${paypalBaseUrl}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          auth_algo: "SHA256withRSA",
          cert_url: params.certUrl,
          transmission_id: params.transmissionId,
          transmission_sig: params.transmissionSig,
          transmission_time: params.transmissionTime,
          webhook_id: params.webhookId,
          webhook_event: JSON.parse(params.body),
        }),
      },
    );

    if (!verifyRes.ok) return false;
    const verifyData = await verifyRes.json();
    return verifyData.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[PayPal] Errore verifica firma:", err);
    return false;
  }
}

/**
 * Estrae dati ordine normalizzati da un evento PayPal
 */
function extractPayPalOrder(
  resource: Record<string, unknown>,
  eventType: string,
): NormalizedOrder | null {
  try {
    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      const purchaseUnit = (
        resource.purchase_units as Array<Record<string, unknown>>
      )?.[0];
      if (!purchaseUnit) return null;

      const amount = purchaseUnit.amount as Record<string, unknown>;
      const shipping = purchaseUnit.shipping as
        | Record<string, unknown>
        | undefined;
      const address = shipping?.address as Record<string, unknown> | undefined;
      const payer = resource.payer as Record<string, unknown> | undefined;
      const payerName = payer?.name as Record<string, unknown> | undefined;

      return {
        sourceId: `paypal_${resource.id}`,
        amount: parseFloat((amount?.value as string) || "0"),
        currency: ((amount?.currency_code as string) || "EUR").toUpperCase(),
        customerEmail: (payer?.email_address as string) || "",
        customerName: payerName
          ? `${payerName.given_name || ""} ${payerName.surname || ""}`.trim()
          : "",
        company: null,
        fiscalCode: null,
        vatNumber: null,
        sdiCode: null,
        pecEmail: null,
        address: (address?.address_line_1 as string) || null,
        city: (address?.admin_area_2 as string) || null,
        province: (address?.admin_area_1 as string) || null,
        zipCode: (address?.postal_code as string) || null,
        country: (address?.country_code as string) || "IT",
        lineItems: (
          (purchaseUnit.items as Array<Record<string, unknown>>) || []
        ).map((item) => ({
          description: (item.name as string) || "Prodotto PayPal",
          quantity: parseInt(item.quantity as string, 10) || 1,
          unitPrice: parseFloat(
            (item.unit_amount as Record<string, string>)?.value || "0",
          ),
          totalPrice:
            (parseInt(item.quantity as string, 10) || 1) *
            parseFloat(
              (item.unit_amount as Record<string, string>)?.value || "0",
            ),
          tax: parseFloat((item.tax as Record<string, string>)?.value || "0"),
          sku: item.sku as string | undefined,
        })),
        metadata: { paypal_order_id: resource.id, event_type: eventType },
        isRefund: false,
      };
    }

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const amount = resource.amount as Record<string, unknown>;
      return {
        sourceId: `paypal_capture_${resource.id}`,
        amount: parseFloat((amount?.value as string) || "0"),
        currency: ((amount?.currency_code as string) || "EUR").toUpperCase(),
        customerEmail: "",
        customerName: "",
        company: null,
        fiscalCode: null,
        vatNumber: null,
        sdiCode: null,
        pecEmail: null,
        address: null,
        city: null,
        province: null,
        zipCode: null,
        country: "IT",
        lineItems: [
          {
            description: `Pagamento PayPal ${resource.id}`,
            quantity: 1,
            unitPrice: parseFloat((amount?.value as string) || "0"),
            totalPrice: parseFloat((amount?.value as string) || "0"),
            tax: 0,
          },
        ],
        metadata: { paypal_capture_id: resource.id, event_type: eventType },
        isRefund: false,
      };
    }

    return null;
  } catch (err) {
    console.error("[PayPal] Errore estrazione ordine:", err);
    return null;
  }
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
  isRefund?: boolean;
  refundData?: {
    originalSourceId: string;
    refundId: string;
    amount: number;
    reason?: string;
  };
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
      customerType: data.vatNumber
        ? "BUSINESS"
        : data.country !== "IT"
          ? "FOREIGN"
          : "PRIVATE",
    },
    update: {
      name: data.customerName || undefined,
      fiscalCode: data.fiscalCode || undefined,
      vatNumber: data.vatNumber || undefined,
    },
  });

  // Create invoice (idempotent)
  const invoice = await prisma.invoice
    .create({
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
    })
    .catch(() => null);

  if (invoice) {
    await enqueueInvoiceProcess({
      invoiceId: invoice.id,
      merchantId,
      sourceType: sourceType as "STRIPE" | "SHOPIFY" | "WOOCOMMERCE" | "PAYPAL",
      sourceId: data.sourceId,
    });
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
    refundAmount = parseFloat(
      (data.transactions as Array<{ amount: string }>)?.[0]?.amount || "0",
    );
    originalSourceId = `shopify_${data.order_id}`;
    reason = data.note as string | undefined;
  } else {
    refundId = `woo_refund_${data.id}`;
    refundAmount = parseFloat((data.amount as string) || "0");
    originalSourceId = `woo_${data.order_id || data.parent_id}`;
    reason = data.reason as string | undefined;
  }

  // Trova fattura originale
  const originalInvoice = await prisma.invoice.findFirst({
    where: { merchantId, sourceId: originalSourceId },
  });

  if (!originalInvoice) {
    console.warn(
      `Refund: fattura originale non trovata per ${originalSourceId}`,
    );
    return;
  }

  // Crea credit note (idempotent)
  const creditNote = await prisma.creditNote
    .create({
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
    })
    .catch(() => null);

  if (creditNote) {
    await enqueueRefundProcess({
      creditNoteId: creditNote.id,
      merchantId,
      originalInvoiceId: originalInvoice.id,
      stripeRefundId: refundId,
      amount: refundAmount,
    });
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
