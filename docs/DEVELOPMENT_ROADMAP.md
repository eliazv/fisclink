# Development roadmap

The project should become simpler before it becomes larger.

## Priority 1 - Make it run reliably (done)

- [x] Run install, lint, test and build locally — `pnpm install && pnpm lint && pnpm test && pnpm build`, 0 lint errors, 98 tests green.
- [x] Fix TypeScript errors.
- [x] Fix missing imports and broken routes.
- [x] Add Docker Compose for PostgreSQL and Redis.
- [x] Add a CI workflow for lint, test and build.
- [x] Husky + lint-staged so lint regressions can't be committed.
- [x] bull-board (`pnpm run queue-board`) for visibility into BullMQ job failures.

## Priority 2 - Focus Stripe first (done)

The main event for subscriptions should be Stripe Billing invoice events.

- [x] support `invoice.paid` — scoped to `billing_reason` subscription_* values to avoid double-processing the same payment also seen by `payment_intent.succeeded`.
- [x] normalize Stripe Invoice data — `extractOrderFromInvoice` in `src/lib/stripe/client.ts`.
- [x] avoid duplicates when multiple Stripe events refer to the same payment — existing idempotency key (`merchantId_sourceType_sourceId`) plus the billing_reason scoping above.
- [x] store original event type in source data.
- [x] use Stripe invoice id for recurring Billing documents and PaymentIntent id for custom one-off flows.

## Priority 3 - Strengthen Magic Link

Magic Link is the core feature.

Needed work:

- improve private/business/foreign customer flow;
- prefill from Stripe customer details;
- add clearer help text for SDI and PEC;
- allow dashboard resend;
- test expiration and completion states.

## Priority 4 - Export before provider integrations

Before improving provider integrations, add simple exports.

- [x] CSV for accountant — `GET /api/invoices/export?format=csv`.
- [x] normalized JSON — `GET /api/invoices/export?format=json`.
- [ ] FatturaPA XML generation — **not started**. Blocked on a real gap: `Merchant` has no registered address (`indirizzo`, CAP, comune, provincia), which FatturaPA's `CedentePrestatore.Sede` requires. Needs a migration + a settings form field before any XML generator is worth writing — otherwise it would produce structurally invalid XML, which is worse than not having the feature. `@digitalia/fatturapa` (npm, TypeScript, JSON↔XML + yup validation) is a reasonable library to use when this is picked up.

This makes FiscLink useful even without Fatture in Cloud credentials.

## Priority 5 - Optional providers

Keep Fatture in Cloud as the first optional provider.

Later evaluate other providers only after the Stripe core is stable.

## Features to hide or remove for now

- Shopify;
- WooCommerce;
- PayPal;
- SaaS subscription pricing;
- OSS automation;
- accountant access;
- advanced automatic credit-note flow.

These can return later, but they should not be part of the public promise now.
