import { useState } from 'react';
import { PlacedPainting } from '../types';
import { COLLECTION_COLORS } from '../constants';
import Tooltip from './Tooltip';

interface PaintingRectProps {
  painting: PlacedPainting;
  scale: number;
}

function getColor(signatuur: string): string {
  if (signatuur.startsWith('BWB')) return COLLECTION_COLORS.BWB;
  if (signatuur.startsWith('AHM')) return COLLECTION_COLORS.AHM;
  if (signatuur.startsWith('Bild. Mus. Geerts')) return COLLECTION_COLORS['Bild. Mus. Geerts'];
  if (signatuur.startsWith('Icones')) return COLLECTION_COLORS.Icones;
  return COLLECTION_COLORS.Unknown;
}

export default function PaintingRect({ painting, scale }: PaintingRectProps) {
  const [hovered, setHovered] = useState(false);
  const { signatuur, width, height, x, y } = painting;
  const color = getColor(signatuur);

  const pxX = x * scale;
  const pxY = y * scale;
  const pxW = width * scale;
  const pxH = height * scale;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: pxX,
        top: pxY,
        width: pxW,
        height: pxH,
        backgroundColor: color,
        boxSizing: 'border-box',
      }}
      className="border border-black/20 overflow-hidden cursor-default transition-opacity"
    >
      <span
        className="absolute inset-0 flex items-center justify-center text-white pointer-events-none select-none"
        style={{
          fontSize: Math.max(8, Math.min(11, pxW / 8)),
          textShadow: '0 0 3px rgba(0,0,0,0.9)',
          overflow: 'hidden',
          padding: '1px 2px',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {signatuur}
      </span>

      {hovered && <Tooltip painting={painting} color={color} />}
    </div>
  );
}
