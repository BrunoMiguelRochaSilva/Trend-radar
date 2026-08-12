import { RefreshCw, Database } from 'lucide-react';
import { relativeTime } from '../utils/relativeTime.js';

/**
 * Subtle cache-freshness indicator + Refresh action, reused wherever data
 * comes from the persistent query cache (product list, product detail,
 * popular videos, video detail). Deliberately small/muted — spec: "This
 * should not dominate the interface."
 *
 * Submit (elsewhere) = cache-first. This Refresh button = network-first /
 * forced refresh, bypassing both the persistent cache and the backend's
 * in-memory cache, then replacing the cached entry.
 */
export default function CacheStatus({ updatedAt, fromCache, isFetching, onRefresh, size = 'sm', label: ariaLabel = 'Refresh' }) {
  let label = null;
  if (isFetching) {
    label = 'Refreshing…';
  } else if (updatedAt) {
    label = fromCache ? `Cached · ${relativeTime(updatedAt)}` : `Updated ${relativeTime(updatedAt)}`;
  }

  const text = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={`flex items-center gap-2 ${text} text-slate-400`}>
      {label && (
        <span className="inline-flex items-center gap-1" title={fromCache ? 'Served from the local query cache — no Kalodata call made' : 'Freshly fetched from Kalodata'}>
          {fromCache && !isFetching && <Database className="h-3 w-3" />}
          {label}
        </span>
      )}
      <button
        onClick={onRefresh}
        disabled={isFetching}
        aria-label={ariaLabel}
        title="Fetch fresh data from Kalodata, bypassing the cache"
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
}
