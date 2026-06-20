# Connettore Fiscale — AI Context File

> Questo file fornisce il contesto completo per qualsiasi AI (Claude, GPT, Copilot) che analizzi o lavori su questo progetto.

## Cos'è questo progetto

Connettore Fiscale è un **middleware SaaS B2B** che connette piattaforme di pagamento (Stripe, in futuro Shopify/PayPal/WooCommerce) con il sistema di fatturazione elettronica italiano (SDI) tramite **Fatture in Cloud API v2**. Il target primario sono freelancer, solopreneur e micro-imprese italiane che vendono prodotti digitali, specialmente in **regime forfettario (RF19)**.

## Problema che risolve

Quando un cliente paga su Stripe, il merchant italiano deve emettere fattura elettronica entro 12 giorni. Spesso mancano i dati fiscali (CF, P.IVA). Il connettore:

1. Intercetta il pagamento via webhook Stripe
2. Valida i dati fiscali (CF con check digit, P.IVA con Luhn, CAP, Province)
3. Se mancano dati → invia un **Magic Link** al cliente per raccoglierli
4. Crea la fattura su Fatture in Cloud e la invia allo SDI
5. Gestisce bollo virtuale (€2 per importi esenti IVA > €77.47)
6. Reminder automatici (fino a 2) se il cliente non compila

## Stack Tecnologico

| Layer        | Tecnologia                         | Versione                                      |
| ------------ | ---------------------------------- | --------------------------------------------- |
| Framework    | Next.js (App Router)               | 16.x                                          |
| Linguaggio   | TypeScript                         | 5.x                                           |
| Database     | PostgreSQL                         | 16+                                           |
| ORM          | Prisma                             | 7.x (con driver adapter `@prisma/adapter-pg`) |
| Job Queue    | BullMQ + IORedis                   | latest                                        |
| Pagamenti    | Stripe SDK                         | latest                                        |
| Fatturazione | Fatture in Cloud API v2            | REST                                          |
| Email        | Resend                             | latest                                        |
| Crittografia | AES-256-GCM (Node crypto) + scrypt | built-in                                      |
| Auth         | JWT (jose) passwordless magic link | custom                                        |
| Validazione  | Zod                                | latest                                        |
| Styling      | Tailwind CSS                       | 4.x                                           |
| Container    | Docker Compose (PG + Redis)        | local dev                                     |

## Architettura

```
                  ┌─────────────────────────────────────────────┐
                  │               Next.js App                   │
                  │                                             │
  Stripe ──────▶  │  /api/webhooks/stripe  ──▶  BullMQ Queue   │
  Webhook         │                              │              │
                  │  /api/magic-link/[token]     │              │
                  │  /api/auth/*                  │              │
                  │  /api/settings                │              │
                  │  /api/invoices                │              │
                  │  /api/dashboard/stats         ▼              │
                  │                         Workers (separate)   │
                  │                          ├ invoice:process   │
                  │                          ├ invoice:send      │
                  │                          ├ magiclink:send    │
                  │                          └ magiclink:reminder│
                  └─────────────────────┬───────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
              PostgreSQL            Redis             Fatture in Cloud
              (Prisma ORM)       (BullMQ)             API v2 → SDI
```

## Struttura Directory

