/* oxlint-disable next/no-img-element -- Responsive local WebP plates; the second request is owned by the timeline. */
export function HeroArchitecture() {
  return (
    <>
      <div
        className="sh-architecture"
        data-hero-layer="architecture-a"
        aria-hidden="true"
      >
        <div data-hero-parallax>
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
        </div>
      </div>
      <div
        className="sh-architecture"
        data-hero-layer="architecture-b"
        aria-hidden="true"
      >
        <div data-hero-parallax>
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
        </div>
      </div>
    </>
  );
}
