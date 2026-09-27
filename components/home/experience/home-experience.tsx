'use client';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { mountHomeChapters } from './chapter-motion';
import { createBreezeRenderer } from './breeze-renderer';
import { ContinuousBreeze } from './continuous-breeze';
import './home-experience.css';
export function HomeExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(
    () =>
      root.current
        ? mountHomeChapters(root.current, createBreezeRenderer(root.current))
        : undefined,
    [],
  );
  return (
    <main id="main" className="home-experience" ref={root}>
      <ContinuousBreeze />
      {children}
    </main>
  );
}
