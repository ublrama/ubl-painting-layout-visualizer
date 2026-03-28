interface ZoomSliderProps {
  zoom: number;
  onChange: (zoom: number) => void;
  visible: boolean;
}

export function ZoomSlider({ zoom, onChange, visible }: ZoomSliderProps) {
  if (!visible) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">
        Zoom
      </h3>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600">1×</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.5}
          value={zoom}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="text-xs text-gray-600">4×</span>
      </div>
      <p className="text-xs text-center text-blue-600 mt-1">Schaal: {zoom} px/cm</p>
    </div>
  );
}
