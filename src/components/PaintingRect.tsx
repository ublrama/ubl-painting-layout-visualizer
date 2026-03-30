import { useState } from 'react';
import type { CSSProperties, RefObject, MouseEvent } from 'react';
import type { PlacedPainting } from '../types';
import { COLLECTION_COLORS } from '../constants';
import { Tooltip } from './Tooltip';

interface PaintingRectProps {
  painting: PlacedPainting;
  scale: number;
  containerRef?: RefObject<HTMLDivElement | null>;
}

export function PaintingRect({ painting, scale, containerRef }: PaintingRectProps) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const collection = painting.collection;
  const color = COLLECTION_COLORS[collection] ?? COLLECTION_COLORS['Unknown'];

  const style: CSSProperties = {
    position: 'absolute',
    left: painting.x * scale,
    top: painting.y * scale,
    width: painting.width * scale,
    height: painting.height * scale,
    backgroundColor: color,
    opacity: 0.85,
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    cursor: 'crosshair',
    boxSizing: 'border-box',
  };

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const container = containerRef?.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    }
  }

  return (
    <div
      style={style}
      onMouseEnter={(e) => {
        const container = containerRef?.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        } else {
          setTooltipPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltipPos(null)}
    >
      {/* Label */}
      <span
        style={{
          display: 'block',
          padding: '2px 3px',
          fontSize: Math.max(8, scale * 5),
          color: 'rgba(255,255,255,0.9)',
          lineHeight: 1.2,
          userSelect: 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {painting.signatuur}
      </span>

      {/* Tooltip */}
      {tooltipPos && (
        <Tooltip
          painting={painting}
          color={color}
          collection={collection}
          x={tooltipPos.x - painting.x * scale}
          y={tooltipPos.y - painting.y * scale}
        />
      )}
    </div>
  );
}
