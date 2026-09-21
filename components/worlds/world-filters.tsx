export function WorldFilters({
  categories,
  value,
  total,
  onChange,
}: {
  categories: { value: string; label: string }[];
  value: string;
  total: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="world-filter-row">
      <fieldset className="world-filters">
        <legend className="sr-only">Filter worlds by category</legend>
        {[{ value: '', label: 'All' }, ...categories].map((category) => (
          <button
            type="button"
            key={category.value}
            aria-pressed={category.value === value}
            aria-controls="worlds-results"
            onClick={() => onChange(category.value)}
          >
            {category.label}
          </button>
        ))}
      </fieldset>
      <output className="world-filter-count eyebrow" aria-live="polite">
        {total} WORLDS
      </output>
    </div>
  );
}
