import { useMemo, useState } from 'react';
import { Download, Clapperboard } from 'lucide-react';
import { useCachedQuery } from '../hooks/useCachedQuery.js';
import { buildVideoRankParams } from '../utils/queryParams.js';
import { fetchProductVideos } from '../services/api.js';
import { normalizeVideos } from '../utils/normalizeVideo.js';
import { formatNumber } from '../utils/formatNumber.js';
import { DATE_RANGE_OPTIONS } from '../constants/filterOptions.js';
import { downloadCsv } from '../utils/exportCsv.js';
import { PAGE_SIZE, MAX_API_PAGES, PagerBar, useCachedPages } from './Pager.jsx';
import { VideoTable } from './VideoRankTable.jsx';
import CacheStatus from './CacheStatus.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';
import { VideoGridSkeleton } from './LoadingSkeleton.jsx';

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

  const extraPageQuery = useCachedQuery({
    endpoint: 'video/rank',
    params: buildVideoRankParams(productId, dateRange, page),
    fetcher: (forceRefresh) =>
      fetchProductVideos(productId, { dateRange, pageSize: PAGE_SIZE, pageNumber: page, refresh: forceRefresh }),
    enabled: page !== 1,
  });

  const current = page === 1 ? page1Query : extraPageQuery;
  const { isLoading, isFetching, isError, error, refresh, updatedAt, fromCache } = current;

  const cachedPages = useCachedPages(
    'video/rank',
    (p) => buildVideoRankParams(productId, dateRange, p),
    `${productId}|${dateRange}|${updatedAt?.getTime()}`
  );

  const videos = useMemo(() => normalizeVideos(current.response?.data), [current.response]);

  const pagesFromCount = videoCount > 0 ? Math.ceil(videoCount / PAGE_SIZE) : 1;
  let lastPage = Math.max(pagesFromCount, videos.length === PAGE_SIZE ? page + 1 : page);
  if (!isLoading && !isError && videos.length < PAGE_SIZE) lastPage = page; // a short page is the real end
  lastPage = Math.min(MAX_API_PAGES, lastPage);

  const rowStart = (page - 1) * PAGE_SIZE;
  const totalLabel =
    videoCount > 0 ? formatNumber(videoCount, { compact: false }) : `${rowStart + videos.length}${videos.length === PAGE_SIZE ? '+' : ''}`;
  const dateRangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? dateRange;

  function handlePageChange(next) {
    setPage(Math.min(Math.max(1, next), lastPage));
  }

  function handleExport() {
    downloadCsv(
      `trendradar-videos-${productId}-page${page}.csv`,
      ['Video ID', 'Title', 'Creator', 'Revenue', 'Views', 'Likes', 'Comments', 'Shares', 'Publish Date', 'Ad', 'AI Video', 'TikTok URL'],
      videos.map((v) => [
        v.id,
        v.title,
        v.creatorHandle ? `@${v.creatorHandle}` : '',
        v.revenue ?? '',
        v.views ?? '',
        v.likes ?? '',
        v.comments ?? '',
        v.shares ?? '',
        v.publishDate ?? '',
        v.isAd ? 'Yes' : 'No',
        v.isAi ? 'Yes' : 'No',
        v.tiktokUrl ?? '',
      ])
    );
  }

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

      {(page > 1 || videos.length > 0) && (
        <PagerBar
          itemLabel="videos"
          isLoading={isLoading}
          rowStart={rowStart}
          count={videos.length}
          page={page}
          lastPage={lastPage}
          cachedPages={cachedPages}
          onPageChange={handlePageChange}
          note={pagesFromCount > MAX_API_PAGES ? `API serves the top ${MAX_API_PAGES * PAGE_SIZE}` : null}
        />
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

        {!isLoading && !isError && videos.length > 0 && <VideoTable videos={videos} rowStart={rowStart} />}
      </div>
    </section>
  );
}
