// ============================================================
// Test: OSS (One Stop Shop) - Classificazione vendite
// ============================================================

import { describe, it, expect } from "vitest";
import {
  classifySale,
  calculateOSSReport,
  getOSSInvoiceNote,
  EU_VAT_RATES,
  type SaleType,
} from "@/lib/oss";

describe("classifySale", () => {
  describe("Vendite domestiche (IT → IT)", () => {
    it("dovrebbe classificare come DOMESTIC (ordinario)", () => {
      const result = classifySale("IT", "IT", false, "RF01");
      expect(result.saleType).toBe("DOMESTIC");
      expect(result.applyItalianVat).toBe(true);
      expect(result.vatRate).toBe(22);
      expect(result.sendToSDI).toBe(true);
      expect(result.ossReportable).toBe(false);
    });

    it("dovrebbe classificare come DOMESTIC (forfettario)", () => {
      const result = classifySale("IT", "IT", false, "RF19");
      expect(result.saleType).toBe("DOMESTIC");
      expect(result.applyItalianVat).toBe(false);
      expect(result.vatRate).toBe(0);
      expect(result.vatNature).toBe("N2.2");
      expect(result.sendToSDI).toBe(true);
    });
  });

  describe("Vendite intra-UE B2B (reverse charge)", () => {
    it("dovrebbe classificare come EU_B2B", () => {
      const result = classifySale("IT", "DE", true, "RF01");
      expect(result.saleType).toBe("EU_B2B");
      expect(result.applyItalianVat).toBe(false);
      expect(result.vatRate).toBe(0);
      expect(result.vatNature).toBe("N3.2");
      expect(result.sendToSDI).toBe(true);
      expect(result.ossReportable).toBe(false);
    });

    it("reverse charge per forfettario verso business UE", () => {
      const result = classifySale("IT", "FR", true, "RF19");
      expect(result.saleType).toBe("EU_B2B");
      expect(result.vatNature).toBe("N3.2");
    });
  });

  describe("Vendite intra-UE B2C (regime OSS)", () => {
    it("dovrebbe classificare come EU_B2C_OSS per ordinario", () => {
      const result = classifySale("IT", "DE", false, "RF01");
      expect(result.saleType).toBe("EU_B2C_OSS");
      expect(result.applyDestinationVat).toBe(true);
      expect(result.vatRate).toBe(19); // Germania
      expect(result.sendToSDI).toBe(false); // Non va allo SDI
      expect(result.ossReportable).toBe(true);
    });

    it("dovrebbe usare IVA francese per vendite verso Francia", () => {
      const result = classifySale("IT", "FR", false, "RF01");
      expect(result.vatRate).toBe(20);
      expect(result.ossReportable).toBe(true);
    });

    it("forfettario NON applica OSS", () => {
      const result = classifySale("IT", "DE", false, "RF19");
      expect(result.saleType).toBe("EU_B2C_OSS");
      expect(result.applyDestinationVat).toBe(false);
      expect(result.vatRate).toBe(0);
      expect(result.ossReportable).toBe(false);
    });
  });

  describe("Vendite extra-UE", () => {
    it("dovrebbe classificare come EXTRA_EU B2C", () => {
      const result = classifySale("IT", "US", false, "RF01");
      expect(result.saleType).toBe("EXTRA_EU");
      expect(result.vatRate).toBe(0);
      expect(result.vatNature).toBe("N3.1");
      expect(result.sendToSDI).toBe(true);
      expect(result.ossReportable).toBe(false);
    });

    it("dovrebbe classificare come EXTRA_EU_B2B", () => {
      const result = classifySale("IT", "US", true, "RF01");
      expect(result.saleType).toBe("EXTRA_EU_B2B");
      expect(result.vatNature).toBe("N3.1");
    });

    it("UK è extra-UE dopo Brexit", () => {
      const result = classifySale("IT", "GB", false, "RF01");
      expect(result.saleType).toBe("EXTRA_EU");
    });
  });
});

describe("EU_VAT_RATES", () => {
  it("dovrebbe avere aliquote per tutti i 27 paesi UE", () => {
    expect(Object.keys(EU_VAT_RATES).length).toBe(27);
  });

  it("aliquote note dovrebbero essere corrette", () => {
    expect(EU_VAT_RATES.IT).toBe(22);
    expect(EU_VAT_RATES.DE).toBe(19);
    expect(EU_VAT_RATES.FR).toBe(20);
    expect(EU_VAT_RATES.HU).toBe(27); // Ungheria ha l'IVA più alta EU
    expect(EU_VAT_RATES.LU).toBe(17); // Lussemburgo ha l'IVA più bassa EU
  });
});

describe("calculateOSSReport", () => {
  it("dovrebbe raggruppare per paese", () => {
    const report = calculateOSSReport([
      { customerCountry: "DE", amount: 119, vatRate: 19 },
      { customerCountry: "DE", amount: 119, vatRate: 19 },
      { customerCountry: "FR", amount: 120, vatRate: 20 },
    ]);

    expect(report.DE.count).toBe(2);
    expect(report.FR.count).toBe(1);
    expect(report.DE.vatRate).toBe(19);
    expect(report.FR.vatRate).toBe(20);
  });

  it("dovrebbe restituire oggetto vuoto per array vuoto", () => {
    const report = calculateOSSReport([]);
    expect(Object.keys(report).length).toBe(0);
  });
});

describe("getOSSInvoiceNote", () => {
  it("dovrebbe restituire dicitura reverse charge per EU_B2B", () => {
    const note = getOSSInvoiceNote({
      saleType: "EU_B2B",
      applyItalianVat: false,
      applyDestinationVat: false,
      vatRate: 0,
      vatNature: "N3.2",
      sendToSDI: true,
      notes: "",
      ossReportable: false,
    });
    expect(note).toContain("art. 41");
  });

  it("dovrebbe restituire dicitura OSS per EU_B2C_OSS reportable", () => {
    const note = getOSSInvoiceNote({
      saleType: "EU_B2C_OSS",
      applyItalianVat: false,
      applyDestinationVat: true,
      vatRate: 19,
      vatNature: null,
      sendToSDI: false,
      notes: "",
      ossReportable: true,
    });
    expect(note).toContain("OSS");
  });

  it("dovrebbe restituire stringa vuota per DOMESTIC", () => {
    const note = getOSSInvoiceNote({
      saleType: "DOMESTIC",
      applyItalianVat: true,
      applyDestinationVat: false,
      vatRate: 22,
      vatNature: null,
      sendToSDI: true,
      notes: "",
      ossReportable: false,
    });
    expect(note).toBe("");
  });
});
