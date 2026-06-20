/**
 * Crittografia AES-256-GCM per chiavi API
 * Le chiavi Stripe/Fatture in Cloud NON devono MAI essere salvate in chiaro.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH);
}

function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ENCRYPTION_SECRET mancante o troppo corto. Deve avere almeno 32 caratteri.",
    );
  }
  return secret;
}

/**
 * Cifra un testo con AES-256-GCM.
 * Output: salt:iv:tag:ciphertext (hex-encoded)
 */
export function encrypt(plaintext: string): string {
  const secret = getEncryptionSecret();
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return [
    salt.toString("hex"),
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted,
  ].join(":");
}

/**
 * Decifra un testo cifrato con AES-256-GCM.
 * Input: salt:iv:tag:ciphertext (hex-encoded)
 */
export function decrypt(ciphertext: string): string {
  const secret = getEncryptionSecret();
  const parts = ciphertext.split(":");

  if (parts.length !== 4) {
    throw new Error("Formato dati cifrati non valido");
  }

  const salt = Buffer.from(parts[0], "hex");
  const iv = Buffer.from(parts[1], "hex");
  const tag = Buffer.from(parts[2], "hex");
  const encrypted = parts[3];

  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Cifra una chiave API per il salvataggio nel database.
 * Ritorna null se il valore è vuoto.
 */
export function encryptApiKey(
  apiKey: string | null | undefined,
): string | null {
  if (!apiKey?.trim()) return null;
  return encrypt(apiKey.trim());
}

/**
 * Decifra una chiave API dal database.
 * Ritorna null se il valore è vuoto.
 */
export function decryptApiKey(
  encrypted: string | null | undefined,
): string | null {
  if (!encrypted?.trim()) return null;
  return decrypt(encrypted.trim());
}
