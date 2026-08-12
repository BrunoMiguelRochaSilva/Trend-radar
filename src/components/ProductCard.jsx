import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { formatPercentage } from '../utils/formatPercentage.js';
import { ProductThumbnail } from './ProductRow.jsx';

// Mobile/small-screen equivalent of a ProductRow — same data, card layout.
export default function ProductCard({ product, rank }) {
  const navigate = useNavigate();
  const isUp = (product.revenueGrowth ?? 0) >= 0;

  return (
    <button
      onClick={() => navigate(`/products/${encodeURIComponent(product.id)}`)}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 text-left transition-colors hover:bg-slate-50"
    >
      <span className="w-6 shrink-0 text-xs font-semibold text-slate-400">#{rank}</span>
      <ProductThumbnail image={product.image} name={product.name} size="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {product.sellerName ?? 'Unknown seller'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-semibold text-slate-900">{formatCurrency(product.revenue)}</span>
          <span
            className={`inline-flex items-center gap-0.5 ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercentage(product.revenueGrowth)}
          </span>
          <span className="text-slate-500">{formatNumber(product.sales)} sales</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
}
