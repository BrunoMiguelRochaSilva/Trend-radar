// Canonical, Kalodata-shaped request params for each endpoint. Used as the
// input to the persistent query cache's key (src/services/queryCache.js) —
// NOT as the literal HTTP call to our backend (see src/services/api.js for
// that). Keeping this separate from our UI filter-state naming means the
// cache key reflects exactly "what would be sent to Kalodata", per spec:
// IDENTICAL QUERY CONFIGURATION = IDENTICAL CACHE KEY.
//
// Only fields that are actually meaningful (non-empty) are included, so an
// untouched optional filter never produces a different key than explicitly
// leaving it blank.

const REGION = 'US';
const LANGUAGE = 'en-US';
const CURRENCY = 'USD';

function rangeOrUndefined(min, max) {
  const hasMin = min !== '' && min !== undefined && min !== null;
  const hasMax = max !== '' && max !== undefined && max !== null;
  if (!hasMin && !hasMax) return undefined;
  const range = {};
  if (hasMin) range.min = Number(min);
  if (hasMax) range.max = Number(max);
  return range;
}

/**
 * POST /openapi/v1/tiktok/product/rank — see server/services/kalodataService.js
 * for the actual request builder (source of truth for what's really sent).
 * revenue_range / unit_price_range are kept here even though the backend
 * currently omits them from live calls (unconfirmed string format) — the
 * cache key should reflect the full query configuration regardless.
 */
export function buildProductRankParams(filters, pageNumber = 1) {
  const params = {
    region: REGION,
    language: LANGUAGE,
    currency: CURRENCY,
    date_range: filters.dateRange,
    sort_field: filters.sort,
    sort_direction: filters.sortDir,
    page_size: 100,
    page_number: pageNumber,
  };
  if (filters.category) params.category_ids = [filters.category];
  if (filters.launch) params.launch_date = filters.launch;
  if (filters.keyword) params.keyword = filters.keyword;

  const revenueRange = rangeOrUndefined(filters.revenueMin, filters.revenueMax);
  if (revenueRange) params.revenue_range = revenueRange;

  const priceRange = rangeOrUndefined(filters.priceMin, filters.priceMax);
  if (priceRange) params.unit_price_range = priceRange;

  return params;
}

/** POST /openapi/v1/tiktok/product/detail */
export function buildProductDetailParams(productId, dateRange = 'last7Day') {
  return {
    region: REGION,
    language: LANGUAGE,
    currency: CURRENCY,
    date_range: dateRange,
    product_id: productId,
  };
}

/**
 * POST /openapi/v1/tiktok/video/rank, filtered by product_id. `pageNumber`
 * is part of the cache key (spec §9/13) — a different page is a genuinely
 * different query, never served from another page's cache entry.
 */
export function buildVideoRankParams(productId, dateRange = 'last7Day', pageNumber = 1) {
  return {
    region: REGION,
    language: LANGUAGE,
    currency: CURRENCY,
    date_range: dateRange,
    sort_field: 'revenue',
    sort_direction: 'DESC',
    page_size: 100,
    page_number: pageNumber,
    product_id: productId,
  };
}

/**
 * POST /openapi/v1/tiktok/video/rank across all products — the Videos page.
 * Mirrors server/routes/videos.js (GET /api/videos).
 */
export function buildVideoListParams(filters, pageNumber = 1) {
  const params = {
    region: REGION,
    language: LANGUAGE,
    currency: CURRENCY,
    date_range: filters.dateRange,
    sort_field: filters.sort,
    sort_direction: 'DESC',
    page_size: 100,
    page_number: pageNumber,
  };
  if (filters.category) params.category_ids = [filters.category];
  if (filters.keyword) params.keyword = filters.keyword;
  return params;
}

/** POST /openapi/v1/tiktok/video/detail */
export function buildVideoDetailParams(videoId, dateRange = 'last7Day') {
  return {
    region: REGION,
    language: LANGUAGE,
    currency: CURRENCY,
    date_range: dateRange,
    video_id: videoId,
  };
}
