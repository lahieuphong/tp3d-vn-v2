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
  const active = worlds.find((world) => world.slug === activeSlug) ?? initialWorld;

  const selectWorld = useCallback((world: World, history = true) => {
    if (world.slug === activeSlug) return;
    setSwitching(true);
    window.setTimeout(() => {
      setActiveSlug(world.slug);
      setSwitching(false);
    }, 170);
    if (history) window.history.pushState({ world: world.slug }, '', `/worlds/${world.slug}`);
  }, [activeSlug]);

  useEffect(() => {
    shell.current?.focus({ preventScroll: true });
    const origin = sessionStorage.getItem('tan-phong-world-origin');
    if (origin) sessionStorage.removeItem('tan-phong-world-origin');
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

  return (
    <main className={`world-detail${switching ? ' is-switching' : ''}`} id="main" ref={shell} tabIndex={-1}>
      <header className="world-detail-header">
        <Link href={`/worlds#${active.slug}`} className="world-detail-back">
          <span aria-hidden="true">×</span> CLOSE
        </Link>
        <span className="world-detail-header-note eyebrow">DIGITAL COLLECTION / {String(worlds.findIndex((world) => world.slug === active.slug) + 1).padStart(2, '0')}</span>
      </header>
      <div className="world-detail-layout">
        <WorldDetailStage key={active.slug} world={active} />
        <WorldDetailInfo world={active} />
        <WorldThumbnailRail worlds={worlds} current={active.slug} onSelect={selectWorld} />
      </div>
    </main>
  );
}
