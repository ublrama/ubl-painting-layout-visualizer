import { COLLECTION_COLORS } from '../constants';

export function Legend() {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8b9db8] mb-3">
        Collecties
      </h3>
      <div className="flex flex-col gap-2">
        {Object.entries(COLLECTION_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-[#8b9db8]">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
