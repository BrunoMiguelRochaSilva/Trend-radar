import { PlayCircle, Heart, MessageCircle, Share2, Sparkles, Megaphone } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { formatPercentage } from '../utils/formatPercentage.js';

// Kalodata's documented /video/rank and /video/detail responses don't expose a
// thumbnail or playable-video URL (spec §17) — so this renders an attractive
// placeholder tile instead of inventing a TikTok CDN URL. `video.thumbnailUrl`
// is read here so a real thumbnail can be dropped in later without touching
// this component's layout.
export default function VideoCard({ video, onOpenDetails }) {
  return (
    <div className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-popover">
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
        ) : (
          <PlayCircle className="h-10 w-10 text-white/80" strokeWidth={1.5} />
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {video.isAd && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              <Megaphone className="h-2.5 w-2.5" /> Ad
            </span>
          )}
          {video.isAi && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold text-brand-600">@{video.creatorHandle ?? 'creator'}</p>
        <p className="line-clamp-2 text-sm font-medium text-slate-900">{video.title}</p>

        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold text-slate-900">
            {formatCurrency(video.revenue)}
          </span>
          <span className="text-xs text-slate-500">{formatNumber(video.views)} views</span>
        </div>

        {video.revenueGrowth !== null && (
          <p
            className={`text-xs font-medium ${video.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {formatPercentage(video.revenueGrowth)} revenue growth
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> {formatNumber(video.likes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> {formatNumber(video.comments)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" /> {formatNumber(video.shares)}
          </span>
        </div>

        {video.adsRoas !== null && (
          <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            ROAS {video.adsRoas.toFixed(1)}
          </span>
        )}

        <button
          onClick={() => onOpenDetails(video)}
          className="mt-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
