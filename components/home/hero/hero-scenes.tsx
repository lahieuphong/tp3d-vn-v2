import Link from 'next/link';
import { heroStory } from './hero-content';

export function HeroSceneA() {
  return (
    <div className="sh-discovery">
      <div className="sh-welcome sh-welcome-en">
        <div className="hi-copy-surface">
          <p className="sh-mobile-eyebrow sh-eyebrow">
            TÂN PHONG / INTERIORS & OBJECTS
          </p>
          <h1 id="spatial-hero-title">
            A new breeze <br />
            <em>for living.</em>
          </h1>
          <p className="sh-signature">
            <span aria-hidden="true" />
            SPACES&nbsp;&nbsp; SHAPE&nbsp;&nbsp; PEOPLE
          </p>
        </div>
      </div>
      <div className="sh-welcome sh-welcome-vi" lang="vi">
        <div className="hi-copy-surface">
          <p className="sh-welcome-title">
            Một làn gió mới <br />
            cho không gian sống.
          </p>
          <p className="sh-signature">
            <span aria-hidden="true" />
            NỘI THẤT&nbsp; KIẾN TẠO&nbsp; CUỘC SỐNG
          </p>
        </div>
      </div>
      <p className="sh-discovery-axis sh-axis" aria-hidden="true">
        <i />
        SPACES
        <br />
        SHAPED
        <br />
        BY A NEW
        <br />
        BREEZE
        <i />
      </p>
    </div>
  );
}

export function HeroSceneB() {
  return (
    <>
      <div
        className="sh-story"
        id="spatial-hero-story"
        aria-hidden="true"
        inert
      >
        <article className="sh-story-column sh-story-en">
          <p className="sh-eyebrow">
            OUR STORY
            <br />
            SPACES SHAPE PEOPLE
          </p>
          <h2>
            A new breeze <br />
            becomes a way
            <br />
            <em>of seeing.</em>
          </h2>
          <span className="sh-rule" aria-hidden="true" />
          <p className="sh-story-body sh-story-full">{heroStory.en}</p>
          <p className="sh-story-body sh-story-short">{heroStory.shortEn}</p>
          <p className="sh-eyebrow sh-story-signoff">
            INTERIORS FOR A MORE
            <br />
            HUMAN TOMORROW
          </p>
        </article>
        <article className="sh-story-column sh-story-vi" lang="vi">
          <p className="sh-eyebrow">
            CÂU CHUYỆN CỦA CHÚNG TÔI
            <br />
            NỘI THẤT KIẾN TẠO CON NGƯỜI
          </p>
          <h2>
            Một làn gió mới <br />
            trở thành một cách
            <br />
            <em>nhìn về không gian.</em>
          </h2>
          <span className="sh-rule" aria-hidden="true" />
          <p className="sh-story-body sh-story-full">{heroStory.vi}</p>
          <p className="sh-story-body sh-story-short">{heroStory.shortVi}</p>
          <p className="sh-eyebrow sh-story-signoff">
            NỘI THẤT CHO MỘT
            <br />
            TƯƠNG LAI NHÂN VĂN HƠN
          </p>
        </article>
        <Link className="sh-read-story" href="/about" prefetch={false}>
          Read our story <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="sh-center-copy" aria-hidden="true" inert>
        <p className="sh-story-axis-top sh-axis">
          <i />
          PEOPLE
          <br />
          SPACES
          <br />
          CULTURE
          <br />A BRIGHTER
          <br />
          TOMORROW
          <i />
        </p>
        <p className="sh-story-axis-bottom sh-axis">
          <i />A<br />
          CONTINUING
          <br />
          BREEZE
          <i />
        </p>
        <p className="sh-side-note sh-axis">
          BEAUTY
          <br />
          LIVES
          <br />
          IN A<br />
          GENTLER
          <br />
          WORLD
        </p>
      </div>
    </>
  );
}
