# FiscLink

[![CI](https://github.com/eliazv/fisclink/actions/workflows/ci.yml/badge.svg)](https://github.com/eliazv/fisclink/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)

**Raccogli e valida i dati fiscali italiani (Codice Fiscale, Partita IVA, SDI, PEC) mancanti dai pagamenti Stripe.**

Open source, self-hosted, pensato per developer, freelance e piccoli SaaS italiani che incassano con Stripe ma si trovano senza i dati necessari per la fatturazione elettronica.

> Stato del progetto: early preview / developer tool. Non è un gestionale fiscale completo e non sostituisce commercialista, consulente fiscale o provider accreditato SdI.

## Perché esiste

In Italia la fatturazione elettronica è obbligatoria per la quasi totalità delle partite IVA. Stripe però non raccoglie in modo affidabile Codice Fiscale, Partita IVA, indirizzo o codice destinatario SDI/PEC al momento del pagamento.

Il risultato è che chi vende con Stripe in Italia finisce a rincorrere i clienti via email per i dati fiscali mancanti, oppure rischia fatture incomplete o in ritardo verso il commercialista.

FiscLink automatizza solo questa parte: webhook Stripe → controllo dati → Magic Link al cliente se manca qualcosa → dati validati e pronti per l'export o per il gestionale fiscale che già usi.

## Cosa fa

- Riceve eventi Stripe da webhook.
- Crea una coda di pagamenti/fatture da completare fiscalmente.
- Recupera dati fiscali mancanti tramite Magic Link inviato al cliente.
- Valida formalmente Codice Fiscale, Partita IVA, CAP, provincia, codice SDI e PEC.
- Tiene traccia dello stato di ogni documento: dati mancanti, pronto, esportato, inviato tramite integrazione opzionale.
- Può integrarsi con Fatture in Cloud per creare e inviare documenti elettronici.

## Cosa non fa, almeno per ora

- Non invia direttamente allo SdI con un canale proprietario.
- Non sostituisce Fatture in Cloud, A-Cube, Aruba, Fattura24 o altri provider fiscali.
- Non garantisce correttezza fiscale, regime IVA, OSS, reverse charge o casi complessi.
- Non è pensato come prodotto SaaS commerciale pronto all'uso.

## Posizionamento

Il progetto nasce per risolvere un problema pratico:

```txt
Stripe incassa il pagamento, ma spesso mancano dati fiscali italiani completi.
FiscLink raccoglie e valida quei dati, poi li prepara per il tuo flusso di fatturazione.
```

L'obiettivo è restare piccolo, ispezionabile e self-hosted.

## Flusso consigliato

```txt
Stripe invoice.paid / checkout.session.completed
        ↓
FiscLink webhook
        ↓
Validazione dati cliente
        ↓
┌───────────────────────────┬────────────────────────────────┐
│ Dati completi             │ Dati mancanti                  │
│ → Pronto per export/invio │ → Magic Link al cliente        │
└───────────────────────────┴────────────────────────────────┘
        ↓
Export / integrazione opzionale con Fatture in Cloud
```

## Stack

| Layer | Tecnologia |
| --- | --- |
| Framework | Next.js, App Router, TypeScript |
| Database | PostgreSQL + Prisma |
| Queue | BullMQ + Redis |
| Pagamenti | Stripe SDK |
| Email | Resend |
| Crittografia | AES-256-GCM per chiavi API |
| Validazione | Zod + validatori fiscali custom |

## Quick start locale

### Prerequisiti

- Node.js 20+
- pnpm 10+ (`npm i -g pnpm` se non lo hai)
- PostgreSQL
- Redis
- Account Stripe in test mode
- Account Resend, opzionale in development
- Account Fatture in Cloud, solo se vuoi provare l'integrazione FiC

### Setup

```bash
git clone <repo-url>
cd fisclink
pnpm install
cp .env.example .env
pnpm exec prisma migrate dev --name init
pnpm dev
```

In un secondo terminale:

```bash
pnpm worker
```

Per testare i webhook Stripe in locale:

```bash
stripe listen --forward-to "localhost:3000/api/webhooks/stripe?merchant=YOUR_MERCHANT_ID"
```

## Script utili

```bash
pnpm dev             # Avvia Next.js
pnpm worker          # Avvia i worker BullMQ
pnpm queue-board     # Dashboard di monitoraggio code (bull-board, richiede QUEUE_BOARD_PASSWORD)
pnpm build           # Build produzione
pnpm lint            # ESLint
pnpm test            # Test Vitest
pnpm db:studio       # Prisma Studio
```

## Roadmap pragmatica

### v0.1 — Core Stripe fiscal data

- [x] Login magic link merchant
- [x] Webhook Stripe base
- [x] Magic Link cliente
- [x] Validazione fiscale italiana formale
- [x] Dashboard stato documenti
- [x] Supporto a `invoice.paid` per abbonamenti Stripe Billing
- [x] Export CSV/JSON per commercialista
- [x] `.env.example` e documentazione self-hosting

### v0.2 — Export e integrazioni

- [ ] Export XML FatturaPA o payload intermedio documentato
- [ ] Integrazione Fatture in Cloud più robusta
- [ ] Gestione stato invio e ricevute
- [ ] Test end-to-end con Stripe CLI

### v0.3 — Casi avanzati

- [ ] Note di credito da refund Stripe
- [ ] Mapping IVA configurabile
- [ ] Provider fiscali aggiuntivi
- [ ] Supporto OSS/estero documentato

## Integrazioni future (presenti nel codice, disattivate per ora)

Il codice include già client per Shopify e WooCommerce (`src/lib/shopify`, `src/lib/woocommerce`), ma non sono esposti nella UI e sono disabilitati di default. La fase attuale del progetto è volutamente concentrata solo su Stripe: prima va reso solido quel flusso, poi si riattivano gli altri provider.

## Documentazione

- [`docs/SETUP.md`](docs/SETUP.md) — setup completo, servizi esterni, deploy
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — deploy su Railway/Render/Fly/VPS
- [`docs/TEST_GUIDE.md`](docs/TEST_GUIDE.md) — guida ai test manuali end-to-end
- [`docs/AI_CONTEXT.md`](docs/AI_CONTEXT.md) — contesto tecnico per chi (o cosa) lavora sul codice
- [`docs/DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md) — direzione di sviluppo
- [`docs/PRODUCT_POSITIONING.md`](docs/PRODUCT_POSITIONING.md) — cosa promettere e cosa no

## Disclaimer fiscale

Questo software è fornito come strumento tecnico. La responsabilità sulla correttezza, emissione, trasmissione e conservazione delle fatture resta dell'utilizzatore e dei suoi consulenti/provider fiscali.

Prima di usarlo in produzione, verifica il flusso con commercialista o consulente fiscale.

## Licenza

MIT. Vedi `LICENSE.md`.
