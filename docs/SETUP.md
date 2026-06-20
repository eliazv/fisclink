# FiscLink — Guida Setup Completa

## Prerequisiti

| Strumento                   | Versione          | Scopo                     |
| --------------------------- | ----------------- | ------------------------- |
| **Node.js**                 | ≥ 20 LTS          | Runtime                   |
| **pnpm**                    | ≥ 10              | Package manager           |
| **Docker + Docker Compose** | Qualsiasi recente | PostgreSQL + Redis locali |
| **Stripe CLI**              | Ultima            | Forward webhook in locale |

---

## 1. Account e Servizi da Creare

### Obbligatori

| Servizio             | URL                             | Cosa serve                      | Variabile .env                               |
| -------------------- | ------------------------------- | ------------------------------- | -------------------------------------------- |
| **Fatture in Cloud** | https://www.fattureincloud.it   | API Token + Company ID          | Salvati cifrati nel DB per-merchant          |
| **Stripe**           | https://dashboard.stripe.com    | Secret Key + Webhook Secret     | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Resend**           | https://resend.com              | API Key per email transazionali | `RESEND_API_KEY`                             |
| **PostgreSQL**       | Docker locale / Supabase / Neon | Database principale             | `DATABASE_URL`                               |
| **Redis**            | Docker locale / Upstash         | Job queue (BullMQ)              | `REDIS_URL`                                  |

### Opzionali (in base ai provider usati)

| Servizio        | URL                                          | Variabili .env                                                  |
| --------------- | -------------------------------------------- | --------------------------------------------------------------- |
| **Shopify**     | Admin Shopify → Settings → Apps → Custom App | `SHOPIFY_API_KEY`, `SHOPIFY_WEBHOOK_SECRET`                     |
| **WooCommerce** | WP Admin → WooCommerce → REST API            | `WOOCOMMERCE_WEBHOOK_SECRET`                                    |
| **PayPal**      | https://developer.paypal.com                 | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` |

---

## 2. Setup Locale (Sviluppo)

### 2.1 Clone e dipendenze

```bash
git clone <repo-url> fisclink
cd fisclink
pnpm install
```

### 2.2 Avvia PostgreSQL e Redis

```bash
docker compose up -d
```

Verifica che i container siano attivi:

```bash
docker compose ps
# postgres (porta 5432) e redis (porta 6379) devono essere "running"
```

### 2.3 Configura .env

```bash
cp .env.example .env
```

Modifica `.env` con i tuoi valori. I minimi per partire sono:

```env
DATABASE_URL="postgresql://fisclink:fisclink@localhost:5432/fisclink?schema=public"
REDIS_URL="redis://localhost:6379"
ENCRYPTION_SECRET="$(openssl rand -base64 32)"
AUTH_SECRET="$(openssl rand -base64 32)"
RESEND_API_KEY="re_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="FiscLink"
EMAIL_FROM="FiscLink <noreply@tuodominio.it>"
```

### 2.4 Inizializza il database

