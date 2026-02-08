// ============================================================
// Test: VIES VAT Validation
// ============================================================

import { describe, it, expect, vi } from "vitest";
import {
  parseFullVatNumber,
  isEUCountry,
  EU_COUNTRIES,
} from "@/lib/validators/vies";

describe("VIES Utilities", () => {
  describe("parseFullVatNumber", () => {
    it("dovrebbe estrarre codice paese e numero da P.IVA completa", () => {
      const result = parseFullVatNumber("IT12345678901");
      expect(result.countryCode).toBe("IT");
      expect(result.vatNumber).toBe("12345678901");
    });

    it("dovrebbe gestire P.IVA tedesca", () => {
      const result = parseFullVatNumber("DE123456789");
      expect(result.countryCode).toBe("DE");
      expect(result.vatNumber).toBe("123456789");
    });

    it("dovrebbe gestire P.IVA francese", () => {
      const result = parseFullVatNumber("FR12345678901");
      expect(result.countryCode).toBe("FR");
      expect(result.vatNumber).toBe("12345678901");
    });

    it("dovrebbe assumere IT se nessun prefisso paese", () => {
      const result = parseFullVatNumber("12345678901");
      expect(result.countryCode).toBe("IT");
      expect(result.vatNumber).toBe("12345678901");
    });

    it("dovrebbe gestire spazi e punti", () => {
      const result = parseFullVatNumber("IT 123.456.789.01");
      expect(result.countryCode).toBe("IT");
      expect(result.vatNumber).toBe("12345678901");
    });

    it("dovrebbe essere case-insensitive", () => {
      const result = parseFullVatNumber("it12345678901");
      expect(result.countryCode).toBe("IT");
    });
  });

  describe("isEUCountry", () => {
    it("dovrebbe riconoscere tutti i paesi UE", () => {
      expect(isEUCountry("IT")).toBe(true);
      expect(isEUCountry("DE")).toBe(true);
      expect(isEUCountry("FR")).toBe(true);
      expect(isEUCountry("ES")).toBe(true);
      expect(isEUCountry("NL")).toBe(true);
      expect(isEUCountry("PL")).toBe(true);
    });

    it("dovrebbe rifiutare paesi non-UE", () => {
      expect(isEUCountry("US")).toBe(false);
      expect(isEUCountry("GB")).toBe(false); // Brexit
      expect(isEUCountry("CH")).toBe(false);
      expect(isEUCountry("JP")).toBe(false);
    });

    it("dovrebbe essere case-insensitive", () => {
      expect(isEUCountry("it")).toBe(true);
      expect(isEUCountry("De")).toBe(true);
    });
  });

  describe("EU_COUNTRIES", () => {
    it("dovrebbe contenere 27 paesi UE", () => {
      expect(EU_COUNTRIES.size).toBe(27);
    });

    it("non dovrebbe contenere UK (Brexit)", () => {
      expect(EU_COUNTRIES.has("GB")).toBe(false);
      expect(EU_COUNTRIES.has("UK")).toBe(false);
    });
  });
});
