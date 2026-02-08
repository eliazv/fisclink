// ============================================================
// Test: Shopify Client
// ============================================================

import { describe, it, expect } from "vitest";
import {
  verifyShopifyWebhook,
  extractOrderFromShopifyWebhook,
  type ShopifyOrder,
} from "@/lib/shopify/client";
import crypto from "crypto";

describe("Shopify Client", () => {
  describe("verifyShopifyWebhook", () => {
    const secret = "shopify-test-secret";
    const payload = '{"id":98765}';

    it("dovrebbe verificare una firma valida", () => {
      const signature = crypto
        .createHmac("sha256", secret)
        .update(payload, "utf8")
        .digest("base64");

      const result = verifyShopifyWebhook(payload, signature, secret);
      expect(result).toBe(true);
    });

    it("dovrebbe rifiutare una firma non valida", () => {
      const result = verifyShopifyWebhook(payload, "wrong-sig", secret);
      expect(result).toBe(false);
    });
  });

  describe("extractOrderFromShopifyWebhook", () => {
    const mockOrder: ShopifyOrder = {
      id: 98765,
      name: "#1001",
      order_number: 1001,
      email: "cliente@test.com",
      created_at: "2026-02-01T14:00:00+01:00",
      updated_at: "2026-02-01T14:00:00+01:00",
      financial_status: "paid",
      fulfillment_status: null,
      currency: "EUR",
      total_price: "59.90",
      subtotal_price: "49.10",
      total_tax: "10.80",
      total_discounts: "0.00",
      gateway: "shopify_payments",
      customer: {
        id: 111,
        email: "cliente@test.com",
        first_name: "Luca",
        last_name: "Bianchi",
        phone: null,
      },
      billing_address: {
        first_name: "Luca",
        last_name: "Bianchi",
        company: null,
        address1: "Via Garibaldi 10",
        address2: null,
        city: "Roma",
        province: "Roma",
        province_code: "RM",
        zip: "00100",
        country: "Italy",
        country_code: "IT",
        phone: null,
      },
      line_items: [
        {
          id: 1,
          title: "Corso Online",
          variant_title: "Standard",
          quantity: 1,
          price: "49.10",
          total_discount: "0.00",
          sku: "COURSE-001",
          variant_id: 1,
          product_id: 100,
          tax_lines: [{ title: "IVA", price: "10.80", rate: 0.22 }],
        },
      ],
      note_attributes: [
        { name: "codice_fiscale", value: "BNCLCU90A01H501X" },
        { name: "codice_sdi", value: "0000000" },
      ],
      refunds: [],
    };

    it("dovrebbe estrarre dati ordine Shopify", () => {
      const result = extractOrderFromShopifyWebhook(mockOrder);

      expect(result.sourceId).toBe("shopify_98765");
      expect(result.amount).toBe(59.9);
      expect(result.currency).toBe("EUR");
      expect(result.customerEmail).toBe("cliente@test.com");
      expect(result.customerName).toBe("Luca Bianchi");
      expect(result.fiscalCode).toBe("BNCLCU90A01H501X");
      expect(result.sdiCode).toBe("0000000");
      expect(result.city).toBe("Roma");
      expect(result.province).toBe("RM");
      expect(result.zipCode).toBe("00100");
      expect(result.country).toBe("IT");
    });

    it("dovrebbe estrarre line items con variant", () => {
      const result = extractOrderFromShopifyWebhook(mockOrder);
      expect(result.lineItems.length).toBe(1);
      expect(result.lineItems[0].description).toBe("Corso Online - Standard");
      expect(result.lineItems[0].sku).toBe("COURSE-001");
    });

    it("dovrebbe gestire note_attributes vuoti", () => {
      const orderNoNotes = { ...mockOrder, note_attributes: [] };
      const result = extractOrderFromShopifyWebhook(orderNoNotes);
      expect(result.fiscalCode).toBeNull();
      expect(result.sdiCode).toBeNull();
    });

    it("dovrebbe includere metadata Shopify", () => {
      const result = extractOrderFromShopifyWebhook(mockOrder);
      expect(result.metadata.shopifyOrderId).toBe(98765);
      expect(result.metadata.shopifyOrderName).toBe("#1001");
      expect(result.metadata.gateway).toBe("shopify_payments");
    });
  });
});
