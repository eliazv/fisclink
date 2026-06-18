# Development roadmap

The project should become simpler before it becomes larger.

## Priority 1 - Make it run reliably

- Run install, lint, test and build locally.
- Fix TypeScript errors.
- Fix missing imports and broken routes.
- Add Docker Compose for PostgreSQL and Redis.
- Add a CI workflow for lint, test and build.

## Priority 2 - Focus Stripe first

The main event for subscriptions should be Stripe Billing invoice events.

Needed work:

- support `invoice.paid`;
- normalize Stripe Invoice data;
- avoid duplicates when multiple Stripe events refer to the same payment;
- store original event type in source data;
- use Stripe invoice id for recurring Billing documents and PaymentIntent id for custom one-off flows.

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

Exports to implement:

- CSV for accountant;
- normalized JSON;
- later, intermediate payload for FatturaPA generation.

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
