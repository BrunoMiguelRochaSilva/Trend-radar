import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Users, Clapperboard, Radio, Sparkles } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { formatPercentage } from '../utils/formatPercentage.js';
import { calculateOpportunityScore } from '../utils/opportunityScore.js';
import { ProductThumbnail } from './ProductRow.jsx';

function SectionCard({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1.5 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function ProductDetails({ product }) {
  const score = calculateOpportunityScore(product);
  const trendData =
    product.revenueTrend?.map((value, i) => ({ label: `Day ${i + 1}`, value })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:flex-row sm:items-start">
        <ProductThumbnail image={product.image} name={product.name} size="h-28 w-28" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{product.name}</h1>
            {score !== null && (
              <span
                title="A TrendRadar-computed heuristic — not a Kalodata metric"
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
              >
                <Sparkles className="h-3 w-3" /> TrendRadar Score {score}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{product.sellerName ?? 'Unknown seller'}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span className="text-slate-500">
              Price{' '}
              <span className="font-semibold text-slate-900">
                {formatCurrency(product.unitPrice)}
              </span>
            </span>
            {product.launchDate && (
              <span className="text-slate-500">
                Launched <span className="font-medium text-slate-700">{product.launchDate}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Performance */}
      <SectionCard title="Performance">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat icon={DollarSign} label="Revenue" value={formatCurrency(product.revenue, { compact: true })} />
          <Stat icon={ShoppingBag} label="Sales" value={formatNumber(product.sales)} />
          <Stat
            icon={TrendingUp}
            label="Growth"
            value={product.revenueGrowth !== null ? formatPercentage(product.revenueGrowth) : '—'}
          />
          <Stat icon={Users} label="Creators" value={formatNumber(product.creatorNumber)} />
          <Stat icon={Clapperboard} label="Videos" value={formatNumber(product.videoNumber)} />
          <Stat icon={Radio} label="Livestreams" value={formatNumber(product.liveNumber)} />
        </div>
      </SectionCard>

      {/* Revenue Breakdown */}
      <SectionCard title="Revenue Breakdown">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Clapperboard} label="Video Revenue" value={formatCurrency(product.videoRevenue)} />
          <Stat icon={Radio} label="Live Revenue" value={formatCurrency(product.liveRevenue)} />
          <Stat icon={ShoppingBag} label="Showcase Revenue" value={formatCurrency(product.showcaseRevenue)} />
          <Stat
            icon={DollarSign}
            label="Shopping Mall Revenue"
            value={formatCurrency(product.shoppingMallRevenue)}
          />
        </div>
      </SectionCard>

      {/* Product Information */}
      <SectionCard title="Product Information">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Commission Rate
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {product.commissionRate !== null ? `${product.commissionRate}%` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Reviews</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {formatNumber(product.reviews)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Launch Date
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {product.launchDate ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Delivery Type
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {product.deliveryType ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              SKU Count
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {product.skuCount ?? '—'}
            </dd>
          </div>
        </dl>
      </SectionCard>

      {/* Revenue Trend */}
      {trendData.length > 0 && (
        <SectionCard title="Revenue Trend">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} width={56} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6d5ef8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6d5ef8' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Relative days within the selected date range — Kalodata returns trend values without
            calendar dates.
          </p>
        </SectionCard>
      )}
    </div>
  );
}
