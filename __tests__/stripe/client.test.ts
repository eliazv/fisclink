import { describe, expect, it } from "vitest";
import type Stripe from "stripe";
import {
  extractOrderFromCheckoutSession,
  extractOrderFromInvoice,
  extractOrderFromPaymentIntent,
} from "@/lib/stripe/client";

describe("Stripe extraction", () => {
  it("extracts checkout session data", () => {
    const session = {
      id: "cs_test_123",
      payment_intent: "pi_123",
      amount_total: 4990,
      currency: "eur",
      metadata: { cf: "TESTCF", piva: "TESTPIVA" },
      customer_details: {
        email: "customer@example.test",
        name: "Test Customer",
        address: {
          line1: "Test street",
          city: "Roma",
          state: "RM",
          postal_code: "00100",
          country: "IT",
        },
      },
    } as unknown as Stripe.Checkout.Session;

    const result = extractOrderFromCheckoutSession(session);

    expect(result.paymentIntentId).toBe("pi_123");
    expect(result.customerEmail).toBe("customer@example.test");
    expect(result.amount).toBe(4990);
    expect(result.currency).toBe("EUR");
    expect(result.fiscalCode).toBe("TESTCF");
    expect(result.vatNumber).toBe("TESTPIVA");
  });

  it("extracts payment intent data", () => {
    const paymentIntent = {
      id: "pi_456",
      amount: 1299,
      currency: "eur",
      receipt_email: "customer@example.test",
      description: "Monthly plan",
      metadata: { fiscal_code: "TESTCF" },
    } as unknown as Stripe.PaymentIntent;

    const result = extractOrderFromPaymentIntent(paymentIntent);

    expect(result.paymentIntentId).toBe("pi_456");
    expect(result.description).toBe("Monthly plan");
    expect(result.fiscalCode).toBe("TESTCF");
  });

  it("extracts Stripe Billing invoice data", () => {
    const invoice = {
      id: "in_123",
      amount_paid: 990,
      total: 990,
      currency: "eur",
      customer_email: "subscriber@example.test",
      customer_name: "Subscriber",
      customer_address: {
        line1: "Test street",
        city: "Milano",
        state: "MI",
        postal_code: "20100",
        country: "IT",
      },
      metadata: { fiscal_code: "TESTCF", vat_number: "TESTPIVA" },
      lines: { data: [{ description: "Pro plan" }] },
    } as unknown as Stripe.Invoice;

    const result = extractOrderFromInvoice(invoice);

    expect(result.paymentIntentId).toBe("in_123");
    expect(result.customerEmail).toBe("subscriber@example.test");
    expect(result.description).toBe("Pro plan");
    expect(result.amount).toBe(990);
    expect(result.currency).toBe("EUR");
    expect(result.address?.state).toBe("MI");
  });
});
