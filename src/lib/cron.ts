// ============================================================
// Cron Jobs - Scheduled tasks per FiscLink
// ============================================================
// Verifica SDI, reminder automatici, cleanup, report

import { prisma } from "@/lib/db";
import { enqueueInvoiceSend, enqueueMagicLinkReminder } from "@/lib/queue";

/**
 * Controlla lo stato SDI delle fatture inviate.
 * Da eseguire ogni 30 minuti.
 */
export async function checkSDIStatus() {
  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      status: "SENT",
      sentAt: { not: null },
    },
    include: { merchant: true },
    take: 50,
  });

  console.log(`[CRON] Controllo stato SDI per ${pendingInvoices.length} fatture...`);

  for (const invoice of pendingInvoices) {
    try {
      // La logica di polling SDI è nel worker invoice:send
      // Qui re-enqueue il job per check stato
      await enqueueInvoiceSend(invoice.id);
    } catch (error) {
      console.error(`[CRON] Errore check SDI per ${invoice.id}:`, error);
    }
  }
}

/**
 * Invia reminder automatici per magic link non completati.
 * Da eseguire ogni ora.
 */
export async function sendPendingReminders() {
  const pendingLinks = await prisma.magicLink.findMany({
    where: {
      isCompleted: false,
      isExpired: false,
      reminderCount: { lt: 2 }, // Max 2 reminder
      expiresAt: { gt: new Date() },
    },
    include: { invoice: true, merchant: true },
  });

  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const TWO_DAYS = 2 * ONE_DAY;
  const FIVE_DAYS = 5 * ONE_DAY;

  for (const link of pendingLinks) {
    const createdMs = link.createdAt.getTime();
    const lastReminderMs = link.lastReminderAt?.getTime() || 0;

    // Primo reminder: 2 giorni dopo creazione
    // Secondo reminder: 5 giorni dopo creazione
    const shouldRemind =
      (link.reminderCount === 0 && now - createdMs > TWO_DAYS) ||
      (link.reminderCount === 1 && now - createdMs > FIVE_DAYS);

    if (shouldRemind && now - lastReminderMs > ONE_DAY) {
      try {
        await enqueueMagicLinkReminder(link.id);
        console.log(`[CRON] Reminder ${link.reminderCount + 1} inviato per magic link ${link.id}`);
      } catch (error) {
        console.error(`[CRON] Errore reminder per ${link.id}:`, error);
      }
    }
  }
}

/**
 * Pulisce magic link scaduti e token login vecchi.
 * Da eseguire ogni giorno.
 */
export async function cleanupExpired() {
  const now = new Date();

  // Marca magic link scaduti
  const expiredLinks = await prisma.magicLink.updateMany({
    where: {
      expiresAt: { lt: now },
      isExpired: false,
      isCompleted: false,
    },
    data: { isExpired: true },
  });

  // Elimina login token vecchi (> 24h)
  const oldTokens = await prisma.loginToken.deleteMany({
    where: {
      createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
  });

  // Reset contatore fatture mensile (subscription)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  await prisma.subscription.updateMany({
    where: {
      resetAt: { lt: now },
    },
    data: {
      invoicesUsed: 0,
      resetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    },
  });

  console.log(
    `[CRON] Cleanup: ${expiredLinks.count} magic link scaduti, ${oldTokens.count} token rimossi`,
  );
}

/**
 * Retry automatico fatture in errore.
 * Da eseguire ogni 15 minuti.
 */
export async function retryFailedInvoices() {
  const retryable = await prisma.invoice.findMany({
    where: {
      status: "ERROR",
      retryCount: { lt: 5 }, // Max 5 tentativi
      nextRetryAt: { lt: new Date() },
    },
    take: 20,
  });

  for (const invoice of retryable) {
    try {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "VALIDATING" },
      });
      // Re-enqueue usando la funzione importata
      const { enqueueInvoiceProcess } = await import("@/lib/queue");
      await enqueueInvoiceProcess(invoice.id);
      console.log(`[CRON] Retry fattura ${invoice.id} (tentativo ${invoice.retryCount + 1})`);
    } catch (error) {
      console.error(`[CRON] Errore retry fattura ${invoice.id}:`, error);
    }
  }
}
