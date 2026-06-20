/**
 * API Export - Fatture in CSV o JSON per commercialista/gestionale
 *
 * GET /api/invoices/export?format=csv|json&status=...&search=...
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EXPORT_LIMIT = 5000;

function getMerchantId(request: NextRequest): string | null {
  return request.headers.get("x-merchant-id");
}

const CSV_HEADERS = [
  "data_pagamento",
  "stato",
  "cliente_nome",
  "cliente_email",
  "codice_fiscale",
  "partita_iva",
  "codice_sdi",
  "pec",
  "indirizzo",
  "citta",
  "provincia",
  "cap",
  "nazione",
  "importo",
  "valuta",
  "descrizione",
  "numero_fattura",
  "id_origine",
  "tipo_origine",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const merchantId = getMerchantId(request);
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format") === "json" ? "json" : "csv";
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { merchantId };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { sourceId: { contains: search } },
      { invoiceNumber: { contains: search } },
      { customer: { email: { contains: search, mode: "insensitive" } } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const payload = invoices.map((inv) => ({
      id: inv.id,
      status: inv.status,
      sourceType: inv.sourceType,
      sourceId: inv.sourceId,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.amount),
      currency: inv.currency,
      description: inv.description,
      bolloApplied: inv.bolloApplied,
      customer: inv.customer && {
        name: inv.customer.name,
        email: inv.customer.email,
        fiscalCode: inv.customer.fiscalCode,
        vatNumber: inv.customer.vatNumber,
        sdiCode: inv.customer.sdiCode,
        pecEmail: inv.customer.pecEmail,
        address: inv.customer.address,
        city: inv.customer.city,
        province: inv.customer.province,
        zipCode: inv.customer.zipCode,
        country: inv.customer.country,
      },
      createdAt: inv.createdAt,
      sentAt: inv.sentAt,
      acceptedAt: inv.acceptedAt,
      rejectedAt: inv.rejectedAt,
    }));

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="fisclink-export-${timestamp}.json"`,
      },
    });
  }

  const rows = invoices.map((inv) =>
    [
      inv.createdAt.toISOString().slice(0, 10),
      inv.status,
      inv.customer?.name,
      inv.customer?.email,
      inv.customer?.fiscalCode,
      inv.customer?.vatNumber,
      inv.customer?.sdiCode,
      inv.customer?.pecEmail,
      inv.customer?.address,
      inv.customer?.city,
      inv.customer?.province,
      inv.customer?.zipCode,
      inv.customer?.country,
      Number(inv.amount).toFixed(2),
      inv.currency,
      inv.description,
      inv.invoiceNumber,
      inv.sourceId,
      inv.sourceType,
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = [CSV_HEADERS.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fisclink-export-${timestamp}.csv"`,
    },
  });
}
