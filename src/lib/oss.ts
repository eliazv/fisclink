// ============================================================
// OSS (One Stop Shop) - Supporto vendite estere UE
// ============================================================
// Gestisce la logica per vendite B2C intra-UE (regime OSS)
// e vendite extra-UE con i relativi obblighi di fatturazione.

import { EU_COUNTRIES, isEUCountry } from "./validators/vies";

export type SaleType = 
  | "DOMESTIC"           // Vendita Italia → Italia
  | "EU_B2B"             // Vendita Italia → UE con P.IVA (reverse charge)
  | "EU_B2C_OSS"         // Vendita Italia → UE privato (regime OSS)
  | "EXTRA_EU"           // Vendita extra-UE (non soggetta IVA IT)
  | "EXTRA_EU_B2B";      // Vendita extra-UE B2B

export interface OSSClassification {
  saleType: SaleType;
  applyItalianVat: boolean;
  applyDestinationVat: boolean;
  vatRate: number | null;         // Aliquota IVA da applicare
  vatNature: string | null;       // Natura IVA per FiC/SDI
  sendToSDI: boolean;             // Se creare fattura elettronica SDI
  notes: string;
  ossReportable: boolean;         // Se includere nel report OSS
}

// Aliquote IVA standard per paese UE (aggiornate 2025)
export const EU_VAT_RATES: Record<string, number> = {
  AT: 20,  BE: 21,  BG: 20,  HR: 25,  CY: 19,
  CZ: 21,  DK: 25,  EE: 22,  FI: 25.5, FR: 20,
  DE: 19,  GR: 24,  HU: 27,  IE: 23,  IT: 22,
  LV: 21,  LT: 21,  LU: 17,  MT: 18,  NL: 21,
  PL: 23,  PT: 23,  RO: 19,  SK: 20,  SI: 22,
  ES: 21,  SE: 25,
};

/**
 * Classifica una vendita in base al paese destinazione e tipo cliente.
 * Determina il trattamento IVA corretto e se serve fattura SDI.
 * 
 * @param merchantCountry - Paese del merchant (tipicamente "IT")
 * @param customerCountry - Paese del cliente
 * @param isB2B - Se il cliente ha P.IVA (B2B) o è privato (B2C)
 * @param merchantTaxRegime - Regime fiscale del merchant (es. "RF01", "RF19")
 */
export function classifySale(
  merchantCountry: string,
  customerCountry: string,
  isB2B: boolean,
  merchantTaxRegime: string = "RF01",
): OSSClassification {
  const mc = merchantCountry.toUpperCase();
  const cc = customerCountry.toUpperCase();
  const isForfettario = merchantTaxRegime === "RF19" || merchantTaxRegime === "RF04";

  // 1. Vendita domestica (Italia → Italia)
  if (mc === cc) {
    return {
      saleType: "DOMESTIC",
      applyItalianVat: !isForfettario,
      applyDestinationVat: false,
      vatRate: isForfettario ? 0 : 22,
      vatNature: isForfettario ? "N2.2" : null,
      sendToSDI: true,
      notes: isForfettario 
        ? "Vendita domestica - Regime forfettario, IVA non applicata" 
        : "Vendita domestica - IVA 22% standard",
      ossReportable: false,
    };
  }

  // 2. Vendita intra-UE B2B (reverse charge)
  if (isEUCountry(cc) && isB2B) {
    return {
      saleType: "EU_B2B",
      applyItalianVat: false,
      applyDestinationVat: false,
      vatRate: 0,
      vatNature: "N3.2", // Non imponibile - cessione intracomunitaria
      sendToSDI: true,    // Va comunque inviata allo SDI
      notes: `Vendita intra-UE B2B verso ${cc} - Reverse charge art. 41 DL 331/93`,
      ossReportable: false,
    };
  }

  // 3. Vendita intra-UE B2C (regime OSS)
  if (isEUCountry(cc) && !isB2B) {
    const destVatRate = EU_VAT_RATES[cc] || 22;
    
    if (isForfettario) {
      // I forfettari NON applicano OSS (non hanno obbligo IVA)
      return {
        saleType: "EU_B2C_OSS",
        applyItalianVat: false,
        applyDestinationVat: false,
        vatRate: 0,
        vatNature: "N2.2",
        sendToSDI: true,
        notes: `Vendita B2C verso ${cc} - Forfettario escluso OSS, IVA non applicata`,
        ossReportable: false, // Forfettari non partecipano a OSS
      };
    }

    return {
      saleType: "EU_B2C_OSS",
      applyItalianVat: false,
      applyDestinationVat: true,
      vatRate: destVatRate,
      vatNature: null, // IVA del paese destinazione, non Natura
      sendToSDI: false, // La fattura OSS non va allo SDI, va nel report OSS
      notes: `Vendita B2C verso ${cc} - Regime OSS, IVA ${destVatRate}% (${cc})`,
      ossReportable: true,
    };
  }

  // 4. Vendita extra-UE B2B
  if (!isEUCountry(cc) && isB2B) {
    return {
      saleType: "EXTRA_EU_B2B",
      applyItalianVat: false,
      applyDestinationVat: false,
      vatRate: 0,
      vatNature: "N3.1", // Non imponibile - esportazione
      sendToSDI: true,
      notes: `Vendita extra-UE B2B verso ${cc} - Esportazione art. 8 DPR 633/72`,
      ossReportable: false,
    };
  }

  // 5. Vendita extra-UE B2C
  return {
    saleType: "EXTRA_EU",
    applyItalianVat: false,
    applyDestinationVat: false,
    vatRate: 0,
    vatNature: "N3.1", // Non imponibile - esportazione
    sendToSDI: true,
    notes: `Vendita extra-UE B2C verso ${cc} - Non soggetta IVA italiana`,
    ossReportable: false,
  };
}

/**
 * Calcola il totale IVA OSS per un mese, raggruppato per paese.
 * Utile per la dichiarazione OSS trimestrale.
 */
export function calculateOSSReport(
  transactions: Array<{
    customerCountry: string;
    amount: number;
    vatRate: number;
  }>,
): Record<string, { totalNet: number; totalVat: number; vatRate: number; count: number }> {
  const report: Record<string, { totalNet: number; totalVat: number; vatRate: number; count: number }> = {};

  for (const tx of transactions) {
    const cc = tx.customerCountry.toUpperCase();
    if (!report[cc]) {
      report[cc] = { totalNet: 0, totalVat: 0, vatRate: tx.vatRate, count: 0 };
    }
    const vatAmount = (tx.amount * tx.vatRate) / (100 + tx.vatRate);
    const netAmount = tx.amount - vatAmount;
    report[cc].totalNet += netAmount;
    report[cc].totalVat += vatAmount;
    report[cc].count += 1;
  }

  return report;
}

/**
 * Restituisce la dicitura obbligatoria per fattura in base al tipo vendita
 */
export function getOSSInvoiceNote(classification: OSSClassification): string {
  switch (classification.saleType) {
    case "EU_B2B":
      return "Operazione non imponibile ai sensi dell'art. 41 del DL 331/93 - Reverse charge";
    case "EU_B2C_OSS":
      if (classification.ossReportable) {
        return `IVA assolta nel paese di destinazione ai sensi del regime OSS (One Stop Shop) - Reg. UE 2021/2248`;
      }
      return "Operazione effettuata in regime forfettario - Art. 1 commi 54-89 L. 190/2014";
    case "EXTRA_EU":
    case "EXTRA_EU_B2B":
      return "Operazione non imponibile ai sensi dell'art. 8 del DPR 633/72";
    case "DOMESTIC":
    default:
      return "";
  }
}
