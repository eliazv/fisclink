# Contribuire a FiscLink

Grazie per l'interesse. FiscLink è un progetto piccolo e volutamente focalizzato: prima di proporre una feature, controlla se rientra nella direzione descritta in [`docs/DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md) e [`docs/PRODUCT_POSITIONING.md`](docs/PRODUCT_POSITIONING.md).

## Setup locale

Segui [`README.md`](README.md#quick-start-locale) o [`docs/SETUP.md`](docs/SETUP.md).

## Prima di aprire una PR

```bash
pnpm install
pnpm run db:generate
pnpm lint
pnpm test
pnpm build
```

Tutti e quattro devono passare. Un git hook (Husky + lint-staged) gira `eslint --fix` sui file staged ad ogni commit.

## Cosa accettiamo volentieri

- Fix di bug con test che lo riproduce
- Miglioramenti alla validazione fiscale (CF, P.IVA, SDI, PEC, VIES)
- Documentazione più chiara
- Test aggiuntivi sui validatori o sul flusso webhook

## Cosa discutere prima in una issue

- Nuovi provider di pagamento oltre Stripe (Shopify/WooCommerce esistono nel codice ma sono disattivati di proposito per questa fase)
- Cambi architetturali (queue, auth, schema database)
- Integrazioni con nuovi gestionali fiscali

## Stile del codice

- TypeScript, niente `any` se evitabile
- Componenti UI: usa i primitivi in `src/components/ui` (shadcn/ui) invece di stilare a mano
- Testi pubblici (README, landing, meta SEO): niente overclaim fiscale — vedi il disclaimer in `src/app/page.tsx` come riferimento di tono
