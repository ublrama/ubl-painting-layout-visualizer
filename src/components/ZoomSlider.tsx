interface ZoomSliderProps {
  scale: number;
  onChange: (s: number) => void;
}

export default function ZoomSlider({ scale, onChange }: ZoomSliderProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
        Zoom
      </h3>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={4}
          step={0.5}
          value={scale}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-amber-400"
        />
        <span className="text-sm text-amber-400 font-semibold w-14 text-right">
          {scale} px/cm
        </span>
      </div>
    </div>
  );
}
