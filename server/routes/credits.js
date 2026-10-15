import { Router } from 'express';
import { getCreditBalance } from '../services/kalodataService.js';

export const creditsRouter = Router();

// GET /api/credits — remaining Kalodata credits (free to call)
creditsRouter.get('/', async (req, res, next) => {
  try {
    res.json(await getCreditBalance());
  } catch (err) {
    next(err);
  }
});
