import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto";
import { z } from "zod";

const SettingsSchema = z.object({
  // Stripe
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),

  // Fatture in Cloud
  ficAccessToken: z.string().optional(),
  ficCompanyId: z.string().optional(),

  // Shopify
  shopifyApiKey: z.string().optional(),
  shopifyWebhookSecret: z.string().optional(),
  shopifyShopDomain: z.string().optional(),

  // WooCommerce
  wooCommerceConsumerKey: z.string().optional(),
  wooCommerceConsumerSecret: z.string().optional(),
  wooCommerceStoreUrl: z.string().optional(),
  wooCommerceWebhookSecret: z.string().optional(),

  // Regime fiscale
  taxRegime: z.enum(["RF01", "RF02", "RF04", "RF19"]).optional(),
  bolloPolicy: z.enum(["CHARGE_CUSTOMER", "ABSORB_COST"]).optional(),

  // Branding
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Colore hex non valido")
    .optional(),
  logoUrl: z.string().url("URL logo non valido").optional().or(z.literal("")),
  businessName: z.string().min(1).max(200).optional(),
  onboarded: z.boolean().optional(),
});

// GET /api/settings — restituisce configurazione merchant (senza API key in chiaro)
export async function GET(req: NextRequest) {
  const merchantId = req.headers.get("x-merchant-id");
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      name: true,
      email: true,
      taxRegime: true,
      bolloPolicy: true,
      brandColor: true,
      logoUrl: true,
      stripeApiKeyEnc: true,
      stripeWebhookSecretEnc: true,
      ficApiKeyEnc: true,
      ficCompanyId: true,
      shopifyApiKeyEnc: true,
      shopifyWebhookSecretEnc: true,
      shopifyShopDomain: true,
      wooCommerceConsumerKeyEnc: true,
      wooCommerceConsumerSecretEnc: true,
      wooCommerceStoreUrl: true,
      wooCommerceWebhookSecretEnc: true,
      createdAt: true,
    },
  });

  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant non trovato" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: merchant.id,
    name: merchant.name,
    email: merchant.email,
    taxRegime: merchant.taxRegime,
    bolloPolicy: merchant.bolloPolicy,
    brandColor: merchant.brandColor,
    logoUrl: merchant.logoUrl,
    ficCompanyId: merchant.ficCompanyId,
    // Indica se le chiavi sono configurate (senza esporre il valore)
    hasStripeKey: !!merchant.stripeApiKeyEnc,
    hasStripeWebhookSecret: !!merchant.stripeWebhookSecretEnc,
    hasFicToken: !!merchant.ficApiKeyEnc,
    hasFicCompanyId: !!merchant.ficCompanyId,
    hasShopifyKey: !!merchant.shopifyApiKeyEnc,
    shopifyShopDomain: merchant.shopifyShopDomain ?? null,
    hasWooCommerceKey: !!merchant.wooCommerceConsumerKeyEnc,
    wooCommerceStoreUrl: merchant.wooCommerceStoreUrl ?? null,
  });
}

