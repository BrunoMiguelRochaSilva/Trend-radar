import { useEffect, useState } from 'react';
import { buildQueryKey, getCachedQuery } from '../services/queryCache.js';
import { buildVideoRankParams } from '../utils/queryParams.js';
import { normalizeVideos } from '../utils/normalizeVideo.js';

/**
 * Highest-revenue videos per product, read ONLY from the persistent query
 * cache — the video/rank page-1 batch saved when a product's page was opened
 * (src/pages/ProductDetailsPage.jsx). Never touches the network, so it costs
 * no credits. Returns { [productId]: video[] | null } — null means that
 * product hasn't been opened for this date range yet. Re-reads on window
 * focus, since a product may have just been opened in another tab.
 */
export function useCachedTopVideos(productIds, dateRange, limit = 3) {
  const [byId, setById] = useState({});
  const idsKey = productIds.join(',');

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    let cancelled = false;

    async function load() {
      const entries = await Promise.all(
        ids.map(async (id) => {
          const key = buildQueryKey('video/rank', buildVideoRankParams(id, dateRange, 1));
          const cached = await getCachedQuery(key);
          // video/rank comes back sorted by revenue (DESC), so the first few are the top earners.
          return [id, cached ? normalizeVideos(cached.payload?.data).slice(0, limit) : null];
        })
      );
      if (!cancelled) setById(Object.fromEntries(entries));
    }

    load();
    window.addEventListener('focus', load);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', load);
    };
  }, [idsKey, dateRange, limit]);

  return byId;
}
