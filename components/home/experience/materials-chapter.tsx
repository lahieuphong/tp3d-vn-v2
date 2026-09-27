import Link from 'next/link';
import { materialChapterCallouts } from '@/data/home-chapters';
import { ChapterImage } from './chapter-image';
import { ChapterColophon } from './chapter-colophon';
import { MaterialComposition } from './material-composition';

export function MaterialsChapter() {
  return (
    <section
      className="hc-chapter hc-materials"
      data-home-chapter="materials"
      aria-labelledby="home-materials-title"
      id="home-materials"
    >
      <div className="hc-backdrop" aria-hidden="true">
        <div data-chapter-depth="background">
          <ChapterImage asset="materials-architecture" />
        </div>
      </div>
      <div className="hc-materials-copy" data-chapter-depth="copy">
        <p className="hc-eyebrow hc-materiality">
          MATERIALITY
          <br />
          LIVES
          <br />
          IN A<br />
          GENTLER
          <br />
          WORLD
        </p>
        <h2 id="home-materials-title" data-chapter-reveal>
          Objects &amp;
          <br />
          Materials
        </h2>
        <p className="hc-eyebrow hc-touch">
          <span aria-hidden="true" />
          TOUCH THE DETAILS
        </p>
        <p className="hc-body" data-chapter-reveal>
          Natural materials, considered objects. Each texture holds a story — of
          place, craft, and a more human way of living.
        </p>
        <Link href="/materials" prefetch={false} className="hc-link">
          EXPLORE OUR MATERIALS <span aria-hidden="true">⟶</span>
        </Link>
      </div>
      <div className="hc-material-scene">
        <MaterialComposition />
        <nav
          className="hc-material-callouts"
          aria-label="Explore materials and objects"
        >
          {materialChapterCallouts.map((material, index) => (
            <Link
              href={material.href}
              prefetch={false}
              key={material.id}
              className={`hc-material-callout hc-callout-${material.id}`}
              data-callout-index={index}
            >
              <span className="hc-leader" aria-hidden="true" />
              <span className="hc-callout-copy">
                <span className="hc-callout-title">{material.title}</span>
                <span className="hc-eyebrow">
                  {material.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
      <p className="hc-axis" aria-hidden="true">
        SPACES
        <br />
        SHAPED
        <br />
        BY A NEW
        <br />
        BREEZE
        <i />
      </p>
      <ChapterColophon />
    </section>
  );
}
