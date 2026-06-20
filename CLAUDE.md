# FiscLink — contesto per Claude

Open source, self-hosted, mercato italiano. Non riposizionarlo come SaaS commerciale internazionale: il pubblico target sono developer/freelance/piccoli SaaS italiani che usano Stripe.

## Cos'è davvero

Bridge fiscale Stripe → dati italiani. Riceve webhook Stripe, capisce se mancano Codice Fiscale/Partita IVA/SDI/PEC/indirizzo, manda un Magic Link al cliente per completarli, valida i dati, li prepara per export o per Fatture in Cloud. Non emette fatture allo SdI con un canale proprietario, non sostituisce commercialista o provider fiscale.

## Direzione del progetto (importante)

Il repo ha subito un riposizionamento (`chore/open-source-repositioning`) da SaaS ambizioso multi-provider a tool open source piccolo e onesto, focalizzato solo su Stripe. Il codice ha già client per Shopify e WooCommerce (`src/lib/shopify`, `src/lib/woocommerce`) e logiche VIES/OSS/note di credito — **non cancellarli**, ma non riattivarli o pubblicizzarli senza che l'utente lo chieda esplicitamente. La UI li mostra già come "Prossimamente"/disabilitati: è voluto.

Prima di proporre nuove feature grandi, la priorità è: far funzionare bene Stripe → validazione → Magic Link → export. Evita overclaim nei testi pubblici (landing, meta SEO, JSON-LD): niente "fatturazione automatica a norma SDI garantita", niente pricing finti, niente paragoni aggressivi con i competitor. Il tono giusto è quello di `src/app/page.tsx` (disclaimer onesti), non quello dei vecchi doc commerciali.

## Documenti interni vs pubblici

- `docs/` → pubblico, deve restare accurato e coerente con la direzione open source (SETUP, DEPLOY, TEST_GUIDE, AI_CONTEXT, DEVELOPMENT_ROADMAP, PRODUCT_POSITIONING, PUBLISHING).
- `private/` → **gitignored**, mai committato. Ci stanno appunti di lavoro, analisi AI, strategie commerciali/pricing, scratch file (es. vecchi `TODO.md`, `STATUS_REPORT.md`, `docs/research/*`, `docs/commercial_strategy/*`). Se trovi un file con linguaggio da pitch commerciale, prezzi, o dump di chat AI, va in `private/`, non in `docs/`.

## Package manager

**pnpm**, non npm. Lockfile: `pnpm-lock.yaml`. `package-lock.json` non deve tornare.

pnpm isola i node_modules per package: occhio a phantom dependency (moduli che npm trovava per hoisting accidentale ma non sono dichiarati). Se qualcosa rotto dopo `pnpm install` con errore "Cannot find module X", probabilmente va aggiunto esplicitamente in `package.json`.

`package.json` ha `pnpm.overrides` per `ioredis` (pinnato a `5.10.1` per matchare quello richiesto da `bullmq` ed evitare doppie versioni con conflitti di tipo TS) e `pnpm.onlyBuiltDependencies` per approvare gli script postinstall nativi (prisma engines, sharp, esbuild, msgpackr-extract, unrs-resolver). Se aggiungi una dipendenza con binari nativi e pnpm si blocca su "Ignored build scripts", aggiungila lì invece di girare `pnpm approve-builds` a mano.

`stripe` è pinnato esatto a `20.3.1` (non `^20.3.1`): versioni più nuove cambiano il literal type di `apiVersion` in `src/lib/stripe/client.ts` e rompono il build. Se aggiorni Stripe, aggiorna anche quella stringa.

## Comandi utili

```bash
pnpm install
pnpm run db:generate   # prisma generate
pnpm dev                # Next.js
pnpm worker             # worker BullMQ (richiede Redis)
pnpm test
pnpm lint
pnpm build
```

`docker compose up -d` per Postgres + Redis locali.

## Stato lint/build

Build e test passano. Lint ha errori pre-esistenti (apostrofi non escaped in `privacy/terms/page.tsx`, due `any` in `dashboard/page.tsx`, alcuni `react-hooks/set-state-in-effect` in `dashboard/settings/page.tsx`) non ancora risolti — non bloccano build/test ma falliscono `pnpm lint` e quindi la CI sul job lint. Da sistemare prima di una release pubblica seria.

## Lingua

L'utente scrive in italiano e vuole risposte in italiano (vedi istruzioni globali). Il prodotto stesso è in italiano (UI, meta SEO, disclaimer). Mantieni questo focus: non anglicizzare la narrazione del prodotto, usa l'inglese solo dove serve per discoverability internazionale (es. topic GitHub).
