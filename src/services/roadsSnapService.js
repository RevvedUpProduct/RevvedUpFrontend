import {CONFIG} from '@constants/config';

const SNAP_URL = 'https://roads.googleapis.com/v1/snapToRoads';

/**
 * Google Roads API — Snap to Roads. Aligns a GPS trace to the road network.
 * @see https://developers.google.com/maps/documentation/roads/snap
 *
 * Requires `CONFIG.roads.apiKey` and Roads API enabled for the key (GCP).
 * Returns `{ ok: false }` when disabled, no key, or network/API error (caller keeps raw coords).
 */

function toPathSegment(coords) {
  return coords.map(c => `${c.latitude},${c.longitude}`).join('|');
}

function extractSnappedLatLng(json) {
  const pts = json?.snappedPoints;
  if (!Array.isArray(pts) || pts.length === 0) return [];
  return pts
    .map(p => {
      const loc = p?.location;
      if (!loc) return null;
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {latitude: lat, longitude: lng};
    })
    .filter(Boolean);
}

function dedupeConsecutive(coords, eps = 1e-6) {
  if (coords.length < 2) return coords;
  const out = [coords[0]];
  for (let i = 1; i < coords.length; i += 1) {
    const a = out[out.length - 1];
    const b = coords[i];
    if (Math.abs(a.latitude - b.latitude) > eps || Math.abs(a.longitude - b.longitude) > eps) {
      out.push(b);
    }
  }
  return out;
}

function chunkOverlapping(coords, chunkSize, overlap) {
  const chunks = [];
  let start = 0;
  while (start < coords.length) {
    const end = Math.min(start + chunkSize, coords.length);
    chunks.push(coords.slice(start, end));
    if (end >= coords.length) break;
    start = end - overlap;
  }
  return chunks;
}

/**
 * @param {Array<{latitude: number, longitude: number}>} coordinates raw ride points
 * @returns {Promise<{ ok: boolean, coordinates?: Array, error?: string }>}
 */
export async function snapCoordinatesToRoads(coordinates) {
  const roads = CONFIG.roads;
  if (!roads?.snapEnabled || !roads?.apiKey?.trim()) {
    return {ok: false, error: 'roads_snap_disabled'};
  }
  if (!coordinates || coordinates.length < 2) {
    return {ok: false, error: 'not_enough_points'};
  }

  const chunkSize = Math.min(roads.maxPointsPerRequest ?? 100, 100);
  const overlap = 1;
  const chunks =
    coordinates.length <= chunkSize
      ? [coordinates]
      : chunkOverlapping(coordinates, chunkSize, overlap);

  const interpolate = roads.interpolate !== false;
  const key = roads.apiKey.trim();
  const timeoutMs = roads.timeoutMs ?? 30_000;

  try {
    const merged = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const path = toPathSegment(chunks[i]);
      const params = new URLSearchParams({
        path,
        interpolate: interpolate ? 'true' : 'false',
        key,
      });
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${SNAP_URL}?${params.toString()}`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!res.ok) {
        let detail = res.statusText;
        try {
          const errBody = await res.json();
          if (errBody?.error?.message) detail = errBody.error.message;
        } catch {
          /* ignore */
        }
        return {ok: false, error: `roads_http_${res.status}: ${detail}`};
      }

      const json = await res.json();
      const snapped = extractSnappedLatLng(json);
      if (snapped.length === 0) {
        return {ok: false, error: 'roads_empty_snapped'};
      }

      if (merged.length === 0) {
        merged.push(...snapped);
      } else {
        const last = merged[merged.length - 1];
        const first = snapped[0];
        const skipFirst =
          Math.abs(last.latitude - first.latitude) < 1e-6 &&
          Math.abs(last.longitude - first.longitude) < 1e-6;
        merged.push(...snapped.slice(skipFirst ? 1 : 0));
      }
    }

    const finalCoords = dedupeConsecutive(merged);
    if (finalCoords.length < 2) {
      return {ok: false, error: 'roads_too_few_after_snap'};
    }
    return {ok: true, coordinates: finalCoords};
  } catch (e) {
    const message = e?.name === 'AbortError' ? 'roads_timeout' : e?.message ?? 'roads_unknown';
    return {ok: false, error: String(message)};
  }
}
