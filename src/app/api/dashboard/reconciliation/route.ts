/**
 * API Dashboard - Riconciliazione Multi-Provider
 *
 * GET /api/dashboard/reconciliation → Confronto pagamenti vs Fatturato SDI
 *
 * Mostra il totale pagamenti per ogni provider, il totale fatture inviate/accettate,
 * e identifica eventuali discrepanze. Supporta Stripe, Shopify, WooCommerce, PayPal.
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

  const sourceTypes = ["STRIPE", "SHOPIFY", "WOOCOMMERCE", "PAYPAL"] as const;

  // Raccogli dati per ogni provider in parallelo
  const [
    providerTotals,
    invoicedTotal,
    pendingInvoices,
    failedInvoices,
    creditNotesTotal,
  ] = await Promise.all([
    // Totali per ogni provider
    Promise.all(
      sourceTypes.map(async (source) => {
        const agg = await prisma.invoice.aggregate({
          where: {
            merchantId,
            sourceType: source,
            createdAt: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
          _count: true,
        });
        return {
          source,
          totalAmount: Number(agg._sum.amount ?? 0),
          transactionCount: agg._count,
        };
      }),
    ),

    // Fatture effettivamente inviate/accettate dallo SDI (tutti i provider)
    prisma.invoice.aggregate({
      where: {
        merchantId,
        status: { in: ["SENT", "ACCEPTED"] },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),

    // Fatture ancora in pending
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

  // Crea breakdown per provider
  const providers: Record<
    string,
    { totalAmount: number; transactionCount: number }
  > = {};
  let allProvidersAmount = 0;
  for (const pt of providerTotals) {
    if (pt.transactionCount > 0) {
      providers[pt.source.toLowerCase()] = {
        totalAmount: pt.totalAmount,
        transactionCount: pt.transactionCount,
      };
    }
    allProvidersAmount += pt.totalAmount;
  }

  const invoicedAmount = Number(invoicedTotal._sum.amount ?? 0);
  const creditNotesAmount = Number(creditNotesTotal._sum.amount ?? 0);
  const gap = allProvidersAmount - invoicedAmount;

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
    providers,
    totalPayments: {
      totalAmount: allProvidersAmount,
      transactionCount: providerTotals.reduce(
        (s, p) => s + p.transactionCount,
        0,
      ),
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
