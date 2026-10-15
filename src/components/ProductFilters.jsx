import { Search, RotateCcw, Check } from 'lucide-react';
import { DATE_RANGE_OPTIONS, CATEGORY_OPTIONS } from '../constants/filterOptions.js';

const SORT_OPTIONS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'revenue_growth_rate', label: 'Revenue Growth' },
  { value: 'sales_volumn', label: 'Sales' },
  { value: 'unit_price', label: 'Unit Price' },
  { value: 'live_revenue', label: 'Live Revenue' },
  { value: 'video_revenue', label: 'Video Revenue' },
];

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';
const inputClass =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

/**
 * A DRAFT-editing panel — spec: "Changing a filter only changes the draft
 * state." Nothing here calls the API. `draftFilters` only becomes a live
 * query once the user clicks Submit (see src/pages/Products.jsx), which is
 * also the only thing that can produce a cache hit/miss.
 */
export default function ProductFilters({ draftFilters, onDraftChange, onSubmit, onReset, hasPendingChanges }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <FieldLabel>Country</FieldLabel>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <span>🇺🇸</span> United States
          </div>
        </div>

        <div>
          <FieldLabel>Category</FieldLabel>
          <select
            aria-label="Category"
            value={draftFilters.category}
            onChange={(e) => onDraftChange({ category: e.target.value })}
            className={selectClass}
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Date Range</FieldLabel>
          <select
            aria-label="Date Range"
            value={draftFilters.dateRange}
            onChange={(e) => onDraftChange({ dateRange: e.target.value })}
            className={selectClass}
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Sort By</FieldLabel>
          <select
            aria-label="Sort By"
            value={draftFilters.sort}
            onChange={(e) => onDraftChange({ sort: e.target.value })}
            className={selectClass}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel>Keyword</FieldLabel>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={draftFilters.keyword}
              onChange={(e) => onDraftChange({ keyword: e.target.value })}
              placeholder="Search products…"
              className={`w-44 py-2 pl-8 pr-3 ${inputClass}`}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Revenue</FieldLabel>
          <div className="flex items-center gap-1.5">
            <input
              value={draftFilters.revenueMin}
              onChange={(e) => onDraftChange({ revenueMin: e.target.value })}
              type="number"
              min="0"
              placeholder="Min $"
              className={`w-24 ${inputClass}`}
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              value={draftFilters.revenueMax}
              onChange={(e) => onDraftChange({ revenueMax: e.target.value })}
              type="number"
              min="0"
              placeholder="Max $"
              className={`w-24 ${inputClass}`}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Average Unit Price</FieldLabel>
          <div className="flex items-center gap-1.5">
            <input
              value={draftFilters.priceMin}
              onChange={(e) => onDraftChange({ priceMin: e.target.value })}
              type="number"
              min="0"
              placeholder="Min $"
              className={`w-20 ${inputClass}`}
            />
            <span className="text-xs text-slate-400">–</span>
            <input
              value={draftFilters.priceMax}
              onChange={(e) => onDraftChange({ priceMax: e.target.value })}
              type="number"
              min="0"
              placeholder="Max $"
              className={`w-20 ${inputClass}`}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 pb-0.5">
          <button
            aria-label="Reset filters"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            aria-label="Submit filters"
            onClick={onSubmit}
            className={[
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors',
              hasPendingChanges
                ? 'bg-brand-600 text-white hover:bg-brand-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
            ].join(' ')}
          >
            <Check className="h-3.5 w-3.5" />
            Submit
          </button>
        </div>
      </div>

      {hasPendingChanges && (
        <p className="mt-2 text-xs font-medium text-brand-600">
          You have unapplied filter changes — click Submit to update the results.
        </p>
      )}

      <p className="mt-2 text-[11px] text-slate-400">
        Revenue and Average Unit Price currently narrow preview (mock) results only — the live
        Kalodata API's exact filter format for these two is unconfirmed, so they're not yet sent
        to it (see README).
      </p>
    </div>
  );
}

function FieldLabel({ children }) {
  return <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{children}</p>;
}
