# FiscLink AI context

FiscLink is an open-source, self-hosted developer tool for Italian Stripe users.
Its current product promise is intentionally narrow:

```txt
Stripe payment or invoice
-> detect missing Italian fiscal data
-> send a customer Magic Link
-> validate fiscal data formally
-> expose clean CSV/JSON exports
```

FiscLink is not a full fiscal management system, does not replace an accountant,
and should not present direct SdI compliance as a core v0.1 feature.

## Current positioning

The useful problem is post-payment fiscal data collection:

- Stripe can collect money before the merchant has Codice Fiscale, Partita IVA,
  SDI/PEC or a complete billing address.
- FiscLink collects and normalizes those missing fields.
- The merchant can export the result or later pass it to an external fiscal
  provider.

The safest public wording is:

```txt
FiscLink helps prepare fiscal data from Stripe payments for Italian invoicing
workflows.
```

Avoid wording that implies:

```txt
FiscLink emits compliant e-invoices.
FiscLink sends invoices directly to SdI.
FiscLink replaces Fatture in Cloud, A-Cube, Aruba, Fattura24 or an accountant.
```

## Technical stack

- Next.js App Router
- Prisma
- PostgreSQL
- Redis + BullMQ
- Stripe SDK
- Zod and custom fiscal validators
- Resend for Magic Link email
- Docker Compose for local Postgres and Redis

Do not change the stack without a concrete reason.

## Priority architecture

The core should produce a stable internal fiscal document draft that is not tied
to Fatture in Cloud or FatturaPA XML.

Recommended flow:

```txt
Stripe webhook
-> normalized source data
-> Invoice + Customer records
-> validateFiscalData()
-> Magic Link if incomplete
-> READY once data is formally valid
-> CSV/JSON export
```

Provider integrations should be adapters around this core, not the core itself.

## Current priorities

1. Strengthen the Magic Link flow.
2. Keep Stripe Billing `invoice.paid` and Checkout flows reliable and idempotent.
3. Keep CSV/JSON export stable and useful for accountants or external systems.
4. Make the local demo flow easy to run end to end.
5. Treat Fatture in Cloud as optional integration work after the core is stable.

## Magic Link expectations

Magic Link is the key feature. It should:

- prefill any data already available from Stripe/customer records;
- support private Italian customers, Italian businesses and foreign customers;
- explain SDI and PEC clearly for Italian businesses;
- show completed and expired states cleanly;
- allow the merchant to resend a pending link from the dashboard;
- avoid promising that FiscLink itself will emit the invoice.

## Exports

CSV and JSON exports are first-class v0.1 features.

They are useful even when the merchant uses:

- an accountant;
- Fatture in Cloud;
- Aruba;
- Fattura24;
- A-Cube;
- a custom back-office workflow.

## Provider guidance

Fatture in Cloud can be the first optional provider integration, but it should
create documents from structured data. Do not design the core around generating
XML and pushing XML into Fatture in Cloud.

FatturaPA XML generation is not a v0.1 priority. If added later, it should be
explicitly experimental and backed by official XSD validation, golden fixtures
and clear disclaimers.

Do not add direct SdI sending, digital signature or preservation workflows to
the core until there is a validated reason.

## Features to avoid expanding now

Keep these out of the public v0.1 promise and avoid investing in them unless the
roadmap changes deliberately:

- Shopify;
- WooCommerce;
- PayPal;
- hosted SaaS subscription/pricing logic;
- OSS automation;
- accountant access;
- advanced credit-note automation;
- direct SdI status management;
- direct FatturaPA XML compliance.

Some of these models or files may already exist in the repo. Treat them as
future or legacy surface area, not as current product direction.

## Verification target

The demo to optimize for is:

```txt
pnpm install
docker compose up -d
pnpm run db:migrate:dev
pnpm run dev
pnpm run worker
stripe listen ...
stripe trigger ...
open dashboard
open Magic Link
submit fiscal data
see invoice become ready/exportable
download CSV/JSON
```
