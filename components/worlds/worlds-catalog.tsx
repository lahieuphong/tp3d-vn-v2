'use client';

import { useEffect, useMemo, useState } from 'react';
import type { World } from '@/data/types';
import {
  defaultWorldQuery,
  getWorldCategories,
  getVisibleWorlds,
  readWorldQuery,
  selectWorlds,
  writeWorldQuery,
  WORLD_PAGE_SIZE,
  type WorldQuery,
} from '@/lib/world-catalog';
import { WorldsToolbar } from './worlds-toolbar';
import { WorldsGrid } from './worlds-grid';
import { LoadMore } from './load-more';

export function WorldsCatalog({
  worlds,
  initialQuery,
}: {
  worlds: World[];
  initialQuery: WorldQuery;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [focusFrom, setFocusFrom] = useState<number | null>(null);
  const [fragment, setFragment] = useState('');
  const categories = useMemo(() => getWorldCategories(worlds), [worlds]);
  const indices = useMemo(
    () => new Map(worlds.map((world, index) => [world.id, index])),
    [worlds],
  );
  const matches = useMemo(() => selectWorlds(worlds, query), [worlds, query]);
  const visible = getVisibleWorlds(matches, page);

  const changeQuery = (patch: Partial<WorldQuery>) => {
    const next = { ...query, ...patch };
    setQuery(next);
    setPage(1);
    setFocusFrom(null);
    const url = new URL(window.location.href);
    url.search = writeWorldQuery(url.searchParams, next).toString();
    url.hash = '';
    window.history.replaceState(window.history.state, '', url);
  };

  useEffect(() => {
    const restore = () => {
      let next = readWorldQuery(
        new URLSearchParams(window.location.search),
        worlds,
      );
      let slug = '';
      try {
        slug = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        /* Ignore invalid fragments. */
      }
      const target = worlds.find((world) => world.slug === slug);
      if (
        target &&
        !selectWorlds(worlds, next).some((world) => world.id === target.id)
      ) {
        next = { ...next, q: '', category: '' };
        const url = new URL(window.location.href);
        url.search = writeWorldQuery(url.searchParams, next).toString();
        window.history.replaceState(window.history.state, '', url);
      }
      const index = target
        ? selectWorlds(worlds, next).findIndex(
            (world) => world.id === target.id,
          )
        : -1;
      setQuery(next);
      setPage(index >= 0 ? Math.floor(index / WORLD_PAGE_SIZE) + 1 : 1);
      setFocusFrom(null);
      setFragment(target ? slug : '');
    };
    restore();
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  }, [worlds, initialQuery]);

  useEffect(() => {
    if (!fragment) return;
    const frame = requestAnimationFrame(() => {
      document
        .getElementById(fragment)
        ?.scrollIntoView({ block: 'start', behavior: 'instant' });
      setFragment('');
    });
    return () => cancelAnimationFrame(frame);
  }, [fragment, page]);

  return (
    <section
      className="container worlds-catalog"
      aria-labelledby="worlds-catalog-title"
    >
      <WorldsToolbar
        category={query.category}
        total={matches.length}
        categories={categories}
        onChange={changeQuery}
      />
      <div id="worlds-results">
        {matches.length ? (
          <WorldsGrid
            worlds={visible}
            indices={indices}
            focusFrom={focusFrom}
          />
        ) : (
          <div className="worlds-empty">
            <h3>No worlds found.</h3>
            <p>Try another room or search term.</p>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                changeQuery(defaultWorldQuery);
                document.getElementById('world-index')?.focus();
              }}
            >
              Clear filters <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
      <LoadMore
        shown={visible.length}
        total={matches.length}
        onLoad={() => {
          setFocusFrom(visible.length);
          setPage((current) => current + 1);
        }}
      />
    </section>
  );
}
