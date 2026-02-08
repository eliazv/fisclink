/**
 * API Dashboard - Riconciliazione
 *
 * GET /api/dashboard/reconciliation → Confronto Stripe vs Fatturato SDI
 *
 * Mostra il totale pagamenti Stripe, il totale fatture inviate/accettate,
 * e identifica eventuali discrepanze.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getMerchantId(request: NextRequest): string | null {
  return request.headers.get("x-merchant-id");
}

export async function GET(request: NextRequest) {
  const merchantId = getMerchantId(request);
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(
    searchParams.get("year") ?? String(new Date().getFullYear()),
  );
  const month = parseInt(
    searchParams.get("month") ?? String(new Date().getMonth() + 1),
  );

  // Range del mese
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Totale pagamenti (tutte le fatture create da Stripe in quel mese)
  const [
    stripeTotal,
    invoicedTotal,
    pendingInvoices,
    failedInvoices,
    creditNotesTotal,
  ] = await Promise.all([
    // Tutto ciò che è arrivato da Stripe nel mese
    prisma.invoice.aggregate({
      where: {
        merchantId,
        sourceType: "STRIPE",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),

    // Fatture effettivamente inviate/accettate dallo SDI
    prisma.invoice.aggregate({
      where: {
        merchantId,
        sourceType: "STRIPE",
        status: { in: ["SENT", "ACCEPTED"] },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),

    // Fatture ancora in pending (dati mancanti, in validazione, ecc.)
    prisma.invoice.count({
      where: {
        merchantId,
        status: { in: ["PENDING_DATA", "VALIDATING", "READY", "SENDING"] },
        createdAt: { gte: startDate, lte: endDate },
      },
    }),

    // Fatture fallite
    prisma.invoice.count({
      where: {
        merchantId,
        status: { in: ["ERROR", "FAILED", "REJECTED"] },
        createdAt: { gte: startDate, lte: endDate },
      },
    }),

    // Note di credito inviate nel mese
    prisma.creditNote.aggregate({
      where: {
        merchantId,
        status: { in: ["SENT", "ACCEPTED"] },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const stripeAmount = Number(stripeTotal._sum.amount ?? 0);
  const invoicedAmount = Number(invoicedTotal._sum.amount ?? 0);
  const creditNotesAmount = Number(creditNotesTotal._sum.amount ?? 0);
  const gap = stripeAmount - invoicedAmount;

  // Stato riconciliazione
  let reconciliationStatus: "MATCH" | "WARNING" | "MISMATCH";
  if (Math.abs(gap) < 0.01) {
    reconciliationStatus = "MATCH";
  } else if (pendingInvoices > 0 || failedInvoices > 0) {
    reconciliationStatus = "WARNING";
  } else {
    reconciliationStatus = "MISMATCH";
  }

  return NextResponse.json({
    period: {
      year,
      month,
      label: `${String(month).padStart(2, "0")}/${year}`,
    },
    stripe: {
      totalAmount: stripeAmount,
      transactionCount: stripeTotal._count,
    },
    invoiced: {
      totalAmount: invoicedAmount,
      invoiceCount: invoicedTotal._count,
    },
    creditNotes: {
      totalAmount: creditNotesAmount,
      count: creditNotesTotal._count,
    },
    netInvoiced: invoicedAmount - creditNotesAmount,
    gap,
    pendingInvoices,
    failedInvoices,
    status: reconciliationStatus,
  });
}
