'use client';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createStoryWorldTimeline } from './story-world-timeline';
import { createBreezeRenderer } from './breeze-renderer';
import './home-experience.css';
export function HomeExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(
    () =>
      root.current
        ? createStoryWorldTimeline(
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
