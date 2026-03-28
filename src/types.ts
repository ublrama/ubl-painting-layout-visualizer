export interface Painting {
  signatuur: string;
  width: number;  // cm
  height: number; // cm
}

export interface PlacedPainting extends Painting {
  x: number; // cm from left of wall
  y: number; // cm from top of wall
}

export interface Wall {
  index: number;
  paintings: PlacedPainting[];
}

export type Collection = 'BWB' | 'AHM' | 'Bild. Mus. Geerts' | 'Icones' | 'Unknown';
