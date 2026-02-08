/**
 * Validatori per dati fiscali italiani
 * Codice Fiscale, Partita IVA, CAP, Provincia
 */

// ============================================================
// CODICE FISCALE - Validazione completa con check digit
// ============================================================

const CF_REGEX = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;

const CF_ODD_MAP: Record<string, number> = {
  "0": 1,
  "1": 0,
  "2": 5,
  "3": 7,
  "4": 9,
  "5": 13,
  "6": 15,
  "7": 17,
  "8": 19,
  "9": 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23,
};

const CF_EVEN_MAP: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
  P: 15,
  Q: 16,
  R: 17,
  S: 18,
  T: 19,
  U: 20,
  V: 21,
  W: 22,
  X: 23,
  Y: 24,
  Z: 25,
};

/**
 * Valida un Codice Fiscale italiano.
 * Supporta sia il formato standard a 16 caratteri
 * sia il formato numerico a 11 cifre (P.IVA usata come CF per le aziende).
 */
export function validateCodiceFiscale(cf: string): {
  valid: boolean;
  error?: string;
} {
  if (!cf || cf.trim().length === 0) {
    return { valid: false, error: "Codice Fiscale mancante" };
  }

  const normalized = cf.toUpperCase().trim();

  // CF numerico a 11 cifre (P.IVA usata come CF per persone giuridiche)
  if (/^\d{11}$/.test(normalized)) {
    return validatePartitaIva(normalized);
  }

  // CF standard a 16 caratteri
  if (normalized.length !== 16) {
    return {
      valid: false,
      error: `Il Codice Fiscale deve avere 16 caratteri, ne hai inseriti ${normalized.length}`,
    };
  }

  if (!CF_REGEX.test(normalized)) {
    return {
      valid: false,
      error:
        "Formato del Codice Fiscale non valido. Controlla di non aver inserito caratteri speciali",
    };
  }

  // Calcolo check digit (carattere di controllo)
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = normalized[i];
    if (i % 2 === 0) {
      // Posizioni dispari (1-based) → indici pari (0-based)
      sum += CF_ODD_MAP[char] ?? 0;
    } else {
      sum += CF_EVEN_MAP[char] ?? 0;
    }
  }

  const expectedCheck = String.fromCharCode(65 + (sum % 26));
  if (normalized[15] !== expectedCheck) {
    return {
      valid: false,
      error:
        "Il carattere di controllo del Codice Fiscale non è corretto. Verifica di averlo digitato bene",
    };
  }

  return { valid: true };
}

// ============================================================
// PARTITA IVA - Algoritmo di Luhn modificato
// ============================================================

/**
 * Valida una Partita IVA italiana (11 cifre, algoritmo di Luhn).
 */
export function validatePartitaIva(piva: string): {
  valid: boolean;
  error?: string;
} {
  if (!piva || piva.trim().length === 0) {
    return { valid: false, error: "Partita IVA mancante" };
  }

  const normalized = piva.replace(/\s/g, "").replace(/^IT/i, "");

  if (!/^\d{11}$/.test(normalized)) {
    return {
      valid: false,
      error: `La Partita IVA deve avere 11 cifre, ne hai inserite ${normalized.length}`,
    };
  }

  // Controllo che non sia tutto zeri
  if (/^0+$/.test(normalized)) {
    return { valid: false, error: "Partita IVA non valida (tutti zeri)" };
  }

  // Algoritmo di Luhn per P.IVA italiana
  const digits = normalized.split("").map(Number);
  let sumOdd = 0;
  let sumEven = 0;

  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) {
      sumOdd += digits[i];
    } else {
      const doubled = digits[i] * 2;
      sumEven += doubled > 9 ? doubled - 9 : doubled;
    }
  }

  const checkDigit = (10 - ((sumOdd + sumEven) % 10)) % 10;

  if (checkDigit !== digits[10]) {
    return {
      valid: false,
      error: "Partita IVA non valida. Controlla il numero e riprova",
    };
  }

  return { valid: true };
}

// ============================================================
// CODICE DESTINATARIO SDI
// ============================================================

/**
 * Valida il Codice Destinatario SDI (7 caratteri alfanumerici).
 * "0000000" per privati senza PEC.
 */
export function validateCodiceDestinatario(code: string): {
  valid: boolean;
  error?: string;
} {
  if (!code) return { valid: true }; // Opzionale

  const normalized = code.toUpperCase().trim();

  if (!/^[A-Z0-9]{7}$/.test(normalized)) {
    return {
      valid: false,
      error:
        "Il Codice Destinatario SDI deve essere di 7 caratteri alfanumerici",
    };
  }

  return { valid: true };
}

// ============================================================
// VALIDAZIONE PEC
// ============================================================

export function validatePec(pec: string): {
  valid: boolean;
  error?: string;
} {
  if (!pec) return { valid: true }; // Opzionale

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(pec)) {
    return { valid: false, error: "Indirizzo PEC non valido" };
  }

  // Le PEC italiane hanno tipicamente domini .pec.it o simili
  // Ma non è un requisito tecnico, quindi accettiamo qualsiasi email valida

  return { valid: true };
}

// ============================================================
// VALIDAZIONE CAP ITALIANO
// ============================================================

export function validateCAP(cap: string): {
  valid: boolean;
  error?: string;
} {
  if (!cap) return { valid: false, error: "CAP mancante" };

  if (!/^\d{5}$/.test(cap.trim())) {
    return { valid: false, error: "Il CAP deve essere di 5 cifre" };
  }

  return { valid: true };
}

