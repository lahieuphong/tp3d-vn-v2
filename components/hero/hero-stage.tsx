/* oxlint-disable next/no-img-element -- Reuses the site's optimized local WebP srcsets. */
import { imageDimensions } from '@/data/images';
import { heroScenes } from './hero-scenes';

function imageAttributes(src: string) {
  const dimensions = imageDimensions[src];
  const base = src.replace(/\.webp$/, '');
  return {
    ...dimensions,
    srcSet: [720, 1280]
      .filter((width) => width < dimensions.width)
      .map((width) => `${base}-${width}.webp ${width}w`)
      .concat(`${src} ${dimensions.width}w`)
      .join(', '),
  };
}

export function HeroStage() {
  const { identity, first, second, material } = heroScenes;
  const firstPhoto = first.project.coverImage;
  const secondPhoto = second.project.coverImage;
  const primary = imageAttributes(firstPhoto.src);
  const secondary = imageAttributes(secondPhoto.src);

  return (
    <div className="emh-stage">
      <p className="emh-note emh-note-opening" aria-hidden="true">
        {identity.eyebrow}
        <span>OBJECT / MATERIAL / SPACE</span>
      </p>
      <h1
        className="emh-identity"
        id="hero-title"
        aria-label="Spaces shaped for living."
      >
        {identity.words.map((word, index) => (
          <span
            className={`emh-word emh-word-${index + 1}`}
            aria-hidden="true"
            key={word}
          >
            {index === 2 ? <em>{word}</em> : word}
          </span>
        ))}
      </h1>
      <div className="emh-image emh-image-primary">
        <img
          {...primary}
          src={firstPhoto.src}
          sizes="100vw"
          alt={firstPhoto.alt}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className="emh-residence" aria-hidden="true">
        <p className="emh-caption">{first.index} / RESIDENCE</p>
        <p className="emh-project-title">
          {first.titleLines[0]}
          <br />
          <em>{first.titleLines[1]}</em>
        </p>
        <p className="emh-caption emh-location">
          {first.project.location}
          <br />
          {first.project.year}
        </p>
      </div>
      <div className="emh-material" aria-hidden="true">
        <div className="emh-material-type">
          {material.words.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </div>
      </div>
      <div className="emh-image emh-image-secondary">
        <img
          width={secondary.width}
          height={secondary.height}
          data-hero-deferred
          data-src={secondPhoto.src}
          data-srcset={secondary.srcSet}
          data-sizes="100vw"
          alt={secondPhoto.alt}
          loading="eager"
          fetchPriority="low"
          decoding="async"
        />
      </div>
      <div className="emh-quiet" aria-hidden="true">
        <p className="emh-caption">A DIFFERENT RHYTHM</p>
        <p className="emh-quiet-title">
          {second.titleLines[0]}
          <br />
          <em>{second.titleLines[1]}</em>
        </p>
        <p className="emh-caption">
          {second.index} / {second.project.title}
          <br />
          {second.project.location} · {second.project.year}
        </p>
      </div>
      <div className="emh-walnut" aria-hidden="true" />
      <p className="emh-swatch-label emh-caption" aria-hidden="true">
        {material.name}
        <span>01 / MATERIAL STUDY</span>
      </p>
      <p className="emh-opening-caption">{identity.caption}</p>
    </div>
  );
}