```
connettore-fiscale/
├── prisma/
│   └── schema.prisma          # Schema DB completo (7 modelli, 5 enum)
├── prisma.config.ts           # Prisma 7 config (datasource URL)
├── docker-compose.yml         # PostgreSQL 16 + Redis 7 per dev
├── src/
│   ├── middleware.ts           # Auth JWT, protezione route, inject merchantId
│   ├── app/
│   │   ├── layout.tsx         # Root layout con metadata SEO
│   │   ├── page.tsx           # Landing page promozionale
│   │   ├── magic/[token]/     # Pagina pubblica: cliente compila dati fiscali
│   │   ├── dashboard/
│   │   │   ├── layout.tsx     # Sidebar nav dashboard
│   │   │   ├── page.tsx       # Home dashboard con KPI
│   │   │   ├── invoices/      # Lista fatture filtrabili
│   │   │   └── settings/      # Config API, regime, branding
│   │   └── api/
│   │       ├── webhooks/stripe/   # Webhook endpoint
│   │       ├── magic-link/[token]/ # GET + POST dati fiscali
│   │       ├── auth/login/        # Magic link login
│   │       ├── auth/verify/       # Verifica token → JWT session
│   │       ├── auth/logout/       # Distruggi sessione
│   │       ├── invoices/          # CRUD fatture
│   │       ├── settings/          # GET/PUT/POST config merchant
│   │       └── dashboard/stats/   # KPI API
│   └── lib/
│       ├── db.ts              # Prisma client singleton con PrismaPg adapter
│       ├── crypto.ts          # AES-256-GCM encrypt/decrypt per API key
│       ├── bollo.ts           # Calcolo imposta di bollo (€2 > €77.47)
│       ├── email.ts           # Template email Magic Link + reminder
│       ├── validators/
│       │   └── fiscal.ts      # Validazione CF (check digit), P.IVA (Luhn), CAP, Province
│       ├── stripe/
│       │   └── client.ts      # Client Stripe, verifica webhook, estrai dati ordine
│       ├── fatture-in-cloud/
│       │   └── client.ts      # Client FiC v2: createInvoice, sendToSDI, getSDIStatus
│       ├── queue/
│       │   └── index.ts       # 4 code BullMQ + helper enqueue con idempotenza job ID
│       └── workers/
│           ├── start.ts       # Entry point: avvia tutti i 4 worker con graceful shutdown
│           ├── invoice.worker.ts   # processInvoice + processSendToSDI
│           └── magiclink.worker.ts # processMagicLinkSend + processMagicLinkReminder
└── docs/
    ├── AI_CONTEXT.md          # ← QUESTO FILE
    ├── analisi-ricerca.md     # Analisi mercato e competitor
    ├── analisi-v2.md          # Analisi business avanzata
    └── ricerca-deep.md        # Ricerca di mercato approfondita
```

## Modelli Database (Prisma)

| Modello        | Scopo                                                                             | Relazioni chiave                                               |
| -------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `Merchant`     | Tenant SaaS. API key cifrate, regime fiscale, branding                            | → Invoice[], Customer[], MagicLink[], AuditLog[], LoginToken[] |
| `Customer`     | Cliente finale del merchant. Dati fiscali completi                                | Unique su [merchantId, email]                                  |
| `Invoice`      | Fattura con lifecycle completo. Idempotente su [merchantId, sourceType, sourceId] | → MagicLink[], AuditLog[]                                      |
| `MagicLink`    | Token univoco per raccolta dati fiscali, con reminder tracking                    | → Invoice, Customer?                                           |
| `AuditLog`     | Log di ogni azione per compliance e debug                                         | Livelli: INFO, WARN, ERROR                                     |
| `LoginToken`   | Token passwordless per auth merchant                                              | Scadenza 15 min                                                |
| `Subscription` | Piano SaaS del merchant (Starter/Pro/Enterprise)                                  | → Merchant                                                     |
| `TaxMapping`   | Mappatura tax_code Stripe → codice IVA FiC                                        | → Merchant                                                     |

## Enum chiave

- `InvoiceStatus`: PENDING_DATA → VALIDATING → READY → SENDING → SENT → ACCEPTED / REJECTED / ERROR / FAILED
- `SourceType`: STRIPE, SHOPIFY
- `CustomerType`: PRIVATE, BUSINESS, FOREIGN
- `BolloPolicy`: CHARGE_CUSTOMER, ABSORB_COST
- `InvoiceDocType`: INVOICE (TD01), CREDIT_NOTE (TD04)

