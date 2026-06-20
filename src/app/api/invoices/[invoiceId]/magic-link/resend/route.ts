import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { prisma } from "@/lib/db";
import { enqueueMagicLinkSend } from "@/lib/queue";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const merchantId = request.headers.get("x-merchant-id");
  if (!merchantId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      merchantId,
    },
    include: {
      customer: {
        select: { email: true },
      },
      magicLinks: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Fattura non trovata" }, { status: 404 });
  }

  if (invoice.status !== "PENDING_DATA") {
    return NextResponse.json(
      { error: "Il Magic Link puo essere reinviato solo per dati mancanti" },
      { status: 409 },
    );
  }

  const existingMagicLink = invoice.magicLinks[0];
  if (existingMagicLink?.isCompleted) {
    return NextResponse.json(
      { error: "Il Magic Link e gia stato completato" },
      { status: 409 },
    );
  }

  const sourceData = invoice.sourceData as Record<string, unknown> | null;
  const customerEmail =
    invoice.customer?.email ?? (sourceData?.customerEmail as string | undefined);

  if (!customerEmail) {
    return NextResponse.json(
      { error: "Email cliente mancante: impossibile reinviare il Magic Link" },
      { status: 422 },
    );
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const magicLink = existingMagicLink
    ? await prisma.magicLink.update({
        where: { id: existingMagicLink.id },
        data: {
          token:
            existingMagicLink.isExpired || existingMagicLink.expiresAt < new Date()
              ? nanoid(32)
              : existingMagicLink.token,
          isExpired: false,
          expiresAt,
        },
      })
    : await prisma.magicLink.create({
        data: {
          token: nanoid(32),
          merchantId,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          expiresAt,
        },
      });

  await enqueueMagicLinkSend({
    magicLinkId: magicLink.id,
    invoiceId: invoice.id,
    merchantId,
    customerEmail,
  });

  await prisma.auditLog.create({
    data: {
      merchantId,
      invoiceId: invoice.id,
      action: "MAGIC_LINK_RESENT",
      details: "Magic Link reinviato dal merchant",
      metadata: {
        magicLinkId: magicLink.id,
        customerEmail,
        expiresAt,
      },
    },
  });

  return NextResponse.json({
    success: true,
    magicLink: {
      id: magicLink.id,
      expiresAt: magicLink.expiresAt,
    },
  });
}
