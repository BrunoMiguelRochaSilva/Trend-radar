import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, Check, Clapperboard } from 'lucide-react';
import Header from '../components/Header.jsx';
import CacheStatus from '../components/CacheStatus.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { VideoGridSkeleton } from '../components/LoadingSkeleton.jsx';
import { PAGE_SIZE, MAX_API_PAGES, PagerBar, useCachedPages } from '../components/Pager.jsx';
import { VideoTable } from '../components/VideoRankTable.jsx';
import { useCachedQuery } from '../hooks/useCachedQuery.js';
import { fetchVideoRanking } from '../services/api.js';
import { normalizeVideos } from '../utils/normalizeVideo.js';
import { buildVideoListParams } from '../utils/queryParams.js';
import {
  CATEGORY_OPTIONS,
  DATE_RANGE_OPTIONS,
  VIDEO_SORT_OPTIONS,
  PUBLISHED_OPTIONS,
} from '../constants/filterOptions.js';

const DEFAULT_FILTERS = { category: '', dateRange: 'last7Day', sort: 'revenue', keyword: '' };
const DAY_MS = 86_400_000;

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';
const inputClass =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

// Applied filters live in the URL (shareable, survive back/forward). `search=1`
// marks that a search was actually submitted — nothing is fetched before that,
// so just opening this page never spends credits.
function filtersFromSearchParams(searchParams) {
  const filters = { ...DEFAULT_FILTERS };
  for (const key of Object.keys(DEFAULT_FILTERS)) {
    if (searchParams.has(key)) filters[key] = searchParams.get(key);
  }
  return filters;
}

function filtersToSearchParams(filters) {
  const params = new URLSearchParams({ search: '1' });
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== DEFAULT_FILTERS[key]) params.set(key, value);
  }
  return params;
}

function FieldLabel({ children }) {
  return <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{children}</p>;
}

/**
 * Video ranking across all products: category + date range (revenue earned in
 * that window) + sort + keyword go to Kalodata's video/rank (one call = 100
 * videos, ~0.1 credits; repeats are cached and free). "Published" has no API
 * equivalent, so it filters the loaded page locally — free.
 */
