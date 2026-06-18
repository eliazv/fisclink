# FiscLink

Open source Stripe fiscal bridge for Italy.

FiscLink aiuta chi usa Stripe in Italia a raccogliere, validare e normalizzare i dati fiscali necessari per la fatturazione elettronica italiana.

> Stato del progetto: early preview / developer tool. Non è un gestionale fiscale completo e non sostituisce commercialista, consulente fiscale o provider accreditato SdI.

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
- PostgreSQL
- Redis
- Account Stripe in test mode
- Account Resend, opzionale in development
- Account Fatture in Cloud, solo se vuoi provare l'integrazione FiC

### Setup

```bash
git clone <repo-url>
cd fisclink
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

In un secondo terminale:

```bash
npm run worker
```

Per testare i webhook Stripe in locale:

```bash
stripe listen --forward-to "localhost:3000/api/webhooks/stripe?merchant=YOUR_MERCHANT_ID"
```

## Script utili

```bash
npm run dev          # Avvia Next.js
npm run worker       # Avvia i worker BullMQ
npm run build        # Build produzione
npm run lint         # ESLint
npm run test         # Test Vitest
npm run db:studio    # Prisma Studio
```

## Roadmap pragmatica

### v0.1 — Core Stripe fiscal data

- [x] Login magic link merchant
- [x] Webhook Stripe base
- [x] Magic Link cliente
- [x] Validazione fiscale italiana formale
- [x] Dashboard stato documenti
- [ ] Supporto completo a `invoice.paid` per abbonamenti Stripe Billing
- [ ] Export CSV/JSON per commercialista
- [ ] `.env.example` e documentazione self-hosting

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

## Disclaimer fiscale

Questo software è fornito come strumento tecnico. La responsabilità sulla correttezza, emissione, trasmissione e conservazione delle fatture resta dell'utilizzatore e dei suoi consulenti/provider fiscali.

Prima di usarlo in produzione, verifica il flusso con commercialista o consulente fiscale.

## Licenza

MIT. Vedi `LICENSE`.
