// ============================================================
// Test: Provider Registry
// ============================================================

import { describe, it, expect } from "vitest";
import {
  isSupportedProvider,
  providerToSourceType,
} from "@/lib/providers/index";

describe("Provider Registry", () => {
  describe("isSupportedProvider", () => {
    it("dovrebbe riconoscere stripe", () => {
      expect(isSupportedProvider("stripe")).toBe(true);
    });

    it("dovrebbe riconoscere shopify", () => {
      expect(isSupportedProvider("shopify")).toBe(true);
    });

    it("dovrebbe riconoscere woocommerce", () => {
      expect(isSupportedProvider("woocommerce")).toBe(true);
    });

    it("dovrebbe riconoscere paypal", () => {
      expect(isSupportedProvider("paypal")).toBe(true);
    });

    it("non dovrebbe riconoscere provider sconosciuti", () => {
      expect(isSupportedProvider("amazon")).toBe(false);
      expect(isSupportedProvider("gumroad")).toBe(false);
      expect(isSupportedProvider("")).toBe(false);
    });
  });

  describe("providerToSourceType", () => {
    it("dovrebbe mappare correttamente i provider ai SourceType", () => {
      expect(providerToSourceType("stripe")).toBe("STRIPE");
      expect(providerToSourceType("shopify")).toBe("SHOPIFY");
      expect(providerToSourceType("woocommerce")).toBe("WOOCOMMERCE");
      expect(providerToSourceType("paypal")).toBe("PAYPAL");
    });
  });
});
