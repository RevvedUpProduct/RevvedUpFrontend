import React from 'react';
import {Marker} from 'react-native-maps';

/** Bundled raster icon — Maps markers only accept images, not vector icon components. */
const MEMORY_MARKER_IMAGE = require('../../../assets/map/memory-marker.png');

/**
 * Memory pin on the map.
 *
 * IMPORTANT (Android / Google Maps + Fabric): Do not render custom React children
 * inside `<Marker>` — ViewAttacherGroup crashes when markers update. Use `image={require(...)}`.
 */
function parseCoordinate(coord) {
  if (!coord || typeof coord !== 'object') return null;
  const latitude = Number(coord.latitude);
  const longitude = Number(coord.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return {latitude, longitude};
}

export function MemoryMapMarker({memory, onPress}) {
  const coordinate = parseCoordinate(memory?.coordinate);
  if (!coordinate) return null;

  const rawCaption = memory.caption != null ? String(memory.caption).trim() : '';
  const title = rawCaption.length > 0 ? rawCaption.slice(0, 60) : 'Memory';

  return (
    <Marker
      coordinate={coordinate}
      image={MEMORY_MARKER_IMAGE}
      anchor={{x: 0.5, y: 1}}
      title={title}
      tracksViewChanges={false}
      onPress={() => onPress?.(memory)}
    />
  );
}
