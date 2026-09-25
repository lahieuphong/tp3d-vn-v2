import { worldsChapterOptions } from '@/data/home-chapters';
import { ChapterImage } from './chapter-image';
import { WorldSelector } from './world-selector';

export function WorldsChapter() {
  return (
    <section
      className="hc-chapter hc-worlds"
      data-home-chapter="worlds"
      aria-labelledby="home-worlds-title"
      id="home-worlds"
    >
      <div className="hc-backdrop" aria-hidden="true">
        <div data-chapter-depth="background">
          <ChapterImage asset="worlds-architecture" />
        </div>
      </div>
      <div className="hc-worlds-daylight" aria-hidden="true">
        <ChapterImage asset="spaces-architecture" />
      </div>
      <div className="hc-world-copy" data-chapter-depth="copy">
        <p className="hc-eyebrow" data-chapter-reveal>
          3D WORLDS
        </p>
        <div className="hc-world-title-mask">
          <h2 id="home-worlds-title" data-chapter-reveal>
            Enter
            <br />
            <em>the space.</em>
          </h2>
        </div>
        <div data-chapter-reveal>
          <p className="hc-body">
            Step inside our interiors and explore them in 3D. Move freely,
            discover details, and experience spaces as if you were really there.
          </p>
          <span className="hc-rule" aria-hidden="true" />
          <p className="hc-eyebrow hc-signoff">
            REAL SPACES. REAL PERSPECTIVE.
          </p>
        </div>
      </div>
      <WorldSelector options={worldsChapterOptions} />
      <div className="hc-worlds-baseline" aria-hidden="true">
        <span>SCROLL / DISCOVER</span>
        <i /> <span>SPACES SHAPED BY A NEW BREEZE</span>
      </div>
    </section>
  );
}
