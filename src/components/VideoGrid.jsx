import { Clapperboard } from 'lucide-react';
import VideoCard from './VideoCard.jsx';
import CacheStatus from './CacheStatus.jsx';
import { VideoGridSkeleton } from './LoadingSkeleton.jsx';
import EmptyState from './EmptyState.jsx';
import ErrorState from './ErrorState.jsx';

/**
 * Presentational "Popular Videos" strip — top 10 by revenue. Data ownership
 * (fetch/cache) lives in ProductDetailsPage, shared with VideoAdTable's first
 * page so both read the exact same cached /video/rank call — never two.
 */
export default function VideoGrid({
  videos,
  isLoading,
  isFetching,
  isError,
  error,
  onRefresh,
  updatedAt,
  fromCache,
}) {
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
            onRefresh={onRefresh}
            label="Refresh videos"
          />
        )}
      </div>

      {isLoading && <VideoGridSkeleton count={5} />}

      {isError && <ErrorState title={error?.message || 'Unable to load videos.'} onRetry={onRefresh} />}

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
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </section>
  );
}
