import { useRef } from 'react';
import type { Wall } from '../types';
import { WALL_WIDTH, WALL_HEIGHT } from '../constants';
import { PaintingRect } from './PaintingRect';

interface WallCanvasProps {
  wall: Wall;
  scale: number;
}

export function WallCanvas({ wall, scale }: WallCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const canvasWidth = WALL_WIDTH * scale;
  const canvasHeight = WALL_HEIGHT * scale;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#001158',
        border: '1px solid rgba(190,25,8,0.25)',
        borderRadius: 4,
        overflow: 'visible',
        flexShrink: 0,
      }}
    >
      {wall.paintings.map((p) => (
        <PaintingRect
          key={p.signatuur}
          painting={p}
          scale={scale}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
}
