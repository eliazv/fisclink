/**
 * API Dashboard - Lista fatture
 *
 * GET /api/invoices → Lista fatture con filtri e paginazione
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// TODO: Sostituire con autenticazione reale via next-auth
function getMerchantId(request: NextRequest): string | null {
  return request.headers.get("x-merchant-id");
}

export async function GET(request: NextRequest) {
  const merchantId = getMerchantId(request);
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? 20)),
  );
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

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            fiscalCode: true,
            vatNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    data: invoices.map((inv) => ({
      id: inv.id,
      status: inv.status,
      sourceType: inv.sourceType,
      sourceId: inv.sourceId,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.amount),
      currency: inv.currency,
      description: inv.description,
      lastError: inv.lastError,
      bolloApplied: inv.bolloApplied,
      customer: inv.customer,
      sentAt: inv.sentAt,
      acceptedAt: inv.acceptedAt,
      rejectedAt: inv.rejectedAt,
      createdAt: inv.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
