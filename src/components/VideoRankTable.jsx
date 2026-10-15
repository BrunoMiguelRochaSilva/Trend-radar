import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Heart, MessageCircle, Share2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { formatPercentage } from '../utils/formatPercentage.js';
import { VideoThumbnail, VideoTitleLink } from './VideoCard.jsx';

// Shared by the product page's Video & Ad table and the Videos page ranking.
// Columns that can be re-sorted locally within the loaded page (no API call).
const SORTABLE = { revenue: 'number', views: 'number', revenueGrowth: 'number', publishDate: 'string' };

function SortHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort.key === sortKey;
  return (
    <th
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sort.dir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 text-slate-300" />
        )}
      </span>
    </th>
  );
}

/**
 * Video ranking table. Rows (and titles) open the video on tiktok.com. `#` is
 * the video's rank in the API result (videos may carry a precomputed `rank`,
 * e.g. when the caller filtered the page; otherwise rowStart + index). Column
 * headers re-sort the loaded page locally; by default the API's order is kept.
 */
export function VideoTable({ videos, rowStart = 0 }) {
  const [sort, setSort] = useState({ key: null, dir: 'desc' });

  const rows = useMemo(() => {
    const ranked = videos.map((v, i) => (v.rank ? v : { ...v, rank: rowStart + i + 1 }));
    if (!sort.key) return ranked;
    const dir = sort.dir === 'asc' ? 1 : -1;
    const isString = SORTABLE[sort.key] === 'string';
    return [...ranked].sort((a, b) =>
      isString
        ? String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? '')) * dir
        : ((a[sort.key] ?? 0) - (b[sort.key] ?? 0)) * dir
    );
  }, [videos, rowStart, sort]);

  function handleSort(key) {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th className="whitespace-nowrap px-3 py-2.5 pl-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              #
            </th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Video</th>
            <SortHeader label="Revenue" sortKey="revenue" sort={sort} onSort={handleSort} />
            <SortHeader label="Views" sortKey="views" sort={sort} onSort={handleSort} />
            <SortHeader label="Growth" sortKey="revenueGrowth" sort={sort} onSort={handleSort} />
            <SortHeader label="Publish Date" sortKey="publishDate" sort={sort} onSort={handleSort} className="pr-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((video) => (
            <tr
              key={video.id}
              // Opens the video on tiktok.com — no in-app detail modal (and no video/detail credits).
              onClick={() => video.tiktokUrl && window.open(video.tiktokUrl, '_blank', 'noopener,noreferrer')}
              title="Open on TikTok"
              className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
            >
              <td className="whitespace-nowrap px-3 py-3 pl-4 text-sm font-medium text-slate-400">{video.rank}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <VideoThumbnail video={video} className="h-11 w-11 shrink-0 rounded-lg" badges={false} />
                  <div className="min-w-0">
                    <VideoTitleLink
                      video={video}
                      className="block max-w-xs truncate text-sm font-medium text-slate-900"
                    />
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium text-brand-600">@{video.creatorHandle ?? 'creator'}</span>
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
              <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">{formatNumber(video.views)}</td>
              <td
                className={`whitespace-nowrap px-3 py-3 text-sm ${
                  video.revenueGrowth == null ? 'text-slate-400' : video.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatPercentage(video.revenueGrowth)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 pr-4 text-sm text-slate-500">{video.publishDate ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
