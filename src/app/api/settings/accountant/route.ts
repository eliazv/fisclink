// ============================================================
// Accountant Settings - Gestione accesso commercialista
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

// GET: Lista accessi commercialista per il merchant
export async function GET(req: NextRequest) {
  const merchantId = req.headers.get("x-merchant-id");
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const accesses = await prisma.accountantAccess.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      token: true,
      isActive: true,
      canViewInvoices: true,
      canViewStats: true,
      canDownloadReports: true,
      canViewErrors: true,
      lastAccessAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fisclink.it";

  return NextResponse.json({
    accesses: accesses.map((a) => ({
      ...a,
      accessUrl: `${baseUrl}/accountant/${a.token}`,
    })),
  });
}

// POST: Crea nuovo accesso commercialista
export async function POST(req: NextRequest) {
  const merchantId = req.headers.get("x-merchant-id");
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const body = await req.json();
  const { email, name, permissions, expiresInDays } = body;

  if (!email) {
    return NextResponse.json({ error: "Email obbligatoria" }, { status: 400 });
  }

  const token = nanoid(32);
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const access = await prisma.accountantAccess.upsert({
    where: { merchantId_email: { merchantId, email } },
    create: {
      merchantId,
      email,
      name: name || null,
      token,
      canViewInvoices: permissions?.canViewInvoices ?? true,
      canViewStats: permissions?.canViewStats ?? true,
      canDownloadReports: permissions?.canDownloadReports ?? true,
      canViewErrors: permissions?.canViewErrors ?? true,
      expiresAt,
    },
    update: {
      name: name || undefined,
      canViewInvoices: permissions?.canViewInvoices,
      canViewStats: permissions?.canViewStats,
      canDownloadReports: permissions?.canDownloadReports,
      canViewErrors: permissions?.canViewErrors,
      expiresAt,
      isActive: true,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fisclink.it";

  await prisma.auditLog.create({
    data: {
      merchantId,
      action: "ACCOUNTANT_ACCESS_CREATED",
      details: `Accesso commercialista creato per ${email}`,
      level: "INFO",
    },
  });

  return NextResponse.json({
    success: true,
    access: {
      id: access.id,
      email: access.email,
      accessUrl: `${baseUrl}/accountant/${access.token}`,
      token: access.token,
    },
  });
}

// DELETE: Revoca accesso commercialista
export async function DELETE(req: NextRequest) {
  const merchantId = req.headers.get("x-merchant-id");
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accessId = searchParams.get("id");

  if (!accessId) {
    return NextResponse.json({ error: "ID obbligatorio" }, { status: 400 });
  }

  await prisma.accountantAccess.updateMany({
    where: { id: accessId, merchantId },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      merchantId,
      action: "ACCOUNTANT_ACCESS_REVOKED",
      details: `Accesso commercialista ${accessId} revocato`,
      level: "INFO",
    },
  });

  return NextResponse.json({ success: true });
}
