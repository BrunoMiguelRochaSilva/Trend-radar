// Persistent, cross-session query cache (IndexedDB), keyed by a deterministic
// hash of the complete request-parameter configuration for a given endpoint.
//
// This is intentionally separate from — and sits in front of — TanStack
// Query's own in-memory query cache and the backend's 5-minute in-memory
// cache (server/utils/cache.js). Those two exist to dedupe/limit traffic
// within a short window; this one is the source of truth for "have we ever
// fetched this exact query before" and survives page reloads / new tabs.
//
// Architecture note: this lives in the browser for V1. If it ever needs to
// move server-side (e.g. shared across users), the interface here
// (buildQueryKey / getCachedQuery / setCachedQuery) is exactly what a
// server-side cache would need to implement — nothing above this module
// depends on IndexedDB specifically.

const DB_NAME = 'trendradar-query-cache';
const DB_VERSION = 1;
const STORE_NAME = 'queries';
// 'mock' | 'live', injected by vite.config.js from USE_MOCK_DATA. Part of every key so
// flipping modes never serves results cached under the other mode.
const DATA_MODE = typeof __DATA_MODE__ !== 'undefined' ? __DATA_MODE__ : 'live';

let dbPromise = null;
// In-memory fallback for environments without IndexedDB (private browsing
// restrictions, very old browsers, etc.) so the app degrades gracefully
// instead of breaking — it just won't survive a reload in that case.
const memoryFallback = new Map();

function isIndexedDbAvailable() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDb() {
  if (!isIndexedDbAvailable()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'queryKey' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null); // degrade to memoryFallback
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Recursively sorts object keys and drops undefined values so two
 * semantically-identical param objects always serialize identically,
 * regardless of construction/insertion order.
 */
function canonicalize(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);

  const out = {};
  for (const key of Object.keys(value).sort()) {
    if (value[key] === undefined) continue;
    out[key] = canonicalize(value[key]);
  }
  return out;
}

/**
 * Deterministic cache key: identical query configuration → identical key,
 * regardless of key order or how the params object was built.
 */
export function buildQueryKey(endpoint, params) {
  return `${DATA_MODE}:${endpoint}::${JSON.stringify(canonicalize(params))}`;
}

/** @returns {Promise<{queryKey, endpoint, params, payload, rowCount, createdAt, updatedAt} | undefined>} */
export async function getCachedQuery(queryKey) {
  const db = await openDb();
  if (!db) return memoryFallback.get(queryKey);

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(queryKey);
      req.onsuccess = () => resolve(req.result || undefined);
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Upserts a cache entry. `createdAt` is preserved across updates (set once);
 * `updatedAt` always reflects this write — that's what freshness labels use.
 */
export async function setCachedQuery(queryKey, { endpoint, params, payload, rowCount }) {
  const now = Date.now();
  const existing = await getCachedQuery(queryKey);
  const entry = {
    queryKey,
    endpoint,
    params,
    payload,
    rowCount,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const db = await openDb();
  if (!db) {
    memoryFallback.set(queryKey, entry);
    return entry;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror = () => resolve(entry); // still usable in-memory even if persistence failed
    } catch {
      resolve(entry);
    }
  });
}

/** Maintenance hook — not wired into any UI yet, available for future use. */
export async function clearAllCachedQueries() {
  memoryFallback.clear();
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
