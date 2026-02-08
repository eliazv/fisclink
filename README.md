# Connettore Fiscale

**Middleware SaaS** che collega piattaforme di pagamento (Stripe, Shopify) con la fatturazione elettronica italiana (SDI) tramite Fatture in Cloud.

## 🏗️ Architettura

```
Stripe Webhook → API Route → Job Queue (BullMQ) → Worker
                                                     ├── Dati fiscali OK → Crea fattura su FiC → Invia a SDI
                                                     └── Dati mancanti  → Magic Link → Cliente compila → Re-enqueue
```

### Stack Tecnologico

| Layer        | Tecnologia                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 15 (App Router, TypeScript) |
| Database     | PostgreSQL + Prisma ORM             |
| Job Queue    | BullMQ + Redis                      |
| Pagamenti    | Stripe SDK                          |
| Fatturazione | Fatture in Cloud API v2             |
| Email        | Resend                              |
| Crittografia | AES-256-GCM (API key nel DB)        |
| Styling      | Tailwind CSS                        |
| Validazione  | Zod                                 |

## 📁 Struttura Progetto

```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/stripe/    # Webhook Stripe (checkout, payment_intent)
│   │   ├── magic-link/[token]/ # GET dati link, POST dati fiscali
│   │   ├── invoices/           # CRUD fatture
│   │   ├── dashboard/stats/    # KPI dashboard
│   │   └── settings/           # Configurazione merchant
│   ├── dashboard/              # Dashboard merchant
│   │   ├── page.tsx            # Home con KPI e setup guide
│   │   ├── invoices/           # Lista fatture con filtri
│   │   └── settings/           # Configurazione API, regime, branding
│   ├── magic/[token]/          # Pagina pubblica Magic Link
│   └── page.tsx                # Landing page
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── crypto.ts               # AES-256-GCM encrypt/decrypt
│   ├── bollo.ts                # Calcolo imposta di bollo
│   ├── email.ts                # Template email Magic Link
│   ├── validators/fiscal.ts    # Validazione CF, P.IVA, CAP, Provincia
│   ├── stripe/client.ts        # Client Stripe + estrazione ordini
│   ├── fatture-in-cloud/client.ts  # Client FiC API v2
│   ├── queue/index.ts          # Code BullMQ + helper enqueue
│   └── workers/
│       ├── invoice.worker.ts   # Processo fattura: valida → crea → invia SDI
│       └── magiclink.worker.ts # Invio email Magic Link + reminder
prisma/
└── schema.prisma               # Schema completo DB
```

## 🚀 Quick Start

### Prerequisiti

- Node.js 18+
- PostgreSQL
- Redis
- Account Stripe (test mode)
- Account Fatture in Cloud (API v2)
- Account Resend

### Setup

```bash
# 1. Clona e installa dipendenze
git clone <repo-url>
cd connettore-fiscale
npm install

# 2. Configura environment
cp .env.example .env
# Compila .env con i tuoi valori

# 3. Crea database e applica schema
npx prisma migrate dev --name init

# 4. Avvia Redis (se non già in esecuzione)
# Docker: docker run -d -p 6379:6379 redis

# 5. Avvia in development
npm run dev

# 6. In un altro terminale, avvia i worker
npx tsx src/lib/workers/start.ts
```

### Stripe CLI (per test webhook)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe?merchant=YOUR_MERCHANT_ID
```

## 🔑 Funzionalità Chiave

### Magic Link

Quando un pagamento Stripe arriva ma mancano i dati fiscali del cliente (CF, P.IVA), il sistema:

1. Crea un **Magic Link** univoco
2. Invia email al cliente con link branded del merchant
3. Il cliente compila i dati fiscali su una pagina pubblica
4. Il sistema ri-processa automaticamente la fattura
5. Se il cliente non risponde, invia fino a 2 **reminder** automatici

### Imposta di Bollo

Gestione automatica del bollo virtuale (€2.00) per:

- Regime forfettario (RF19) con importi esenti IVA > €77.47
- Politica configurabile: addebito al cliente o assorbimento

### Validazione Fiscale

- **Codice Fiscale**: algoritmo completo con check digit
- **Partita IVA**: validazione Luhn
- **CAP**: formato 5 cifre
- **Provincia**: verifica esistenza sigla
- **Codice SDI**: formato 7 caratteri alfanumerici

### Crittografia

Le API key dei merchant (Stripe, Fatture in Cloud) sono cifrate con **AES-256-GCM** prima di essere salvate nel database, usando chiave derivata con scrypt.

## 📊 Modello Dati

| Modello     | Descrizione                                                |
| ----------- | ---------------------------------------------------------- |
| `Merchant`  | Tenant con configurazione, API key cifrate, regime fiscale |
| `Customer`  | Dati anagrafici e fiscali del cliente                      |
| `Invoice`   | Fattura con lifecycle completo (PENDING → ACCEPTED)        |
| `MagicLink` | Token per recupero dati fiscali con scadenza e reminder    |
| `AuditLog`  | Log granulare di ogni azione per merchant                  |

## 🔧 Comandi Utili

```bash
# Development
npm run dev              # Avvia Next.js in dev mode
npm run build            # Build produzione
npm run start            # Avvia in produzione

# Database
npx prisma studio        # GUI per esplorare il DB
npx prisma migrate dev   # Applica migrazioni in dev
npx prisma generate      # Rigenera Prisma Client

# Worker
npx tsx src/lib/workers/start.ts  # Avvia worker BullMQ
```

## 📝 Piano di Pricing

| Piano        | Prezzo   | Fatture/mese | Funzionalità                                    |
| ------------ | -------- | ------------ | ----------------------------------------------- |
| **Starter**  | €15/mese | 50           | 1 integrazione, Magic Link, email support       |
| **Pro**      | €29/mese | 200          | 2 integrazioni, bollo automatico, priorità      |
| **Business** | €59/mese | Illimitate   | Tutte le integrazioni, API, onboarding dedicato |

## 📜 Licenza

Proprietario - Tutti i diritti riservati.
