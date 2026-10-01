import type { ReactNode } from 'react';
import './spatial-hero.css';

export function SpatialHero({
  children,
  architecture,
  objects,
}: {
  children: ReactNode;
  architecture: ReactNode;
  objects: ReactNode;
}) {
  return (
    <section
      className="spatial-hero"
      aria-labelledby="spatial-hero-title"
      data-scene="discovery"
      data-motion="scroll"
    >
      <div className="sh-stage">
        <div className="sh-plane sh-plane-background">{architecture}</div>
        <div className="sh-plane sh-plane-objects">{objects}</div>
        <div className="sh-plane sh-plane-content">
          {children}
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
      </div>
    </section>
  );
}