```bash
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

### 2.5 Avvia l'app

```bash
pnpm dev
```

L'app sarà su **http://localhost:3000**.

### 2.6 Stripe CLI (per testare webhook in locale)

```bash
# In un terminale separato:
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe?merchant=YOUR_MERCHANT_ID
```

La CLI stamperà il webhook signing secret (`whsec_...`), salvalo in `.env` come `STRIPE_WEBHOOK_SECRET`.

### 2.7 Avvia i worker (in un terminale separato)

```bash
pnpm exec tsx src/lib/workers/start.ts
```

I worker elaborano le code BullMQ: creazione fatture, invio SDI, magic link, rimborsi.

### 2.8 Esegui i test

```bash
pnpm test
```

---

## 3. Struttura Architetturale

```
Browser → Next.js (App Router)
              ├── Dashboard UI (React)
              ├── API Routes (/api/*)
              │     ├── /api/webhooks/stripe         → Webhook Stripe dedicato
              │     ├── /api/webhooks/[provider]     → Multi-provider (Shopify, WooCommerce, PayPal)
              │     ├── /api/settings                → Configurazione merchant
              │     ├── /api/dashboard/*             → Stats, Riconciliazione
              │     ├── /api/invoices                → Lista fatture
              │     └── /api/magic-link/[token]      → Raccolta dati fiscali
              └── Middleware (auth JWT + rate limiting)

Worker (BullMQ) ← Redis
   ├── invoice:process    → Validazione + creazione FiC + VIES + OSS + TaxMapping
   ├── invoice:send       → Invio SDI
   ├── magiclink:send     → Email magic link
   ├── magiclink:reminder → Reminder automatici
   └── refund:process     → Nota di credito FiC

Database: PostgreSQL (Prisma ORM)
```

---

## 4. Deploy in Produzione

### 4.1 Piattaforma consigliata

| Componente        | Servizio consigliato | Alternativa        |
| ----------------- | -------------------- | ------------------ |
| **App Next.js**   | Vercel               | Railway, Fly.io    |
| **PostgreSQL**    | Supabase (free tier) | Neon, Railway      |
| **Redis**         | Upstash (serverless) | Railway Redis      |
| **Worker BullMQ** | Railway / Fly.io     | VPS con PM2        |
| **Dominio**       | Qualsiasi registrar  | —                  |
| **DNS/CDN**       | Cloudflare           | Vercel (integrato) |

### 4.2 Deploy su Vercel + Supabase + Upstash

#### A) Database (Supabase)

1. Crea progetto su https://supabase.com
2. Vai su Settings → Database → Connection string (URI)
3. Copia in `DATABASE_URL`

#### B) Redis (Upstash)

1. Crea database su https://upstash.com
2. Copia la connection string in `REDIS_URL`

#### C) Deploy Next.js (Vercel)

1. Connetti il repo GitHub a Vercel
2. Configura **Environment Variables** nel dashboard Vercel (tutte quelle del `.env`)
3. Imposta il build command: `prisma generate && next build`
4. Deploy!

#### D) Worker

I worker BullMQ **non** girano su Vercel (serverless ≠ long-running).
Opzioni:

- **Railway**: Crea un servizio con start command `pnpm exec tsx src/lib/workers/start.ts`
- **Fly.io**: Dockerfile con CMD per i worker
- **VPS**: PM2 con `pm2 start src/lib/workers/start.ts --interpreter=tsx`

### 4.3 Webhook URLs da configurare

| Provider        | URL Webhook                                                       |
| --------------- | ----------------------------------------------------------------- |
| **Stripe**      | `https://tuodominio.com/api/webhooks/stripe?merchant=MERCHANT_ID` |
| **Shopify**     | `https://tuodominio.com/api/webhooks/shopify`                     |
| **WooCommerce** | `https://tuodominio.com/api/webhooks/woocommerce`                 |
| **PayPal**      | `https://tuodominio.com/api/webhooks/paypal`                      |

### 4.4 Eventi webhook da attivare

**Stripe:**

- `checkout.session.completed`
- `payment_intent.succeeded`
- `charge.refunded`
- `invoice.paid` (solo se usi Stripe Billing per abbonamenti)

**Shopify:**

- `orders/paid`
- `orders/create`
- `refunds/create`

**WooCommerce:**

- `order.completed`
- `order.payment_complete`
- `order.refunded`

**PayPal:**

- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.REFUNDED`

---

## 5. Checklist Pre-Produzione

### Sicurezza

- [ ] `ENCRYPTION_SECRET` e `AUTH_SECRET` generati con `openssl rand -base64 32`
- [ ] Tutte le API key di Stripe sono in modalità **live** (non test)
- [ ] HTTPS abilitato (Vercel lo fa automatico)
- [ ] Rate limiting attivo (middleware integrato)
- [ ] CORS configurato se necessario

### Database

- [ ] Backup automatici configurati (Supabase li include)
- [ ] Migration eseguita: `pnpm exec prisma migrate deploy`
- [ ] Indici verificati (Prisma li crea da schema)

### Monitoraggio

- [ ] Logging attivo (Vercel Logs / Railway Logs)
- [ ] Health check endpoint: `GET /api/health`
- [ ] Monitorare le queue BullMQ (consigliato: bull-board o arena)

### Legal / Compliance

- [ ] Privacy policy pubblicata (GDPR obbligatorio)
- [ ] Cookie banner se necessario
- [ ] I dati fiscali (CF, P.IVA) sono cifrati nel DB (AES-256-GCM)
- [ ] Retention policy per i dati: definire dopo quanto eliminare

---

## 6. Comandi Utili

```bash
# Sviluppo
pnpm dev                                    # App Next.js
pnpm exec tsx src/lib/workers/start.ts            # Worker BullMQ
stripe listen --forward-to localhost:3000/api/webhooks/stripe?merchant=ID

# Database
pnpm exec prisma studio                     # GUI database
pnpm exec prisma migrate dev --name <nome>  # Nuova migration
pnpm exec prisma migrate deploy             # Applica in produzione
pnpm exec prisma generate                   # Rigenera client

# Test
pnpm test                                   # Tutti i test
pnpm test -- --watch                        # Watch mode
pnpm test -- __tests__/lib/bollo.test.ts    # Singolo file

# Build
pnpm build                                  # Build produzione
pnpm start                                  # Avvia build di produzione
```

---

## 7. Troubleshooting

| Problema                     | Soluzione                                                                |
| ---------------------------- | ------------------------------------------------------------------------ |
| `prisma migrate` fallisce    | Verifica `DATABASE_URL` e che il container PostgreSQL sia attivo         |
| Worker non partono           | Verifica `REDIS_URL` e che Redis sia raggiungibile                       |
| Webhook Stripe 400           | Assicurati che `STRIPE_WEBHOOK_SECRET` corrisponda a quello della CLI    |
| Email non inviate            | Verifica `RESEND_API_KEY` e il dominio verificato su Resend              |
| Rate limit troppo aggressivo | Modifica le soglie in `src/middleware.ts`                                |
| PayPal 401                   | Verifica `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` |
