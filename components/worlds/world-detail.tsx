'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { World } from '@/data/types';
import {
  worldDetailHref,
  worldReturnHref,
  type WorldDetailContext,
} from '@/lib/world-detail-context';
import { WorldDetailStage } from './world-detail-stage';
import { WorldDetailInfo } from './world-detail-info';
import { WorldThumbnailRail } from './world-thumbnail-rail';
import {
  detailKeyAction,
  nextViewerState,
  type ViewerEvent,
  type ViewerState,
} from './world-viewer-state';

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

export function WorldDetail({
  initialWorld,
  worlds,
  context,
}: {
  initialWorld: World;
  /** The browse set: the whole catalogue, or the Gallery's curation. */
  worlds: World[];
  context: WorldDetailContext;
}) {
  const [activeSlug, setActiveSlug] = useState(initialWorld.slug);
  const [switching, setSwitching] = useState(false);
  // TP3D PASS 07: one owner for the live viewer, so Escape, switching and
  // the stage always agree.
  const [viewer, setViewer] = useState<ViewerState>('poster');
  const send = useCallback(
    (event: ViewerEvent) => setViewer((state) => nextViewerState(state, event)),
    [],
  );
  const shell = useRef<HTMLElement>(null);
  const switchTimer = useRef<number | null>(null);
  const active =
    worlds.find((world) => world.slug === activeSlug) ?? initialWorld;

  const selectWorld = useCallback(
    (world: World, history = true) => {
      if (world.slug === activeSlug) return;
      // The current iframe unmounts at once; the next world rests on its poster
      // until its own ENTER 3D WORLD.
      send('switch');
      if (switchTimer.current !== null)
        window.clearTimeout(switchTimer.current);
      setSwitching(true);
      switchTimer.current = window.setTimeout(() => {
        setActiveSlug(world.slug);
        setSwitching(false);
        switchTimer.current = null;
      }, 170);
      if (history)
        window.history.pushState(
          { world: world.slug },
          '',
          worldDetailHref(world.slug, context),
        );
    },
    [activeSlug, context, send],
  );

  useEffect(
    () => () => {
      if (switchTimer.current !== null)
        window.clearTimeout(switchTimer.current);
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
  }, [active.slug]);

  useEffect(() => {
    const pop = () => {
      const slug = window.location.pathname.split('/').pop();
      const next = worlds.find((world) => world.slug === slug);
      if (next) selectWorld(next, false);
    };
    const keydown = (event: KeyboardEvent) => {
      const action = detailKeyAction({
        key: event.key,
        viewer,
        modified: event.altKey || event.ctrlKey || event.metaKey,
        editable: isEditable(event.target),
        handled: event.defaultPrevented,
      });
      if (!action) return;
      if (action === 'close-viewer') {
        // Escape closes the viewer first; it never leaves the page from here.
        event.preventDefault();
        send('close');
        return;
      }
      if (action === 'return') {
        window.location.assign(worldReturnHref(active.slug, context));
        return;
      }
      const index = worlds.findIndex((world) => world.slug === active.slug);
      const delta = action === 'next' ? 1 : -1;
      selectWorld(worlds[(index + delta + worlds.length) % worlds.length]);
    };
    window.addEventListener('popstate', pop);
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener('popstate', pop);
      window.removeEventListener('keydown', keydown);
    };
  }, [active.slug, context, selectWorld, send, viewer, worlds]);

  const activeIndex = worlds.findIndex((world) => world.slug === active.slug);
  const previous = worlds[(activeIndex - 1 + worlds.length) % worlds.length];
  const next = worlds[(activeIndex + 1) % worlds.length];

  return (
    <main
      className={`world-detail${switching ? ' is-switching' : ''}`}
      id="main"
      ref={shell}
      tabIndex={-1}
    >
      <section className="world-detail-shell">
        <header className="world-detail-context">
          <p className="world-detail-crumb eyebrow">
            <Link href={worldReturnHref(active.slug, context)}>
              {context.kind === 'gallery' && (
                <span className="sr-only">Back to </span>
              )}
              {context.label}
            </Link>
            <span aria-hidden="true">/</span> {active.title}
          </p>
          <nav className="world-detail-switcher" aria-label="Browse worlds">
            <button
              type="button"
              aria-label={`Open previous world: ${previous.title}`}
              onClick={() => selectWorld(previous)}
            >
              ←
            </button>
            <span className="eyebrow">
              {String(activeIndex + 1).padStart(2, '0')} /{' '}
              {String(worlds.length).padStart(2, '0')}
            </span>
            <button
              type="button"
              aria-label={`Open next world: ${next.title}`}
              onClick={() => selectWorld(next)}
            >
              →
            </button>
          </nav>
        </header>
        <div className="world-detail-layout">
          <WorldDetailStage
            key={active.slug}
            world={active}
            index={activeIndex + 1}
            total={worlds.length}
            viewer={viewer}
            onEnter={() => send('enter')}
            onClose={() => send('close')}
            onReady={() => send('ready')}
          />
          <WorldDetailInfo world={active} />
          <WorldThumbnailRail
            worlds={worlds}
            current={active.slug}
            onSelect={selectWorld}
          />
        </div>
      </section>
      <section
        className="world-detail-editorial"
        aria-label="Tân Phong perspective"
      >
        <p className="eyebrow">SPACES THAT BELONG</p>
        <p className="world-detail-quote">
          <em>“Interiors are a way of living, not just a way of seeing.”</em>
          <span>— TÂN PHONG</span>
        </p>
        <p className="eyebrow">A MORE TANGIBLE TOMORROW</p>
      </section>
    </main>
  );
}
