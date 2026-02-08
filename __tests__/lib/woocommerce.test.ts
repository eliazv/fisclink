// ============================================================
// Test: WooCommerce Client
// ============================================================

import { describe, it, expect } from "vitest";
import {
  verifyWooCommerceWebhook,
  extractOrderFromWooCommerceWebhook,
  type WooCommerceOrder,
} from "@/lib/woocommerce/client";
import crypto from "crypto";

describe("WooCommerce Client", () => {
  describe("verifyWooCommerceWebhook", () => {
    const secret = "test-webhook-secret";
    const payload = '{"id":123,"status":"completed"}';

    it("dovrebbe verificare una firma valida", () => {
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(payload, "utf8")
        .digest("base64");

      const result = verifyWooCommerceWebhook(payload, expectedSig, secret);
      expect(result).toBe(true);
    });

    it("dovrebbe rifiutare una firma non valida", () => {
      const result = verifyWooCommerceWebhook(
        payload,
        "invalid-signature",
        secret,
      );
      expect(result).toBe(false);
    });
  });

  describe("extractOrderFromWooCommerceWebhook", () => {
    const mockOrder: WooCommerceOrder = {
      id: 123,
      number: "1001",
      status: "completed",
      currency: "EUR",
      total: "100.00",
      total_tax: "22.00",
      date_created: "2026-01-15T10:00:00",
      payment_method: "stripe",
      payment_method_title: "Credit Card",
      customer_id: 1,
      billing: {
        first_name: "Mario",
        last_name: "Rossi",
        company: "Test SRL",
        address_1: "Via Roma 1",
        address_2: "",
        city: "Milano",
        state: "MI",
        postcode: "20100",
        country: "IT",
        email: "mario@test.com",
        phone: "+39123456789",
      },
      shipping: {
        first_name: "Mario",
        last_name: "Rossi",
        company: "",
        address_1: "Via Roma 1",
        address_2: "",
        city: "Milano",
        state: "MI",
        postcode: "20100",
        country: "IT",
      },
      line_items: [
        {
          id: 1,
          name: "Product A",
          product_id: 10,
          quantity: 2,
          subtotal: "80.00",
          total: "80.00",
          total_tax: "17.60",
          sku: "SKU-001",
          price: 40,
        },
      ],
      meta_data: [
        { key: "codice_fiscale", value: "RSSMRA85M01H501Z" },
        { key: "partita_iva", value: "12345678901" },
        { key: "codice_sdi", value: "M5UXCR1" },
      ],
      refunds: [],
    };

    it("dovrebbe estrarre dati ordine correttamente", () => {
      const result = extractOrderFromWooCommerceWebhook(mockOrder);

      expect(result.sourceId).toBe("woo_123");
      expect(result.amount).toBe(100);
      expect(result.currency).toBe("EUR");
      expect(result.customerEmail).toBe("mario@test.com");
      expect(result.customerName).toBe("Mario Rossi");
      expect(result.company).toBe("Test SRL");
      expect(result.fiscalCode).toBe("RSSMRA85M01H501Z");
      expect(result.vatNumber).toBe("12345678901");
      expect(result.sdiCode).toBe("M5UXCR1");
      expect(result.address).toBe("Via Roma 1");
      expect(result.city).toBe("Milano");
      expect(result.province).toBe("MI");
      expect(result.zipCode).toBe("20100");
      expect(result.country).toBe("IT");
    });

    it("dovrebbe estrarre line items", () => {
      const result = extractOrderFromWooCommerceWebhook(mockOrder);
      expect(result.lineItems.length).toBe(1);
      expect(result.lineItems[0].description).toBe("Product A");
      expect(result.lineItems[0].quantity).toBe(2);
      expect(result.lineItems[0].sku).toBe("SKU-001");
    });

    it("dovrebbe gestire ordine senza meta_data fiscali", () => {
      const orderNoMeta = { ...mockOrder, meta_data: [] };
      const result = extractOrderFromWooCommerceWebhook(orderNoMeta);
      expect(result.fiscalCode).toBeNull();
      expect(result.vatNumber).toBeNull();
      expect(result.sdiCode).toBeNull();
    });
  });
});
