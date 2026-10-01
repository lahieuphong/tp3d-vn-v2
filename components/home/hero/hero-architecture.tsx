/* oxlint-disable next/no-img-element -- Responsive local WebP plates; the second request is owned by the timeline. */
export function HeroArchitecture() {
  return (
    <>
      <div
        className="sh-architecture"
        data-hero-layer="architecture-a"
        aria-hidden="true"
      >
        <div data-hero-surface>
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/images/spatial-architecture-a-720.webp"
            />
            <source
              media="(max-width: 1199px)"
              srcSet="/images/spatial-architecture-a-1280.webp"
            />
            <img
              src="/images/spatial-architecture-a.webp"
              srcSet="/images/spatial-architecture-a-720.webp 720w, /images/spatial-architecture-a-1280.webp 1280w, /images/spatial-architecture-a.webp 1586w"
              sizes="100vw"
              width={1586}
              height={992}
              alt=""
              fetchPriority="high"
              loading="eager"
            />
          </picture>
        </div>
      </div>
      <div
        className="sh-architecture"
        data-hero-layer="architecture-b"
        aria-hidden="true"
      >
        <div data-hero-surface>
          <picture>
            <source
              media="(max-width: 767px)"
              data-hero-deferred-source
              data-srcset="/images/spatial-architecture-b-720.webp"
            />
            <source
              media="(max-width: 1199px)"
              data-hero-deferred-source
              data-srcset="/images/spatial-architecture-b-1280.webp"
            />
            <img
              data-hero-deferred
              data-src="/images/spatial-architecture-b.webp"
              data-srcset="/images/spatial-architecture-b-720.webp 720w, /images/spatial-architecture-b-1280.webp 1280w, /images/spatial-architecture-b.webp 1586w"
              data-sizes="100vw"
              width={1586}
              height={992}
              alt=""
              fetchPriority="low"
              decoding="async"
            />
          </picture>
        </div>
      </div>
    </>
  );
}
