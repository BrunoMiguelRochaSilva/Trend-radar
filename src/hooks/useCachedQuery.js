import { useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { buildQueryKey, getCachedQuery, setCachedQuery } from '../services/queryCache.js';

/**
 * Wraps TanStack Query with the persistent (IndexedDB) cross-session cache
 * from src/services/queryCache.js.
 *
 * Default behavior is cache-first ("Submit"): an exact repeat of the same
 * `params` for the same `endpoint` never re-hits the network, even after a
 * page reload. Call the returned `refresh()` to force a real network fetch
 * ("Refresh") and replace the cached entry — `fetcher` receives `true` in
 * that case so it can also ask our backend to bypass its own cache.
 *
 * @param {string} endpoint - logical endpoint name, e.g. 'product/rank'
 * @param {object} params - canonical request params (see src/utils/queryParams.js) — this IS the cache key input
 * @param {(forceRefresh: boolean) => Promise<any>} fetcher - calls our backend
 * @param {boolean} [enabled]
 */
export function useCachedQuery({ endpoint, params, fetcher, enabled = true }) {
  const forceRef = useRef(false);
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey(endpoint, params);

  const query = useQuery({
    queryKey: ['cached-query', endpoint, params],
    queryFn: async () => {
      const forceRefresh = forceRef.current;
      forceRef.current = false;

      if (!forceRefresh) {
        const cached = await getCachedQuery(queryKey);
        if (cached) return { ...cached, fromCache: true };
      }

      const payload = await fetcher(forceRefresh);
      // A real network fetch may have spent credits — have the sidebar balance re-check.
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      const rowCount = Array.isArray(payload?.data) ? payload.data.length : payload?.data ? 1 : 0;
      const entry = await setCachedQuery(queryKey, { endpoint, params, payload, rowCount });
      return { ...entry, fromCache: false };
    },
    enabled,
  });

  async function refresh() {
    forceRef.current = true;
    await query.refetch();
  }

  return {
    ...query,
    // the raw {success, data} envelope from our backend — what callers actually want
    response: query.data?.payload,
    rowCount: query.data?.rowCount ?? 0,
    updatedAt: query.data?.updatedAt ? new Date(query.data.updatedAt) : null,
    fromCache: query.data?.fromCache ?? false,
    refresh,
  };
}
