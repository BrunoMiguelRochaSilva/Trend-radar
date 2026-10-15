import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  Clapperboard,
} from 'lucide-react';
import { useCachedQuery } from '../hooks/useCachedQuery.js';
import { buildQueryKey, getCachedQuery } from '../services/queryCache.js';
import { buildVideoRankParams } from '../utils/queryParams.js';
import { fetchProductVideos } from '../services/api.js';
import { normalizeVideos } from '../utils/normalizeVideo.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { DATE_RANGE_OPTIONS } from '../constants/filterOptions.js';
import { downloadCsv } from '../utils/exportCsv.js';
import { VideoThumbnail, VideoTitleLink } from './VideoCard.jsx';
import CacheStatus from './CacheStatus.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import { VideoGridSkeleton } from './LoadingSkeleton.jsx';

// One page = one video/rank call (page_size 100), so every page shows a full batch.
const PAGE_SIZE = 100;
// The Open API serves rank results up to page_number 5 (the same cap the KaloData CLI
// enforces) — i.e. the top 500 videos per product.
const MAX_API_PAGES = 5;
const SORTABLE_COLUMNS = new Set(['revenue', 'views']); // the only columns video/rank actually returns numeric data for

function SortHeader({ label, sortKey, active, dir, onSort, className = '' }) {
  const sortable = SORTABLE_COLUMNS.has(sortKey);
  return (
    <th
      className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${className} ${sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
      onClick={sortable ? () => onSort(sortKey) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortable &&
          (active ? (
            dir === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )
          ) : (
            <ChevronDown className="h-3 w-3 text-slate-300" />
          ))}
      </span>
    </th>
  );
}

const arrowClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

/**
 * Kalodata-style pager: ‹ 1 2 3 4 5 › Go to [ ] Page. Pages not yet in the
 * cache carry a small amber dot — opening one is a new video/rank call
 * (~0.1 credits); already-opened pages are free.
 */
