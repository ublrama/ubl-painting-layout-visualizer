import { Wall } from '../types';
import { WALL_WIDTH, WALL_HEIGHT } from '../constants';
import PaintingRect from './PaintingRect';

interface WallCanvasProps {
  wall: Wall;
  scale: number;
}

export default function WallCanvas({ wall, scale }: WallCanvasProps) {
  const wallPxW = WALL_WIDTH * scale;
  const wallPxH = WALL_HEIGHT * scale;

  return (
    <div
      style={{
        position: 'relative',
        width: wallPxW,
        height: wallPxH,
        flexShrink: 0,
        backgroundColor: '#f5f0e8',
      }}
      className="border-2 border-gray-600 overflow-hidden"
    >
      {wall.paintings.map((p) => (
        <PaintingRect key={p.signatuur} painting={p} scale={scale} />
      ))}
    </div>
  );
}
