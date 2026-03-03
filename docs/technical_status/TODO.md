# FiscLink — Guida Completa: Setup, Test, Pubblicazione

> Guida operativa per configurare, testare e pubblicare l'app.

---

## 1. Setup locale — Servizi da configurare

### 1.1 Docker (PostgreSQL + Redis)

```bash
docker compose up -d
```

Avvia PostgreSQL 16 (porta 5432) e Redis 7 (porta 6379) con dati persistenti.

### 1.2 Database — Prisma migrate

```bash
npx prisma migrate dev --name init
```

Crea tutte le tabelle nel database PostgreSQL locale.

### 1.3 Servizi esterni da configurare

| Servizio             | Cosa serve                                    | Come ottenerlo                                                       |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| **Stripe**           | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Dashboard Stripe → Developers → API keys (usa chiavi `sk_test_...`)  |
| **Fatture in Cloud** | `FIC_ACCESS_TOKEN` + `FIC_COMPANY_ID`         | Pannello FiC → Impostazioni → App → Crea applicazione → OAuth2 token |
| **Resend**           | `RESEND_API_KEY`                              | resend.com → Dashboard → API Keys → Crea chiave                      |
| **Auth Secret**      | `AUTH_SECRET` (stringa random 32+ char)       | `openssl rand -hex 32` oppure genera manualmente                     |
| **Encryption**       | `ENCRYPTION_SECRET` (stringa random 32+ char) | `openssl rand -hex 32` oppure genera manualmente                     |

### 1.4 File .env completo

```env
DATABASE_URL="postgresql://connettore:connettore_dev_2026@localhost:5432/connettore_fiscale?schema=public"
REDIS_URL="redis://localhost:6379"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

FIC_ACCESS_TOKEN="il-tuo-token-fic"
FIC_COMPANY_ID="123456"

RESEND_API_KEY="re_..."
EMAIL_FROM="FiscLink <noreply@tuodominio.com>"

AUTH_SECRET="una-stringa-random-lunga-32-caratteri"
ENCRYPTION_SECRET="unaltra-stringa-random-lunga-32-caratteri"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="FiscLink"
```

### 1.5 Avvio dev

```bash
npm run dev          # Next.js su http://localhost:3000
npm run worker       # Worker BullMQ (se configurato)
```

---

## 2. Come testare il funzionamento

### 2.1 Test Stripe Webhooks (Stripe CLI)

```bash
# Installa Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In un altro terminale, simula un pagamento:
stripe trigger checkout.session.completed
stripe trigger charge.refunded
```

La CLI ti darà un `whsec_...` temporaneo da mettere in `STRIPE_WEBHOOK_SECRET`.

### 2.2 Test flusso completo end-to-end

1. **Configura il merchant**: Vai su `/dashboard/settings`, inserisci le chiavi API
2. **Simula un pagamento**: Con Stripe CLI `stripe trigger checkout.session.completed`
3. **Verifica il webhook**: Controlla i log del server Next.js
4. **Magic Link**: Se il pagamento non ha CF, controlla che venga creato un MagicLink nel DB
5. **Compila il Magic Link**: Apri `/magic-link/[token]` e inserisci un CF di test
6. **Fattura**: Verifica su Fatture in Cloud (sandbox) che la fattura sia stata creata

### 2.3 Test con dati fiscali di esempio

| Campo          | Valore test                              |
| -------------- | ---------------------------------------- |
| Codice Fiscale | `RSSMRA85M01H501Z` (syntactically valid) |
| Partita IVA    | `12345678903` (Luhn valid)               |
| SDI Code       | `0000000` (persona fisica)               |
| PEC            | `test@pec.it`                            |
| CAP            | `00100`                                  |

### 2.4 Test unitari (da implementare)

```bash
npm test                # Quando configurato con Vitest
```

Aree da coprire:

- Validazione CF (check digit)
- Validazione P.IVA (algoritmo Luhn)
- Calcolo bollo (> €77.47)
- Crittografia/decrittografia chiavi API
- Mapping fattura Stripe → FiC

### 2.5 Fatture in Cloud Sandbox

FiC offre un ambiente sandbox per test. Usa il token sandbox per evitare di creare fatture reali.
Documentazione: https://developers.fattureincloud.it/

---

## 3. Cosa manca per la pubblicazione

### 3.1 Infrastruttura produzione

- [ ] **Hosting**: Vercel (Next.js nativo) o VPS con Docker
- [ ] **Database produzione**: Neon, Supabase, o PostgreSQL su Railway/Render
- [ ] **Redis produzione**: Upstash (serverless) o Redis Cloud
- [ ] **Dominio**: Registra `fisclink.it` o simile
- [ ] **SSL**: Automatico su Vercel, Let's Encrypt su VPS
- [ ] **DNS**: Configura A/CNAME record

### 3.2 Stripe produzione

- [ ] Attiva account Stripe (non più test mode)
- [ ] Genera chiavi `sk_live_...` e `whsec_...` di produzione
- [ ] Configura webhook endpoint produzione: `https://fisclink.it/api/webhooks/stripe`
- [ ] Abilita eventi: `checkout.session.completed`, `charge.refunded`, `invoice.paid`

### 3.3 Sicurezza pre-lancio

- [ ] **Rate limiting** sugli endpoint API (già parziale, da rafforzare)
- [ ] **CORS** configurato correttamente
- [ ] **CSP headers** (Content Security Policy)
- [ ] **Audit logging** completo
- [ ] **Backup database** automatici (giornalieri)
- [ ] **Monitoring**: Sentry o Axiom per error tracking
- [ ] **Health check** endpoint `/api/health`
- [ ] Verifica che `.env` NON sia nel repository

### 3.4 Legale

