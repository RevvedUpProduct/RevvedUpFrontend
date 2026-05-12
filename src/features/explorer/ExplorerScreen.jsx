import React, {useCallback, useMemo, useRef, useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE} from 'react-native-maps';
import {COLORS, MAP_DARK_STYLE} from '@constants/colors';
import {FONT, RADIUS, SHADOW, SPACING} from '@constants/spacing';
import {useHistoryStore} from '@store/historyStore';
import {useMemoryStore} from '@store/memoryStore';
import {MemoryMapMarker} from '@features/ride/components/MemoryMapMarker';
import {MemoryViewer} from '@features/ride/components/MemoryViewer';
import {readJSON, STORAGE_KEYS} from '@services/storage';

// Distinct colours for up to 10 rides; cycles if there are more.
const ROUTE_COLORS = [
  COLORS.accentPrimary,   // green
  COLORS.accentCyan,      // teal
  COLORS.accentViolet,    // violet
  COLORS.accentAmber,     // amber
  COLORS.accentOrange,    // orange
  '#E85A8C',              // pink
  '#5AB4E8',              // sky blue
  '#C8E85A',              // lime
  '#E8A05A',              // peach
  '#8CE85A',              // bright green
];

function routeColor(index) {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

const MUMBAI_REGION = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 4,
  longitudeDelta: 4,
};

const FIT_PADDING = {top: 80, right: 60, bottom: 80, left: 60};

export function ExplorerScreen({navigation}) {
  const mapRef = useRef(null);
  const rides = useHistoryStore(s => s.rides);
  const byRide = useMemoryStore(s => s.byRide);

  const [selectedMemory, setSelectedMemory] = useState(null);

  // Load full ride details (with coordinates) from MMKV for each ride in
  // the history list. This is a synchronous read so no async state needed.
  const ridesWithCoords = useMemo(() => {
    return rides
      .map(summary => {
        const detail = readJSON(STORAGE_KEYS.rideDetail(summary.id));
        if (!detail?.coordinates?.length) return null;
        return {
          ...summary,
          coordinates: detail.coordinates,
        };
      })
      .filter(Boolean);
  }, [rides]);

  // All memories across every ride, flat list for the map.
  const allMemories = useMemo(() => {
    return Object.values(byRide).flat();
  }, [byRide]);

  // Once the map is ready, fit to all known coordinate points.
  const handleMapReady = useCallback(() => {
    const allPoints = ridesWithCoords.flatMap(r =>
      r.coordinates.map(c => ({latitude: c.latitude, longitude: c.longitude})),
    );
    if (allPoints.length > 1) {
      mapRef.current?.fitToCoordinates(allPoints, {
        edgePadding: FIT_PADDING,
        animated: true,
      });
    }
  }, [ridesWithCoords]);

  const handleMemoryPress = useCallback(m => setSelectedMemory(m), []);

  const handleRidePress = useCallback(
    rideId => {
      // Navigate into the history stack's RideDetail screen.
      navigation.navigate('History', {
        screen: 'RideDetail',
        params: {rideId},
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
        <Text style={styles.subtitle}>
          {ridesWithCoords.length === 0
            ? 'Complete rides to see your routes here'
            : `${ridesWithCoords.length} ride${ridesWithCoords.length === 1 ? '' : 's'} plotted`}
        </Text>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          customMapStyle={MAP_DARK_STYLE}
          initialRegion={MUMBAI_REGION}
          onMapReady={handleMapReady}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          pitchEnabled={false}
          toolbarEnabled={false}>

          {ridesWithCoords.map((ride, idx) => {
            const polylineCoords = ride.coordinates.map(c => ({
              latitude: c.latitude,
              longitude: c.longitude,
            }));
            const color = routeColor(idx);
            // Midpoint marker — tapping it navigates to the ride detail.
            const midIdx = Math.floor(polylineCoords.length / 2);
            const midPoint = polylineCoords[midIdx];

            return (
              <React.Fragment key={ride.id}>
                <Polyline
                  coordinates={polylineCoords}
                  strokeColor={color}
                  strokeWidth={4}
                  lineCap="round"
                  lineJoin="round"
                />
                {/* Start dot */}
                <Marker
                  coordinate={polylineCoords[0]}
                  anchor={{x: 0.5, y: 0.5}}
                  tracksViewChanges={false}>
                  <View style={[styles.dot, {backgroundColor: color}]} />
                </Marker>
                {/* Invisible mid-route tap target */}
                <Marker
                  coordinate={midPoint}
                  anchor={{x: 0.5, y: 0.5}}
                  tracksViewChanges={false}
                  onPress={() => handleRidePress(ride.id)}>
                  <View style={[styles.rideBadge, SHADOW.sm, {borderColor: color}]}>
                    <Text style={[styles.rideBadgeText, {color}]} allowFontScaling={false}>
                      {idx + 1}
                    </Text>
                  </View>
                </Marker>
              </React.Fragment>
            );
          })}

          {allMemories.map(memory => (
            <MemoryMapMarker
              key={memory.id}
              memory={memory}
              onPress={handleMemoryPress}
            />
          ))}
        </MapView>

        {/* Empty state overlay */}
        {ridesWithCoords.length === 0 ? (
          <View style={styles.emptyOverlay} pointerEvents="none">
            <Text style={styles.emptyGlyph}>◉</Text>
            <Text style={styles.emptyText}>No routes yet</Text>
            <Text style={styles.emptySubtext}>
              Start your first ride from the Home tab
            </Text>
          </View>
        ) : null}

        {/* Legend */}
        {ridesWithCoords.length > 0 ? (
          <View style={[styles.legend, SHADOW.md]}>
            <Pressable
              style={styles.legendFitBtn}
              onPress={handleMapReady}
              accessibilityRole="button"
              accessibilityLabel="Fit all routes">
              <Text style={styles.legendFitText} allowFontScaling={false}>⊞ Fit all</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <MemoryViewer
        memory={selectedMemory}
        visible={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.xxs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.xxl,
    fontWeight: FONT.weight.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
  },
  mapWrapper: {
    flex: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  rideBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideBadgeText: {
    fontSize: FONT.size.xs,
    fontWeight: FONT.weight.bold,
    includeFontPadding: false,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(15,15,16,0.55)',
  },
  emptyGlyph: {
    fontSize: 48,
    color: COLORS.textTertiary,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.lg,
    fontWeight: FONT.weight.semibold,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: FONT.size.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  legend: {
    position: 'absolute',
    top: SPACING.base,
    right: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendFitBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  legendFitText: {
    color: COLORS.textPrimary,
    fontSize: FONT.size.sm,
    fontWeight: FONT.weight.semibold,
  },
});
