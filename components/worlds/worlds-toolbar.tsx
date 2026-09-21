import { WorldFilters } from './world-filters';

export function WorldsToolbar({
  category,
  total,
  categories,
  onChange,
}: {
  category: string;
  total: number;
  categories: { value: string; label: string }[];
  onChange: (patch: { category: string }) => void;
}) {
  return (
    <div className="worlds-toolbar" id="world-index">
      <WorldFilters
        categories={categories}
        value={category}
        total={total}
        onChange={(category) => onChange({ category })}
      />
    </div>
  );
}
