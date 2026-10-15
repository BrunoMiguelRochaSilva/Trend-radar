// Normalizes a raw Kalodata video object (from /video/rank or /video/detail)
// into the camelCase shape our UI consumes. One function covers both
// endpoints since /video/detail is a superset of /video/rank fields.
//
// Raw → normalized field mapping:
//   belonged_creator_handle -> creatorHandle
//   digg_count               -> likes
//   share_count               -> shares
//   comment_count             -> comments
//   revenue_growth_rate       -> revenueGrowth
//   ads_roas                  -> adsRoas

export function normalizeVideo(raw) {
  if (!raw) return null;

  return {
    id: raw.video_id,
    title: raw.video_title || 'Untitled video',
    // Public TikTok page — TikTok resolves it by video id; the handle just makes it canonical.
    tiktokUrl: raw.video_id
      ? `https://www.tiktok.com/@${raw.belonged_creator_handle || ''}/video/${raw.video_id}`
      : null,
    creatorId: raw.belonged_creator_id ?? null,
    creatorHandle: raw.belonged_creator_handle || null,
    creatorDebut: raw.creator_debut ?? null,
    revenue: numberOrNull(raw.revenue),
    views: numberOrNull(raw.views),
    revenueGrowth: numberOrNull(raw.revenue_growth_rate),
    likes: numberOrNull(raw.digg_count),
    shares: numberOrNull(raw.share_count),
    comments: numberOrNull(raw.comment_count),
    adsRoas: numberOrNull(raw.ads_roas),
    adRevenueRatio: numberOrNull(raw.ad_revenue_ratio),
    adViewRatio: numberOrNull(raw.ad_view_ratio),
    isAd: !!raw.ad,
    isAi: !!raw.ai_video,

    // /video/detail-only fields
    region: raw.video_region ?? null,
    productNumber: numberOrNull(raw.product_number),
    sales: numberOrNull(raw.sales_volumn),
    gpm: numberOrNull(raw.video_gpm),
    adsViews: numberOrNull(raw.ads_views),
    adsPeriod: raw.ads_period ?? null,
    adCpa: numberOrNull(raw.ad_cpa),
    duration: numberOrNull(raw.duration),
    revenueTrend: Array.isArray(raw.revenue_trend) ? raw.revenue_trend.map(Number) : null,

    // Confirmed empirically against the LIVE API (full raw response dumps of both
    // /video/rank and /video/detail, 2026-08-12): neither endpoint returns a thumbnail,
    // playable video URL, TikTok URL, or publish/create date field. These stay null —
    // never fabricated — but are wired here so a real field can be mapped in later
    // without touching any component that reads them (VideoCard, VideoAdTable, the
    // video preview modal all branch on these being present vs. null). `tiktokUrl`
    // (above) is built from video_id + handle rather than taken from the response.
    thumbnailUrl: null,
    videoUrl: null,
    publishDate: null,

    raw,
  };
}

export function normalizeVideos(rawList) {
  return Array.isArray(rawList) ? rawList.map(normalizeVideo) : [];
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
