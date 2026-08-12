import { useMemo, useState } from 'react';
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
import { buildVideoRankParams } from '../utils/queryParams.js';
import { fetchProductVideos } from '../services/api.js';
import { normalizeVideos } from '../utils/normalizeVideo.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { DATE_RANGE_OPTIONS } from '../constants/filterOptions.js';
import { downloadCsv } from '../utils/exportCsv.js';
import { VideoThumbnail } from './VideoCard.jsx';
import CacheStatus from './CacheStatus.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import { VideoGridSkeleton } from './LoadingSkeleton.jsx';

const ROWS_PER_PAGE = 10;
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

/**
 * The full "Video & Ad" table — a real analytics table backed entirely by
 * /video/rank data already in the cache. Never issues one call per row/video;
 * only paginates into a genuinely new API page (page_size 100 each) when the
 * user pages past a full 100-row batch. `page1Query` is the shared
 * useCachedQuery result for page_number=1 owned by ProductDetailsPage — the
 * same query Popular Videos uses — so the very first page never double-fetches.
 */
export default function VideoAdTable({ productId, dateRange, page1Query, onOpenVideo }) {
  const [apiPage, setApiPage] = useState(1);
  const [localPage, setLocalPage] = useState(1);
  const [sort, setSort] = useState({ key: 'revenue', dir: 'desc' });

  const extraPageQuery = useCachedQuery({
    endpoint: 'video/rank',
    params: buildVideoRankParams(productId, dateRange, apiPage),
    fetcher: (forceRefresh) =>
      fetchProductVideos(productId, { dateRange, pageSize: 100, pageNumber: apiPage, refresh: forceRefresh }),
    enabled: apiPage !== 1,
  });

  const current = apiPage === 1 ? page1Query : extraPageQuery;
  const { isLoading, isFetching, isError, error, refresh, updatedAt, fromCache } = current;

  const videos = useMemo(() => normalizeVideos(current.response?.data), [current.response]);

  const sortedVideos = useMemo(() => {
    if (!SORTABLE_COLUMNS.has(sort.key)) return videos;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...videos].sort((a, b) => ((a[sort.key] ?? 0) - (b[sort.key] ?? 0)) * dir);
  }, [videos, sort]);

  const hasMoreApiPages = videos.length === 100; // a full batch means there may be more
  const totalLocalPages = Math.max(1, Math.ceil(sortedVideos.length / ROWS_PER_PAGE));
  const clampedLocalPage = Math.min(localPage, totalLocalPages);
  const rowStart = (clampedLocalPage - 1) * ROWS_PER_PAGE;
  const pageRows = sortedVideos.slice(rowStart, rowStart + ROWS_PER_PAGE);

  const knownTotal = hasMoreApiPages ? `${apiPage * 100}+` : (apiPage - 1) * 100 + videos.length;
  const dateRangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? dateRange;

  function handleSort(key) {
    setLocalPage(1);
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  }

  function goPrev() {
    if (clampedLocalPage > 1) {
      setLocalPage(clampedLocalPage - 1);
    } else if (apiPage > 1) {
      setApiPage(apiPage - 1);
      setLocalPage(1);
    }
  }

  function goNext() {
    if (clampedLocalPage < totalLocalPages) {
      setLocalPage(clampedLocalPage + 1);
    } else if (hasMoreApiPages) {
      setApiPage(apiPage + 1);
      setLocalPage(1);
    }
  }

  function handleExport() {
    downloadCsv(
      `trendradar-videos-${productId}-page${apiPage}.csv`,
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

  const canGoPrev = clampedLocalPage > 1 || apiPage > 1;
  const canGoNext = clampedLocalPage < totalLocalPages || hasMoreApiPages;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Video &amp; Ad</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {videos.length > 0 ? `${knownTotal} videos` : 'No videos yet'} · {dateRangeLabel}
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

      <div className="p-6 pt-4">
        {isLoading && <VideoGridSkeleton count={4} />}

        {isError && <ErrorState title={error?.message || 'Unable to load videos.'} onRetry={refresh} />}

        {!isLoading && !isError && videos.length === 0 && (
          <EmptyState
            icon={Clapperboard}
            title="No videos found"
            message="No promotional videos were found for this product yet."
          />
        )}

        {!isLoading && !isError && videos.length > 0 && (
          <>
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
                  {pageRows.map((video, i) => (
                    <tr
                      key={video.id}
                      onClick={() => onOpenVideo(video.id)}
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
                            <p className="max-w-xs truncate text-sm font-medium text-slate-900">{video.title}</p>
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

            <div className="mt-3 flex items-center justify-between text-sm">
              <p className="text-xs text-slate-400">
                Showing {rowStart + 1}–{rowStart + pageRows.length} of {knownTotal}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  aria-label="Previous page"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <span className="px-2 text-xs text-slate-400">
                  Page {clampedLocalPage} of {hasMoreApiPages ? `${totalLocalPages}+` : totalLocalPages}
                </span>
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  aria-label="Next page"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
