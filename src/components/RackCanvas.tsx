/**
 * RackCanvas — renders the rack face and optionally enables interactive
 * drag-and-drop repositioning of paintings.
 *
 * When editMode=true the user can drag any painting to a new position.
 * Position is snapped to the nearest 1 cm and validated:
 *   • must stay within the rack with ≥ MARGIN cm from every wall
 *   • must not overlap any other painting (with ≥ MARGIN cm gap)
 * Valid drop: green border.  Invalid drop: red border + drop is cancelled.
 * A faded ghost marks the original position while the painting is in flight.
 */

import { useRef, useState, useCallback } from 'react';
import type { Rack, PlacedPainting } from '../types';
import { PaintingRect } from './PaintingRect';
import { MARGIN } from '../constants';

export interface RackCanvasProps {
  rack: Rack;
  scale: number;
  editMode?: boolean;
  /** Called when a painting is successfully dropped at a new position. */
  onPaintingMove?: (paintingId: string, newX: number, newY: number) => Promise<void>;
}

// ── Drag state ─────────────────────────────────────────────────────────────

interface DragState {
  painting:  PlacedPainting;
  /** Where within the painting the pointer first landed (cm). */
  offsetX:   number;
  offsetY:   number;
  /** Current snapped top-left in rack cm. */
  currentX:  number;
  currentY:  number;
  isValid:   boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const snap = (v: number) => Math.round(v); // 1 cm grid

function positionValid(
  p:   PlacedPainting,
  nx:  number,
  ny:  number,
  all: PlacedPainting[],
  rw:  number,
  rh:  number,
): boolean {
  // Rack boundary (MARGIN from every wall)
  if (nx < MARGIN || ny < MARGIN)                        return false;
  if (nx + p.width  + MARGIN > rw)                       return false;
  if (ny + p.height + MARGIN > rh)                       return false;

  // No overlap with other paintings (MARGIN gap required on all sides)
  for (const o of all) {
    if (o.id === p.id) continue;
    const separated =
      nx + p.width  + MARGIN <= o.x ||
      o.x + o.width + MARGIN <= nx  ||
      ny + p.height + MARGIN <= o.y ||
      o.y + o.height + MARGIN <= ny;
    if (!separated) return false;
  }
  return true;
}

// ── Component ──────────────────────────────────────────────────────────────

export function RackCanvas({ rack, scale, editMode = false, onPaintingMove }: RackCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag,   setDrag]   = useState<DragState | null>(null);
  const [saving, setSaving] = useState(false);

  const { width: rw, height: rh } = rack.rackType;

  // Convert a pointer event to rack coordinates (cm)
  const toCm = useCallback((e: React.PointerEvent) => {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / scale,
      y: (e.clientY - r.top)  / scale,
    };
  }, [scale]);

  // ── Pointer handlers ────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!editMode || saving) return;
    const cm = toCm(e);
    // Pick the topmost painting at the cursor (iterate reversed to match z-order)
    const painting = [...rack.paintings].reverse().find(
      p => cm.x >= p.x && cm.x <= p.x + p.width &&
           cm.y >= p.y && cm.y <= p.y + p.height,
    );
    if (!painting) return;

    e.preventDefault();
    containerRef.current?.setPointerCapture(e.pointerId);
    setDrag({
      painting,
      offsetX:  cm.x - painting.x,
      offsetY:  cm.y - painting.y,
      currentX: painting.x,
      currentY: painting.y,
      isValid:  true,
    });
  }, [editMode, saving, toCm, rack.paintings]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return;
    e.preventDefault();
    const cm = toCm(e);
    const nx = snap(cm.x - drag.offsetX);
    const ny = snap(cm.y - drag.offsetY);
    const valid = positionValid(drag.painting, nx, ny, rack.paintings, rw, rh);
    setDrag(prev => prev ? { ...prev, currentX: nx, currentY: ny, isValid: valid } : null);
  }, [drag, toCm, rack.paintings, rw, rh]);

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    if (!drag) return;
    containerRef.current?.releasePointerCapture(e.pointerId);

    const { painting, currentX, currentY, isValid } = drag;
    setDrag(null);

    const moved = currentX !== painting.x || currentY !== painting.y;
    if (isValid && moved && onPaintingMove) {
      setSaving(true);
      try {
        await onPaintingMove(painting.id, currentX, currentY);
      } catch (err) {
        console.error('[RackCanvas] Failed to save new position:', err);
      } finally {
        setSaving(false);
      }
    }
  }, [drag, onPaintingMove]);

  const handlePointerCancel = useCallback(() => setDrag(null), []);

  // ── Render ───────────────────────────────────────────────────────────────

  const isDraggingId = drag?.painting.id;

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position:    'relative',
          width:       rw * scale,
          height:      rh * scale,
          background:  '#f9fafb',
          border:      '2px solid #d1d5db',
          borderRadius: 4,
          overflow:    'hidden',
          flexShrink:  0,
          cursor:      saving ? 'wait' : drag ? 'grabbing' : editMode ? 'grab' : 'default',
          touchAction: editMode ? 'none' : 'auto',
          userSelect:  'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* All paintings — dragged one shown as ghost at original position */}
        {rack.paintings.map(p => (
          <PaintingRect
            key={p.signatuur}
            painting={p}
            scale={scale}
            isGhost={p.id === isDraggingId}
          />
        ))}

        {/* Live painting following the cursor */}
        {drag && (
          <PaintingRect
            key="__drag__"
            painting={{ ...drag.painting, x: drag.currentX, y: drag.currentY }}
            scale={scale}
            isDragging
            isInvalid={!drag.isValid}
          />
        )}

        {/* Saving overlay */}
        {saving && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200,
          }}>
            <span style={{
              background: 'white', padding: '5px 14px', borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 12, color: '#374151',
            }}>
              Opslaan…
            </span>
          </div>
        )}

        {/* Edit-mode hint banner (shown when no paintings are being dragged yet) */}
        {editMode && !drag && !saving && rack.paintings.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 10,
            padding: '3px 10px', borderRadius: 20, pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            Sleep een schilderij om het te verplaatsen
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-1 text-center">
        {rw} × {rh} cm
      </p>
    </div>
  );
}
