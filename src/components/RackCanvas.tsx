import { useRef } from 'react';
import type { Rack } from '../types';
import { PaintingRect } from './PaintingRect';

interface RackCanvasProps {
  rack: Rack;
  side: 'front' | 'back';
  scale: number;
}

export function RackCanvas({ rack, side, scale }: RackCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: rackWidth, height: rackHeight } = rack.rackType;

  const canvasWidth = rackWidth * scale;
  const canvasHeight = rackHeight * scale;
  const paintings = side === 'front' ? rack.frontPaintings : rack.backPaintings;

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: '#f9fafb',
          border: '2px solid #d1d5db',
          borderRadius: 4,
          overflow: 'visible',
          flexShrink: 0,
        }}
      >
        {paintings.map((p) => (
          <PaintingRect
            key={p.signatuur}
            painting={p}
            scale={scale}
            containerRef={containerRef}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">
        {rackWidth} × {rackHeight} cm
      </p>
    </div>
  );
}
