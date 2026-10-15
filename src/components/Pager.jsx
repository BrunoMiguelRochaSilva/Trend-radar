import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildQueryKey, getCachedQuery } from '../services/queryCache.js';

// Shared by every paginated Kalodata rank list (product list, Video & Ad, Videos page).
// One page = one rank call with page_size 100, so every page shows a full batch.
export const PAGE_SIZE = 100;
// The Open API serves rank results up to page_number 5 (the same cap the KaloData CLI
// enforces) — i.e. the top 500 rows per query.
export const MAX_API_PAGES = 5;

const arrowClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

/**
 * Kalodata-style pager: ‹ 1 2 3 4 5 › Go to [ ] Page. Pages not yet in the
 * cache carry a small amber dot — opening one is a new rank call (~0.1
 * credits); already-opened pages are free.
 */
export function Pagination({ page, lastPage, cachedPages, onChange, itemLabel = 'Items' }) {
  const [goTo, setGoTo] = useState('');
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);

  function handleGoTo(e) {
    e.preventDefault();
    const n = Number(goTo);
    if (Number.isInteger(n) && n >= 1 && n <= lastPage) onChange(n);
    setGoTo('');
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className={arrowClass}>
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p) => {
        const isActive = p === page;
        const isCached = cachedPages.has(p);
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={isActive ? 'page' : undefined}
            title={`${itemLabel} ${(p - 1) * PAGE_SIZE + 1}–${p * PAGE_SIZE} · ${isCached ? 'already loaded, free' : '~0.1 credits to load'}`}
            className={[
              'relative inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700',
            ].join(' ')}
          >
            {p}
            {!isCached && !isActive && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
            )}
          </button>
        );
      })}

      <button onClick={() => onChange(page + 1)} disabled={page >= lastPage} aria-label="Next page" className={arrowClass}>
        <ChevronRight className="h-4 w-4" />
      </button>

      {lastPage > 1 && (
        <form onSubmit={handleGoTo} className="ml-2 flex items-center gap-1.5 text-sm text-slate-500">
          Go to
          <input
            type="number"
            min="1"
            max={lastPage}
            value={goTo}
            onChange={(e) => setGoTo(e.target.value)}
            aria-label="Go to page"
            className="h-8 w-14 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          Page
        </form>
      )}
    </div>
  );
}

/** Info line + cost legend on the left, Pagination on the right. */
export function PagerBar({
  isLoading,
  rowStart,
  count,
  page,
  lastPage,
  cachedPages,
  onPageChange,
  note,
  itemLabel = 'items',
  className = 'border-b border-slate-100 px-6 py-3',
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="text-xs text-slate-400">
        <p>
          {isLoading
            ? `Loading ${itemLabel} ${rowStart + 1}–${rowStart + PAGE_SIZE}…`
            : count > 0
              ? `Showing ${rowStart + 1}–${rowStart + count} · ${PAGE_SIZE} per page`
              : `No ${itemLabel} on page ${page}`}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          New page ~0.1 credits · opened pages are free{note ? ` · ${note}` : ''}
        </p>
      </div>
      <Pagination
        page={page}
        lastPage={lastPage}
        cachedPages={cachedPages}
        onChange={onPageChange}
        itemLabel={itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}
      />
    </div>
  );
}

/**
 * Which pages (1..MAX_API_PAGES) of a rank query are already in the persistent
 * cache, i.e. free to open. `paramsForPage(p)` builds that page's canonical
 * params for `endpoint`; re-checks whenever `depsKey` changes (pass something
 * that changes with the base query and the current page's updatedAt).
 */
export function useCachedPages(endpoint, paramsForPage, depsKey) {
  const [pages, setPages] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    const checks = Array.from({ length: MAX_API_PAGES }, async (_, i) =>
      (await getCachedQuery(buildQueryKey(endpoint, paramsForPage(i + 1)))) ? i + 1 : null
    );
    Promise.all(checks).then((found) => {
      if (!cancelled) setPages(new Set(found.filter(Boolean)));
    });
    return () => {
      cancelled = true;
    };
    // paramsForPage is rebuilt every render; depsKey captures what actually matters.
  }, [endpoint, depsKey]);

  return pages;
}
