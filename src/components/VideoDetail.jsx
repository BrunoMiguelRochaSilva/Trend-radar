import { useEffect } from 'react';
import { X, Heart, MessageCircle, Share2, Megaphone, Sparkles, PlayCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { fetchVideoDetails } from '../services/api.js';
import { normalizeVideo } from '../utils/normalizeVideo.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { formatPercentage } from '../utils/formatPercentage.js';
import { useCachedQuery } from '../hooks/useCachedQuery.js';
import { buildVideoDetailParams } from '../utils/queryParams.js';
import ErrorState from './ErrorState.jsx';
import CacheStatus from './CacheStatus.jsx';
import VideoPreview from './VideoPreview.jsx';

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function VideoDetail({ videoId, dateRange, onClose }) {
  // Same cache-first pattern: reopening the same video is 0 Kalodata calls
  // until Refresh is clicked.
  const { response, isLoading, isFetching, isError, error, refresh, updatedAt, fromCache } =
    useCachedQuery({
      endpoint: 'video/detail',
      params: buildVideoDetailParams(videoId, dateRange),
      fetcher: (forceRefresh) => fetchVideoDetails(videoId, { dateRange, refresh: forceRefresh }),
      enabled: !!videoId,
    });

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const video = normalizeVideo(response?.data);
  const trendData =
    video?.revenueTrend?.map((value, i) => ({ label: `Day ${i + 1}`, value })) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Video Details</p>
              <p className="text-sm font-semibold text-slate-900">@{video?.creatorHandle ?? '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && (
              <CacheStatus
                updatedAt={updatedAt}
                fromCache={fromCache}
                isFetching={isFetching}
                onRefresh={refresh}
                label="Refresh video details"
              />
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            <div className="skeleton-shimmer relative h-5 w-3/4 overflow-hidden rounded bg-slate-200" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer relative h-14 overflow-hidden rounded-lg bg-slate-200"
                />
              ))}
            </div>
          </div>
        )}

        {isError && <ErrorState title={error?.message || 'Unable to load video.'} onRetry={refresh} />}

        {!isLoading && !isError && video && (
          <>
            <div className="mb-4">
              <VideoPreview video={video} />
            </div>

            <p className="mb-4 text-base font-medium text-slate-900">{video.title}</p>

            <div className="mb-4 flex flex-wrap gap-2">
              {video.isAd && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <Megaphone className="h-3 w-3" /> Ad
                </span>
              )}
              {!video.isAd && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  Organic
                </span>
              )}
              {video.isAi && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                  <Sparkles className="h-3 w-3" /> AI Video
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Metric label="Revenue" value={formatCurrency(video.revenue)} />
              <Metric label="Sales" value={formatNumber(video.sales)} />
              <Metric label="Views" value={formatNumber(video.views)} />
              <Metric
                label="GPM"
                value={video.gpm !== null ? formatCurrency(video.gpm) : '—'}
              />
              <Metric
                label="Likes"
                value={
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {formatNumber(video.likes)}
                  </span>
                }
              />
              <Metric
                label="Comments"
                value={
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> {formatNumber(video.comments)}
                  </span>
                }
              />
              <Metric
                label="Shares"
                value={
                  <span className="inline-flex items-center gap-1">
                    <Share2 className="h-3.5 w-3.5" /> {formatNumber(video.shares)}
                  </span>
                }
              />
              <Metric label="Ad Views" value={formatNumber(video.adsViews)} />
              <Metric label="Ad ROAS" value={video.adsRoas !== null ? video.adsRoas.toFixed(1) : '—'} />
              <Metric label="Ad CPA" value={video.adCpa !== null ? formatCurrency(video.adCpa) : '—'} />
              <Metric
                label="Duration"
                value={video.duration !== null ? `${video.duration}s` : '—'}
              />
              <Metric
                label="Revenue Growth"
                value={video.revenueGrowth !== null ? formatPercentage(video.revenueGrowth) : '—'}
              />
            </div>

            {trendData.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Revenue Trend
                </p>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={48} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6d5ef8"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#6d5ef8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Relative days within the selected date range.
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-between text-[11px] text-slate-400">
              <span>Video ID: {video.id}</span>
              <span>Creator ID: {video.creatorId ?? '—'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