## Flusso principale (Happy Path)

1. Stripe invia webhook `checkout.session.completed` → `/api/webhooks/stripe`
2. Verifica firma webhook, estrai dati ordine
3. Upsert Customer (by merchantId + email)
4. Crea Invoice (status: VALIDATING), idempotenza su sourceType+sourceId
5. Enqueue job `invoice:process`
6. Worker: valida dati fiscali → se OK, calcola bollo, crea fattura su FiC
7. Enqueue job `invoice:send` → Worker: invoca `sendToSDI()` su FiC
8. Se dati mancanti → crea MagicLink, enqueue `magiclink:send` → email al cliente
9. Cliente compila form → POST `/api/magic-link/[token]` → re-enqueue `invoice:process`

## Sicurezza

- **API key cifrate** con AES-256-GCM + scrypt key derivation (salt random)
- **JWT session** (7 giorni, HS256, httpOnly cookie `cf-session`)
- **Middleware** inietta `x-merchant-id` nell'header dopo verifica JWT
- Route pubbliche: `/`, `/api/webhooks/stripe`, `/api/magic-link/*`, `/magic/*`
- **Tenant isolation**: ogni query filtra per merchantId

## Convenzioni di codice

- **Lingua**: codice e commenti in inglese, UI/copy in italiano
- **API**: JSON REST, errori con `{ error: string, details?: ... }`
- **Prisma**: `@@map` per snake_case sulle tabelle, field in camelCase
- **Env vars**: `NEXT_PUBLIC_*` per client-side, tutto il resto server-only
- **Worker**: funzioni pure esportate, registrate in `start.ts` con BullMQ Worker
- **Validazione**: Zod per API input, `validators/fiscal.ts` per logica fiscale italiana

## Come avviare in dev

```bash
docker compose up -d          # PostgreSQL + Redis
cp .env.example .env          # Configura variabili
pnpm exec prisma migrate dev  # Crea tabelle
pnpm run dev                  # Next.js su :3000
pnpm exec tsx src/lib/workers/start.ts  # Worker (terminale separato)
```

## Servizi esterni necessari

| Servizio             | Uso                        | Necessario per                   |
| -------------------- | -------------------------- | -------------------------------- |
| **Stripe**           | Ricevi webhook pagamenti   | Core — senza Stripe non funziona |
| **Fatture in Cloud** | Crea fatture e invia a SDI | Core — destinazione fatture      |
| **Resend**           | Invia email Magic Link     | Core — recupero dati fiscali     |
| **PostgreSQL**       | Database applicativo       | Core — persistence               |
| **Redis**            | Job queue BullMQ           | Core — async processing          |

## Stato attuale e roadmap

### ✅ Implementato (MVP)

- Webhook Stripe → creazione fattura
- Webhook `charge.refunded` → Nota di Credito automatica (TD04)
- Magic Link (email + reminder)
- Validazione fiscale italiana completa
- Dashboard merchant (KPI, fatture, settings)
- Dashboard riconciliazione (Stripe vs SDI, `/api/dashboard/reconciliation`)
- Auth passwordless
- Imposta di bollo automatica
- Crittografia API key
- Modello Subscription (piani Starter/Pro/Enterprise)
- Modello TaxMapping (mapping aliquote Stripe → FiC con API CRUD)
- Modello CreditNote (note di credito per rimborsi)
- Worker refund.worker.ts per Nota di Credito
- 5 code BullMQ: invoice:process, invoice:send, magiclink:send, magiclink:reminder, refund:process

### 🔜 Da implementare

- Webhook multi-provider `/api/webhooks/[provider]`
- Validazione VIES (P.IVA reale, non solo formato)
- Magic Link via WhatsApp (Twilio)
- Accesso read-only commercialista
- Supporto vendite estere / OSS
- WooCommerce plugin
- Shopify integrazione + App Store
- Report PDF mensili
