'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { mountHeroMotion } from './hero-motion-controller';
import './hero-motion.css';

export function HeroMotion({ children }: { children: ReactNode }) {
  const hero = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hero.current) return mountHeroMotion(hero.current);
  }, []);

  return (
    <section
      ref={hero}
      className="home-hero"
      aria-labelledby="hero-title"
      data-hero-motion="static"
    >
      {children}
      <div className="hero-motion-planes" aria-hidden="true">
        <div className="hero-motion-plane hero-motion-plane-left" />
        <div className="hero-motion-plane hero-motion-plane-right" />
        <div className="hero-motion-plane hero-motion-plane-sill" />
      </div>
    </section>
  );
}
