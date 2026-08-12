import { ExternalLink, VideoOff } from 'lucide-react';
import { VideoThumbnail } from './VideoCard.jsx';

/**
 * Three-way video preview, per spec:
 *   1. A real playable video URL  -> native <html5> player.
 *   2. Only a TikTok URL          -> thumbnail + prominent "View on TikTok".
 *   3. Neither                    -> thumbnail + honest "unavailable" state.
 *
 * As of the last live check, neither /video/rank nor /video/detail expose a
 * thumbnail, video URL, or TikTok URL (see normalizeVideo.js) — so case 3 is
 * what actually renders today. This branches on the normalized fields rather
 * than hardcoding that, so a future field addition lights up automatically.
 */
export default function VideoPreview({ video }) {
  if (video.videoUrl) {
    return (
      <div className="overflow-hidden rounded-lg bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          controls
          preload="metadata"
          poster={video.thumbnailUrl ?? undefined}
          src={video.videoUrl}
          className="max-h-80 w-full"
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (video.tiktokUrl) {
    return (
      <div className="relative overflow-hidden rounded-lg">
        <VideoThumbnail video={video} className="h-44 w-full" badges={false} />
        <a
          href={video.tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md backdrop-blur transition-colors hover:bg-white"
        >
          View on TikTok <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-36 flex-col items-center justify-center gap-1.5 rounded-lg bg-slate-100 text-slate-400">
      <VideoOff className="h-5 w-5" strokeWidth={1.75} />
      <p className="text-xs font-medium">Video preview unavailable</p>
    </div>
  );
}
