import type { WorldQuery } from '@/lib/world-catalog';
import { WorldFilters } from './world-filters';

export function WorldsToolbar({
  query,
  shown,
  total,
  categories,
  onChange,
}: {
  query: WorldQuery;
  shown: number;
  total: number;
  categories: { value: string; label: string }[];
  onChange: (patch: Partial<WorldQuery>) => void;
}) {
  return (
    <div className="worlds-toolbar" id="world-index">
      <div className="worlds-toolbar-top">
        <div className="worlds-catalog-heading">
          <h2 id="worlds-catalog-title">All worlds</h2>
          <output
            className="eyebrow worlds-results-count"
            aria-live="polite"
            aria-atomic="true"
          >
            SHOWING {shown} OF {total}
          </output>
        </div>
        <div className="worlds-tools">
          <search className="worlds-search">
            <label className="sr-only" htmlFor="worlds-search">
              Search worlds by title, category, style or type
            </label>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" />
            </svg>
            <input
              id="worlds-search"
              type="search"
              placeholder="Search worlds"
              value={query.q}
              maxLength={160}
              onChange={(event) => onChange({ q: event.target.value })}
              autoComplete="off"
              spellCheck={false}
              aria-controls="worlds-results"
            />
            {query.q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  onChange({ q: '' });
                  document.getElementById('worlds-search')?.focus();
                }}
              >
                ×
              </button>
            )}
          </search>
          <div className="worlds-sort">
            <label htmlFor="worlds-sort">Sort by</label>
            <select
              id="worlds-sort"
              value={query.sort}
              onChange={(event) =>
                onChange({ sort: event.target.value as WorldQuery['sort'] })
              }
              aria-controls="worlds-results"
            >
              <option value="newest">Newest</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>
      </div>
      <WorldFilters
        categories={categories}
        value={query.category}
        onChange={(category) => onChange({ category })}
      />
    </div>
  );
}
