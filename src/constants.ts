// Wall dimensions in centimetres
export const WALL_WIDTH = 375;
export const WALL_HEIGHT = 240;

// Padding around each painting (on all four sides) in centimetres
export const PADDING = 5;

// Default render scale: pixels per centimetre
export const SCALE = 2;

// Color map keyed by collection prefix
export const COLLECTION_COLORS: Record<string, string> = {
  BWB: '#3b82f6',              // blue-500
  AHM: '#22c55e',              // green-500
  'Bild. Mus. Geerts': '#f97316', // orange-500
  Icones: '#a855f7',           // purple-500
  Unknown: '#6b7280',          // gray-500
};
