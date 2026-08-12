// Mock-mode implementations of the four Kalodata calls. These simulate the
// request behavior (filter / sort / paginate) against the fixtures in
// src/mocks/products.js and src/mocks/videos.js, and return the exact same
// { success, data } envelope shape the real API uses, so kalodataService.js
// callers and the frontend normalizers never need to know which mode is active.
//
// NOTE: the shape of the `unit_price_range` / `revenue_range` request filters
// below ({ min, max }) is a reasonable-but-UNVERIFIED guess for the real API
// request body (the Open Center docs describing these optional filters were
// not reachable while building this — see server/services/kalodataClient.js).
// It only affects mock filtering here; confirm the real shape from the docs
// before relying on these filters in real mode.

import { mockProducts, findMockProduct } from '../../src/mocks/products.js';
import { mockVideos, findMockVideosByProduct, findMockVideo } from '../../src/mocks/videos.js';
import { KalodataApiError } from './kalodataClient.js';

function applyRange(value, range) {
  if (!range) return true;
  const { min, max } = range;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

function sortAndPaginate(items, { sort_field, page_size, page_number }) {
  const field = sort_field?.field || 'revenue';
  const dir = sort_field?.type === 'ASC' ? 1 : -1;

  const sorted = [...items].sort((a, b) => {
    const av = Number(a[field]) || 0;
    const bv = Number(b[field]) || 0;
    return (av - bv) * dir;
  });

  const size = page_size || 100;
  const start = ((page_number || 1) - 1) * size;
  return sorted.slice(start, start + size);
}

export async function getMockProductRanking(body) {
  let items = mockProducts;

  if (body.keyword) {
    const q = body.keyword.toLowerCase();
    items = items.filter((p) => p.product_name.toLowerCase().includes(q));
  }
  if (body.unit_price_range) {
    items = items.filter((p) => applyRange(p.unit_price, body.unit_price_range));
  }
  if (body.revenue_range) {
    items = items.filter((p) => applyRange(p.revenue, body.revenue_range));
  }

  const data = sortAndPaginate(items, body);
  return { success: true, data };
}

export async function getMockProductDetails(body) {
  const product = findMockProduct(body.product_id);
  if (!product) {
    throw new KalodataApiError('Product not found.', { code: 'NOT_FOUND', status: 404 });
  }
  return { success: true, data: product };
}

export async function getMockVideoRanking(body) {
  const items = findMockVideosByProduct(body.product_id);
  const data = sortAndPaginate(items, { ...body, page_size: body.page_size || 10 });
  return { success: true, data };
}

export async function getMockVideoDetails(body) {
  const video = findMockVideo(body.video_id);
  if (!video) {
    throw new KalodataApiError('Video not found.', { code: 'NOT_FOUND', status: 404 });
  }
  return { success: true, data: video };
}
