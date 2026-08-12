import { useState } from 'react';
import { Clapperboard } from 'lucide-react';
import { fetchProductVideos } from '../services/api.js';
import { normalizeVideos } from '../utils/normalizeVideo.js';
import { useCachedQuery } from '../hooks/useCachedQuery.js';
import { buildVideoRankParams } from '../utils/queryParams.js';
import VideoCard from './VideoCard.jsx';
import VideoDetail from './VideoDetail.jsx';
import CacheStatus from './CacheStatus.jsx';
import { VideoGridSkeleton } from './LoadingSkeleton.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';

// Fetches videos ONLY when a product is opened (spec §6/§32) — never on the
// dashboard, never for every product up front. Same cache-first/forced-
// refresh pattern as the product list: opening the same product's videos
// again costs 0 Kalodata calls until Refresh is clicked.
export default function VideoGrid({ productId, dateRange }) {
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  const { response, isLoading, isFetching, isError, error, refresh, updatedAt, fromCache } =
    useCachedQuery({
      endpoint: 'video/rank',
      params: buildVideoRankParams(productId, dateRange),
      fetcher: (forceRefresh) =>
        fetchProductVideos(productId, { dateRange, refresh: forceRefresh }),
      enabled: !!productId,
    });

  const videos = normalizeVideos(response?.data);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Popular Videos</h2>
          <p className="mt-0.5 text-sm text-slate-500">Top videos promoting this product</p>
        </div>
        {!isLoading && (
          <CacheStatus
            updatedAt={updatedAt}
            fromCache={fromCache}
            isFetching={isFetching}
            onRefresh={refresh}
            label="Refresh videos"
          />
        )}
      </div>

      {isLoading && <VideoGridSkeleton count={5} />}

      {isError && (
        <ErrorState title={error?.message || 'Unable to load videos.'} onRetry={refresh} />
      )}

      {!isLoading && !isError && videos.length === 0 && (
        <EmptyState
          icon={Clapperboard}
          title="No videos found"
          message="No promotional videos were found for this product yet."
        />
      )}

      {!isLoading && !isError && videos.length > 0 && (
        <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onOpenDetails={(v) => setSelectedVideoId(v.id)} />
          ))}
        </div>
      )}

      {selectedVideoId && (
        <VideoDetail
          videoId={selectedVideoId}
          dateRange={dateRange}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </section>
  );
}
