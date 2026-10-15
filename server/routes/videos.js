import { Router } from 'express';
import { getVideoDetails, getVideoRanking } from '../services/kalodataService.js';
import { clearCache } from '../utils/cache.js';

export const videosRouter = Router();

// The sort fields and date windows video/rank accepts (same sets the KaloData CLI allows).
const SORT_FIELDS = new Set(['revenue', 'views', 'revenue_growth_rate', 'ads_roas']);
const DATE_RANGES = new Set(['lastDay', 'last7Day', 'last30Day']);
const MAX_PAGE = 5;

// GET /api/videos — video ranking across all products (Videos page). One call returns
// 100 videos; `revenue` is what each earned within dateRange.
videosRouter.get('/', async (req, res, next) => {
  try {
    const { dateRange, sort, category, keyword, pageNumber, refresh } = req.query;
    if (refresh === 'true') clearCache();
    const data = await getVideoRanking({
      dateRange: DATE_RANGES.has(dateRange) ? dateRange : 'last7Day',
      sortField: SORT_FIELDS.has(sort) ? sort : 'revenue',
      sortType: 'DESC',
      pageSize: 100,
      pageNumber: Math.min(Math.max(1, Number(pageNumber) || 1), MAX_PAGE),
      // Kalodata category ids are purely numeric — anything else is dropped rather than forwarded.
      categoryIds: /^\d+$/.test(category || '') ? [category] : undefined,
      keyword: keyword || undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/videos/:id
videosRouter.get('/:id', async (req, res, next) => {
  try {
    const { dateRange, refresh } = req.query;
    if (refresh === 'true') clearCache();
    const data = await getVideoDetails({
      videoId: req.params.id,
      dateRange: dateRange || 'last7Day',
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});
