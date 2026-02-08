// ============================================================
// Test: Crypto (AES-256-GCM)
// ============================================================

import { describe, it, expect } from "vitest";
import { encrypt, decrypt, encryptApiKey, decryptApiKey } from "@/lib/crypto";

// Mock env variable for tests (must be ≥ 32 chars)
process.env.ENCRYPTION_SECRET = "test-encryption-key-for-vitest-32chars!!";

describe("Crypto AES-256-GCM", () => {
  describe("encrypt / decrypt (core)", () => {
    it("dovrebbe cifrare e decifrare correttamente", () => {
      const original = "sk_test_1234567890abcdef";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("dovrebbe produrre output diversi per lo stesso input (salt random)", () => {
      const original = "same-key";
      const enc1 = encrypt(original);
      const enc2 = encrypt(original);
      expect(enc1).not.toBe(enc2); // Salt diversi
    });

    it("dovrebbe gestire stringhe vuote", () => {
      const original = "";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("dovrebbe gestire stringhe lunghe", () => {
      const original = "a".repeat(1000);
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("dovrebbe gestire caratteri speciali", () => {
      const original = "key!@#$%^&*()_+{}|:<>?àèìòù€£";
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it("il testo cifrato dovrebbe contenere 4 parti separate da :", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");
      expect(parts.length).toBe(4); // salt:iv:tag:ciphertext
    });
  });

  describe("encryptApiKey / decryptApiKey (wrapper)", () => {
    it("dovrebbe cifrare e decifrare una API key", () => {
      const original = "sk_live_abc123";
      const encrypted = encryptApiKey(original);
      expect(encrypted).not.toBeNull();
      const decrypted = decryptApiKey(encrypted!);
      expect(decrypted).toBe(original);
    });

    it("dovrebbe restituire null per input null/undefined/vuoto", () => {
      expect(encryptApiKey(null)).toBeNull();
      expect(encryptApiKey(undefined)).toBeNull();
      expect(encryptApiKey("")).toBeNull();
      expect(encryptApiKey("  ")).toBeNull();
    });

    it("dovrebbe restituire null per decrypt di null/undefined/vuoto", () => {
      expect(decryptApiKey(null)).toBeNull();
      expect(decryptApiKey(undefined)).toBeNull();
      expect(decryptApiKey("")).toBeNull();
    });
  });
});
