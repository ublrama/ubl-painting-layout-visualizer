import { useState } from 'react';
import { COLORS } from '../constants.js';

/**
 * Returns the fill color for a painting based on its signatuur prefix.
 */
function getColor(signatuur) {
  if (signatuur.startsWith('BWB')) return COLORS.BWB;
  if (signatuur.startsWith('AHM')) return COLORS.AHM;
  if (signatuur.startsWith('Bild. Mus. Geerts')) return COLORS['Bild. Mus. Geerts'];
  if (signatuur.startsWith('Icones')) return COLORS.Icones;
  return COLORS.Unknown;
}

/**
 * Renders a single painting rectangle with a tooltip on hover.
 *
 * Props:
 *   painting: { signatuur, width, height, x, y }
 *   scale: px per cm
 */
export default function PaintingRect({ painting, scale }) {
  const [hovered, setHovered] = useState(false);

  const { signatuur, width, height, x, y } = painting;
  const color = getColor(signatuur);

  const pxX = x * scale;
  const pxY = y * scale;
  const pxW = width * scale;
  const pxH = height * scale;

  return (
    <div
      title={`${signatuur}\n${width} cm × ${height} cm\n(x: ${x} cm, y: ${y} cm)`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: pxX,
        top: pxY,
        width: pxW,
        height: pxH,
        backgroundColor: color,
        border: '1px solid rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        cursor: 'default',
        opacity: hovered ? 0.85 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: Math.max(8, Math.min(12, pxW / 8)),
          color: '#fff',
          textShadow: '0 0 3px rgba(0,0,0,0.8)',
          padding: '1px 2px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          textAlign: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {signatuur}
      </span>

      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#fff',
            fontSize: 11,
            padding: '4px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            zIndex: 100,
            pointerEvents: 'none',
            lineHeight: 1.5,
          }}
        >
          <strong>{signatuur}</strong>
          <br />
          {width} cm × {height} cm
          <br />
          x: {x} cm, y: {y} cm
        </div>
      )}
    </div>
  );
}
