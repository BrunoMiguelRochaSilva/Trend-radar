import crypto from 'node:crypto';
import fs from 'node:fs';
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
import { creditsRouter } from './routes/credits.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;
const USE_MOCK_DATA = String(process.env.USE_MOCK_DATA).toLowerCase() === 'true';
const APP_PASSWORD = process.env.APP_PASSWORD;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// Password gate for a deployed copy: set APP_PASSWORD on the host and the browser shows its
// own login box (any username). Everything — site and /api — sits behind it, so nobody
// else can spend the Kalodata credits. Unset (local dev) = no gate.
if (APP_PASSWORD) {
  const expected = Buffer.from(APP_PASSWORD);
  app.use((req, res, next) => {
    const [scheme, encoded] = (req.headers.authorization || '').split(' ');
    const decoded = scheme === 'Basic' && encoded ? Buffer.from(encoded, 'base64').toString() : '';
    const given = Buffer.from(decoded.slice(decoded.indexOf(':') + 1));
    if (decoded.includes(':') && given.length === expected.length && crypto.timingSafeEqual(given, expected)) {
      return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="TrendRadar", charset="UTF-8"');
    res.status(401).send('Password required.');
  });
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: USE_MOCK_DATA ? 'mock' : 'live' });
});

app.use('/api/products', productsRouter);
app.use('/api/videos', videosRouter);
app.use('/api/credits', creditsRouter);

app.use('/api', notFoundHandler);

// Deployed: this same server also serves the built site (`npm run build` → dist/), so one
// Node service hosts everything. Any non-API path gets index.html (client-side routes).
// In dev, Vite serves the site on :5173 and proxies /api here instead.
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TrendRadar API listening on http://localhost:${PORT} (mode: ${USE_MOCK_DATA ? 'MOCK' : 'LIVE'})`);
  if (!APP_PASSWORD) console.log('No APP_PASSWORD set — the site is open to anyone who can reach it.');
});
