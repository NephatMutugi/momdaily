// In-memory token bucket rate limiter, keyed by an arbitrary string
// (e.g., userId, IP). Lives in the Node process — fine for single-instance
// deploys. For serverless or multi-region, swap for Redis/Upstash.
//
// Used in Phase 1 for the signup endpoint, and in Phase 8 for the AI coach.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

interface LimiterConfig {
  capacity: number; // max tokens
  refillPerSecond: number; // tokens added per second
}

function getBucket(key: string, cfg: LimiterConfig): Bucket {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing) {
    const b = { tokens: cfg.capacity, lastRefill: now };
    buckets.set(key, b);
    return b;
  }
  const elapsedSec = (now - existing.lastRefill) / 1000;
  const refill = elapsedSec * cfg.refillPerSecond;
  existing.tokens = Math.min(cfg.capacity, existing.tokens + refill);
  existing.lastRefill = now;
  return existing;
}

export interface LimiterResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function consume(key: string, cfg: LimiterConfig): LimiterResult {
  const b = getBucket(key, cfg);
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return { ok: true, remaining: Math.floor(b.tokens), retryAfterSec: 0 };
  }
  const need = 1 - b.tokens;
  const retryAfterSec = Math.ceil(need / cfg.refillPerSecond);
  return { ok: false, remaining: 0, retryAfterSec };
}

// Signup limiter: 5-burst, refill 1 every 60s. Keyed by IP.
// Tight enough to deter spam, loose enough to not punish a family share.
export const SIGNUP_LIMIT: LimiterConfig = {
  capacity: 5,
  refillPerSecond: 1 / 60,
};

// Profile update limiter: 20-burst, refill 1 every 5s. Keyed by userId.
export const PROFILE_LIMIT: LimiterConfig = {
  capacity: 20,
  refillPerSecond: 1 / 5,
};

// Coach limiter (Phase 8): 5/day. Keyed by userId.
// 5-token burst, refill 1 every ~17280s (5/day).
export const COACH_LIMIT: LimiterConfig = {
  capacity: 5,
  refillPerSecond: 5 / 86400,
};

// Forgot-password limiter. Two keys per request:
//   - by IP: 5-burst, refill 1/min (prevents spam from one IP)
//   - by email: 3-burst, refill 1/15min (prevents flooding a real user's
//     inbox even if the attacker rotates IPs)
// Both keys are checked; if either is exhausted the request still returns
// 200 (privacy) but doesn't send.
export const FORGOT_PASSWORD_IP_LIMIT: LimiterConfig = {
  capacity: 5,
  refillPerSecond: 1 / 60,
};
export const FORGOT_PASSWORD_EMAIL_LIMIT: LimiterConfig = {
  capacity: 3,
  refillPerSecond: 1 / 900,
};

// Reset-password limiter. Tight — token-guessing should be infeasible at
// 256 bits of entropy, but rate-limit anyway so a leaked token isn't
// brute-forced via a typo. Keyed by IP.
export const RESET_PASSWORD_LIMIT: LimiterConfig = {
  capacity: 10,
  refillPerSecond: 1 / 30,
};
