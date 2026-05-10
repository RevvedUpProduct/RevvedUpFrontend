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
      // The backend returns { "error": { "code": "…", "message": "…" } } on errors.
      // Try to extract that shape; fall back to raw text if the body isn't JSON or
      // doesn't match the expected envelope.
      let code = statusToCode(res.status);
      let message = res.statusText;
      try {
        const body = await res.json();
        if (body?.error?.message) message = body.error.message;
        if (body?.error?.code) code = body.error.code;
      } catch {
        message = await res.text().catch(() => res.statusText) || res.statusText;
      }
      return {ok: false, error: {code, message}};
    }

    const data = await res.json();
    return {ok: true, data};
  } catch (err) {
    return {ok: false, error: toApiError(err)};
  } finally {
    clearTimeout(timeoutId);
  }
}

