import { Router } from 'express';
import { getVideoDetails } from '../services/kalodataService.js';
import { clearCache } from '../utils/cache.js';

export const videosRouter = Router();

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
