import {CONFIG} from '@constants/config';

function buildUrl(path, query) {
  const base = `${CONFIG.api.baseUrl}${path}`;
  if (!query) return base;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return params ? `${base}?${params}` : base;
}

function toApiError(error) {
  if (error instanceof Error && error.name === 'AbortError') {
    return {code: 'TIMEOUT', message: 'Request was aborted'};
  }
  if (error instanceof TypeError) {
    return {code: 'NETWORK_ERROR', message: error.message};
  }
  return {code: 'UNKNOWN', message: error instanceof Error ? error.message : 'Unknown error'};
}

function statusToCode(status) {
  if (status === 401 || status === 403) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN';
}

export async function request(init) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.api.timeoutMs);
  init.signal?.addEventListener('abort', () => controller.abort());

  try {
    const res = await fetch(buildUrl(init.path, init.query), {
      method: init.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const message = await res.text().catch(() => res.statusText);
      return {
        ok: false,
        error: {code: statusToCode(res.status), message: message || res.statusText},
      };
    }

    const data = await res.json();
    return {ok: true, data};
  } catch (err) {
    return {ok: false, error: toApiError(err)};
  } finally {
    clearTimeout(timeoutId);
  }
}

export function simulateLatency() {
  const {mockLatencyMinMs, mockLatencyMaxMs} = CONFIG.api;
  const ms = mockLatencyMinMs + Math.random() * (mockLatencyMaxMs - mockLatencyMinMs);
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function maybeMockFailure() {
  if (CONFIG.api.mockFailureRate <= 0) return null;
  if (Math.random() >= CONFIG.api.mockFailureRate) return null;
  return {code: 'NETWORK_ERROR', message: 'Simulated mock failure'};
}
