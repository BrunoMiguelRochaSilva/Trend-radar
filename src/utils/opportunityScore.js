// Placeholder architecture for a future "TrendRadar Score" feature (spec §30).
// This is NOT a Kalodata metric — it's a simple heuristic we compute
// ourselves from already-loaded fields, and it must always be labeled
// "TrendRadar Score" wherever shown so it's never confused with a Kalodata
// figure. Intentionally simple for V1; not a headline feature.

/**
 * Computes a 0–100 heuristic score from a normalized product.
 * Weighs revenue growth, sales velocity, and commission rate.
 */
export function calculateOpportunityScore(product) {
  if (!product) return null;

  const growth = clamp(product.revenueGrowth ?? 0, -50, 100);
  const growthScore = ((growth + 50) / 150) * 100; // -50%..100% -> 0..100

  const sales = product.sales ?? 0;
  const salesScore = clamp((Math.log10(sales + 1) / Math.log10(2000)) * 100, 0, 100);

  const commission = product.commissionRate ?? 0;
  const commissionScore = clamp((commission / 30) * 100, 0, 100);

  const score = growthScore * 0.5 + salesScore * 0.3 + commissionScore * 0.2;
  return Math.round(clamp(score, 0, 100));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
