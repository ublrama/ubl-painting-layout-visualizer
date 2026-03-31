import type { CSSProperties } from 'react';
import type { PlacedPainting } from '../types';
import { COLLECTION_COLORS } from '../constants';

interface PaintingRectProps {
  painting: PlacedPainting;
  scale: number;
}

export function PaintingRect({ painting, scale }: PaintingRectProps) {
  const collection = painting.collection;
  const color = COLLECTION_COLORS[collection] ?? COLLECTION_COLORS['Unknown'];

  const pxWidth  = painting.width  * scale;
  const pxHeight = painting.height * scale;

  // Adaptive font size: readable at high zoom, tiny-but-present at low zoom
  const fontSize     = Math.max(7, Math.min(11, scale * 4.5));
  const subFontSize  = Math.max(6, fontSize - 1);

  const style: CSSProperties = {
    position: 'absolute',
    left:   painting.x * scale,
    top:    painting.y * scale,
    width:  pxWidth,
    height: pxHeight,
    backgroundColor: color,
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: '2px 3px',
    gap: 1,
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