function Pagination({ page, lastPage, cachedPages, onChange }) {
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
            title={`Videos ${(p - 1) * PAGE_SIZE + 1}–${p * PAGE_SIZE} · ${isCached ? 'already loaded, free' : '~0.1 credits to load'}`}
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

/**
 * The full "Video & Ad" table — a real analytics table backed entirely by
 * /video/rank data already in the cache. Never issues one call per row/video:
 * each page is exactly one video/rank call of 100 videos, fetched only when
 * that page is opened. `page1Query` is the shared useCachedQuery result for
 * page_number=1 owned by ProductDetailsPage — the same query Popular Videos
 * uses — so the very first page never double-fetches.
 *
 * `videoCount` (product/detail `video_number`) sizes the pager up front; when
 * it's missing, the pager grows one page at a time while pages come back full.
 */
export default function VideoAdTable({ productId, dateRange, videoCount, page1Query }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: 'revenue', dir: 'desc' });
  const [cachedPages, setCachedPages] = useState(() => new Set());

  const extraPageQuery = useCachedQuery({
    endpoint: 'video/rank',
    params: buildVideoRankParams(productId, dateRange, page),
    fetcher: (forceRefresh) =>
      fetchProductVideos(productId, { dateRange, pageSize: PAGE_SIZE, pageNumber: page, refresh: forceRefresh }),
    enabled: page !== 1,
  });

  const current = page === 1 ? page1Query : extraPageQuery;
  const { isLoading, isFetching, isError, error, refresh, updatedAt, fromCache } = current;
  const updatedAtMs = updatedAt?.getTime();

  // Which pages are already in the persistent cache (free to open) — re-checked
  // whenever a page finishes loading.
  useEffect(() => {
    let cancelled = false;
    const checks = Array.from({ length: MAX_API_PAGES }, async (_, i) => {
      const key = buildQueryKey('video/rank', buildVideoRankParams(productId, dateRange, i + 1));
      return (await getCachedQuery(key)) ? i + 1 : null;
    });
    Promise.all(checks).then((pages) => {
      if (!cancelled) setCachedPages(new Set(pages.filter(Boolean)));
    });
    return () => {
      cancelled = true;
    };
  }, [productId, dateRange, updatedAtMs]);

  const videos = useMemo(() => normalizeVideos(current.response?.data), [current.response]);

  const sortedVideos = useMemo(() => {
    if (!SORTABLE_COLUMNS.has(sort.key)) return videos;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...videos].sort((a, b) => ((a[sort.key] ?? 0) - (b[sort.key] ?? 0)) * dir);
  }, [videos, sort]);

  const pagesFromCount = videoCount > 0 ? Math.ceil(videoCount / PAGE_SIZE) : 1;
  let lastPage = Math.max(pagesFromCount, videos.length === PAGE_SIZE ? page + 1 : page);
  if (!isLoading && !isError && videos.length < PAGE_SIZE) lastPage = page; // a short page is the real end
  lastPage = Math.min(MAX_API_PAGES, lastPage);

  const rowStart = (page - 1) * PAGE_SIZE;
  const totalLabel =
    videoCount > 0 ? formatNumber(videoCount, { compact: false }) :`${rowStart + videos.length}${videos.length === PAGE_SIZE ? '+' : ''}`;
  const dateRangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? dateRange;

  function handleSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  }

  function handlePageChange(next) {
    setPage(Math.min(Math.max(1, next), lastPage));
  }

  function handleExport() {
    downloadCsv(
      `trendradar-videos-${productId}-page${page}.csv`,
      ['Video ID', 'Title', 'Creator', 'Revenue', 'Views', 'Likes', 'Comments', 'Shares', 'Ad', 'AI Video'],
      videos.map((v) => [
        v.id,
        v.title,
        v.creatorHandle ? `@${v.creatorHandle}` : '',
        v.revenue ?? '',
        v.views ?? '',
        v.likes ?? '',
        v.comments ?? '',
        v.shares ?? '',
        v.isAd ? 'Yes' : 'No',
        v.isAi ? 'Yes' : 'No',
      ])
    );
  }

  const showPager = page > 1 || videos.length > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Video &amp; Ad</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {videos.length > 0 || page > 1 ? `${totalLabel} videos` : 'No videos yet'} · {dateRangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CacheStatus
            updatedAt={updatedAt}
            fromCache={fromCache}
            isFetching={isFetching}
            onRefresh={refresh}
            label="Refresh Video & Ad table"
          />
          <button
            onClick={handleExport}
            disabled={videos.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {showPager && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-3">
          <div className="text-xs text-slate-400">
            <p>
              {isLoading
                ? `Loading videos ${rowStart + 1}–${rowStart + PAGE_SIZE}…`
                : videos.length > 0
                  ? `Showing ${rowStart + 1}–${rowStart + videos.length} · ${PAGE_SIZE} per page`
                  : `No videos on page ${page}`}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              New page ~0.1 credits · opened pages are free
              {pagesFromCount > MAX_API_PAGES && ` · API serves the top ${MAX_API_PAGES * PAGE_SIZE}`}
            </p>
          </div>
          <Pagination page={page} lastPage={lastPage} cachedPages={cachedPages} onChange={handlePageChange} />
        </div>
      )}

      <div className="p-6 pt-4">
        {isLoading && <VideoGridSkeleton count={4} />}

        {isError && <ErrorState title={error?.message || 'Unable to load videos.'} onRetry={refresh} />}

        {!isLoading && !isError && videos.length === 0 && (
          <EmptyState
            icon={Clapperboard}
            title="No videos found"
            message={
              page > 1
                ? `Kalodata returned no videos for page ${page}.`
                : 'No promotional videos were found for this product yet.'
            }
          />
        )}

        {!isLoading && !isError && videos.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="whitespace-nowrap px-3 py-2.5 pl-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    #
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Video
                  </th>
                  <SortHeader label="Revenue" sortKey="revenue" active={sort.key === 'revenue'} dir={sort.dir} onSort={handleSort} />
                  <SortHeader label="Views" sortKey="views" active={sort.key === 'views'} dir={sort.dir} onSort={handleSort} />
                  <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Item Sold
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Publish Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVideos.map((video, i) => (
                  <tr
                    key={video.id}
                    // Opens the video on tiktok.com — no in-app detail modal (and no video/detail credits).
                    onClick={() => video.tiktokUrl && window.open(video.tiktokUrl, '_blank', 'noopener,noreferrer')}
                    title="Open on TikTok"
                    className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-3 py-3 pl-4 text-sm font-medium text-slate-400">
                      {rowStart + i + 1}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <VideoThumbnail
                          video={video}
                          className="h-11 w-11 shrink-0 rounded-lg"
                          badges={false}
                        />
                        <div className="min-w-0">
                          <VideoTitleLink
                            video={video}
                            className="block max-w-xs truncate text-sm font-medium text-slate-900"
                          />
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                            <span className="font-medium text-brand-600">
                              @{video.creatorHandle ?? 'creator'}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <Heart className="h-3 w-3" /> {formatNumber(video.likes)}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <MessageCircle className="h-3 w-3" /> {formatNumber(video.comments)}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <Share2 className="h-3 w-3" /> {formatNumber(video.shares)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold text-slate-900">
                      {formatCurrency(video.revenue)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">
                      {formatNumber(video.views)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-400">
                      {video.sales !== null ? formatNumber(video.sales) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 pr-4 text-sm text-slate-400">
                      {video.publishDate ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
