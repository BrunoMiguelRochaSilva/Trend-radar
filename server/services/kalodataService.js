// Centralizes all Kalodata Open Center API calls. Every function here builds
// the exact documented request body, calls the client, and returns the raw
// (validated) Kalodata response — normalization into our own shape happens
// on the frontend (src/utils/normalizeProduct.js, normalizeVideo.js).

import { postKalodata } from './kalodataClient.js';
import { withCache, cacheKey } from '../utils/cache.js';
import {
  getMockProductRanking,
  getMockProductDetails,
  getMockVideoRanking,
  getMockVideoDetails,
} from './mockData.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

const isMockMode = () => String(process.env.USE_MOCK_DATA).toLowerCase() === 'true';

const COMMON = { region: 'US', language: 'en-US', currency: 'USD' };

/**
 * POST /openapi/v1/tiktok/product/rank
 * Rate limit: 10 requests / 10 seconds.
 * Billing: 0.1 credit per ceil(returned rows / 100) — 100 rows costs the same 0.1 credit as
 * 30, so callers should default to the documented max (100) and let the frontend slice down
 * for display rather than requesting fewer rows per call.
 */
export async function getProductRanking({
  dateRange = 'last7Day',
  sortField = 'revenue',
  sortType = 'DESC',
  pageSize = 100,
  pageNumber = 1,
  keyword,
  priceRange,
  revenueRange,
} = {}) {
  const body = {
    ...COMMON,
    date_range: dateRange,
    sort_field: { field: sortField, type: sortType },
    // Never exceed Kalodata's documented max page size for this endpoint.
    page_size: Math.min(pageSize, 100),
    page_number: pageNumber,
    need_image: 1,
  };
  if (keyword) body.keyword = keyword;

  if (isMockMode()) {
    // Mock filtering understands { min, max } objects directly — real shape doesn't matter here.
    if (priceRange) body.unit_price_range = priceRange;
    if (revenueRange) body.revenue_range = revenueRange;
    return getMockProductRanking(body);
  }

  // unit_price_range / revenue_range are intentionally NOT sent in live mode. Confirmed live
  // against the real API: sending them as { min, max } objects throws a hard server error —
  // Kalodata's ProductRankReq["revenue_range"] expects a STRING, not an object (Jackson:
  // "Cannot deserialize value of type `java.lang.String` from Object value"). The correct
  // string format isn't documented anywhere we could reach, so rather than guess another
  // shape (same "do not guess" rule as the auth header), we omit the field entirely — the
  // request still succeeds, just without server-side price/revenue filtering applied.
  // TODO: once the exact string format is confirmed, re-enable both filters for live mode.
  if (priceRange || revenueRange) {
    console.warn(
      'Price/Revenue range filters were requested but are not sent to the live Kalodata API ' +
        '(unverified request shape — see comment above). Ignored for this request.'
    );
  }

  const key = cacheKey('product/rank', body);
  return withCache(key, CACHE_TTL_MS, () => postKalodata('/openapi/v1/tiktok/product/rank', body));
}

/**
 * POST /openapi/v1/tiktok/product/detail
 * Rate limit: 100 requests / 10 seconds.
 */
export async function getProductDetails({ productId, dateRange = 'last7Day' }) {
  if (!productId) throw new Error('productId is required');

  const body = {
    ...COMMON,
    date_range: dateRange,
    product_id: productId,
    need_image: 1,
    need_extra: false,
  };

  if (isMockMode()) return getMockProductDetails(body);

  const key = cacheKey('product/detail', body);
  return withCache(key, CACHE_TTL_MS, () => postKalodata('/openapi/v1/tiktok/product/detail', body));
}

/**
 * POST /openapi/v1/tiktok/video/rank filtered by product_id.
 * Rate limit: 10 requests / 10 seconds.
 * Confirmed live: page_size accepts up to 100 (same as product/rank), and Kalodata's
 * "Rank APIs" billing (0.1 credit per ceil(rows/100)) applies here too — so default to
 * the max per call, same reasoning as product/rank. The Video & Ad table paginates the
 * fetched batch client-side; a genuinely new page_number only fires when a product has
 * more videos than already fetched (see src/components/VideoAdTable.jsx).
 */
export async function getVideoRanking({
  productId,
  dateRange = 'last7Day',
  sortField = 'revenue',
  sortType = 'DESC',
  pageSize = 100,
  pageNumber = 1,
}) {
  if (!productId) throw new Error('productId is required');

  const body = {
    ...COMMON,
    date_range: dateRange,
    sort_field: { field: sortField, type: sortType },
    // Never exceed Kalodata's confirmed max page size for this endpoint.
    page_size: Math.min(pageSize, 100),
    page_number: pageNumber,
    product_id: productId,
  };

  if (isMockMode()) return getMockVideoRanking(body);

  const key = cacheKey('video/rank', body);
  return withCache(key, CACHE_TTL_MS, () => postKalodata('/openapi/v1/tiktok/video/rank', body));
}

/**
 * POST /openapi/v1/tiktok/video/detail
 * Rate limit: 100 requests / 10 seconds.
 */
export async function getVideoDetails({ videoId, dateRange = 'last7Day' }) {
  if (!videoId) throw new Error('videoId is required');

  const body = {
    ...COMMON,
    date_range: dateRange,
    video_id: videoId,
    need_extra: false,
  };

  if (isMockMode()) return getMockVideoDetails(body);

  const key = cacheKey('video/detail', body);
  return withCache(key, CACHE_TTL_MS, () => postKalodata('/openapi/v1/tiktok/video/detail', body));
}
