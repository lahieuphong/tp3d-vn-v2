import type { ReactNode } from 'react';
import { ContinuousBreeze } from './continuous-breeze';
import { SharedTP } from './shared-tp';
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
    </section>
  );
}
