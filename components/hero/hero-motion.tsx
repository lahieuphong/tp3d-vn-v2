'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  mountHeroMotion,
  type HeroMotionController,
} from './hero-motion-controller';
import './hero-motion.css';

export function HeroMotion({ children }: { children: ReactNode }) {
  const hero = useRef<HTMLElement>(null);
  const controller = useRef<HeroMotionController | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!hero.current) return;
    const motion = mountHeroMotion(hero.current);
    controller.current = motion;
    return () => {
      motion.destroy();
      controller.current = null;
    };
  }, []);

  return (
    <section
      ref={hero}
      className="editorial-motion-hero"
      aria-labelledby="hero-title"
      data-hero-motion="static"
      data-hero-ready="false"
    >
      {children}
      <div className="emh-controls">
        <Link className="emh-explore" href="/spaces">
          EXPLORE SPACES <span aria-hidden="true">↗</span>
        </Link>
        <span className="emh-edition">
          01 — 02 <span>SELECTED INTERIORS</span>
        </span>
        <div className="emh-actions">
          <button
            className="emh-motion-toggle"
            type="button"
            aria-label={paused ? 'Resume hero motion' : 'Pause hero motion'}
            onClick={() => {
              const next = !paused;
              setPaused(next);
              controller.current?.setPaused(next);
            }}
          >
            {paused ? 'PLAY MOTION' : 'PAUSE MOTION'}
          </button>
          <a href="#introduction" className="emh-scroll">
            SCROLL TO DISCOVER <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