- [ ] **Privacy Policy** (GDPR compliant — tratti dati fiscali!)
- [ ] **Termini di Servizio**
- [ ] **Cookie Policy** (anche se usi solo cookie tecnici)
- [ ] **DPA** (Data Processing Agreement) con i fornitori (Stripe, FiC, Resend)
- [ ] **Registro trattamenti** (art. 30 GDPR)
- [ ] **P.IVA** visibile nel footer (obbligo per SaaS B2B)

### 3.5 Pagine mancanti

- [ ] `/privacy` — Privacy Policy
- [ ] `/terms` — Termini di Servizio
- [ ] `/cookies` — Cookie Policy
- [ ] `/status` — Status page (uptime)

### 3.6 SEO e Marketing

- [ ] **Open Graph image** (`/public/og-image.png`) — 1200x630px
- [ ] **Favicon** set completo (16, 32, 180, 192, 512)
- [ ] **robots.txt** e **sitemap.xml**
- [ ] Google Search Console
- [ ] Google Analytics 4 o Plausible/Fathom (privacy-friendly)

---

## 4. Come pubblicare su Stripe App Store e Shopify

### 4.1 Stripe App Marketplace

**URL**: https://marketplace.stripe.com/

**Requisiti:**

1. **Stripe Partner Program**: Registrati su https://stripe.com/partners
2. **Stripe App**: Crea un'app con OAuth flow in Stripe Connect
3. **Review process**: Stripe esamina sicurezza, UX, compliance
4. **Documentazione richiesta**:
   - Descrizione app, screenshot, video demo
   - Privacy policy, ToS
   - Endpoint OAuth per installazione
   - Webhook di deinstallazione
5. **Monetizzazione**: Puoi far pagare tramite Stripe Billing direttamente

**Passaggi tecnici:**

```
1. Crea Stripe App → Dashboard Stripe → Apps
2. Implementa OAuth2 flow (authorize → callback → save token)
3. L'utente installa l'app dal marketplace
4. Tu ricevi il connected account ID
5. Puoi gestire webhook e creare fatture per quell'account
```

**Timeline**: 2-6 settimane per approvazione.

### 4.2 Shopify App Store

**URL**: https://apps.shopify.com/

**Requisiti:**

1. **Shopify Partners**: Registrati su https://partners.shopify.com (gratuito)
2. **App Shopify**: Crea un'app nel Partner Dashboard
3. **OAuth2**: Implementa il flow di autenticazione Shopify
4. **Webhook Shopify**: Ascolta `orders/paid`, `refunds/create`
5. **Review process**: Shopify esamina UX, performance, sicurezza
6. **App Listing**: Screenshot, video, descrizione, pricing

**Passaggi tecnici da implementare:**

```
1. Crea progetto Shopify App (usa @shopify/shopify-api)
2. Implementa OAuth: /api/auth/shopify → redirect → callback
3. Salva AccessToken + Shop domain nel DB (crittografato)
4. Ricevi webhook: /api/webhooks/shopify (orders/paid)
5. Mappa dati ordine → struttura fattura
6. Il resto del flusso (FiC, Magic Link) è identico a Stripe
```

**Funzionalità richieste per approvazione Shopify:**

- App responsive (funziona su mobile)
- Onboarding chiaro per l'utente
- Gestione uninstall (cancella dati utente)
- Privacy badge e compliance GDPR
- Performance: caricamento < 3 secondi

**Monetizzazione**: Shopify Billing API per abbonamenti nell'admin Shopify.

**Timeline**: 2-8 settimane per approvazione.

---

## 5. Prossimi passi di sviluppo (da analisi-v2.md)

### Priorità 1 — Differenziante

- [ ] **Note di Credito automatiche** (TD04): Worker `refund.worker.ts` per `charge.refunded`
- [ ] **Dashboard riconciliazione**: Stripe totals vs SDI totals con alert discrepanze
- [ ] **Modello Subscription**: Gestione piani Starter/Pro/Enterprise con limiti fatture

### Priorità 2 — Crescita

- [ ] **TaxMapping**: Tabella per mappare tax_rates Stripe → codici IVA FiC
- [ ] **Magic Link via WhatsApp**: Integrazione Twilio dopo X ore di non-risposta email
- [ ] **Accesso commercialista**: Dashboard read-only con export CSV/PDF

### Priorità 3 — Espansione

- [ ] **Multi-store / multi-merchant**: Layer UI per gestire più negozi
- [ ] **Validazione VIES**: Check P.IVA reale via servizio VIES/AdE
- [ ] **Webhook multi-provider**: Struttura `/api/webhooks/[provider]`
- [ ] **WooCommerce plugin**: Endpoint API + plugin WordPress minimale
- [ ] **Integrazione PayPal**: Secondo provider di pagamento

### Priorità 4 — Enterprise

- [ ] **Vendite estere / OSS**: Filtro per fatture extra-SDI (B2C EU)
- [ ] **Report PDF mensili**: Generazione automatica per commercialista
- [ ] **White-label**: Branding personalizzato per rivenditori
- [ ] **API pubblica**: Per integrazioni custom dei clienti

---

## 6. Checklist lancio rapido

```
[ ] docker compose up -d (PG + Redis)
[ ] npx prisma migrate dev --name init
[ ] Stripe test keys in .env
[ ] stripe listen --forward-to localhost:3000/api/webhooks/stripe
[ ] FiC sandbox token in .env
[ ] Resend API key in .env
[ ] npm run dev → apri http://localhost:3000
[ ] Configura merchant su /dashboard/settings
[ ] stripe trigger checkout.session.completed
[ ] Verifica fattura su FiC sandbox
[ ] ✅ Tutto funziona → deploy su Vercel/VPS
```
