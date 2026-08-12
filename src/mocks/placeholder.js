// Generates small, self-contained SVG placeholder tiles as data: URIs — no
// network dependency, so mock mode works fully offline. Used for product
// images in mock data only; real mode always uses the API's master_image_url.

const PALETTES = [
  ['#6d5ef8', '#a78bfa'],
  ['#0ea5e9', '#67e8f9'],
  ['#f59e0b', '#fbbf24'],
  ['#ec4899', '#f9a8d4'],
  ['#10b981', '#6ee7b7'],
  ['#ef4444', '#fca5a5'],
  ['#8b5cf6', '#c4b5fd'],
  ['#14b8a6', '#5eead4'],
];

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Deterministic placeholder image for a mock product (data: URI, no network). */
export function placeholderImage(seed, name) {
  const [from, to] = PALETTES[seed % PALETTES.length];
  const label = initials(name) || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="300" height="300" rx="28" fill="url(#g)"/>
    <text x="150" y="168" font-family="Arial, sans-serif" font-size="88" font-weight="700"
      fill="rgba(255,255,255,0.92)" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
