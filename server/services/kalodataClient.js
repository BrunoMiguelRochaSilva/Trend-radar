// Low-level HTTP client for the Kalodata Open Center API.
// Owns: base URL, authentication header, POST semantics, timeout, and
// baseline error/response validation. Nothing above this layer should ever
// touch axios or the raw Kalodata response shape directly.

import axios from 'axios';

const BASE_URL = 'https://www.kalodata.com';
const REQUEST_TIMEOUT_MS = 10_000;

export class KalodataApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'KalodataApiError';
    this.status = status;
    this.code = code; // 'AUTH' | 'RATE_LIMIT' | 'UPSTREAM' | 'NETWORK' | 'TIMEOUT' | 'CONFIG' | 'INVALID_RESPONSE'
  }
}

/**
 * Builds the auth header object from env config.
 *
 * CONFIRMED from the official Kalodata Open Center "Quick API Example":
 *   curl -H "secret-key: YOUR_API_KEY" ...
 * i.e. the raw key is sent as-is in a `secret-key` header — no scheme prefix
 * (not `Authorization: Bearer`, not `X-API-Key`). That maps to:
 *   KALODATA_AUTH_HEADER=secret-key
 *   KALODATA_AUTH_SCHEME=
 * Still driven entirely from .env rather than hardcoded here, so if Kalodata
 * ever changes this it's a config change, not a code change.
 */
function buildAuthHeaders() {
  const apiKey = process.env.KALODATA_API_KEY;
  // Defaults to the confirmed `secret-key` header, so a deployment only needs the key itself.
  const headerName = process.env.KALODATA_AUTH_HEADER || 'secret-key';
  const scheme = process.env.KALODATA_AUTH_SCHEME;

  if (!apiKey) {
    throw new KalodataApiError(
      'KALODATA_API_KEY is not configured.',
      { code: 'CONFIG' }
    );
  }

  const value = scheme ? `${scheme} ${apiKey}` : apiKey;
  return { [headerName]: value };
}

const client = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  // Matches the official Kalodata Quick API Example's content-type exactly.
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
});

/**
 * Call a Kalodata Open Center endpoint and return the parsed JSON body.
 * Validates `success` per the documented response envelope; never leaks the
 * API key or its header name in thrown errors.
 */
async function requestKalodata(method, path, body) {
  let response;
  try {
    response = await client.request({ method, url: path, data: body, headers: buildAuthHeaders() });
  } catch (err) {
    if (err instanceof KalodataApiError) throw err;

    // Diagnostic logging server-side only — this is Kalodata's response / axios's own
    // error info, never our request headers, so it never contains the API key.
    console.error(
      `Kalodata ${path} failed — axios code: ${err.code}, message: ${err.message}, ` +
        `HTTP status: ${err.response?.status ?? '(none — no response received)'}, ` +
        `body: ${JSON.stringify(err.response?.data)?.slice(0, 500)}`
    );

    if (err.code === 'ECONNABORTED') {
      throw new KalodataApiError('Kalodata API request timed out.', { code: 'TIMEOUT' });
    }
    if (!err.response) {
      throw new KalodataApiError('Unable to reach the Kalodata API.', { code: 'NETWORK' });
    }

    const status = err.response.status;
    if (status === 401 || status === 403) {
      throw new KalodataApiError('Kalodata authentication failed.', { status, code: 'AUTH' });
    }
    if (status === 429) {
      throw new KalodataApiError('Kalodata rate limit reached.', { status, code: 'RATE_LIMIT' });
    }
    throw new KalodataApiError('Kalodata API returned an error.', { status, code: 'UPSTREAM' });
  }

  const data = response.data;

  if (!data || typeof data !== 'object') {
    throw new KalodataApiError('Kalodata API returned an invalid response.', {
      code: 'INVALID_RESPONSE',
    });
  }

  if (data.success === false) {
    // Kalodata's own documented example/mock responses show `success: false`
    // alongside a fully populated `data` payload — so this flag alone does NOT
    // mean "no results" or "request failed". Only treat it as an error when the
    // response actually carries an auth/rate-limit/error signal; otherwise pass
    // the (still-valid) data through untouched.
    const message = data.message || data.msg || data.error || '';
    const errorCode = String(data.code ?? data.error_code ?? data.errorCode ?? '').toLowerCase();
    const haystack = `${errorCode} ${message}`.toLowerCase();

    if (/(unauth|401|forbidden|403|invalid.*key|invalid.*token)/.test(haystack)) {
      throw new KalodataApiError(message || 'Kalodata authentication failed.', { code: 'AUTH' });
    }
    if (/(rate.?limit|429|too many requests)/.test(haystack)) {
      throw new KalodataApiError(message || 'Kalodata rate limit reached.', { code: 'RATE_LIMIT' });
    }

    const hasUsableData = data.data !== undefined && data.data !== null;
    if (hasUsableData) {
      return data;
    }

    throw new KalodataApiError(message || 'Kalodata API reported failure.', { code: 'UPSTREAM' });
  }

  return data;
}

export function postKalodata(path, body) {
  return requestKalodata('post', path, body);
}

export function getKalodata(path) {
  return requestKalodata('get', path);
}
