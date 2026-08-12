export function formatNumber(value, { compact = true } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';

  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US').format(num);
}
