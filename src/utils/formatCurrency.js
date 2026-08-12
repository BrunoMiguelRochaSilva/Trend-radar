export function formatCurrency(value, { compact = false } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';

  if (compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}
