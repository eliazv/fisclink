// ============================================================
// Test: Bollo Virtuale
// ============================================================

import { describe, it, expect } from "vitest";
import {
  calculateBollo,
  BOLLO_THRESHOLD,
  BOLLO_AMOUNT,
  getDicituraForfettario,
  getDicituraMinimi,
} from "@/lib/bollo";

describe("Bollo Virtuale", () => {
  describe("Costanti", () => {
    it("soglia bollo = €77.47", () => {
      expect(BOLLO_THRESHOLD).toBe(77.47);
    });

    it("importo bollo = €2.00", () => {
      expect(BOLLO_AMOUNT).toBe(2.0);
    });
  });

  describe("calculateBollo", () => {
    it("dovrebbe applicare il bollo per importi > €77.47 con natura esente", () => {
      const result = calculateBollo(100, "N2.2");
      expect(result.required).toBe(true);
      expect(result.amount).toBe(2);
    });

    it("non dovrebbe applicare il bollo per importi ≤ €77.47", () => {
      const result = calculateBollo(50, "N2.2");
      expect(result.required).toBe(false);
      expect(result.amount).toBe(0);
    });

    it("non dovrebbe applicare il bollo per importo uguale a €77.47", () => {
      const result = calculateBollo(77.47, "N2.2");
      expect(result.required).toBe(false);
      expect(result.amount).toBe(0);
    });

    it("dovrebbe applicare per importo €77.48", () => {
      const result = calculateBollo(77.48, "N2.2");
      expect(result.required).toBe(true);
      expect(result.amount).toBe(2);
    });

    it("non dovrebbe applicare il bollo senza codice natura", () => {
      const result = calculateBollo(200, null);
      expect(result.required).toBe(false);
      expect(result.amount).toBe(0);
    });

    it("dovrebbe applicare per forfettari sopra soglia", () => {
      const result = calculateBollo(100, "N2.2", "RF19");
      expect(result.required).toBe(true);
      expect(result.amount).toBe(2);
      expect(result.reason).toContain("forfettario");
    });

    it("non dovrebbe applicare per natura N6 (reverse charge)", () => {
      const result = calculateBollo(200, "N6");
      expect(result.required).toBe(false);
    });

    it("dovrebbe applicare per natura N4 (esente)", () => {
      const result = calculateBollo(100, "N4");
      expect(result.required).toBe(true);
      expect(result.amount).toBe(2);
    });
  });

  describe("Diciture", () => {
    it("getDicituraForfettario dovrebbe restituire dicitura corretta", () => {
      const dic = getDicituraForfettario();
      expect(dic).toContain("art");
      expect(dic).toContain("190/2014");
      expect(dic.length).toBeGreaterThan(10);
    });

    it("getDicituraMinimi dovrebbe restituire dicitura corretta", () => {
      const dic = getDicituraMinimi();
      expect(dic).toContain("244/2007");
      expect(dic.length).toBeGreaterThan(10);
    });
  });
});
