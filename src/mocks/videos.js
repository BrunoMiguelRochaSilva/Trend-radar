// Mock TikTok video data for local development (USE_MOCK_DATA=true).
//
// Shape mirrors the REAL Kalodata /openapi/v1/tiktok/video/rank and
// /openapi/v1/tiktok/video/detail responses field-for-field. 10 videos are
// generated per mock product so the "Popular Videos" experience can be
// exercised on any product, not just one. Development fixtures only.

import { mockProducts } from './products.js';

const CREATOR_HANDLES = [
  'techreviewer',
  'sara.finds',
  'dealhunterdan',
  'thatgirlaesthetic',
  'homehacksdaily',
  'glowwithjules',
  'fitwithmarcus',
  'thriftyandtidy',
  'kitchenkyle',
  'petparentpro',
  'mustknowmia',
  'gadgetgeekgabe',
  'beautybyriley',
  'dadtestedgear',
  'shopwithsofia',
];

const HOOKS = [
  'POV: you finally found the one',
  "I didn't expect this to actually work",
  'Sweet girl essential!',
  'This sold out 3 times for a reason',
  'Okay this is actually genius',
  "Why didn't I buy this sooner",
  'The TikTok made me do it',
  'Testing the viral one so you don’t have to',
  'This fixed my biggest daily annoyance',
  'Rating my $30 TikTok Shop find',
];

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

function buildVideo(product, productIndex, videoIndex) {
  const seed = 5000 + productIndex * 37 + videoIndex;
  const rand = mulberry32(seed);

  const creatorIdx = Math.floor(rand() * CREATOR_HANDLES.length);
  const hook = HOOKS[Math.floor(rand() * HOOKS.length)];

  // Videos within a product are revenue-ranked: highest first, decaying.
  const shareOfProductRevenue = product.video_revenue / 10;
  const revenue =
    Math.round(shareOfProductRevenue * (1.6 - videoIndex * 0.12) * (0.8 + rand() * 0.4) * 100) /
    100;
  const views = Math.max(1200, Math.round((revenue / (0.02 + rand() * 0.06)) * 10) / 10);
  const diggCount = Math.round(views * (0.03 + rand() * 0.05));
  const commentCount = Math.round(diggCount * (0.03 + rand() * 0.05));
  const shareCount = Math.round(diggCount * (0.05 + rand() * 0.08));

  const adRevenueRatio = Math.round((rand() * 0.6) * 100) / 100;
  const adViewRatio = Math.round((rand() * 0.4) * 100) / 100;
  const isAd = adRevenueRatio > 0.3 ? 1 : 0;

  const trendDays = 7;
  const revenueTrend = Array.from({ length: trendDays }, (_, i) => {
    const dayFactor = 0.5 + (i / (trendDays - 1)) * 0.6 + (rand() - 0.5) * 0.25;
    return Math.max(0, Math.round((revenue / trendDays) * dayFactor * 100) / 100);
  });

  return {
    // --- fields shared with /video/rank ---
    video_id: `76278${(2000000 + productIndex * 100 + videoIndex).toString()}`,
    video_title: `${hook} — ${product.product_name}`,
    belonged_creator_id: `74340${(60000 + creatorIdx * 13).toString()}`,
    belonged_creator_handle: CREATOR_HANDLES[creatorIdx],
    revenue,
    views,
    revenue_growth_rate: Math.round((rand() * 60 - 10) * 10) / 10,
    ads_roas: Math.round((1.5 + rand() * 4) * 10) / 10,
    digg_count: diggCount,
    share_count: shareCount,
    comment_count: commentCount,
    ad_revenue_ratio: adRevenueRatio,
    ad_view_ratio: adViewRatio,
    creator_debut: isoDaysAgo(200 + Math.floor(rand() * 500)),
    ad: isAd,
    ai_video: rand() > 0.85 ? 1 : 0,

    // --- extra fields only returned by /video/detail ---
    video_region: 'US',
    product_number: 1 + Math.floor(rand() * 4),
    sales_volumn: Math.max(5, Math.round(revenue / product.unit_price)),
    video_gpm: Math.round((revenue / Math.max(views, 1)) * 1000 * 100) / 100,
    ads_views: Math.round(views * adViewRatio),
    ads_period: 'last7Day',
    ad_cpa: isAd ? Math.round((revenue / Math.max(1, Math.round(views * 0.01))) * 100) / 100 : 0,
    revenue_trend: revenueTrend,
    duration: 12 + Math.floor(rand() * 48),

    // internal indexing only — not a documented API field, used to filter mock data by product
    product_id: product.product_id,
  };
}

export const mockVideos = mockProducts.flatMap((product, productIndex) =>
  Array.from({ length: 10 }, (_, videoIndex) => buildVideo(product, productIndex, videoIndex))
);

export function findMockVideosByProduct(productId) {
  return mockVideos
    .filter((v) => v.product_id === productId)
    .sort((a, b) => b.revenue - a.revenue);
}

export function findMockVideo(videoId) {
  return mockVideos.find((v) => v.video_id === videoId);
}
