// Simple in-memory TTL cache. No Redis needed for V1 — this process only ever
// runs as a single instance, and cache entries are small and short-lived.

const store = new Map();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // ~5 minutes, per Kalodata rate limits

/**
 * Build a stable cache key from an endpoint name and a params object.
 * Key order doesn't matter — params are sorted before serializing.
 */
export function cacheKey(namespace, params = {}) {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  return `${namespace}:${JSON.stringify(sorted)}`;
}

export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Wrap an async producer with cache-aside behavior. */
export async function withCache(key, ttlMs, producer) {
  const cached = getCached(key);
  if (cached !== undefined) return cached;
  const value = await producer();
  setCached(key, value, ttlMs);
  return value;
}

/** Remove all cache entries (used by the manual refresh endpoint/action). */
export function clearCache() {
  store.clear();
}
