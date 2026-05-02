import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {Platform, StyleSheet} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE} from 'react-native-maps';
import {COLORS, MAP_DARK_STYLE} from '@constants/colors';
import {CONFIG} from '@constants/config';

// Padding (dp) around the polyline bounding box when fitting the route view.
const FIT_PADDING = {top: 80, right: 60, bottom: 80, left: 60};

export function RideMap({
  coordinates,
  memories = [],
  follow = true,
  fitToRoute = false,
  onMemoryPress,
}) {
  const mapRef = useRef(null);

  const initialRegion = useMemo(() => {
    const fallback = {latitude: 19.076, longitude: 72.8777};
    const first = coordinates[0] ?? fallback;
    return {
      latitude: first.latitude,
      longitude: first.longitude,
      latitudeDelta: CONFIG.map.initialLatitudeDelta,
      longitudeDelta: CONFIG.map.initialLongitudeDelta,
    };
  }, [coordinates]);

  // Follow mode: keep camera centred on the latest coordinate while recording.
  useEffect(() => {
    if (!follow || coordinates.length === 0) return;
    const last = coordinates[coordinates.length - 1];
    mapRef.current?.animateCamera({center: last}, {duration: 500});
  }, [coordinates, follow]);

  const polylineCoords = useMemo(
    () => coordinates.map(c => ({latitude: c.latitude, longitude: c.longitude})),
    [coordinates],
  );

  // Summary mode: once the map is ready, zoom to fit the entire route.
  const handleMapReady = useCallback(() => {
    if (!fitToRoute || polylineCoords.length === 0) return;

    if (polylineCoords.length === 1) {
      // Single-point ride — just centre and zoom in.
      mapRef.current?.animateCamera(
        {center: polylineCoords[0], zoom: 15},
        {duration: 0},
      );
      return;
    }

    // fitToCoordinates calculates the tightest bounding box that contains all
    // points and then applies edgePadding so the polyline isn't clipped.
    mapRef.current?.fitToCoordinates(polylineCoords, {
      edgePadding: FIT_PADDING,
      animated: false,
    });
  }, [fitToRoute, polylineCoords]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
      customMapStyle={MAP_DARK_STYLE}
      initialRegion={initialRegion}
      onMapReady={handleMapReady}
      showsUserLocation={!fitToRoute}
      showsMyLocationButton={false}
      showsCompass={false}
      pitchEnabled={false}
      toolbarEnabled={false}>

      {polylineCoords.length > 1 ? (
        <Polyline
          coordinates={polylineCoords}
          strokeColor={COLORS.mapPolyline}
          strokeWidth={CONFIG.map.polylineWidth}
          lineCap="round"
          lineJoin="round"
        />
      ) : null}

      {/* Start marker */}
      {polylineCoords.length > 0 ? (
        <Marker
          coordinate={polylineCoords[0]}
          pinColor={COLORS.mapMarkerStart}
          title="Start"
        />
      ) : null}

      {/* End marker — only shown in summary (fitToRoute) mode */}
      {fitToRoute && polylineCoords.length > 1 ? (
        <Marker
          coordinate={polylineCoords[polylineCoords.length - 1]}
          pinColor={COLORS.danger}
          title="End"
        />
      ) : null}

      {memories.map(memory => (
        <Marker
          key={memory.id}
          coordinate={memory.coordinate}
          pinColor={COLORS.mapMemoryMarker}
          onPress={() => onMemoryPress?.(memory)}
          title={memory.caption ?? 'Memory'}
        />
      ))}
    </MapView>
  );
}
