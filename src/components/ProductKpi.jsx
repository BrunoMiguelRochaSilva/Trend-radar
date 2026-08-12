import { Package, DollarSign, TrendingUp, Crown } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatPercentage } from '../utils/formatPercentage.js';
import { KpiSkeleton } from './LoadingSkeleton.jsx';

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-popover">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
        {label}
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/**
 * All values are computed client-side from the products actually displayed —
 * nothing here is hardcoded. `totalFetched` (up to 100, one Kalodata rank
 * call) may be larger than `products` (the current Top N shown in the table)
 * — see src/pages/Products.jsx.
 */
export default function ProductKpi({ products, totalFetched, isLoading }) {
  if (isLoading) return <KpiSkeleton count={4} />;

  const list = products ?? [];
  const totalRevenue = list.reduce((sum, p) => sum + (p.revenue ?? 0), 0);
  const growthValues = list.filter((p) => p.revenueGrowth !== null).map((p) => p.revenueGrowth);
  const avgGrowth =
    growthValues.length > 0
      ? growthValues.reduce((sum, g) => sum + g, 0) / growthValues.length
      : null;
  const topProduct = list.reduce(
    (top, p) => (top === null || (p.revenue ?? 0) > (top.revenue ?? 0) ? p : top),
    null
  );

  const topProductsSub =
    totalFetched && totalFetched > list.length
      ? `Showing ${list.length} of ${totalFetched} fetched`
      : `${list.length} fetched this request`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={Package} label="Top Products" value={list.length} sub={topProductsSub} />
      <KpiCard
        icon={DollarSign}
        label="Total Revenue"
        value={formatCurrency(totalRevenue, { compact: true })}
        sub="Sum across loaded products"
      />
      <KpiCard
        icon={TrendingUp}
        label="Average Growth"
        value={avgGrowth === null ? '—' : formatPercentage(avgGrowth)}
        sub="Revenue growth rate"
      />
      <KpiCard
        icon={Crown}
        label="Top Product"
        value={topProduct ? formatCurrency(topProduct.revenue, { compact: true }) : '—'}
        sub={topProduct?.name ?? 'No data'}
      />
    </div>
  );
}
