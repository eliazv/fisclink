// ============================================================
// Rate Limiter - Protezione API da abusi
// ============================================================
// Semplice rate limiter in-memory per protezione base.
// In produzione: usare Redis per rate limiting distribuito.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup automatico ogni 5 minuti
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  },
  5 * 60 * 1000,
);

export interface RateLimitConfig {
  maxRequests: number; // Numero massimo di richieste
  windowMs: number; // Finestra temporale in ms
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Timestamp reset in ms
  retryAfter?: number; // Secondi prima del prossimo tentativo
}

/**
 * Verifica se una richiesta è consentita dal rate limiter.
 *
 * @param key - Identificatore unico (es. IP, merchantId, endpoint+IP)
 * @param config - Configurazione limiti
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60_000 },
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Nuova finestra
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Configurazioni predefinite per diversi endpoint
export const RATE_LIMITS = {
  webhook: { maxRequests: 1000, windowMs: 60_000 }, // 1000/min per webhook
  api: { maxRequests: 100, windowMs: 60_000 }, // 100/min per API generiche
  auth: { maxRequests: 10, windowMs: 15 * 60_000 }, // 10 tentativi per 15 min
  magicLink: { maxRequests: 20, windowMs: 60_000 }, // 20/min per magic link
  reports: { maxRequests: 10, windowMs: 60_000 }, // 10/min per report PDF
} as const;
