// ============================================================
// Reports API - Report mensili PDF e dati
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateMonthlyReportPDF,
  type MonthlyReportData,
} from "@/lib/reports/pdf";

export async function GET(req: NextRequest) {
  const merchantId = req.headers.get("x-merchant-id");

  // Supporta anche token commercialista
  const accountantToken = req.headers.get("x-accountant-token");
  let resolvedMerchantId = merchantId;

  if (!resolvedMerchantId && accountantToken) {
    const access = await prisma.accountantAccess.findUnique({
      where: { token: accountantToken },
    });
    if (access?.isActive && access.canDownloadReports) {
      resolvedMerchantId = access.merchantId;
    }
  }

  if (!resolvedMerchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM
  const format = searchParams.get("format") || "json"; // json | pdf

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Parametro 'month' obbligatorio (formato: YYYY-MM)" },
      { status: 400 },
    );
  }

  const startDate = new Date(`${month}-01T00:00:00Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const merchant = await prisma.merchant.findUnique({
    where: { id: resolvedMerchantId },
  });

  if (!merchant) {
    return NextResponse.json(
      { error: "Merchant non trovato" },
      { status: 404 },
    );
  }

  // Raccolta dati
  const [invoices, creditNotes, statusCounts] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        merchantId: resolvedMerchantId,
        createdAt: { gte: startDate, lt: endDate },
      },
      include: {
        customer: { select: { name: true, email: true, country: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.creditNote.findMany({
      where: {
        merchantId: resolvedMerchantId,
        createdAt: { gte: startDate, lt: endDate },
      },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: {
        merchantId: resolvedMerchantId,
        createdAt: { gte: startDate, lt: endDate },
      },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  // Calcoli
  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + Number(inv.amount),
    0,
  );
  const totalRefunds = creditNotes.reduce(
    (sum, cn) => sum + Number(cn.amount),
    0,
  );
  const totalBollo = invoices
    .filter((inv) => inv.bolloApplied)
    .reduce((sum, inv) => sum + Number(inv.bolloAmount || 2), 0);

  const totalVat = invoices.reduce(
    (sum, inv) => sum + (Number(inv.vatRate || 0) / 100) * Number(inv.amount),
    0,
  );

  const countByStatus = (status: string) =>
    statusCounts.find((s) => s.status === status)?._count || 0;

  // Aggregazione OSS (vendite estere B2C)
  const ossInvoices = invoices.filter(
    (inv) => inv.customer?.country && inv.customer.country !== "IT",
  );
  const ossGrouped = new Map<
    string,
    { count: number; totalNet: number; totalVat: number; vatRate: number }
  >();
  for (const inv of ossInvoices) {
    const cc = inv.customer?.country || "??";
    const existing = ossGrouped.get(cc) || {
      count: 0,
      totalNet: 0,
      totalVat: 0,
      vatRate: Number(inv.vatRate || 0),
    };
    existing.count += 1;
    existing.totalNet += Number(inv.amount);
    existing.totalVat += (Number(inv.vatRate || 0) / 100) * Number(inv.amount);
    ossGrouped.set(cc, existing);
  }

  const reportData: MonthlyReportData = {
    merchantName: merchant.name || merchant.email,
    merchantVat: merchant.vatNumber || "N/D",
    period: month,
    generatedAt: new Date().toLocaleDateString("it-IT"),
    totalInvoices: invoices.length,
    totalAccepted: countByStatus("ACCEPTED"),
    totalRejected: countByStatus("REJECTED"),
    totalPending:
      countByStatus("PENDING_DATA") +
      countByStatus("VALIDATING") +
      countByStatus("READY") +
      countByStatus("SENDING") +
      countByStatus("SENT"),
    totalErrors: countByStatus("ERROR") + countByStatus("FAILED"),
    totalCreditNotes: creditNotes.length,
    totalRevenue,
    totalVat,
    totalBollo,
    totalRefunds,
    netRevenue: totalRevenue - totalRefunds,
    stripeTotal: totalRevenue, // TODO: fetch actual Stripe totals
    ficTotal: invoices
      .filter((inv) => inv.status === "ACCEPTED")
      .reduce((sum, inv) => sum + Number(inv.amount), 0),
    reconciliationStatus:
      Math.abs(
        totalRevenue -
          invoices
            .filter((inv) => inv.status === "ACCEPTED")
            .reduce((s, i) => s + Number(i.amount), 0),
      ) < 1
        ? "MATCH"
        : Math.abs(
              totalRevenue -
                invoices
                  .filter((inv) => inv.status === "ACCEPTED")
                  .reduce((s, i) => s + Number(i.amount), 0),
            ) <
            totalRevenue * 0.05
          ? "WARNING"
          : "MISMATCH",
    gap:
      totalRevenue -
      invoices
        .filter((inv) => inv.status === "ACCEPTED")
        .reduce((s, i) => s + Number(i.amount), 0),
    ossTransactions: Array.from(ossGrouped.entries()).map(
      ([country, data]) => ({
        country,
        ...data,
      }),
    ),
    invoices: invoices.map((inv) => ({
      number: inv.invoiceNumber || "-",
      date: inv.createdAt.toLocaleDateString("it-IT"),
      customer: inv.customer?.name || inv.customer?.email || "-",
      amount: Number(inv.amount),
      status: inv.status,
      type: "Fattura",
    })),
  };

  if (format === "pdf") {
    const pdfBuffer = await generateMonthlyReportPDF(reportData);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="FiscLink_Report_${month}.pdf"`,
      },
    });
  }

  return NextResponse.json(reportData);
}
