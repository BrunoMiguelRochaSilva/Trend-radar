import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ImageOff } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency.js';
import { formatNumber } from '../utils/formatNumber.js';
import { formatPercentage } from '../utils/formatPercentage.js';
import { VideoThumbnail } from './VideoCard.jsx';

/**
 * Top 3 revenue videos for a product, each linking to tiktok.com. Only shows
 * videos already in the local cache (from opening the product before) — never
 * fetches, so it never costs credits.
 *   undefined = still reading the cache · null = product not opened yet
 */
function TopVideos({ videos }) {
  if (videos === undefined) return <span className="text-sm text-slate-300">…</span>;
  if (videos === null) {
    return (
      <span
        className="text-xs text-slate-400"
        title="Open this product once (~0.2 credits) — its top videos then show here for free"
      >
        Open to load
      </span>
    );
  }
  if (videos.length === 0) return <span className="text-xs text-slate-400">No videos</span>;

  return (
    <div className="flex gap-1.5">
      {videos.map((video) => (
        <a
          key={video.id}
          href={video.tiktokUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`@${video.creatorHandle ?? 'creator'} · ${formatCurrency(video.revenue)} — open on TikTok`}
          className="rounded-lg transition-transform hover:scale-110"
        >
          <VideoThumbnail video={video} className="h-11 w-11 rounded-lg" badges={false} />
        </a>
      ))}
    </div>
  );
}

function GrowthBadge({ value }) {
  if (value === null) return <span className="text-slate-400">—</span>;
  const isUp = value >= 0;
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
      ].join(' ')}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPercentage(value)}
    </span>
  );
}

const PREVIEW_MAX = 320;
const PREVIEW_GAP = 12;
const HOVER_DELAY_MS = 150;

// Places the hover preview beside the thumbnail (right side, flipping left near
// the viewport edge), vertically centered on it and clamped inside the viewport.
function previewBox(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const size = Math.min(PREVIEW_MAX, vw - PREVIEW_GAP * 2, vh - PREVIEW_GAP * 2);
  let left = rect.right + PREVIEW_GAP;
  if (left + size > vw - PREVIEW_GAP) left = rect.left - PREVIEW_GAP - size;
  left = Math.max(PREVIEW_GAP, left);
  const centeredTop = rect.top + rect.height / 2 - size / 2;
  const top = Math.min(Math.max(PREVIEW_GAP, centeredTop), vh - size - PREVIEW_GAP);
  return { left, top, width: size, height: size };
}

/**
 * Product image with an enlarged preview on hover. The preview reuses the same
 * image URL the browser already loaded — no extra Kalodata request or credits.
 * It's portaled to <body> so the table's overflow clipping can't cut it off.
 */
export function ProductThumbnail({ image, name, size = 'h-11 w-11' }) {
  const [preview, setPreview] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!preview) return undefined;
    // The preview is position: fixed, so close it instead of leaving it floating on scroll.
    const close = () => setPreview(null);
    window.addEventListener('scroll', close, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', close, { capture: true });
  }, [preview]);

  function handleMouseEnter(e) {
    const el = e.currentTarget;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPreview(previewBox(el.getBoundingClientRect())), HOVER_DELAY_MS);
  }

  function handleMouseLeave() {
    clearTimeout(timerRef.current);
    setPreview(null);
  }

  if (!image) {
    return (
      <div
        className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300`}
      >
        <ImageOff className="h-4 w-4" />
      </div>
    );
  }
  return (
    <>
      <img
        src={image}
        alt={name}
        loading="lazy"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${size} shrink-0 cursor-zoom-in rounded-lg border border-slate-100 object-cover`}
      />
      {preview &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-2xl"
            style={preview}
          >
            <img src={image} alt="" className="h-full w-full rounded-lg object-contain" />
          </div>,
          document.body
        )}
    </>
  );
}

export default function ProductRow({ product, rank, topVideos }) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/products/${encodeURIComponent(product.id)}`)}
      className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
    >
      <td className="whitespace-nowrap px-5 py-3.5 text-sm font-medium text-slate-400">
        #{rank}
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-3">
          <ProductThumbnail image={product.image} name={product.name} />
          {/* Title opens the product in a new tab; the rest of the row still opens it in place. */}
          <a
            href={`/products/${encodeURIComponent(product.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`${product.name} — opens in a new tab`}
            className="max-w-[220px] truncate text-sm font-medium text-slate-900 hover:text-brand-700 hover:underline"
          >
            {product.name}
          </a>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm font-semibold text-slate-900">
        {formatCurrency(product.revenue)}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm">
        <GrowthBadge value={product.revenueGrowth} />
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">
        {formatNumber(product.sales)}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5">
        <TopVideos videos={topVideos} />
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">
        {formatCurrency(product.unitPrice)}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">
        {formatCurrency(product.videoRevenue)}
      </td>
      <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-600">
        {formatCurrency(product.liveRevenue)}
      </td>
      <td className="max-w-[160px] truncate px-3 py-3.5 text-sm text-slate-500">
        {product.sellerName ?? '—'}
      </td>
    </tr>
  );
}
