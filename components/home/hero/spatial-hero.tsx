'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { mountSpatialHero } from './hero-timeline';
import './spatial-hero.css';

export function SpatialHero({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const controller = mountSpatialHero(root.current);
    return () => controller.destroy();
  }, []);
  return (
    <section
      ref={root}
      className="spatial-hero"
      aria-labelledby="spatial-hero-title"
      data-scene="discovery"
      data-motion="scroll"
    >
      <div className="sh-stage">
        {children}
        <div className="sh-departure" aria-hidden="true" />
        <footer className="sh-colophon">
          <span className="sh-colophon-brand" aria-hidden="true">
            tân phong
          </span>
          <span className="sh-colophon-line" aria-hidden="true" />
          <span className="sh-scroll-indicator">
            SCROLL TO DISCOVER <span aria-hidden="true">↓</span>
          </span>
          <span className="sh-colophon-line" aria-hidden="true" />
          <span className="sh-colophon-edition">EST. 2026</span>
        </footer>
      </div>
    </section>
  );
}
