export const COLORS = {
  // Surfaces
  background: '#0F0F10',
  backgroundElevated: '#161618',
  surface: '#1C1C1F',
  surfaceMuted: '#242427',
  surfaceOverlay: 'rgba(15, 15, 16, 0.85)',

  // Borders
  border: '#2D2D31',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',

  // Text
  textPrimary: '#FAFAFA',
  textSecondary: '#A0A0A8',
  textTertiary: '#6B6B73',
  textInverse: '#0F0F10',

  // Brand / chart accents (mirrors chart-1..chart-5 from Figma tokens)
  accentPrimary: '#5DD879', // chart-1 — vivid lime/green (primary CTA, active GPS, route start)
  accentCyan: '#1AB5D2',    // chart-2 — teal cyan (route end, secondary metrics)
  accentAmber: '#C49A2A',   // chart-3 — gold/amber (warnings, time)
  accentOrange: '#DA9268',  // chart-4 — warm orange (breaks, dwell)
  accentViolet: '#7E69E8',  // chart-5 — violet (achievements)

  // Semantic
  success: '#5DD879',
  warning: '#C49A2A',
  danger: '#E5523A',
  info: '#1AB5D2',

  // Map
  mapPolyline: '#5DD879',
  mapPolylineShadow: 'rgba(93, 216, 121, 0.35)',
  mapMarkerStart: '#5DD879',
  mapMarkerEnd: '#1AB5D2',
  mapMemoryMarker: '#DA9268',

  // Misc
  shadow: '#000000',
  transparent: 'transparent',
};

export const MAP_DARK_STYLE = [
  {elementType: 'geometry', stylers: [{color: '#1C1C1F'}]},
  {elementType: 'labels.text.stroke', stylers: [{color: '#0F0F10'}]},
  {elementType: 'labels.text.fill', stylers: [{color: '#A0A0A8'}]},
  {featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{color: '#A0A0A8'}]},
  {featureType: 'poi', elementType: 'labels.text.fill', stylers: [{color: '#6B6B73'}]},
  {featureType: 'poi.park', elementType: 'geometry', stylers: [{color: '#1F2A1F'}]},
  {featureType: 'road', elementType: 'geometry', stylers: [{color: '#2D2D31'}]},
  {featureType: 'road', elementType: 'geometry.stroke', stylers: [{color: '#0F0F10'}]},
  {featureType: 'road', elementType: 'labels.text.fill', stylers: [{color: '#A0A0A8'}]},
  {featureType: 'road.highway', elementType: 'geometry', stylers: [{color: '#3A3A40'}]},
  {featureType: 'transit', elementType: 'geometry', stylers: [{color: '#242427'}]},
  {featureType: 'water', elementType: 'geometry', stylers: [{color: '#0A1A22'}]},
  {featureType: 'water', elementType: 'labels.text.fill', stylers: [{color: '#1AB5D2'}]},
];