// PUT /api/settings — aggiorna configurazione merchant
export async function PUT(req: NextRequest) {
  const merchantId = req.headers.get("x-merchant-id");
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = SettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dati non validi",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Costruisci l'oggetto update solo con i campi presenti
  const updateData: Record<string, unknown> = {};

  // Cripta e salva API key se fornite
  if (data.stripeSecretKey) {
    updateData.stripeApiKeyEnc = await encryptApiKey(data.stripeSecretKey);
  }
  if (data.stripeWebhookSecret) {
    updateData.stripeWebhookSecretEnc = await encryptApiKey(
      data.stripeWebhookSecret,
    );
  }
  if (data.ficAccessToken) {
    updateData.ficApiKeyEnc = await encryptApiKey(data.ficAccessToken);
  }
  if (data.ficCompanyId !== undefined) {
    updateData.ficCompanyId = data.ficCompanyId || null;
  }

  // Shopify
  if (data.shopifyApiKey) {
    updateData.shopifyApiKeyEnc = await encryptApiKey(data.shopifyApiKey);
  }
  if (data.shopifyWebhookSecret) {
    updateData.shopifyWebhookSecretEnc = await encryptApiKey(
      data.shopifyWebhookSecret,
    );
  }
  if (data.shopifyShopDomain !== undefined) {
    updateData.shopifyShopDomain = data.shopifyShopDomain || null;
  }

  // WooCommerce
  if (data.wooCommerceConsumerKey) {
    updateData.wooCommerceConsumerKeyEnc = await encryptApiKey(
      data.wooCommerceConsumerKey,
    );
  }
  if (data.wooCommerceConsumerSecret) {
    updateData.wooCommerceConsumerSecretEnc = await encryptApiKey(
      data.wooCommerceConsumerSecret,
    );
  }
  if (data.wooCommerceStoreUrl !== undefined) {
    updateData.wooCommerceStoreUrl = data.wooCommerceStoreUrl || null;
  }
  if (data.wooCommerceWebhookSecret) {
    updateData.wooCommerceWebhookSecretEnc = await encryptApiKey(
      data.wooCommerceWebhookSecret,
    );
  }

  // Campi non cifrati
  if (data.taxRegime) updateData.taxRegime = data.taxRegime;
  if (data.bolloPolicy) updateData.bolloPolicy = data.bolloPolicy;
  if (data.brandColor) updateData.brandColor = data.brandColor;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null;
  if (data.businessName) updateData.name = data.businessName;
  if (data.onboarded !== undefined) updateData.onboarded = data.onboarded;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Nessun dato da aggiornare" },
      { status: 400 },
    );
  }

  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: updateData,
    select: {
      id: true,
      name: true,
      taxRegime: true,
      bolloPolicy: true,
      brandColor: true,
      logoUrl: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      merchantId,
      action: "SETTINGS_UPDATED",
      level: "INFO",
      details: `Aggiornati: ${Object.keys(updateData).join(", ")}`,
    },
  });

  return NextResponse.json({
    message: "Impostazioni aggiornate",
    merchant,
  });
}

// POST /api/settings/test-connection — verifica connessione Fatture in Cloud
export async function POST(req: NextRequest) {
  const merchantId = req.headers.get("x-merchant-id");
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "test-fic") {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { ficApiKeyEnc: true, ficCompanyId: true },
    });

    if (!merchant?.ficApiKeyEnc || !merchant?.ficCompanyId) {
      return NextResponse.json(
        { error: "Configura prima le credenziali Fatture in Cloud" },
        { status: 400 },
      );
    }

    try {
      const token = await decryptApiKey(merchant.ficApiKeyEnc);
      // Verifica connessione con una chiamata leggera
      const res = await fetch(
        `https://api-v2.fattureincloud.it/c/${merchant.ficCompanyId}/info`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        return NextResponse.json(
          {
            success: false,
            error: "Credenziali non valide o azienda non trovata",
          },
          { status: 400 },
        );
      }

      const info = await res.json();
      return NextResponse.json({
        success: true,
        companyName: info.data?.name || "Connesso",
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Errore di connessione a Fatture in Cloud" },
        { status: 500 },
      );
    }
  }

  if (action === "test-stripe") {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { stripeApiKeyEnc: true },
    });

    if (!merchant?.stripeApiKeyEnc) {
      return NextResponse.json(
        { error: "Configura prima la chiave Stripe" },
        { status: 400 },
      );
    }

    try {
      const key = await decryptApiKey(merchant.stripeApiKeyEnc);
      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${key}` },
      });

      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: "Chiave Stripe non valida" },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true, message: "Connesso a Stripe" });
    } catch {
      return NextResponse.json(
        { success: false, error: "Errore di connessione a Stripe" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Azione non riconosciuta" },
    { status: 400 },
  );
}
