'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { mountSpatialHero, type SpatialHeroController } from './hero-timeline';
import './spatial-hero.css';

export function SpatialHero({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const controller = useRef<SpatialHeroController | null>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    const motion = mountSpatialHero(root.current);
    controller.current = motion;
    return () => {
      motion.destroy();
      controller.current = null;
    };
  }, []);
  return (
    <section
      ref={root}
      className="spatial-hero"
      aria-labelledby="spatial-hero-title"
      data-scene="discovery"
      data-motion="static"
    >
      {children}
      <footer className="sh-colophon">
        <span className="sh-colophon-brand" aria-hidden="true">
          tân phong
        </span>
        <span className="sh-colophon-line" aria-hidden="true" />
        <div className="sh-controls">
          <button
            type="button"
            data-hero-control
            className="sh-scene-control"
            aria-controls="spatial-hero-story"
            aria-label="Switch between our story and discovery"
            onClick={() => {
              const scene =
                root.current?.dataset.scene === 'story' ? 'discovery' : 'story';
              controller.current?.showScene(scene);
              setPaused(true);
            }}
          >
            <span className="sh-control-story">OUR STORY ↗</span>
            <span className="sh-control-discover">DISCOVER ↗</span>
          </button>
          <Link className="sh-static-story" href="/about" prefetch={false}>
            OUR STORY ↗
          </Link>
          <span className="sh-colophon-motto">A CONTINUING BREEZE</span>
          <button
            type="button"
            className="sh-motion-control"
            data-hero-control
            aria-label={
              paused ? 'Resume opening animation' : 'Pause opening animation'
            }
            aria-pressed={paused}
            onClick={() => {
              controller.current?.setPaused(!paused);
              setPaused(!paused);
            }}
          >
            {paused ? 'PLAY' : 'PAUSE'}
          </button>
        </div>
        <span className="sh-colophon-line" aria-hidden="true" />
        <span className="sh-colophon-edition">EST. 2026</span>
      </footer>
    </section>
  );
}
