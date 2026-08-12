# TrendRadar

TikTok Shop product intelligence dashboard, built on the real **Kalodata Open Center API**.
Shows the Top 30 TikTok Shop products, their real metrics, product images, and the most
popular videos promoting each one.

```
React + Vite (JS)         Express backend         Kalodata Open Center API
   Product Discovery  →   /api/products/*   →     openapi/v1/tiktok/*
   Product Details    →   /api/videos/*
   Popular Videos
```

The browser only ever talks to our own Express backend. The Kalodata API key lives in
`.env` and is never sent to the frontend.

## Install & run

```bash
npm install     # installs the frontend deps, then server/ deps via postinstall
npm run dev     # runs the Vite dev server (5173) + Express API (3001) together
```

Open **http://localhost:5173**. By default the app runs against built-in mock data — no
Kalodata credentials required.

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `KALODATA_API_KEY` | Your Kalodata Open Center secret key (server-side only). |
| `KALODATA_AUTH_HEADER` | HTTP header name Kalodata expects the key in. Confirmed as `secret-key` from the official Quick API Example (`curl -H "secret-key: YOUR_API_KEY" ...`). |
| `KALODATA_AUTH_SCHEME` | Optional scheme prefix before the key (e.g. `Bearer`). Left blank — `secret-key` takes the raw key value. |
| `USE_MOCK_DATA` | `true` = built-in mock data (default, no credentials needed). `false` = call the real Kalodata API. |
| `PORT` | Port the Express backend listens on (default `3001`). |

`.env` is git-ignored. `.env.example` documents every variable with the confirmed
defaults but no real key.

### Switching from mock to real data

1. Confirm `KALODATA_API_KEY` is set in `.env`.
2. Set `USE_MOCK_DATA=false`.
3. Restart `npm run dev`.

`KALODATA_AUTH_HEADER`/`KALODATA_AUTH_SCHEME` are already set correctly from the
confirmed docs example — no further changes needed unless Kalodata's auth changes.

## Kalodata endpoints used

All calls are made server-side from `server/services/kalodataService.js`:

- `POST /openapi/v1/tiktok/product/rank` — Top 30 product ranking (dashboard table).
- `POST /openapi/v1/tiktok/product/detail` — full metrics for one product (detail page).
- `POST /openapi/v1/tiktok/video/rank` — up to 100 videos for a product (Popular Videos top
  10 + the full Video & Ad table, same shared call — see below).
- `POST /openapi/v1/tiktok/video/detail` — full metrics for one video (video modal).

Product details and videos are only fetched **on click** — never in bulk for all
products — to stay well within Kalodata's rate limits (10 req/10s for rank endpoints,
100 req/10s for detail endpoints). Each endpoint response is cached in-memory for ~5
minutes (`server/utils/cache.js`).

**Rank request sizing:** `product/rank` billing is `0.1 credit × ceil(rows / 100)`, so 100
rows costs the same 0.1 credit as 30. The backend always requests `page_size: 100` (the
documented max) in one call; the dashboard displays Top 30 by default and a "Show" control
(30/50/100) re-slices that same fetched batch client-side — no extra request or credit spent
switching between them.

## Query caching (Submit vs. Refresh)

Filters use a **draft → submit** model, not live-as-you-type: changing a field in the filter
panel only updates local draft state — nothing is sent anywhere. Clicking **Submit** commits
that draft as the applied query and checks a **persistent, cross-session cache** (IndexedDB,
`src/services/queryCache.js`) keyed by a deterministic hash of the complete request
configuration (region/date range/sort/keyword/ranges/page size, etc. — see
`src/utils/queryParams.js`). An exact repeat of a query already fetched — this session, or a
browser restart ago — is served from that cache with **zero** Kalodata calls; only a genuinely
new configuration calls the API. **Refresh** (shown next to each cached section) is the
explicit escape hatch: it bypasses both the persistent cache and the backend's in-memory
cache and replaces the stored entry. The same cache-first/forced-refresh pattern
(`src/hooks/useCachedQuery.js`) covers all four endpoints — product list, product detail,
popular videos, and video detail — each fetched lazily and cached independently. A small
"Cached · 8m ago" / "Updated just now" label shows freshness without dominating the UI.

The backend's original 5-minute in-memory cache (`server/utils/cache.js`) is unchanged and
still sits behind this as a second line of defense (e.g. if IndexedDB is unavailable).

## Video & Ad table

The Product Details page has a full-width "Video & Ad" section (`src/components/VideoAdTable.jsx`)
below Popular Videos — a sortable, paginated table over the same `/video/rank` data, not a
separate feature. Both sections share **one** cached page-1 call (`page_size: 100`, owned by
`ProductDetailsPage`); the table paginates 10 rows at a time client-side with zero extra
requests, and only fetches a genuinely new API page (`page_number: 2`, its own cache entry) if
the user pages past a full 100-row batch. Sorting by Revenue/Views is client-side over
already-fetched rows — never a new call. "Export CSV" downloads whatever's currently loaded,
no server round-trip.

**Video thumbnails, playable video URLs, and TikTok URLs**: confirmed empirically against the
live API (full raw response dumps of both `/video/rank` and `/video/detail`) that neither
endpoint returns any of these, nor a publish-date field. Rather than fabricate them, the table
shows a placeholder tile and "—" for Item Sold/Publish Date, and clicking a video opens a
preview modal that branches on whatever's actually present (`normalizeVideo.js`):
a real `<video>` player if a video URL ever appears, a "View on TikTok" button if only a
TikTok URL appears, or today's honest "Video preview unavailable" — never a fake embed.

## Project structure

```
server/            Express backend (never reachable from the browser's JS)
  services/kalodataClient.js   auth headers, POST/timeout/error handling
  services/kalodataService.js  the 4 documented Kalodata calls + caching
  services/mockData.js         mock-mode request simulation
  routes/, middleware/, utils/

src/                React frontend
  pages/            Dashboard/Products, ProductDetailsPage, Videos
  components/       Table, Filters (draft/submit), KPI cards, VideoCard/VideoGrid,
                     VideoAdTable, VideoDetail modal, VideoPreview, CacheStatus,
                     skeletons, states
  hooks/useCachedQuery.js       cache-first + forced-refresh query hook
  services/api.js               talks only to our backend (/api/*)
  services/queryCache.js        persistent (IndexedDB) query cache
  utils/            normalizeProduct/Video, formatters, queryParams (cache-key builders),
                     relativeTime, exportCsv, TrendRadar Score
  constants/filterOptions.js    shared date-range option list
  mocks/            30 mock products + 10 mock videos each (dev-only fixtures)
```

## Known limitation

`unit_price_range` / `revenue_range` filters (Price/Revenue Range in the UI) are **not
sent to the live Kalodata API**. Confirmed live: sending them as `{ min, max }` objects
throws a hard server error — `ProductRankReq["revenue_range"]` expects a **string**, not an
object (Jackson: `Cannot deserialize value of type java.lang.String from Object value`).
The correct string format isn't documented anywhere reachable, so rather than guess again,
the backend omits the field entirely in live mode (see the comment in
`server/services/kalodataService.js`) — the request still succeeds, just without server-side
price/revenue filtering. They still work in mock mode. Everything else (endpoints, request
bodies, auth header, response field names) matches the confirmed official docs and has been
verified against the real API.
