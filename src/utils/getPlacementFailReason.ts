import type { Painting, Rack } from '../types';
import { MARGIN } from '../constants';

export type PlacementFailReason =
  | 'too-deep'         // depth exceeds maxDepth of every rack
  | 'too-wide'         // wider than every depth-compatible rack
  | 'too-tall'         // taller than every depth-compatible rack
  | 'predefined-full'  // has a forced rack but that rack is full
  | 'all-racks-full';  // physically fits somewhere but every rack is out of space

export interface PlacementFailInfo {
  reason: PlacementFailReason;
  /** Short Dutch label shown in the UI */
  label: string;
  /** One-sentence Dutch explanation */
  detail: string;
}

/**
 * Determines why `painting` ended up unassigned, given the full rack list.
 *
 * We replicate the same checks the assignment algorithm uses so that
 * the reason is always accurate and requires no extra API calls.
 */
export function getPlacementFailReason(
  painting: Painting,
  racks: Rack[],
): PlacementFailInfo {
  // 1. Predefined rack is specified but that rack is full?
  if (painting.predefinedRack) {
    const forced = racks.find((r) => r.name === painting.predefinedRack);
    if (forced) {
      const { width: rw, height: rh } = forced.rackType;
      const usedArea = forced.paintings.reduce((s, p) => s + p.width * p.height, 0);
      const totalArea = rw * rh;
      if (usedArea + painting.width * painting.height > totalArea) {
        return {
          reason: 'predefined-full',
          label: 'Aangewezen rek vol',
          detail: `Rek ${painting.predefinedRack} is vol — het schilderij (${painting.width}×${painting.height} cm) past er niet meer in.`,
        };
      }
    }
  }

  // 2. Depth check — no rack accepts this depth
  const depthCompatible = racks.filter((r) => r.rackType.maxDepth >= painting.depth);
  if (depthCompatible.length === 0) {
    const maxAvailDepth = Math.max(...racks.map((r) => r.rackType.maxDepth));
    return {
      reason: 'too-deep',
      label: 'Te diep',
      detail: `Schilderij is ${painting.depth} cm diep; het diepste rek accepteert maar ${maxAvailDepth} cm.`,
    };
  }

  // 3. Width check — wider than every depth-compatible rack
  const widthCompatible = depthCompatible.filter(
    (r) => r.rackType.width >= painting.width + MARGIN * 2,
  );
  if (widthCompatible.length === 0) {
    const maxAvailWidth = Math.max(...depthCompatible.map((r) => r.rackType.width));
    return {
      reason: 'too-wide',
      label: 'Te breed',
      detail: `Schilderij is ${painting.width} cm breed; het breedste geschikte rek is ${maxAvailWidth} cm.`,
    };
  }

  // 4. Height check — taller than every width+depth compatible rack
  const sizeCompatible = widthCompatible.filter(
    (r) => r.rackType.height >= painting.height + MARGIN * 2,
  );
  if (sizeCompatible.length === 0) {
    const maxAvailHeight = Math.max(...widthCompatible.map((r) => r.rackType.height));
    return {
      reason: 'too-tall',
      label: 'Te hoog',
      detail: `Schilderij is ${painting.height} cm hoog; het hoogste geschikte rek is ${maxAvailHeight} cm.`,
    };
  }

  // 5. Physically fits, but all racks that could hold it are simply full
  return {
    reason: 'all-racks-full',
    label: 'Rekken vol',
    detail: `Schilderij (${painting.width}×${painting.height} cm) past qua afmeting, maar er is geen aaneengesloten ruimte meer beschikbaar.`,
  };
}

/** Colour classes per reason for consistent badge styling */
export const FAIL_REASON_COLORS: Record<PlacementFailReason, string> = {
  'too-deep':        'bg-red-100 text-red-700 border-red-200',
  'too-wide':        'bg-orange-100 text-orange-700 border-orange-200',
  'too-tall':        'bg-orange-100 text-orange-700 border-orange-200',
  'predefined-full': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'all-racks-full':  'bg-gray-100 text-gray-600 border-gray-200',
};

