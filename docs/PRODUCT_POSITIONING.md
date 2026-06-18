# Product positioning

FiscLink should continue as a small open source project, not as a full commercial fiscal SaaS.

## Core idea

FiscLink connects Stripe to an Italian fiscal-data workflow.

It helps with:

- reading Stripe payment events;
- detecting missing fiscal data;
- collecting Codice Fiscale, Partita IVA, SDI, PEC and address through a Magic Link;
- validating data formally;
- preparing data for export or an external invoicing provider.

## What FiscLink should not promise

FiscLink should not claim to replace:

- accountants;
- fiscal consultants;
- commercial e-invoicing tools;
- SdI-accredited providers.

It should also avoid claims such as:

- full fiscal compliance;
- zero errors;
- 100 percent automation;
- direct SdI replacement.

## Why this direction

The market already has strong tools for the final e-invoicing step. The useful open source gap is before that step: Stripe users often do not have complete Italian fiscal data.

The most valuable feature is the Magic Link flow for missing fiscal data.

## Product scope now

In scope:

- Stripe webhooks;
- Stripe Billing support;
- Magic Link fiscal-data collection;
- Italian fiscal validators;
- dashboard for incomplete documents;
- CSV and JSON export;
- optional Fatture in Cloud integration.

Out of scope now:

- hosted SaaS pricing;
- direct SdI channel;
- Stripe Marketplace app;
- Shopify, WooCommerce and PayPal;
- complex cross-border tax cases;
- advanced credit note automation.

## Name

FiscLink is good as a brand name, but weak for SEO.

Recommended public naming:

FiscLink - Open source Stripe fiscal bridge for Italy

Alternative repo names if discoverability becomes more important than brand:

- stripe-fattura-italia
- stripe-fatturazione-italia
- fattura-stripe-it
- stripe-sdi-helper

Recommendation: keep FiscLink for now, but always use a very explicit subtitle.
