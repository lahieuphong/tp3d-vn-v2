'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { World } from '@/data/types';
import { WorldDetailStage } from './world-detail-stage';
import { WorldDetailInfo } from './world-detail-info';
import { WorldThumbnailRail } from './world-thumbnail-rail';

export function WorldDetail({ initialWorld, worlds }: { initialWorld: World; worlds: World[] }) {
  const [activeSlug, setActiveSlug] = useState(initialWorld.slug);
  const [switching, setSwitching] = useState(false);
  const shell = useRef<HTMLElement>(null);
  const switchTimer = useRef<number | null>(null);
  const active = worlds.find((world) => world.slug === activeSlug) ?? initialWorld;

  const selectWorld = useCallback((world: World, history = true) => {
    if (world.slug === activeSlug) return;
    if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
    setSwitching(true);
    switchTimer.current = window.setTimeout(() => {
      setActiveSlug(world.slug);
      setSwitching(false);
      switchTimer.current = null;
    }, 170);
    if (history) window.history.pushState({ world: world.slug }, '', `/worlds/${world.slug}`);
  }, [activeSlug]);

  useEffect(
    () => () => {
      if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
    },
    [],
  );

  useEffect(() => {
    shell.current?.focus({ preventScroll: true });
    try {
      const origin = sessionStorage.getItem('tan-phong-world-origin');
      if (origin) sessionStorage.removeItem('tan-phong-world-origin');
    } catch {
      // Focus and route navigation remain available without browser storage.
    }
    const pop = () => {
      const slug = window.location.pathname.split('/').pop();
      const next = worlds.find((world) => world.slug === slug);
      if (next) selectWorld(next, false);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') window.location.assign(`/worlds#${active.slug}`);
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowLeft') return;
      const index = worlds.findIndex((world) => world.slug === active.slug);
      const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
      const next = worlds[(index + delta + worlds.length) % worlds.length];
      selectWorld(next);
    };
    window.addEventListener('popstate', pop);
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('popstate', pop);
      window.removeEventListener('keydown', keydown);
    };
  }, [active.slug, selectWorld, worlds]);

  const activeIndex = worlds.findIndex((world) => world.slug === active.slug);
  const previous = worlds[(activeIndex - 1 + worlds.length) % worlds.length];
  const next = worlds[(activeIndex + 1) % worlds.length];

  return (
    <main className={`world-detail${switching ? ' is-switching' : ''}`} id="main" ref={shell} tabIndex={-1}>
      <section className="world-detail-shell">
        <header className="world-detail-context">
          <p className="world-detail-crumb eyebrow">
            <Link href={`/worlds#${active.slug}`}>3D WORLDS</Link>
            <span aria-hidden="true">/</span> {active.title}
          </p>
          <nav className="world-detail-switcher" aria-label="Browse worlds">
            <button type="button" aria-label={`Open previous world: ${previous.title}`} onClick={() => selectWorld(previous)}>←</button>
            <span className="eyebrow">{String(activeIndex + 1).padStart(2, '0')} / {String(worlds.length).padStart(2, '0')}</span>
            <button type="button" aria-label={`Open next world: ${next.title}`} onClick={() => selectWorld(next)}>→</button>
          </nav>
        </header>
        <div className="world-detail-layout">
        <WorldDetailStage key={active.slug} world={active} index={activeIndex + 1} total={worlds.length} />
        <WorldDetailInfo world={active} />
        <WorldThumbnailRail worlds={worlds} current={active.slug} onSelect={selectWorld} />
        </div>
      </section>
      <section className="world-detail-editorial" aria-label="Tân Phong perspective">
        <p className="eyebrow">SPACES THAT BELONG</p>
        <p className="world-detail-quote"><em>“Interiors are a way of living, not just a way of seeing.”</em><span>— TÂN PHONG</span></p>
        <p className="eyebrow">A MORE TANGIBLE TOMORROW</p>
      </section>
    </main>
  );
}
