/**
 * API Magic Link - customer fiscal data collection.
 *
 * GET  /api/magic-link/[token] returns the public form context.
 * POST /api/magic-link/[token] stores customer fiscal data and resumes processing.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateFiscalData, type FiscalData } from "@/lib/validators/fiscal";
import { enqueueInvoiceProcess } from "@/lib/queue";
import { z } from "zod";

const emptyToNull = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().optional().nullable(),
);

const fiscalDataSchema = z
  .object({
    customerType: z.enum(["PRIVATE", "BUSINESS", "FOREIGN"]),
    name: z.string().trim().min(1, "Nome o ragione sociale obbligatorio"),
    fiscalCode: emptyToNull,
    vatNumber: emptyToNull,
    address: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    province: z.string().trim().optional().nullable(),
    zipCode: z.string().trim().optional().nullable(),
    country: z.string().trim().min(2, "Nazione obbligatoria").default("IT"),
    sdiCode: emptyToNull,
    pecEmail: z.preprocess(
      (value) => (value === "" ? null : value),
      z.string().email("PEC non valida").optional().nullable(),
    ),
  })
  .superRefine((data, ctx) => {
    const isItalian = data.country.toUpperCase() === "IT";
    if (!isItalian) return;

    const requiredItalianFields: Array<
      [keyof typeof data, string]
    > = [
      ["address", "Indirizzo obbligatorio per clienti italiani"],
      ["city", "Citta obbligatoria per clienti italiani"],
      ["zipCode", "CAP obbligatorio per clienti italiani"],
      ["province", "Provincia obbligatoria per clienti italiani"],
    ];

    for (const [field, message] of requiredItalianFields) {
      const value = data[field];
      if (typeof value !== "string" || !value.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message,
        });
      }
    }
  });

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
      message: "Dati fiscali gia inseriti.",
      merchant: magicLink.merchant,
    });
  }

  if (magicLink.isExpired || new Date() > magicLink.expiresAt) {
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
          "Questo link e scaduto. Contatta il venditore per riceverne uno nuovo.",
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

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
    return NextResponse.json({ error: "Dati gia inseriti" }, { status: 409 });
  }

  if (magicLink.isExpired || new Date() > magicLink.expiresAt) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
  }

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

  const data = {
    ...parsed.data,
    fiscalCode: parsed.data.fiscalCode?.toUpperCase() ?? null,
    vatNumber: parsed.data.vatNumber?.toUpperCase() ?? null,
    address: parsed.data.address ?? null,
    city: parsed.data.city ?? null,
    province: parsed.data.province?.toUpperCase() ?? null,
    zipCode: parsed.data.zipCode ?? null,
    country: parsed.data.country.toUpperCase(),
    sdiCode: parsed.data.sdiCode?.toUpperCase() ?? null,
    pecEmail: parsed.data.pecEmail?.toLowerCase() ?? null,
  };

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
    const invoice = magicLink.invoice;
    const sourceData = invoice.sourceData as Record<string, unknown> | null;
    const email =
      (sourceData?.customerEmail as string | undefined) ?? "unknown@unknown.com";

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

    await prisma.invoice.update({
      where: { id: magicLink.invoiceId },
      data: { customerId: customer.id },
    });
  }

  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: {
      isCompleted: true,
      completedAt: new Date(),
      submittedData: data,
    },
  });

  await enqueueInvoiceProcess({
    invoiceId: magicLink.invoiceId,
    merchantId: magicLink.merchantId,
    sourceType: magicLink.invoice.sourceType,
    sourceId: magicLink.invoice.sourceId,
  });

  await prisma.auditLog.create({
    data: {
      merchantId: magicLink.merchantId,
      invoiceId: magicLink.invoiceId,
      action: "MAGIC_LINK_COMPLETED",
      details: "Il cliente ha completato i dati fiscali tramite magic link",
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
      "Grazie. I tuoi dati fiscali sono stati ricevuti e saranno preparati per il flusso di fatturazione del venditore.",
  });
}
