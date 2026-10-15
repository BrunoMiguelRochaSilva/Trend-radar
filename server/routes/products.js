import { Router } from 'express';
import {
  getProductRanking,
  getProductDetails,
  getVideoRanking,
} from '../services/kalodataService.js';
import { clearCache } from '../utils/cache.js';

export const productsRouter = Router();

const SORT_FIELDS = new Set([
  'revenue',
  'revenue_growth_rate',
  'sales_volumn',
  'unit_price',
  'live_revenue',
  'video_revenue',
]);

// The only launch_date windows product/rank accepts (days since launch) — confirmed live:
// "launch_date must be equals <3 or <7 or <30".
const LAUNCH_WINDOWS = new Set(['<3', '<7', '<30']);

function parseRange(minStr, maxStr) {
  const min = minStr !== undefined && minStr !== '' ? Number(minStr) : undefined;
  const max = maxStr !== undefined && maxStr !== '' ? Number(maxStr) : undefined;
  if (min === undefined && max === undefined) return undefined;
  const range = {};
  if (min !== undefined && !Number.isNaN(min)) range.min = min;
  if (max !== undefined && !Number.isNaN(max)) range.max = max;
  return range;
}

// GET /api/products
productsRouter.get('/', async (req, res, next) => {
  try {
    const {
      dateRange,
      sort,
      sortDir,
      category,
      launch,
      keyword,
      priceMin,
      priceMax,
      revenueMin,
      revenueMax,
      pageNumber,
      refresh,
    } = req.query;

    if (refresh === 'true') clearCache();

    const sortField = SORT_FIELDS.has(sort) ? sort : 'revenue';
    const sortType = sortDir === 'ASC' ? 'ASC' : 'DESC';
    // Kalodata category ids are purely numeric — anything else is dropped rather than forwarded.
    const categoryIds = /^\d+$/.test(category || '') ? [category] : undefined;
    const launchDate = LAUNCH_WINDOWS.has(launch) ? launch : undefined;

    // Kalodata's rank-endpoint pricing is 0.1 credit per ceil(rows/100) — i.e. requesting
    // 100 rows costs exactly the same 0.1 credit as requesting 30. So we always request the
    // documented max (100) in one call, and the frontend displays Top 30 by default while
    // keeping the rest available client-side to expand to Top 50/100 with no extra request.
    // Deeper pages (101–200, …) are separate calls, up to the Open API's page_number 5.
    const data = await getProductRanking({
      dateRange: dateRange || 'last7Day',
      sortField,
      sortType,
      pageSize: 100,
      pageNumber: Math.min(Math.max(1, Number(pageNumber) || 1), 5),
      categoryIds,
      launchDate,
      keyword: keyword || undefined,
      priceRange: parseRange(priceMin, priceMax),
      revenueRange: parseRange(revenueMin, revenueMax),
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
productsRouter.get('/:id', async (req, res, next) => {
  try {
    const { dateRange, refresh } = req.query;
    if (refresh === 'true') clearCache();
    const data = await getProductDetails({
      productId: req.params.id,
      dateRange: dateRange || 'last7Day',
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id/videos
productsRouter.get('/:id/videos', async (req, res, next) => {
  try {
    const { dateRange, pageSize, pageNumber, refresh } = req.query;
    if (refresh === 'true') clearCache();
    const data = await getVideoRanking({
      productId: req.params.id,
      dateRange: dateRange || 'last7Day',
      sortField: 'revenue',
      sortType: 'DESC',
      pageSize: pageSize ? Number(pageSize) : 100,
      pageNumber: pageNumber ? Number(pageNumber) : 1,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});
