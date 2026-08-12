import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Always load the .env at the project root, regardless of the process's cwd
// (npm --prefix server changes cwd to server/, which would otherwise cause
// dotenv's default lookup to miss the root .env entirely).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { productsRouter } from './routes/products.js';
import { videosRouter } from './routes/videos.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;
const USE_MOCK_DATA = String(process.env.USE_MOCK_DATA).toLowerCase() === 'true';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: USE_MOCK_DATA ? 'mock' : 'live' });
});

app.use('/api/products', productsRouter);
app.use('/api/videos', videosRouter);

app.use('/api', notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TrendRadar API listening on http://localhost:${PORT} (mode: ${USE_MOCK_DATA ? 'MOCK' : 'LIVE'})`);
  if (!USE_MOCK_DATA && !process.env.KALODATA_AUTH_HEADER) {
    console.warn(
      '⚠️  USE_MOCK_DATA=false but KALODATA_AUTH_HEADER is not set. Real API calls will fail ' +
        'with a config error until you set KALODATA_AUTH_HEADER (and KALODATA_AUTH_SCHEME, if ' +
        'needed) in .env from the authenticated Kalodata Open Center docs.'
    );
  }
});
