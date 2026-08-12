// Normalizes a raw Kalodata product object (from /product/rank or
// /product/detail) into the camelCase shape our UI consumes. Handles both
// endpoints with one function since /product/detail is a superset of
// /product/rank fields — any field not present in the raw response is simply
// left undefined here, never fabricated.
//
// Raw → normalized field mapping (per the "sales_volumn" spelling warning etc.):
//   sales_volumn        -> sales
//   revenue_growth_rate  -> revenueGrowth
//   commission_rate      -> commissionRate
//   unit_price           -> unitPrice
//   master_image_url     -> image
//
// The original raw API object is preserved at `raw` for anything not covered here.

export function normalizeProduct(raw) {
  if (!raw) return null;

  return {
    id: raw.product_id,
    name: raw.product_name,
    image: raw.master_image_url || null,
    revenue: numberOrNull(raw.revenue),
    revenueGrowth: numberOrNull(raw.revenue_growth_rate),
    sales: numberOrNull(raw.sales_volumn),
    unitPrice: numberOrNull(raw.unit_price),
    videoRevenue: numberOrNull(raw.video_revenue),
    liveRevenue: numberOrNull(raw.live_revenue),
    showcaseRevenue: numberOrNull(raw.showcase_revenue),
    shoppingMallRevenue: numberOrNull(raw.shopping_mall_revenue),
    launchDate: raw.launch_date || null,
    sellerId: raw.seller_id ?? null,
    sellerName: raw.seller_name || null,
    skuCount: raw.sku_count != null ? Number(raw.sku_count) : null,

    // /product/detail-only fields
    region: raw.product_region ?? null,
    shopId: raw.product_shop_id ?? null,
    primaryCategoryId: raw.pri_cate_id ?? null,
    secondaryCategoryId: raw.sec_cate_id ?? null,
    tertiaryCategoryId: raw.ter_cate_id ?? null,
    minPrice: numberOrNull(raw.min_price),
    maxPrice: numberOrNull(raw.max_price),
    commissionRate: numberOrNull(raw.commission_rate),
    creatorNumber: numberOrNull(raw.creator_number),
    videoNumber: numberOrNull(raw.video_number),
    liveNumber: numberOrNull(raw.live_number),
    deliveryType: raw.delivery_type ?? null,
    reviews: numberOrNull(raw.product_review_count),
    revenueTrend: Array.isArray(raw.revenue_trend) ? raw.revenue_trend.map(Number) : null,

    raw,
  };
}

export function normalizeProducts(rawList) {
  return Array.isArray(rawList) ? rawList.map(normalizeProduct) : [];
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
