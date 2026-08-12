// Mock TikTok Shop product data for local development (USE_MOCK_DATA=true).
//
// Shape mirrors the REAL Kalodata /openapi/v1/tiktok/product/rank and
// /openapi/v1/tiktok/product/detail responses field-for-field (see the raw
// field names below) so that server/services/mockData.js and the frontend
// normalizers (src/utils/normalizeProduct.js) exercise the exact same code
// path as real API data. These are illustrative development fixtures only —
// never presented anywhere as real production numbers.

import { placeholderImage } from './placeholder.js';

const SELLERS = [
  'Glow & Co Store',
  'UrbanNest Home',
  'PawPrime Supply',
  'FitCore Direct',
  'AquaLux Living',
  'TechNova Outlet',
  'GlamGlow Beauty',
  'KitchenEdge Co',
  'PureVital Wellness',
  'DailyDrip Gadgets',
];

const PRODUCT_NAMES = [
  'Wireless Bluetooth Earbuds Pro',
  'RGB LED Strip Lights 32ft',
  'Posture Corrector Back Brace',
  'Portable USB Blender Bottle',
  'Mini Skincare Fridge',
  'Resistance Bands Set (5pc)',
  'Mini Waffle Maker',
  'Handheld Cordless Car Vacuum',
  'Magnetic Car Phone Mount',
  'Sonic Electric Toothbrush',
  'Hair Straightener Brush',
  'Silicone Pet Grooming Glove',
  'Insulated Stainless Tumbler 32oz',
  'Electric Knife Sharpener',
  'Facial Ice Roller Set',
  'Collagen Under-Eye Patches',
  'Marine Collagen Powder',
  'Jade Facial Roller & Gua Sha',
  'Foldable Wireless Charger Stand',
  'Mini Bluetooth Speaker',
  'Smart Reminder Water Bottle',
  'Shiatsu Neck & Shoulder Massager',
  'LED Makeup Mirror with Lights',
  'Reusable Silicone Baking Mats',
  'Expandable Garden Hose 50ft',
  'Adjustable Foldable Laptop Stand',
  'Mini Portable Projector',
  'Reusable Air Fryer Liners (Set)',
  'Graduated Compression Socks',
  'Calming Anxiety Vest for Dogs',
];

const LAUNCH_DAYS_AGO = [
  12, 18, 25, 31, 40, 47, 55, 63, 70, 78, 85, 92, 100, 108, 115, 123, 130, 138, 145, 153, 160,
  168, 175, 183, 12, 45, 88, 130, 20, 60,
];

// Small deterministic PRNG (mulberry32) so mock numbers are stable across
// requests/refreshes instead of jumping around on every fetch.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildProduct(index) {
  const rand = mulberry32(1000 + index);
  const name = PRODUCT_NAMES[index];

  // Revenue roughly descending across the 30 slots (like a real revenue-sorted rank), with jitter.
  const base = 92000 * Math.pow(0.905, index);
  const revenue = Math.round((base * (0.85 + rand() * 0.3)) * 100) / 100;

  const unitPrice = Math.round((8 + rand() * 52) * 100) / 100;
  const salesVolumn = Math.max(20, Math.round(revenue / unitPrice));

  const videoShare = 0.35 + rand() * 0.25;
  const liveShare = 0.2 + rand() * 0.25;
  const videoRevenue = Math.round(revenue * videoShare * 100) / 100;
  const liveRevenue = Math.round(revenue * liveShare * 100) / 100;
  const showcaseRevenue = Math.round((revenue - videoRevenue - liveRevenue) * 100) / 100;

  const revenueGrowthRate = Math.round((rand() * 70 - 15) * 10) / 10;
  const commissionRate = Math.round((8 + rand() * 17) * 10) / 10;
  const sellerIndex = index % SELLERS.length;

  const creatorNumber = 8 + Math.floor(rand() * 120);
  const videoNumber = 15 + Math.floor(rand() * 250);
  const liveNumber = Math.floor(rand() * 40);

  const trendDays = 7;
  const revenueTrend = Array.from({ length: trendDays }, (_, i) => {
    const dayFactor = 0.6 + (i / (trendDays - 1)) * 0.5 + (rand() - 0.5) * 0.2;
    return Math.round((revenue / trendDays) * dayFactor * 100) / 100;
  });

  return {
    // --- fields shared with /product/rank ---
    product_id: `76278${(1000000 + index).toString()}`,
    product_name: name,
    revenue,
    commission_rate: commissionRate,
    revenue_growth_rate: revenueGrowthRate,
    sales_volumn: salesVolumn,
    unit_price: unitPrice,
    live_revenue: liveRevenue,
    video_revenue: videoRevenue,
    showcase_revenue: showcaseRevenue,
    launch_date: isoDaysAgo(LAUNCH_DAYS_AGO[index]),
    master_image_url: placeholderImage(index, name),
    seller_id: `seller_${sellerIndex + 1}`,
    seller_name: SELLERS[sellerIndex],
    sku_count: String(1 + Math.floor(rand() * 5)),

    // --- extra fields only returned by /product/detail ---
    product_region: 'US',
    product_shop_id: `shop_${sellerIndex + 1}`,
    max_price: Math.round(unitPrice * 1.15 * 100) / 100,
    min_price: Math.round(unitPrice * 0.85 * 100) / 100,
    creator_number: creatorNumber,
    video_number: videoNumber,
    live_number: liveNumber,
    delivery_type: rand() > 0.5 ? 'Local Warehouse' : 'Cross-Border',
    shopping_mall_revenue: Math.max(
      0,
      Math.round((revenue - videoRevenue - liveRevenue - showcaseRevenue) * 100) / 100
    ),
    product_review_count: Math.floor(salesVolumn * (0.3 + rand() * 0.5)),
    revenue_trend: revenueTrend,
  };
}

export const mockProducts = PRODUCT_NAMES.map((_, index) => buildProduct(index));

export function findMockProduct(productId) {
  return mockProducts.find((p) => p.product_id === productId);
}
