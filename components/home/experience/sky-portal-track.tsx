import type { ReactNode } from 'react';
import { ChapterImage } from './chapter-image';
import './sky-portal.css';

/** A short native-scroll overlap, not another scene or a copy of either scene. */
export function SkyPortalTrack({ children }: { children: ReactNode }) {
  return (
    <div className="sky-worlds-track" data-sky-track>
      <span className="sky-scroll-range" data-sky-range aria-hidden="true" />
      <div className="sky-static-aperture" aria-hidden="true">
        <ChapterImage
          asset="worlds-atrium"
          sizes="(max-width: 767px) 70vw, 35vw"
        />
      </div>
      {children}
    </div>
  );
}
