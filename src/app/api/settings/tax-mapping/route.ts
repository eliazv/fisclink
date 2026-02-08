/**
 * API Tax Mapping — Configurazione mapping aliquote IVA
 *
 * GET  /api/settings/tax-mapping → Lista mapping del merchant
 * POST /api/settings/tax-mapping → Crea/aggiorna un mapping
 * DELETE /api/settings/tax-mapping → Elimina un mapping
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

function getMerchantId(request: NextRequest): string | null {
  return request.headers.get("x-merchant-id");
}

// Schema validazione
const taxMappingSchema = z.object({
  stripeTaxCode: z.string().min(1, "Codice tax Stripe obbligatorio"),
  stripeTaxLabel: z.string().optional(),
  ficVatId: z.number().int().min(0),
  ficVatRate: z.number().min(0).max(100),
  ficVatNature: z.string().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * GET — Lista tutti i tax mapping del merchant
 */
export async function GET(request: NextRequest) {
  const merchantId = getMerchantId(request);
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const mappings = await prisma.taxMapping.findMany({
    where: { merchantId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ mappings });
}

/**
 * POST — Crea o aggiorna un tax mapping
 */
export async function POST(request: NextRequest) {
  const merchantId = getMerchantId(request);
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = taxMappingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Se isDefault, rimuovi il default precedente
  if (data.isDefault) {
    await prisma.taxMapping.updateMany({
      where: { merchantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // Upsert: crea o aggiorna per merchantId + stripeTaxCode
  const mapping = await prisma.taxMapping.upsert({
    where: {
      merchantId_stripeTaxCode: {
        merchantId,
        stripeTaxCode: data.stripeTaxCode,
      },
    },
    update: {
      stripeTaxLabel: data.stripeTaxLabel,
      ficVatId: data.ficVatId,
      ficVatRate: data.ficVatRate,
      ficVatNature: data.ficVatNature,
      isDefault: data.isDefault ?? false,
    },
    create: {
      merchantId,
      stripeTaxCode: data.stripeTaxCode,
      stripeTaxLabel: data.stripeTaxLabel,
      ficVatId: data.ficVatId,
      ficVatRate: data.ficVatRate,
      ficVatNature: data.ficVatNature,
      isDefault: data.isDefault ?? false,
    },
  });

  return NextResponse.json({ mapping });
}

/**
 * DELETE — Elimina un tax mapping per ID
 */
export async function DELETE(request: NextRequest) {
  const merchantId = getMerchantId(request);
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  }

  // Verifica che il mapping appartenga al merchant
  const mapping = await prisma.taxMapping.findFirst({
    where: { id, merchantId },
  });

  if (!mapping) {
    return NextResponse.json({ error: "Mapping non trovato" }, { status: 404 });
  }

  await prisma.taxMapping.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
