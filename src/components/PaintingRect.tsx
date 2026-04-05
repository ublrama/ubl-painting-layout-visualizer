import type { CSSProperties } from 'react';
import type { PlacedPainting } from '../types';
import { COLLECTION_COLORS } from '../constants';

interface PaintingRectProps {
  painting: PlacedPainting;
  scale: number;
  /** Being dragged — rendered on top with validity highlight */
  isDragging?: boolean;
  /** Position is invalid (overlap / out of bounds) while dragging */
  isInvalid?: boolean;
  /** Faded ghost shown at the original position during drag */
  isGhost?: boolean;
}

export function PaintingRect({ painting, scale, isDragging, isInvalid, isGhost }: PaintingRectProps) {
  const color = COLLECTION_COLORS[painting.collection] ?? COLLECTION_COLORS['Unknown'];

  const pxWidth  = painting.width  * scale;
  const pxHeight = painting.height * scale;

  // Adaptive font size: readable at high zoom, tiny-but-present at low zoom
  const fontSize     = Math.max(7, Math.min(11, scale * 4.5));
  const subFontSize  = Math.max(6, fontSize - 1);

  // ── Ghost: faded dashed outline at original position ──────────────────────
  if (isGhost) {
    return (
      <div
        style={{
          position: 'absolute',
          left:   painting.x * scale,
          top:    painting.y * scale,
          width:  pxWidth,
          height: pxHeight,
          border: '2px dashed rgba(0,0,0,0.25)',
          borderRadius: 2,
          background: 'rgba(0,0,0,0.04)',
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    );
  }

  // ── Normal / dragging state ────────────────────────────────────────────────
  const style: CSSProperties = {
    position: 'absolute',
    left:   painting.x * scale,
    top:    painting.y * scale,
    width:  pxWidth,
    height: pxHeight,
    backgroundColor: color,
    border: isDragging
      ? (isInvalid ? '2px solid #ef4444' : '2px solid #22c55e')
      : '1px solid rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: '2px 3px',
    gap: 1,
    zIndex: isDragging ? 100 : 1,
    transform: isDragging ? 'scale(1.025)' : 'none',
    transformOrigin: 'top left',
    boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.25)' : 'none',
    filter: isDragging && isInvalid ? 'brightness(0.8) saturate(0.6)' : 'none',
    pointerEvents: isDragging ? 'none' : 'auto',
    transition: isDragging ? 'none' : 'box-shadow 0.1s',
  };

  return (
    <div style={style}>
      {/* Signatuur — always shown */}
      <span
        style={{
          fontSize,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
          lineHeight: 1.2,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {painting.signatuur}
      </span>

      {/* Dimensions — shown when there's enough vertical space */}
      {pxHeight >= 28 && (
        <span
          style={{
            fontSize: subFontSize,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {painting.width} × {painting.height} cm
        </span>
      )}

      {/* Depth — shown only when there's ample space */}
      {pxHeight >= 44 && painting.depth > 0 && (
        <span
          style={{
            fontSize: subFontSize,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          ∅ {painting.depth} cm
        </span>
      )}
    </div>
  );
}
