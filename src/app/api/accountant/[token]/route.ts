// ============================================================
// Accountant API - Accesso read-only commercialista
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // Verifica token commercialista
  const access = await prisma.accountantAccess.findUnique({
    where: { token },
    include: { merchant: true },
  });

  if (!access || !access.isActive) {
    return NextResponse.json(
      { error: "Accesso non valido o disattivato" },
      { status: 403 },
    );
  }

  if (access.expiresAt && access.expiresAt < new Date()) {
    return NextResponse.json({ error: "Accesso scaduto" }, { status: 403 });
  }

  // Aggiorna ultimo accesso
  await prisma.accountantAccess.update({
    where: { id: access.id },
    data: { lastAccessAt: new Date() },
  });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") || "overview";
  const month = searchParams.get("month"); // formato YYYY-MM
  const merchantId = access.merchantId;

  // Filtra per mese se specificato
  const dateFilter = month
    ? {
        createdAt: {
          gte: new Date(`${month}-01T00:00:00Z`),
          lt: new Date(
            new Date(`${month}-01T00:00:00Z`).setMonth(
              new Date(`${month}-01`).getMonth() + 1,
            ),
          ),
        },
      }
    : {};

  switch (view) {
    case "overview": {
      const [
        totalInvoices,
        accepted,
        rejected,
        pending,
        errors,
        creditNotes,
        revenue,
      ] = await Promise.all([
        prisma.invoice.count({ where: { merchantId, ...dateFilter } }),
        prisma.invoice.count({
          where: { merchantId, status: "ACCEPTED", ...dateFilter },
        }),
        prisma.invoice.count({
          where: { merchantId, status: "REJECTED", ...dateFilter },
        }),
        prisma.invoice.count({
          where: {
            merchantId,
            status: {
              in: ["PENDING_DATA", "VALIDATING", "READY", "SENDING", "SENT"],
            },
            ...dateFilter,
          },
        }),
        prisma.invoice.count({
          where: {
            merchantId,
            status: { in: ["ERROR", "FAILED"] },
            ...dateFilter,
          },
        }),
        prisma.creditNote.count({ where: { merchantId, ...dateFilter } }),
        prisma.invoice.aggregate({
          where: { merchantId, status: "ACCEPTED", ...dateFilter },
          _sum: { amount: true },
        }),
      ]);

      return NextResponse.json({
        merchantName: access.merchant.name,
        merchantCompany: access.merchant.company,
        merchantVat: access.merchant.vatNumber,
        taxRegime: access.merchant.taxRegime,
        overview: {
          totalInvoices,
          accepted,
          rejected,
          pending,
          errors,
          creditNotes,
          revenue: revenue._sum.amount || 0,
        },
      });
    }

    case "invoices": {
      if (!access.canViewInvoices) {
        return NextResponse.json(
          { error: "Permesso non concesso" },
          { status: 403 },
        );
      }

      const page = parseInt(searchParams.get("page") || "1");
      const limit = 50;
      const skip = (page - 1) * limit;

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: { merchantId, ...dateFilter },
          include: {
            customer: {
              select: {
                name: true,
                email: true,
                vatNumber: true,
                fiscalCode: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
        }),
        prisma.invoice.count({ where: { merchantId, ...dateFilter } }),
      ]);

      return NextResponse.json({
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          amount: inv.amount,
          currency: inv.currency,
          vatRate: inv.vatRate,
          vatNature: inv.vatNature,
          bolloApplied: inv.bolloApplied,
          customer: inv.customer,
          sourceType: inv.sourceType,
          sourceId: inv.sourceId,
          ficDocumentId: inv.ficDocumentId,
          sdiIdentifier: inv.sdiIdentifier,
          lastError: inv.lastError,
          sentAt: inv.sentAt,
          acceptedAt: inv.acceptedAt,
          rejectedAt: inv.rejectedAt,
          createdAt: inv.createdAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    case "errors": {
      if (!access.canViewErrors) {
        return NextResponse.json(
          { error: "Permesso non concesso" },
          { status: 403 },
        );
      }

      const errorInvoices = await prisma.invoice.findMany({
        where: {
          merchantId,
          status: { in: ["ERROR", "FAILED", "REJECTED"] },
          ...dateFilter,
        },
        include: { customer: { select: { name: true, email: true } } },
        orderBy: { updatedAt: "desc" },
        take: 100,
      });

      return NextResponse.json({
        errors: errorInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          lastError: inv.lastError,
          errorCode: inv.errorCode,
          rejectionReason: inv.rejectionReason,
          customer: inv.customer,
          amount: inv.amount,
          retryCount: inv.retryCount,
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
        })),
      });
    }

    case "stats": {
      if (!access.canViewStats) {
        return NextResponse.json(
          { error: "Permesso non concesso" },
          { status: 403 },
        );
      }

      // Statistiche mensili ultimi 12 mesi
      const monthlyStats = await prisma.invoice.groupBy({
        by: ["status"],
        where: {
          merchantId,
          createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
        _count: true,
        _sum: { amount: true },
      });

      return NextResponse.json({ monthlyStats });
    }

    default:
      return NextResponse.json({ error: "Vista non valida" }, { status: 400 });
  }
}
