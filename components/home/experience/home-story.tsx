import type { ReactNode } from 'react';
import { ContinuousBreeze } from './continuous-breeze';
import { SharedTP } from './shared-tp';
import { AtmosphericSkyBridge } from './atmospheric-sky-bridge';
import './home-story.css';

/** One persistent viewport, released into the normal document-flow Footer. */
export function HomeStory({ children }: { children: ReactNode }) {
  return (
    <section
      className="home-story"
      data-home-story
      aria-label="Arrival, perspective, worlds"
    >
      <div className="home-story-stage" data-home-story-stage>
        <SharedTP />
        {children}
        <AtmosphericSkyBridge />
        <ContinuousBreeze />
        <aside className="story-rail" aria-hidden="true">
          <span className="story-rail-track">
            <i />
          </span>
          <span data-story-chapter-label="arrival">
            <b>01</b>ARRIVAL
          </span>
          <span data-story-chapter-label="perspective">
            <b>02</b>PERSPECTIVE
          </span>
          <span data-story-chapter-label="worlds">
            <b>03</b>WORLDS
          </span>
        </aside>
      </div>
      {/* TP3D PASS 16: measures the approved journey's height, so the Atrium
          orbit appends its own span instead of stretching that journey. */}
      <div
        className="home-story-base"
        data-home-story-base
        aria-hidden="true"
      />
    </section>
  );
}
