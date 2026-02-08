/**
 * Worker per l'invio e il reminder dei Magic Link
 */

import { prisma } from "@/lib/db";
import { sendMagicLinkEmail, sendMagicLinkReminder } from "@/lib/email";
import {
  scheduleMagicLinkReminder,
  type MagicLinkSendJobData,
  type MagicLinkReminderJobData,
} from "@/lib/queue";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Invia l'email con il magic link al cliente finale.
 */
export async function processMagicLinkSend(
  data: MagicLinkSendJobData,
): Promise<void> {
  const { magicLinkId, invoiceId, merchantId, customerEmail } = data;

  // Carica magic link e merchant
  const magicLink = await prisma.magicLink.findUnique({
    where: { id: magicLinkId },
    include: {
      merchant: { select: { name: true, logoUrl: true, brandColor: true } },
      invoice: { select: { amount: true, description: true, currency: true } },
    },
  });

  if (!magicLink) {
    throw new Error(`Magic Link ${magicLinkId} non trovato`);
  }

  if (magicLink.isCompleted || magicLink.isExpired) {
    return; // Niente da fare
  }

  const magicLinkUrl = `${APP_URL}/magic/${magicLink.token}`;

  const result = await sendMagicLinkEmail({
    to: customerEmail,
    merchantName: magicLink.merchant.name,
    merchantLogoUrl: magicLink.merchant.logoUrl,
    brandColor: magicLink.merchant.brandColor ?? undefined,
    magicLinkUrl,
    purchaseDescription: magicLink.invoice.description ?? undefined,
    purchaseAmount: magicLink.invoice.amount
      ? `${Number(magicLink.invoice.amount).toFixed(2)} ${magicLink.invoice.currency}`
      : undefined,
  });

  if (result.success) {
    await prisma.magicLink.update({
      where: { id: magicLinkId },
      data: { emailSentAt: new Date() },
    });

    await logAudit(merchantId, invoiceId, "MAGIC_LINK_EMAIL_SENT", {
      to: customerEmail,
      messageId: result.messageId,
    });
  } else {
    await logAudit(merchantId, invoiceId, "MAGIC_LINK_EMAIL_ERROR", {
      to: customerEmail,
      error: result.error,
    });
    throw new Error(`Errore invio email magic link: ${result.error}`);
  }
}

/**
 * Invia un reminder per il magic link non completato.
 */
export async function processMagicLinkReminder(
  data: MagicLinkReminderJobData,
): Promise<void> {
  const { magicLinkId, invoiceId, merchantId, reminderNumber } = data;

  const magicLink = await prisma.magicLink.findUnique({
    where: { id: magicLinkId },
    include: {
      merchant: { select: { name: true, logoUrl: true, brandColor: true } },
      invoice: { select: { amount: true, description: true, currency: true } },
      customer: { select: { email: true } },
    },
  });

  if (!magicLink) return;

  // Se già completato o scaduto, skip
  if (magicLink.isCompleted || magicLink.isExpired) return;
  if (new Date() > magicLink.expiresAt) {
    await prisma.magicLink.update({
      where: { id: magicLinkId },
      data: { isExpired: true },
    });
    return;
  }

  const customerEmail = magicLink.customer?.email;
  if (!customerEmail) return;

  const magicLinkUrl = `${APP_URL}/magic/${magicLink.token}`;

  const result = await sendMagicLinkReminder({
    to: customerEmail,
    merchantName: magicLink.merchant.name,
    merchantLogoUrl: magicLink.merchant.logoUrl,
    brandColor: magicLink.merchant.brandColor ?? undefined,
    magicLinkUrl,
    reminderNumber,
  });

  if (result.success) {
    await prisma.magicLink.update({
      where: { id: magicLinkId },
      data: {
        reminderCount: { increment: 1 },
        lastReminderAt: new Date(),
      },
    });

    // Programma un secondo reminder dopo 3 giorni (max 2 reminder)
    if (reminderNumber < 2) {
      await scheduleMagicLinkReminder(
        {
          magicLinkId,
          invoiceId,
          merchantId,
          reminderNumber: reminderNumber + 1,
        },
        3 * 24 * 60 * 60 * 1000, // 3 giorni
      );
    }
  }

  await logAudit(merchantId, invoiceId, "MAGIC_LINK_REMINDER_SENT", {
    reminderNumber,
    success: result.success,
  });
}

// Helper
async function logAudit(
  merchantId: string,
  invoiceId: string,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        merchantId,
        invoiceId,
        action,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        level: action.includes("ERROR") ? "ERROR" : "INFO",
      },
    });
  } catch {
    console.error(`[AUDIT] Failed to log: ${action}`, metadata);
  }
}
