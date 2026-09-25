/* oxlint-disable next/no-img-element -- One optimized alpha textile shared across three chapters. */
/** One continuous artwork, not three restarted ribbons. It lives in document
 * flow coordinates: no full-page transform, GPU promotion or animation loop. */
export function BreezeConnector() {
  return (
    <div className="hc-breeze-journey" aria-hidden="true">
      <img
        src="/images/home-chapters/journey-ribbon.webp"
        width={724}
        height={2172}
        alt=""
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        draggable={false}
      />
    </div>
  );
}

export function ChapterColophon({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`hc-colophon${dark ? ' hc-colophon-dark' : ''}`}
      aria-hidden="true"
    >
      <span>tân phong</span>
      <i />
      <small>A CONTINUING BREEZE</small>
      <i />
      <small>EST. 2026</small>
    </div>
  );
}
