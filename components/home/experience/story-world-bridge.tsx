import type { ReactNode } from 'react';
import { ContinuousBreeze } from './continuous-breeze';
import './story-world-bridge.css';

/** The opening's existing approach hands its live Story nodes to the bridge.
 * One sticky stage keeps that handoff exact: no duplicate Story or Worlds plate.
 * The approach marker is outside the 250svh / 210svh Story → Worlds range. */
export function StoryWorldBridge({ children }: { children: ReactNode }) {
  return (
    <div className="story-world-sequence" data-story-world-sequence>
      <section
        className="story-world-bridge"
        data-story-world-bridge
        aria-label="Our story, into the worlds"
      >
        <span
          className="story-world-range"
          data-story-world-range
          aria-hidden="true"
        />
        <div className="story-world-sticky-stage" data-story-world-stage>
          {children}
          <ContinuousBreeze />
        </div>
      </section>
    </div>
  );
}
