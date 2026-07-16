/**
 * In-memory sliding-window rate limiter.
 *
 * NOTE: This is a single-process in-memory store. It works correctly for
 * single-instance deployments (e.g. a single Docker container). For
 * multi-instance / serverless deployments, replace the store with Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

/** Pre-configured limits for common endpoints */
export const RATE_LIMITS = {
  /** Public contact form: 10 submissions per 10 minutes */
  contactForm: { maxRequests: 10, windowMs: 10 * 60 * 1000 } satisfies RateLimitConfig,
  /** Admin login: 5 attempts per 15 minutes */
  adminLogin: { maxRequests: 5, windowMs: 15 * 60 * 1000 } satisfies RateLimitConfig,
} as const;

/**
 * Returns `true` if the request is allowed, `false` if rate-limited.
 *
 * @param key    - A unique identifier for the requester, typically an IP address.
 * @param config - Rate limit configuration.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const entry = store.get(key) ?? { timestamps: [] };

  // Purge timestamps that have fallen outside the window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    store.set(key, entry);
    return false; // Rate limit exceeded
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return true; // Request allowed
}

/**
 * Extracts the best available IP address from a Next.js / Node.js request.
 * Respects X-Forwarded-For for reverse-proxied deployments.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; the first is the client IP
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Periodically prune stale entries to avoid unbounded memory growth
// (runs every 10 minutes; only active while the process is running)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.timestamps.every((ts) => ts <= now - Math.max(RATE_LIMITS.contactForm.windowMs, RATE_LIMITS.adminLogin.windowMs))) {
        store.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}
