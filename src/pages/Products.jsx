import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import Header from '../components/Header.jsx';
import ProductFilters from '../components/ProductFilters.jsx';
import ProductKpi from '../components/ProductKpi.jsx';
import ProductTable from '../components/ProductTable.jsx';
import CacheStatus from '../components/CacheStatus.jsx';
import { ProductTableSkeleton } from '../components/LoadingSkeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { PAGE_SIZE, MAX_API_PAGES, PagerBar, useCachedPages } from '../components/Pager.jsx';
import { fetchProducts } from '../services/api.js';
import { normalizeProducts } from '../utils/normalizeProduct.js';
import { useCachedQuery } from '../hooks/useCachedQuery.js';
import { buildProductRankParams } from '../utils/queryParams.js';

const DEFAULT_FILTERS = {
  dateRange: 'last7Day',
  sort: 'revenue',
  sortDir: 'DESC',
  category: '',
  launch: '',
  keyword: '',
  priceMin: '',
  priceMax: '',
  revenueMin: '',
  revenueMax: '',
};

const DISPLAY_COUNT_OPTIONS = [30, 50, 100];

/** Reads applied filters from the URL, falling back to defaults — makes a submitted query shareable/bookmarkable. */
function filtersFromSearchParams(searchParams) {
  const filters = { ...DEFAULT_FILTERS };
  for (const key of Object.keys(DEFAULT_FILTERS)) {
    if (searchParams.has(key)) filters[key] = searchParams.get(key);
  }
  return filters;
}

function filtersToSearchParams(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    const isDefault = value === DEFAULT_FILTERS[key];
    if (value !== '' && value !== undefined && value !== null && !isDefault) {
      params.set(key, value);
    }
  }
  return params;
}

export default function Products({ onMenuClick }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // A submitted query is immediately "applied" — sharing/bookmarking the URL
  // reproduces the same query. Draft starts equal to applied.
  const [appliedFilters, setAppliedFilters] = useState(() => filtersFromSearchParams(searchParams));
  const [draftFilters, setDraftFilters] = useState(() => filtersFromSearchParams(searchParams));
  // Purely client-side — re-slices the already-fetched (up to 100) rows,
  // never triggers a new Kalodata request.
  const [displayCount, setDisplayCount] = useState(30);
  // Page of the Kalodata ranking (100 products each, up to 5) — one call per page. Kept in
  // the URL so coming back from a product page lands on the same page.
  const page = Math.min(Math.max(1, Number(searchParams.get('page')) || 1), MAX_API_PAGES);

  const hasPendingChanges = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const {
    response,
    isLoading,
    isFetching,
    isError,
    error,
    refresh,
    updatedAt,
    fromCache,
  } = useCachedQuery({
    endpoint: 'product/rank',
    params: buildProductRankParams(appliedFilters, page),
    fetcher: (forceRefresh) =>
      fetchProducts({ ...appliedFilters, pageNumber: page, refresh: forceRefresh || undefined }),
  });

  const cachedPages = useCachedPages(
    'product/rank',
    (p) => buildProductRankParams(appliedFilters, p),
    `${JSON.stringify(appliedFilters)}|${updatedAt?.getTime()}`
  );

  const allProducts = normalizeProducts(response?.data);
  const products = allProducts.slice(0, displayCount);
  const rowStart = (page - 1) * PAGE_SIZE;
  // A page shorter than 100 is the real end of the ranking — remembered per filter set, so
  // pages past it stay hidden (no paying for empty pages) after moving back to earlier ones.
  const endPageRef = useRef({});
  const filtersKey = JSON.stringify(appliedFilters);
  if (!isLoading && !isError && response && allProducts.length < PAGE_SIZE) {
    endPageRef.current[filtersKey] = Math.min(endPageRef.current[filtersKey] ?? MAX_API_PAGES, page);
  }
  const lastPage = Math.max(page, endPageRef.current[filtersKey] ?? MAX_API_PAGES);

  function goToPage(next) {
    const params = new URLSearchParams(searchParams);
    const target = Math.min(Math.max(1, next), lastPage);
    if (target > 1) params.set('page', String(target));
    else params.delete('page');
    setSearchParams(params);
  }

  function handleDraftChange(patch) {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit() {
    // Cache-first: if this exact configuration was fetched before (any
    // session), useCachedQuery resolves it from IndexedDB with 0 API calls.
    setAppliedFilters(draftFilters);
    setSearchParams(filtersToSearchParams(draftFilters), { replace: false });
  }

  function handleReset() {
    setDraftFilters(DEFAULT_FILTERS);
    // Spec: Reset only clears the draft — it does not itself trigger a query.
  }

  return (
    <div className="flex-1">
      <Header title="Product Discovery" subtitle="Discover the products driving TikTok Shop." onMenuClick={onMenuClick} />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <ProductFilters
          draftFilters={draftFilters}
          onDraftChange={handleDraftChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
          hasPendingChanges={hasPendingChanges}
        />

        <ProductKpi products={products} totalFetched={allProducts.length} isLoading={isLoading} />

        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {page === 1
                  ? `Top ${products.length} Products`
                  : `Products #${rowStart + 1}–#${rowStart + products.length}`}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Each page is one Kalodata call of 100 ranked products — switching "Show" re-slices
                that same page instantly, no extra request.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Show
                <select
                  aria-label="Show top N"
                  value={displayCount}
                  onChange={(e) => setDisplayCount(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  {DISPLAY_COUNT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} rows
                    </option>
                  ))}
                </select>
              </label>
              <CacheStatus
                updatedAt={updatedAt}
                fromCache={fromCache}
                isFetching={isFetching}
                onRefresh={refresh}
                label="Refresh product list"
              />
            </div>
          </div>

          <PagerBar
            itemLabel="products"
            isLoading={isLoading}
            rowStart={rowStart}
            count={allProducts.length}
            page={page}
            lastPage={lastPage}
            cachedPages={cachedPages}
            onPageChange={goToPage}
            className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card"
          />

          {isLoading && <ProductTableSkeleton rows={12} />}

          {isError && (
            <ErrorState title={error?.message || 'Unable to load product data.'} onRetry={refresh} />
          )}

          {!isLoading && !isError && products.length === 0 && (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              message={
                page > 1
                  ? `Kalodata returned no products for page ${page} — the ranking ends earlier.`
                  : 'Try adjusting your filters and clicking Submit.'
              }
            />
          )}

          {!isLoading && !isError && products.length > 0 && (
            <ProductTable products={products} dateRange={appliedFilters.dateRange} rankOffset={rowStart} />
          )}
        </div>
      </div>
    </div>
  );
}
