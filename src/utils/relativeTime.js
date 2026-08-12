// Human-friendly "time ago" labels for cache-freshness display (e.g.
// "Cached result · 8m ago", "Fetched 2 days ago"). Shared by CacheStatus and
// anywhere else that shows when data was last fetched.
export function relativeTime(date) {
  if (!date) return null;
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
