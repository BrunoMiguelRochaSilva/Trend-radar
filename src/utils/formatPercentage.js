export function formatPercentage(value, { showSign = true } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';

  const sign = showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}
