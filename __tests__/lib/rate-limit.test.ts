// ============================================================
// Test: Rate Limiter
// ============================================================

import { describe, it, expect } from "vitest";
import { checkRateLimit, type RateLimitConfig } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  const config: RateLimitConfig = { maxRequests: 3, windowMs: 1000 };

  it("dovrebbe permettere richieste sotto il limite", () => {
    const key = `test-${Date.now()}-1`;
    const r1 = checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("dovrebbe bloccare richieste oltre il limite", () => {
    const key = `test-${Date.now()}-2`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);

    const r4 = checkRateLimit(key, config);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfter).toBeDefined();
    expect(r4.retryAfter!).toBeGreaterThan(0);
  });

  it("chiavi diverse dovrebbero avere limiti indipendenti", () => {
    const key1 = `test-${Date.now()}-3a`;
    const key2 = `test-${Date.now()}-3b`;

    checkRateLimit(key1, config);
    checkRateLimit(key1, config);
    checkRateLimit(key1, config);
    const r1 = checkRateLimit(key1, config);
    expect(r1.allowed).toBe(false);

    const r2 = checkRateLimit(key2, config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(2);
  });

  it("dovrebbe resettare dopo la finestra temporale", async () => {
    const shortConfig = { maxRequests: 1, windowMs: 100 };
    const key = `test-${Date.now()}-4`;

    checkRateLimit(key, shortConfig);
    const blocked = checkRateLimit(key, shortConfig);
    expect(blocked.allowed).toBe(false);

    // Attendi che la finestra scada
    await new Promise((resolve) => setTimeout(resolve, 150));

    const afterReset = checkRateLimit(key, shortConfig);
    expect(afterReset.allowed).toBe(true);
  });
});
