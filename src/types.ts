export interface Painting {
  signatuur: string;
  collection: string;
  width: number;   // cm (breedte)
  height: number;  // cm (hoogte)
  depth: number;   // cm (diepte), 0 if missing
}

export interface RackType {
  id: number;
  height: number;    // cm
  width: number;     // cm
  maxDepth: number;  // cm
}

export interface Rack {
  name: string;       // e.g. "Pos. 5-1a"
  rackType: RackType;
  frontPaintings: PlacedPainting[];
  backPaintings: PlacedPainting[];
}

export interface PlacedPainting extends Painting {
  x: number; // cm from left of rack face
  y: number; // cm from top of rack face
}

export interface AssignmentResult {
  racks: Rack[];
  unassigned: Painting[];
}
