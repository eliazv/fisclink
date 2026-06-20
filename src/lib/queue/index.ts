/**
 * Job Queue con BullMQ
 * Gestisce l'elaborazione asincrona di fatture e magic link.
 *
 * Queue principali:
 * - invoice:process    → Valida dati e crea fattura
 * - invoice:send       → Invia fattura allo SDI
 * - magiclink:send     → Invia email magic link
 * - magiclink:reminder → Reminder per magic link non completati
 */

import { Queue, Job } from "bullmq";
import IORedis from "ioredis";

// Connessione Redis condivisa
const getRedisConnection = () => {
  return new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

// ============================================================
// DEFINIZIONE CODE
// ============================================================

export const QUEUE_NAMES = {
  INVOICE_PROCESS: "invoice-process",
  INVOICE_SEND: "invoice-send",
  MAGIC_LINK_SEND: "magiclink-send",
  MAGIC_LINK_REMINDER: "magiclink-reminder",
  REFUND_PROCESS: "refund-process",
} as const;

// ============================================================
// TIPI JOB
// ============================================================

export interface InvoiceProcessJobData {
  invoiceId: string;
  merchantId: string;
  sourceType: "STRIPE" | "SHOPIFY" | "WOOCOMMERCE" | "PAYPAL";
  sourceId: string;
}

export interface InvoiceSendJobData {
  invoiceId: string;
  merchantId: string;
  ficDocumentId: number;
}

export interface MagicLinkSendJobData {
  magicLinkId: string;
  invoiceId: string;
  merchantId: string;
  customerEmail: string;
}

export interface MagicLinkReminderJobData {
  magicLinkId: string;
  invoiceId: string;
  merchantId: string;
  reminderNumber: number;
}

export interface RefundProcessJobData {
  creditNoteId: string;
  merchantId: string;
  originalInvoiceId: string;
  stripeRefundId: string;
  amount: number;
}

// ============================================================
// CREAZIONE CODE
// ============================================================

let _queues: Record<string, Queue> | null = null;

export function getQueues() {
  if (_queues) return _queues;

  const connection = getRedisConnection();

  _queues = {
    [QUEUE_NAMES.INVOICE_PROCESS]: new Queue(QUEUE_NAMES.INVOICE_PROCESS, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000, // 5s, 10s, 20s, 40s, 80s
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    }),
    [QUEUE_NAMES.INVOICE_SEND]: new Queue(QUEUE_NAMES.INVOICE_SEND, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 10000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    }),
    [QUEUE_NAMES.MAGIC_LINK_SEND]: new Queue(QUEUE_NAMES.MAGIC_LINK_SEND, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "fixed",
          delay: 30000,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
      },
    }),
    [QUEUE_NAMES.MAGIC_LINK_REMINDER]: new Queue(
      QUEUE_NAMES.MAGIC_LINK_REMINDER,
      {
        connection,
        defaultJobOptions: {
          attempts: 2,
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 500 },
        },
      },
    ),
    [QUEUE_NAMES.REFUND_PROCESS]: new Queue(QUEUE_NAMES.REFUND_PROCESS, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    }),
  };

  return _queues;
}

// ============================================================
// HELPER PER AGGIUNGERE JOB
// ============================================================

/**
 * Accoda un job per elaborare una fattura (validazione + creazione).
 */
export async function enqueueInvoiceProcess(
  data: InvoiceProcessJobData,
): Promise<Job<InvoiceProcessJobData>> {
  const queues = getQueues();
  const queue = queues[QUEUE_NAMES.INVOICE_PROCESS];

  // Job ID = sourceType:sourceId per idempotenza
  // Se il job esiste già, non viene duplicato
  return queue.add(`process-${data.sourceId}`, data, {
    jobId: `${data.sourceType}:${data.sourceId}`,
  });
}

/**
 * Accoda un job per inviare una fattura allo SDI.
 */
export async function enqueueInvoiceSend(
  data: InvoiceSendJobData,
): Promise<Job<InvoiceSendJobData>> {
  const queues = getQueues();
  const queue = queues[QUEUE_NAMES.INVOICE_SEND];

  return queue.add(`send-${data.invoiceId}`, data, {
    jobId: `send:${data.invoiceId}`,
  });
}

/**
 * Accoda l'invio di un magic link via email.
 */
export async function enqueueMagicLinkSend(
  data: MagicLinkSendJobData,
): Promise<Job<MagicLinkSendJobData>> {
  const queues = getQueues();
  const queue = queues[QUEUE_NAMES.MAGIC_LINK_SEND];

  return queue.add(`ml-${data.magicLinkId}`, data);
}

/**
 * Programma un reminder per il magic link (delay in ms).
 */
export async function scheduleMagicLinkReminder(
  data: MagicLinkReminderJobData,
  delayMs: number,
): Promise<Job<MagicLinkReminderJobData>> {
  const queues = getQueues();
  const queue = queues[QUEUE_NAMES.MAGIC_LINK_REMINDER];

  return queue.add(
    `reminder-${data.magicLinkId}-${data.reminderNumber}`,
    data,
    {
      delay: delayMs,
      jobId: `reminder:${data.magicLinkId}:${data.reminderNumber}`,
    },
  );
}

/**
 * Accoda un job per processare un rimborso e creare una Nota di Credito.
 */
export async function enqueueRefundProcess(
  data: RefundProcessJobData,
): Promise<Job<RefundProcessJobData>> {
  const queues = getQueues();
  const queue = queues[QUEUE_NAMES.REFUND_PROCESS];

  return queue.add(`refund-${data.stripeRefundId}`, data, {
    jobId: `refund:${data.stripeRefundId}`,
  });
}
