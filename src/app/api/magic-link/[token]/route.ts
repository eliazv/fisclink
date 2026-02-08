/**
 * API Magic Link - Recupero dati e submit
 *
 * GET  /api/magic-link/[token] → Ritorna i dati della pagina magic link
 * POST /api/magic-link/[token] → Riceve i dati fiscali dal cliente
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateFiscalData, type FiscalData } from "@/lib/validators/fiscal";
import { enqueueInvoiceProcess } from "@/lib/queue";
import { z } from "zod";

// Schema di validazione per i dati fiscali inviati dal cliente
const fiscalDataSchema = z.object({
  customerType: z.enum(["PRIVATE", "BUSINESS", "FOREIGN"]),
  name: z.string().min(1, "Nome o ragione sociale obbligatorio"),
  fiscalCode: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  address: z.string().min(1, "Indirizzo obbligatorio"),
  city: z.string().min(1, "Città obbligatoria"),
  province: z.string().min(2, "Provincia obbligatoria").max(2),
  zipCode: z.string().min(5, "CAP obbligatorio").max(5),
  country: z.string().default("IT"),
  sdiCode: z.string().optional().nullable(),
  pecEmail: z.string().email().optional().nullable(),
});

/**
 * GET /api/magic-link/[token]
 * Ritorna le info per la pagina di completamento dati.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: {
      merchant: {
        select: {
          name: true,
          logoUrl: true,
          brandColor: true,
        },
      },
      invoice: {
        select: {
          amount: true,
          currency: true,
          description: true,
          status: true,
        },
      },
      customer: {
        select: {
          name: true,
          email: true,
          fiscalCode: true,
          vatNumber: true,
          address: true,
          city: true,
          province: true,
          zipCode: true,
          country: true,
          sdiCode: true,
          pecEmail: true,
          customerType: true,
        },
      },
    },
  });

  if (!magicLink) {
    return NextResponse.json(
      { error: "Link non valido o scaduto" },
      { status: 404 },
    );
  }

  if (magicLink.isCompleted) {
    return NextResponse.json({
      status: "completed",
      message: "Dati fiscali già inseriti. La fattura è in elaborazione.",
      merchant: magicLink.merchant,
    });
  }

  if (magicLink.isExpired || new Date() > magicLink.expiresAt) {
    // Segna come scaduto se non lo era già
    if (!magicLink.isExpired) {
      await prisma.magicLink.update({
        where: { id: magicLink.id },
        data: { isExpired: true },
      });
    }

    return NextResponse.json(
      {
        status: "expired",
        error:
          "Questo link è scaduto. Contatta il venditore per riceverne uno nuovo.",
        merchant: magicLink.merchant,
      },
      { status: 410 },
    );
  }

  return NextResponse.json({
    status: "active",
    merchant: magicLink.merchant,
    invoice: {
      amount: Number(magicLink.invoice.amount),
      currency: magicLink.invoice.currency,
      description: magicLink.invoice.description,
    },
    // Dati pre-compilati (se il cliente ha comprato prima)
    prefilled: magicLink.customer
      ? {
          name: magicLink.customer.name,
          fiscalCode: magicLink.customer.fiscalCode,
          vatNumber: magicLink.customer.vatNumber,
          address: magicLink.customer.address,
          city: magicLink.customer.city,
          province: magicLink.customer.province,
          zipCode: magicLink.customer.zipCode,
          country: magicLink.customer.country,
          sdiCode: magicLink.customer.sdiCode,
          pecEmail: magicLink.customer.pecEmail,
          customerType: magicLink.customer.customerType,
        }
      : null,
  });
}

/**
 * POST /api/magic-link/[token]
 * Riceve i dati fiscali dal cliente e riavvia il workflow.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // 1. Carica il magic link
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: {
      invoice: true,
    },
  });

  if (!magicLink) {
    return NextResponse.json({ error: "Link non valido" }, { status: 404 });
  }

  if (magicLink.isCompleted) {
    return NextResponse.json({ error: "Dati già inseriti" }, { status: 409 });
  }

  if (magicLink.isExpired || new Date() > magicLink.expiresAt) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
  }

  // 2. Valida i dati ricevuti
  const body = await request.json();
  const parsed = fiscalDataSchema.safeParse(body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (e) => `${e.path.join(".")}: ${e.message}`,
    );
    return NextResponse.json(
      { error: "Dati non validi", details: errors },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // 3. Validazione fiscale approfondita
  const fiscalValidation = validateFiscalData(data as FiscalData);

  if (!fiscalValidation.valid) {
    return NextResponse.json(
      {
        error: "Dati fiscali non validi",
        details: fiscalValidation.errors,
      },
      { status: 422 },
    );
  }

  // 4. Aggiorna il cliente nel DB
  if (magicLink.customerId) {
    await prisma.customer.update({
      where: { id: magicLink.customerId },
      data: {
        name: data.name,
        fiscalCode: data.fiscalCode,
        vatNumber: data.vatNumber,
        address: data.address,
        city: data.city,
        province: data.province,
        zipCode: data.zipCode,
        country: data.country,
        sdiCode: data.sdiCode,
        pecEmail: data.pecEmail,
        customerType: data.customerType,
      },
    });
  } else {
    // Crea customer se non esisteva
    const invoice = magicLink.invoice;
    const sourceData = invoice.sourceData as Record<string, unknown> | null;
    const email =
      (sourceData?.customerEmail as string) ?? "unknown@unknown.com";

    const customer = await prisma.customer.create({
      data: {
        merchantId: magicLink.merchantId,
        email,
        name: data.name,
        fiscalCode: data.fiscalCode,
        vatNumber: data.vatNumber,
        address: data.address,
        city: data.city,
        province: data.province,
        zipCode: data.zipCode,
        country: data.country,
        sdiCode: data.sdiCode,
        pecEmail: data.pecEmail,
        customerType: data.customerType,
      },
    });

    // Collega il customer all'invoice
    await prisma.invoice.update({
      where: { id: magicLink.invoiceId },
      data: { customerId: customer.id },
    });
  }

  // 5. Segna il magic link come completato
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      submittedData: data,
    },
  });

  // 6. Riavvia il workflow di fatturazione
  await enqueueInvoiceProcess({
    invoiceId: magicLink.invoiceId,
    merchantId: magicLink.merchantId,
    sourceType: magicLink.invoice.sourceType as "STRIPE" | "SHOPIFY",
    sourceId: magicLink.invoice.sourceId,
  });

  // 7. Audit log
  await prisma.auditLog.create({
    data: {
      merchantId: magicLink.merchantId,
      invoiceId: magicLink.invoiceId,
      action: "MAGIC_LINK_COMPLETED",
      details: `Il cliente ha completato i dati fiscali tramite magic link`,
      metadata: {
        customerType: data.customerType,
        hasFiscalCode: !!data.fiscalCode,
        hasVatNumber: !!data.vatNumber,
      },
    },
  });

  return NextResponse.json({
    success: true,
    message:
      "Grazie! I tuoi dati fiscali sono stati ricevuti. La fattura verrà emessa a breve.",
  });
}
