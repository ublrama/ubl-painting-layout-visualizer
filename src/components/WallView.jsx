import { WALL_WIDTH, WALL_HEIGHT } from '../constants.js';
import PaintingRect from './PaintingRect.jsx';

/**
 * Renders a single wall with all its paintings.
 *
 * Props:
 *   wallIndex: number (0-based)
 *   paintings: Array of placed painting objects
 *   scale: px per cm
 */
export default function WallView({ wallIndex, paintings, scale }) {
  const wallPxW = WALL_WIDTH * scale;
  const wallPxH = WALL_HEIGHT * scale;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>
        Muur {wallIndex + 1}
        <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 12, color: '#555' }}>
          ({paintings.length} schilderijen)
        </span>
      </h2>

      <div
        style={{
          position: 'relative',
          width: wallPxW,
          height: wallPxH,
          border: '2px solid #333',
          backgroundColor: '#f5f0e8',
          boxSizing: 'content-box',
          flexShrink: 0,
        }}
      >
        {paintings.map((p) => (
          <PaintingRect key={p.signatuur} painting={p} scale={scale} />
        ))}
      </div>
    </div>
  );
}
