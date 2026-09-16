// lib/rate-limit.ts

type Bucket = number[];

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

const SWEEP_INTERVAL_MS = 5 * 60_000;

function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, timestamps] of buckets) {
    const fresh = timestamps.filter((t) => now - t < windowMs);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}

/**
 * Returns `{ allowed, remaining, retryAfterMs }`.
 * Call once per request. Do not `await`.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  sweep(windowMs);
  const now = Date.now();
  const bucket = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (bucket.length >= limit) {
    const oldest = bucket[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - oldest),
    };
  }

  bucket.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: limit - bucket.length,
    retryAfterMs: 0,
  };
}

/** Best-effort client IP from common proxy headers. */
export function getClientIp(req: Request): string {
  const h = req.headers;
  const xff = h.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return (
    h.get('x-real-ip') ??
    h.get('cf-connecting-ip') ??
    h.get('x-vercel-forwarded-for') ??
    'unknown'
  );
}