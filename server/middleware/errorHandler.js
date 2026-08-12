// Central error handler. Converts thrown errors (KalodataApiError or anything
// else) into a clean, consistent JSON response. Never includes the API key,
// the configured auth header name, or any raw upstream payload.

import { KalodataApiError } from '../services/kalodataClient.js';

const FRIENDLY_MESSAGES = {
  CONFIG: 'Please check your API configuration.',
  AUTH: 'Kalodata authentication failed. Please verify the API authentication header configuration.',
  RATE_LIMIT: 'Kalodata rate limit reached. Please wait a moment and try again.',
  UPSTREAM: 'Kalodata API returned an error.',
  NETWORK: 'Unable to load product data.',
  TIMEOUT: 'Unable to load product data.',
  NOT_FOUND: 'The requested item was not found.',
  INVALID_RESPONSE: 'Kalodata API returned an unexpected response.',
};

const STATUS_BY_CODE = {
  CONFIG: 500,
  AUTH: 401,
  RATE_LIMIT: 429,
  UPSTREAM: 502,
  NETWORK: 502,
  TIMEOUT: 504,
  NOT_FOUND: 404,
  INVALID_RESPONSE: 502,
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof KalodataApiError) {
    const status = err.status && err.status >= 400 ? err.status : STATUS_BY_CODE[err.code] || 500;
    const message = FRIENDLY_MESSAGES[err.code] || 'Unable to load product data.';
    // Log the real underlying reason server-side (never sent to the client) — this is our
    // own error's message/code, not the API key, so it's always safe to print.
    console.error(
      `[${req.method} ${req.originalUrl}] KalodataApiError(${err.code}, upstream status ${err.status ?? 'n/a'}): ${err.message}`
    );
    return res.status(status).json({ error: message });
  }

  console.error('Unhandled server error:', err?.message || err);
  return res.status(500).json({ error: 'Something went wrong on our end. Please try again.' });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found.' });
}
