// ============================================================
// VIES VAT Validation - Verifica P.IVA reale tramite EU VIES
// ============================================================

export interface ViesValidationResult {
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  name?: string;
  address?: string;
  requestDate: string;
  error?: string;
}

/**
 * Verifica una Partita IVA nel registro VIES dell'UE.
 * Utilizza l'API REST ufficiale della Commissione Europea.
 * 
 * @param countryCode - Codice paese ISO 2 lettere (es. "IT", "DE", "FR")
 * @param vatNumber - Numero P.IVA senza prefisso paese
 * @returns Risultato validazione con dati aziendali se disponibili
 */
export async function validateVatVIES(
  countryCode: string,
  vatNumber: string,
): Promise<ViesValidationResult> {
  // Normalizza input
  const cc = countryCode.toUpperCase().trim();
  const vat = vatNumber.replace(/[\s.-]/g, "").trim();

  if (!cc || cc.length !== 2) {
    return {
      valid: false,
      countryCode: cc,
      vatNumber: vat,
      requestDate: new Date().toISOString(),
      error: "Codice paese non valido (deve essere ISO 2 lettere)",
    };
  }

  if (!vat || vat.length < 2) {
    return {
      valid: false,
      countryCode: cc,
      vatNumber: vat,
      requestDate: new Date().toISOString(),
      error: "Numero P.IVA troppo corto",
    };
  }

  try {
    const response = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: cc,
          vatNumber: vat,
        }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      },
    );

    if (!response.ok) {
      // Fallback: se VIES è down, permettiamo la validazione solo formale
      console.warn(`VIES API returned ${response.status}, falling back to format-only validation`);
      return {
        valid: true, // Fail-open: non blocchiamo per problemi VIES
        countryCode: cc,
        vatNumber: vat,
        requestDate: new Date().toISOString(),
        error: `VIES non disponibile (HTTP ${response.status}). Validazione solo formale.`,
      };
    }

    const data = await response.json();

    return {
      valid: data.valid === true,
      countryCode: cc,
      vatNumber: vat,
      name: data.name || undefined,
      address: data.address || undefined,
      requestDate: data.requestDate || new Date().toISOString(),
    };
  } catch (error) {
    // Se VIES è irraggiungibile, non blocchiamo il flusso
    console.warn("VIES validation failed (network):", error);
    return {
      valid: true, // Fail-open
      countryCode: cc,
      vatNumber: vat,
      requestDate: new Date().toISOString(),
      error: "VIES non raggiungibile. Validazione solo formale applicata.",
    };
  }
}

/**
 * Estrae codice paese e numero da una P.IVA completa (es. "IT12345678901")
 */
export function parseFullVatNumber(fullVat: string): {
  countryCode: string;
  vatNumber: string;
} {
  const cleaned = fullVat.replace(/[\s.-]/g, "").toUpperCase();
  const match = cleaned.match(/^([A-Z]{2})(\d+)$/);
  if (match) {
    return { countryCode: match[1], vatNumber: match[2] };
  }
  // Assume Italian if no prefix
  return { countryCode: "IT", vatNumber: cleaned };
}

/**
 * Verifica se una P.IVA italiana esiste nel registro VIES.
 * Wrapper per uso semplice con solo numero italiano.
 */
export async function validateItalianVat(
  vatNumber: string,
): Promise<ViesValidationResult> {
  const cleaned = vatNumber.replace(/[\s.-]/g, "").replace(/^IT/i, "");
  return validateVatVIES("IT", cleaned);
}

// Lista paesi UE per validazione OSS
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

/**
 * Verifica se un paese è nell'Unione Europea
 */
export function isEUCountry(countryCode: string): boolean {
  return EU_COUNTRIES.has(countryCode.toUpperCase());
}
