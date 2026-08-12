import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ImageOff } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { formatPercentage } from '../utils/formatPercentage.js';

function GrowthBadge({ value }) {
  if (value === null) return <span className="text-slate-400">—</span>;
  const isUp = value >= 0;
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
      ].join(' ')}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPercentage(value)}
    </span>
  );
}

export function ProductThumbnail({ image, name, size = 'h-11 w-11' }) {
  if (!image) {
    return (
      <div
        className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300`}
      >
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      src={image}
      alt={name}
      loading="lazy"
      className={`${size} shrink-0 rounded-lg border border-slate-100 object-cover`}
    />
  );
}

export default function ProductRow({ product, rank }) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/products/${encodeURIComponent(product.id)}`)}
      className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
    >
      <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-400">
        #{rank}
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-3">
          <ProductThumbnail image={product.image} name={product.name} />
          <span className="max-w-[220px] truncate text-sm font-medium text-slate-900">
            {product.name}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm font-semibold text-slate-900">
        {formatCurrency(product.revenue)}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm">
        <GrowthBadge value={product.revenueGrowth} />
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">
        {formatNumber(product.sales)}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">
        {formatCurrency(product.unitPrice)}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">
        {formatCurrency(product.videoRevenue)}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">
        {formatCurrency(product.liveRevenue)}
      </td>
      <td className="max-w-[160px] truncate px-3 py-3.5 text-sm text-slate-500">
        {product.sellerName ?? '—'}
      </td>
    </tr>
  );
}
