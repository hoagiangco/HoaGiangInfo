/**
 * Small in-memory fixed-window rate limiter.
 *
 * NOTE: state lives in the Node.js process. That is fine for a single VPS /
 * single `next start` process. If you scale to several instances, move this to
 * Redis (or a DB table) - the call sites will not need to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  buckets.forEach((b, key) => {
    if (b.resetAt <= now) buckets.delete(key);
  });
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Client IP. Only trust X-Forwarded-For when the app runs behind your own
 * reverse proxy (nginx/caddy) that overwrites the header.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim() || 'unknown';
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
