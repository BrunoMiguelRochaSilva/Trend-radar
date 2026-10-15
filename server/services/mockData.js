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

// Mock-only category assignment for the 30 fixture products (keyed by name, ids from
// src/constants/filterOptions.js CATEGORY_OPTIONS). Kept here rather than on the fixtures
// themselves, since those mirror the real rank response field-for-field.
const MOCK_PRODUCT_CATEGORY = {
  'Wireless Bluetooth Earbuds Pro': '601739',
  'RGB LED Strip Lights 32ft': '604968',
  'Posture Corrector Back Brace': '700645',
  'Portable USB Blender Bottle': '600024',
  'Mini Skincare Fridge': '600942',
  'Resistance Bands Set (5pc)': '603014',
  'Mini Waffle Maker': '600942',
  'Handheld Cordless Car Vacuum': '605196',
  'Magnetic Car Phone Mount': '605196',
  'Sonic Electric Toothbrush': '601450',
  'Hair Straightener Brush': '601450',
  'Silicone Pet Grooming Glove': '602118',
  'Insulated Stainless Tumbler 32oz': '600024',
  'Electric Knife Sharpener': '600024',
  'Facial Ice Roller Set': '601450',
  'Collagen Under-Eye Patches': '601450',
  'Marine Collagen Powder': '700645',
  'Jade Facial Roller & Gua Sha': '601450',
  'Foldable Wireless Charger Stand': '601739',
  'Mini Bluetooth Speaker': '601739',
  'Smart Reminder Water Bottle': '603014',
  'Shiatsu Neck & Shoulder Massager': '700645',
  'LED Makeup Mirror with Lights': '601450',
  'Reusable Silicone Baking Mats': '600024',
  'Expandable Garden Hose 50ft': '604968',
  'Adjustable Foldable Laptop Stand': '601755',
  'Mini Portable Projector': '601739',
  'Reusable Air Fryer Liners (Set)': '600024',
  'Graduated Compression Socks': '700645',
  'Calming Anxiety Vest for Dogs': '602118',
};

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

  if (body.category_ids?.length) {
    items = items.filter((p) => body.category_ids.includes(MOCK_PRODUCT_CATEGORY[p.product_name]));
  }
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

// Mock mode spends no credits, so there is no balance to report — the `mock` flag lets
// the UI say so instead of showing a made-up number.
export async function getMockCreditBalance() {
  return { success: true, mock: true, data: null };
}
