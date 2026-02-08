/**
 * Worker Startup Script
 * Avvia tutti i worker BullMQ per il processing asincrono.
 *
 * Uso: npx tsx src/lib/workers/start.ts
 */

import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processInvoice, processSendToSDI } from "./invoice.worker";
import {
  processMagicLinkSend,
  processMagicLinkReminder,
} from "./magiclink.worker";
import { processRefund } from "./refund.worker";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);

console.log("🚀 Avvio worker FiscLink...");

// Worker: Processa fattura (valida dati → crea su FiC o Magic Link)
const invoiceProcessWorker = new Worker(
  "invoice:process",
  async (job) => {
    console.log(
      `📄 [invoice:process] Job ${job.id} - Invoice ${job.data.invoiceId}`,
    );
    await processInvoice(job.data.invoiceId);
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 }, // max 10 job/sec
  },
);

// Worker: Invia fattura a SDI tramite Fatture in Cloud
const invoiceSendWorker = new Worker(
  "invoice:send",
  async (job) => {
    console.log(
      `📤 [invoice:send] Job ${job.id} - Invoice ${job.data.invoiceId}`,
    );
    await processSendToSDI(job.data.invoiceId);
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 5, duration: 1000 },
  },
);

// Worker: Invio email Magic Link
const magicLinkSendWorker = new Worker(
  "magiclink:send",
  async (job) => {
    console.log(
      `✉️ [magiclink:send] Job ${job.id} - MagicLink ${job.data.magicLinkId}`,
    );
    await processMagicLinkSend(job.data.magicLinkId);
  },
  {
    connection,
    concurrency: 5,
  },
);

// Worker: Reminder Magic Link
const magicLinkReminderWorker = new Worker(
  "magiclink:reminder",
  async (job) => {
    console.log(
      `🔔 [magiclink:reminder] Job ${job.id} - MagicLink ${job.data.magicLinkId}`,
    );
    await processMagicLinkReminder(job.data.magicLinkId);
  },
  {
    connection,
    concurrency: 3,
  },
);

// Worker: Processa rimborsi → Note di Credito
const refundProcessWorker = new Worker(
  "refund:process",
  async (job) => {
    console.log(
      `💸 [refund:process] Job ${job.id} - CreditNote ${job.data.creditNoteId}`,
    );
    await processRefund(job.data);
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 5, duration: 1000 },
  },
);

// Event handlers comuni
const workers = [
  { worker: invoiceProcessWorker, name: "invoice:process" },
  { worker: invoiceSendWorker, name: "invoice:send" },
  { worker: magicLinkSendWorker, name: "magiclink:send" },
  { worker: magicLinkReminderWorker, name: "magiclink:reminder" },
  { worker: refundProcessWorker, name: "refund:process" },
];

for (const { worker, name } of workers) {
  worker.on("completed", (job) => {
    console.log(`✅ [${name}] Job ${job.id} completato`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [${name}] Job ${job?.id} fallito:`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`🔥 [${name}] Errore worker:`, err.message);
  });
}

console.log("✅ Tutti i worker sono attivi:");
console.log("   - invoice:process    (concurrency: 5)");
console.log("   - invoice:send       (concurrency: 3)");
console.log("   - magiclink:send     (concurrency: 5)");
console.log("   - magiclink:reminder (concurrency: 3)");
console.log("   - refund:process     (concurrency: 3)");

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutdown in corso...");
  await Promise.all(workers.map(({ worker }) => worker.close()));
  await connection.quit();
  console.log("👋 Worker fermati. Bye!");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
