/**
 * Calcolo automatico dell'imposta di bollo virtuale
 *
 * In Italia, le fatture con operazioni non soggette a IVA
 * di importo > 77.47€ devono assolvere il bollo di 2.00€.
 *
 * Natura IVA che richiedono il bollo:
 * - N1: Escluse art.15
 * - N2.1: Non soggette - art. 7
 * - N2.2: Non soggette - altri casi
 * - N3.5: Non imponibili - regime del margine
 * - N3.6: Non imponibili - altri casi
 * - N4: Esenti
 *
 * NON richiedono il bollo:
 * - N2.1/N2.2 in regime forfettario → SÌ, richiedono il bollo
 * - N6: Inversione contabile (reverse charge)
 * - N7: IVA assolta in altro stato UE
 */

/** Soglia oltre la quale il bollo è obbligatorio */
export const BOLLO_THRESHOLD = 77.47;

/** Importo fisso del bollo virtuale */
export const BOLLO_AMOUNT = 2.0;

/** Codici natura IVA che richiedono il bollo */
const NATURE_CON_BOLLO = new Set(["N1", "N2.1", "N2.2", "N3.5", "N3.6", "N4"]);

export interface BolloCalculation {
  /** Il bollo è dovuto? */
  required: boolean;
  /** Importo del bollo (0 o 2.00) */
  amount: number;
  /** Motivo (per logging) */
  reason: string;
}

/**
 * Calcola se il bollo virtuale è dovuto su una fattura.
 *
 * @param totalExempt - Totale degli importi non soggetti/esenti IVA
 * @param vatNature - Codice natura IVA (es. "N2.2")
 * @param taxRegime - Regime fiscale (es. "RF19" per forfettari)
 */
export function calculateBollo(
  totalExempt: number,
  vatNature: string | null | undefined,
  taxRegime?: string,
): BolloCalculation {
  // I forfettari (RF19) emettono fatture con natura N2.2
  // e il bollo è SEMPRE obbligatorio sopra la soglia
  const isForfeGettario = taxRegime === "RF19";

  if (isForfeGettario && totalExempt > BOLLO_THRESHOLD) {
    return {
      required: true,
      amount: BOLLO_AMOUNT,
      reason: `Regime forfettario: bollo obbligatorio (importo ${totalExempt.toFixed(2)}€ > ${BOLLO_THRESHOLD}€)`,
    };
  }

  // Per altri regimi, controlla il codice natura
  if (!vatNature) {
    return {
      required: false,
      amount: 0,
      reason: "Nessun codice natura IVA specificato",
    };
  }

  const needsBollo = NATURE_CON_BOLLO.has(vatNature);

  if (needsBollo && totalExempt > BOLLO_THRESHOLD) {
    return {
      required: true,
      amount: BOLLO_AMOUNT,
      reason: `Bollo obbligatorio: natura ${vatNature}, importo ${totalExempt.toFixed(2)}€ > ${BOLLO_THRESHOLD}€`,
    };
  }

  if (needsBollo && totalExempt <= BOLLO_THRESHOLD) {
    return {
      required: false,
      amount: 0,
      reason: `Natura ${vatNature} ma importo ${totalExempt.toFixed(2)}€ ≤ ${BOLLO_THRESHOLD}€: bollo non dovuto`,
    };
  }

  return {
    required: false,
    amount: 0,
    reason: `Natura ${vatNature}: bollo non applicabile`,
  };
}

/**
 * Mappa dei regimi fiscali italiani e relative informazioni
 */
export const REGIMI_FISCALI: Record<
  string,
  { name: string; vatNature: string; description: string }
> = {
  RF01: {
    name: "Ordinario",
    vatNature: "",
    description: "Regime ordinario",
  },
  RF02: {
    name: "Contribuenti minimi",
    vatNature: "N2.2",
    description: "Contribuenti minimi (art.1, c.96-117, L. 244/2007)",
  },
  RF04: {
    name: "Agricoltura",
    vatNature: "",
    description: "Agricoltura e attività connesse e pesca",
  },
  RF19: {
    name: "Forfettario",
    vatNature: "N2.2",
    description: "Regime forfettario (art.1, c.54-89, L. 190/2014)",
  },
};

/**
 * Ritorna la dicitura obbligatoria per il regime forfettario.
 * Da inserire nella fattura elettronica.
 */
export function getDicituraForfettario(): string {
  return "Operazione effettuata ai sensi dell'articolo 1, commi da 54 a 89, della Legge n. 190/2014 – Regime forfettario";
}

/**
 * Ritorna la dicitura per contribuenti minimi.
 */
export function getDicituraMinimi(): string {
  return "Operazione effettuata ai sensi dell'articolo 1, commi da 96 a 117, della Legge n. 244/2007 – Regime dei contribuenti minimi";
}
