// Talks only to OUR backend (/api/*). Never touches Kalodata directly and
// never sees the Kalodata API key — see server/services/kalodataClient.js.

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { params } = {}) {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  let response;
  try {
    response = await fetch(url.pathname + url.search, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON body (unlikely) — fall through with body = null
  }

  if (!response.ok) {
    throw new ApiError(body?.error || 'Unable to load product data.', response.status);
  }

  return body;
}

/**
 * @param {object} filters
 * @param {string} [filters.dateRange] - 'lastDay' | 'last7Day' | 'last30Day'
 * @param {string} [filters.sort] - e.g. 'revenue', 'sales_volumn'
 * @param {string} [filters.sortDir] - 'ASC' | 'DESC'
 * @param {string} [filters.keyword]
 * @param {number} [filters.priceMin]
 * @param {number} [filters.priceMax]
 * @param {number} [filters.revenueMin]
 * @param {number} [filters.revenueMax]
 * @param {boolean} [filters.refresh] - bypass server cache
 */
export function fetchProducts(filters = {}) {
  return request('/api/products', { params: filters });
}

export function fetchProductDetails(productId, { dateRange, refresh } = {}) {
  return request(`/api/products/${encodeURIComponent(productId)}`, {
    params: { dateRange, refresh: refresh || undefined },
  });
}

export function fetchProductVideos(productId, { dateRange, pageSize, pageNumber, refresh } = {}) {
  return request(`/api/products/${encodeURIComponent(productId)}/videos`, {
    params: { dateRange, pageSize, pageNumber, refresh: refresh || undefined },
  });
}

export function fetchVideoDetails(videoId, { dateRange, refresh } = {}) {
  return request(`/api/videos/${encodeURIComponent(videoId)}`, {
    params: { dateRange, refresh: refresh || undefined },
  });
}

export { ApiError };
