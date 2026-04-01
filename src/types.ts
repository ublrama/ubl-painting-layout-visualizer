export interface Painting {
  id: string;                       // uuid
  signatuur: string;
  collection: string;
  width: number;                    // cm (breedte)
  height: number;                   // cm (hoogte)
  depth: number;                    // cm (diepte), 0 if missing
  assignedRackName: string | null;  // null = unassigned
  manuallyPlaced: boolean;          // true once physically confirmed
  predefinedRack: string | null;    // rack name forced by the CSV "Rek" column
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
  paintings: PlacedPainting[];
}

export interface PlacedPainting extends Painting {
  x: number; // cm from left of rack face
  y: number; // cm from top of rack face
}

export interface AssignmentResult {
  racks: Rack[];
  unassigned: Painting[];
  confirmedAt: string | null;  // ISO date string when placement was confirmed/frozen
}

export interface RackSuggestion {
  rackName: string;
  rackType: RackType;
  paintingCount: number;
  canFit: boolean;
  remainingArea: number;
}

export interface MoveSuggestion {
  painting: PlacedPainting;
  suggestedRack: string;
  canFit: boolean;
}

export interface ForcePlacementResult {
  canPlaceDirectly: boolean;
  moveSuggestions: MoveSuggestion[];
}

export interface FillSuggestion {
  painting: Painting;
  fitsWidth: number;
  fitsHeight: number;
}
