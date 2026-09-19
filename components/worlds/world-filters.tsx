export function WorldFilters({
  categories,
  value,
  onChange,
}: {
  categories: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
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
  );
}