export default function Videos({ onMenuClick }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasSearched = searchParams.get('search') === '1';
  const appliedFilters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [page, setPage] = useState(1);
  const [publishedWithin, setPublishedWithin] = useState('');

  const hasPendingChanges = !hasSearched || JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  const query = useCachedQuery({
    endpoint: 'video/rank',
    params: buildVideoListParams(appliedFilters, page),
    fetcher: (forceRefresh) => fetchVideoRanking({ ...appliedFilters, pageNumber: page, refresh: forceRefresh }),
    enabled: hasSearched,
  });
  const { isLoading, isFetching, isError, error, refresh, updatedAt, fromCache } = query;

  const cachedPages = useCachedPages(
    'video/rank',
    (p) => buildVideoListParams(appliedFilters, p),
    `${JSON.stringify(appliedFilters)}|${updatedAt?.getTime()}`
  );

  const rowStart = (page - 1) * PAGE_SIZE;
  // Rank is fixed before the local Published filter, so # always reflects the API ranking.
  const videos = useMemo(
    () => normalizeVideos(query.response?.data).map((v, i) => ({ ...v, rank: rowStart + i + 1 })),
    [query.response, rowStart]
  );
  const shownVideos = useMemo(() => {
    const days = Number(publishedWithin);
    if (!days) return videos;
    return videos.filter((v) => v.publishDate && (Date.now() - Date.parse(v.publishDate)) / DAY_MS <= days);
  }, [videos, publishedWithin]);

  // A page shorter than 100 is the real end of the ranking — remembered per filter set, so
  // pages past it stay hidden (no paying for empty pages) after moving back to earlier ones.
  const endPageRef = useRef({});
  const filtersKey = JSON.stringify(appliedFilters);
  if (!isLoading && !isError && query.response && videos.length < PAGE_SIZE) {
    endPageRef.current[filtersKey] = Math.min(endPageRef.current[filtersKey] ?? MAX_API_PAGES, page);
  }
  const lastPage = Math.max(page, endPageRef.current[filtersKey] ?? MAX_API_PAGES);
  const dateRangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === appliedFilters.dateRange)?.label;
  const categoryLabel = CATEGORY_OPTIONS.find((o) => o.value === appliedFilters.category)?.label ?? 'All categories';
  const publishedLabel = PUBLISHED_OPTIONS.find((o) => o.value === publishedWithin)?.label;

  function handleDraftChange(patch) {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit() {
    setPage(1);
    setSearchParams(filtersToSearchParams(draftFilters));
  }

  return (
    <div className="flex-1">
      <Header
        title="Video Ranking"
        subtitle="Top TikTok Shop videos by category — revenue earned in the selected period."
        onMenuClick={onMenuClick}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
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
                onChange={(e) => handleDraftChange({ category: e.target.value })}
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
                onChange={(e) => handleDraftChange({ dateRange: e.target.value })}
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
                onChange={(e) => handleDraftChange({ sort: e.target.value })}
                className={selectClass}
              >
                {VIDEO_SORT_OPTIONS.map((opt) => (
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
                  onChange={(e) => handleDraftChange({ keyword: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Video title or hashtag…"
                  className={`w-52 py-2 pl-8 pr-3 ${inputClass}`}
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 pb-0.5">
              <button
                aria-label="Reset filters"
                onClick={() => setDraftFilters(DEFAULT_FILTERS)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                aria-label="Submit filters"
                onClick={handleSubmit}
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
          <p className="mt-2 text-xs text-slate-400">
            Each new search loads the top 100 videos for ~0.1 credits · repeating a search you've
            already run is free.
          </p>
        </div>

        {!hasSearched ? (
          <EmptyState
            icon={Clapperboard}
            title="Pick your filters and click Submit"
            message="Nothing is loaded until you submit, so opening this page never spends credits."
          />
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Top Videos</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {categoryLabel} · {dateRangeLabel} · revenue earned in this period
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className="flex items-center gap-2 text-sm text-slate-600"
                  title="Kalodata has no publish-date filter, so this narrows the videos already loaded — free"
                >
                  Published
                  <select
                    aria-label="Published within"
                    value={publishedWithin}
                    onChange={(e) => setPublishedWithin(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    {PUBLISHED_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <CacheStatus
                  updatedAt={updatedAt}
                  fromCache={fromCache}
                  isFetching={isFetching}
                  onRefresh={refresh}
                  label="Refresh video ranking"
                />
              </div>
            </div>

            <PagerBar
              itemLabel="videos"
              isLoading={isLoading}
              rowStart={rowStart}
              count={videos.length}
              page={page}
              lastPage={lastPage}
              cachedPages={cachedPages}
              onPageChange={(next) => setPage(Math.min(Math.max(1, next), lastPage))}
              note={
                publishedWithin && !isLoading
                  ? `${shownVideos.length} of ${videos.length} on this page published in the ${publishedLabel.toLowerCase()} (free filter)`
                  : null
              }
            />

            <div className="p-6 pt-4">
              {isLoading && <VideoGridSkeleton count={4} />}

              {isError && <ErrorState title={error?.message || 'Unable to load videos.'} onRetry={refresh} />}

              {!isLoading && !isError && shownVideos.length === 0 && (
                <EmptyState
                  icon={Clapperboard}
                  title="No videos found"
                  message={
                    videos.length > 0
                      ? `None of the ${videos.length} videos on this page were published in the ${publishedLabel.toLowerCase()}. Try another page or a wider Published window.`
                      : 'Kalodata returned no videos for these filters.'
                  }
                />
              )}

              {!isLoading && !isError && shownVideos.length > 0 && <VideoTable videos={shownVideos} rowStart={rowStart} />}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