// ============================================================
// PROVINCE ITALIANE
// ============================================================

export const PROVINCE_ITALIANE = new Set([
  "AG",
  "AL",
  "AN",
  "AO",
  "AP",
  "AQ",
  "AR",
  "AT",
  "AV",
  "BA",
  "BG",
  "BI",
  "BL",
  "BN",
  "BO",
  "BR",
  "BS",
  "BT",
  "BZ",
  "CA",
  "CB",
  "CE",
  "CH",
  "CL",
  "CN",
  "CO",
  "CR",
  "CS",
  "CT",
  "CZ",
  "EN",
  "FC",
  "FE",
  "FG",
  "FI",
  "FM",
  "FR",
  "GE",
  "GO",
  "GR",
  "IM",
  "IS",
  "KR",
  "LC",
  "LE",
  "LI",
  "LO",
  "LT",
  "LU",
  "MB",
  "MC",
  "ME",
  "MI",
  "MN",
  "MO",
  "MS",
  "MT",
  "NA",
  "NO",
  "NU",
  "OG",
  "OR",
  "OT",
  "PA",
  "PC",
  "PD",
  "PE",
  "PG",
  "PI",
  "PN",
  "PO",
  "PR",
  "PT",
  "PU",
  "PV",
  "PZ",
  "RA",
  "RC",
  "RE",
  "RG",
  "RI",
  "RM",
  "RN",
  "RO",
  "SA",
  "SI",
  "SO",
  "SP",
  "SR",
  "SS",
  "SU",
  "SV",
  "TA",
  "TE",
  "TN",
  "TO",
  "TP",
  "TR",
  "TS",
  "TV",
  "UD",
  "VA",
  "VB",
  "VC",
  "VE",
  "VI",
  "VR",
  "VT",
  "VV",
]);

export function validateProvincia(prov: string): {
  valid: boolean;
  error?: string;
} {
  if (!prov) return { valid: false, error: "Provincia mancante" };

  const normalized = prov.toUpperCase().trim();
  if (!PROVINCE_ITALIANE.has(normalized)) {
    return {
      valid: false,
      error: `"${prov}" non è una sigla di provincia valida`,
    };
  }

  return { valid: true };
}

// ============================================================
// VALIDAZIONE COMPLETA DATI FISCALI PER FATTURA
// ============================================================

export interface FiscalData {
  fiscalCode?: string | null;
  vatNumber?: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  zipCode?: string | null;
  country?: string | null;
  sdiCode?: string | null;
  pecEmail?: string | null;
  customerType?: "PRIVATE" | "BUSINESS" | "FOREIGN";
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  missingFields: string[];
}

/**
 * Valida completa dei dati fiscali necessari per emettere una fattura elettronica.
 * Ritorna errori "umani" leggibili dal merchant.
 */
export function validateFiscalData(data: FiscalData): ValidationResult {
  const errors: string[] = [];
  const missingFields: string[] = [];

  const country = (data.country ?? "IT").toUpperCase();
  const isItalian = country === "IT";
  const isBusiness = data.customerType === "BUSINESS";

  // --- Nome/Ragione Sociale ---
  if (!data.name?.trim()) {
    errors.push("Nome o ragione sociale mancante");
    missingFields.push("name");
  }

  // --- Per clienti italiani ---
  if (isItalian) {
    if (isBusiness) {
      // Azienda italiana: P.IVA obbligatoria
      if (!data.vatNumber) {
        errors.push("Partita IVA obbligatoria per le aziende italiane");
        missingFields.push("vatNumber");
      } else {
        const pivaResult = validatePartitaIva(data.vatNumber);
        if (!pivaResult.valid) errors.push(pivaResult.error!);
      }
    } else {
      // Privato italiano: CF obbligatorio
      if (!data.fiscalCode && !data.vatNumber) {
        errors.push(
          "Codice Fiscale o Partita IVA obbligatorio per i clienti italiani",
        );
        missingFields.push("fiscalCode");
      } else {
        if (data.fiscalCode) {
          const cfResult = validateCodiceFiscale(data.fiscalCode);
          if (!cfResult.valid) errors.push(cfResult.error!);
        }
        if (data.vatNumber) {
          const pivaResult = validatePartitaIva(data.vatNumber);
          if (!pivaResult.valid) errors.push(pivaResult.error!);
        }
      }
    }

    // Indirizzo obbligatorio per clienti italiani
    if (!data.address?.trim()) {
      errors.push("Indirizzo mancante");
      missingFields.push("address");
    }
    if (!data.city?.trim()) {
      errors.push("Città mancante");
      missingFields.push("city");
    }
    if (!data.zipCode) {
      errors.push("CAP mancante");
      missingFields.push("zipCode");
    } else {
      const capResult = validateCAP(data.zipCode);
      if (!capResult.valid) errors.push(capResult.error!);
    }
    if (!data.province) {
      errors.push("Provincia mancante");
      missingFields.push("province");
    } else {
      const provResult = validateProvincia(data.province);
      if (!provResult.valid) errors.push(provResult.error!);
    }
  }

  // --- Codice Destinatario / PEC (opzionali ma validati se presenti) ---
  if (data.sdiCode) {
    const sdiResult = validateCodiceDestinatario(data.sdiCode);
    if (!sdiResult.valid) errors.push(sdiResult.error!);
  }
  if (data.pecEmail) {
    const pecResult = validatePec(data.pecEmail);
    if (!pecResult.valid) errors.push(pecResult.error!);
  }

  return {
    valid: errors.length === 0,
    errors,
    missingFields,
  };
}
