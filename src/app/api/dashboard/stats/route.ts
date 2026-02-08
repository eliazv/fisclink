/**
 * API Dashboard - Statistiche
 *
 * GET /api/dashboard/stats → Statistiche fatture del merchant
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

  // Statistiche aggregate
  const [
    totalInvoices,
    pendingData,
    sent,
    accepted,
    errors,
    totalRevenue,
    recentActivity,
  ] = await Promise.all([
    prisma.invoice.count({ where: { merchantId } }),
    prisma.invoice.count({
      where: { merchantId, status: "PENDING_DATA" },
    }),
    prisma.invoice.count({
      where: { merchantId, status: "SENT" },
    }),
    prisma.invoice.count({
      where: { merchantId, status: "ACCEPTED" },
    }),
    prisma.invoice.count({
      where: {
        merchantId,
        status: { in: ["ERROR", "FAILED", "REJECTED"] },
      },
    }),
    prisma.invoice.aggregate({
      where: { merchantId, status: { in: ["SENT", "ACCEPTED"] } },
      _sum: { amount: true },
    }),
    prisma.auditLog.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        details: true,
        level: true,
        createdAt: true,
      },
    }),
  ]);

  // Fatture degli ultimi 30 giorni per grafico
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const invoicesByDay = await prisma.invoice.groupBy({
    by: ["status"],
    where: {
      merchantId,
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: true,
  });

  return NextResponse.json({
    stats: {
      totalInvoices,
      pendingData,
      sent,
      accepted,
      errors,
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    },
    invoicesByStatus: invoicesByDay.map((g) => ({
      status: g.status,
      count: g._count,
    })),
    recentActivity,
  });
}
