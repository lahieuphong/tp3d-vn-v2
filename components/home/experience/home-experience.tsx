'use client';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createHomeStoryTimeline } from './home-story-timeline';
import { createBreezeRenderer } from './breeze-renderer';
import './home-experience.css';
export function HomeExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(
    () =>
      root.current
        ? createHomeStoryTimeline(
            root.current,
            createBreezeRenderer(root.current),
          )
        : undefined,
    [],
  );
  return (
    <main id="main" className="home-experience" ref={root}>
      {children}
    </main>
  );
}
