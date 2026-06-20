/**
 * Bull Board - Dashboard di monitoraggio code BullMQ
 * Mostra job in attesa, attivi, completati e falliti per ogni coda.
 *
 * Uso: pnpm run queue-board
 * Protetto da basic auth (QUEUE_BOARD_USER / QUEUE_BOARD_PASSWORD in .env).
 */

import express from "express";
import basicAuth from "express-basic-auth";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { getQueues } from "../queue";

const PORT = Number(process.env.QUEUE_BOARD_PORT ?? 4000);
const USER = process.env.QUEUE_BOARD_USER ?? "admin";
const PASSWORD = process.env.QUEUE_BOARD_PASSWORD;

if (!PASSWORD) {
  console.error(
    "[queue-board] QUEUE_BOARD_PASSWORD non impostata in .env. Imposta una password prima di avviare la dashboard.",
  );
  process.exit(1);
}

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");

createBullBoard({
  queues: Object.values(getQueues()).map((queue) => new BullMQAdapter(queue)),
  serverAdapter,
});

const app = express();
app.use(basicAuth({ users: { [USER]: PASSWORD } }));
app.use("/", serverAdapter.getRouter());

app.listen(PORT, () => {
  console.log(`[queue-board] Dashboard code disponibile su http://localhost:${PORT}`);
});
