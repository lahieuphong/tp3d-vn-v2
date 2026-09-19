export function WorldsHero({
  count,
  edition,
}: {
  count: number;
  edition: string;
}) {
  return (
    <section className="container worlds-hero" aria-labelledby="worlds-title">
      <div className="worlds-hero-copy">
        <p className="eyebrow">3D / DIGITAL SPACES</p>
        <h1 id="worlds-title">
          Worlds made
          <br />
          <em>to explore.</em>
        </h1>
      </div>
      <div className="worlds-hero-aside">
        <p>
          A growing collection of digital interiors, objects and spatial
          studies.
        </p>
        <a href="#world-index" className="text-link">
          Browse the collection <span aria-hidden="true">↓</span>
        </a>
      </div>
      <div className="worlds-hero-edition eyebrow">
        <span>{String(count).padStart(2, '0')} WORLDS</span>
        <span>
          CURATED IN {edition} <span aria-hidden="true">/</span> OPEN TO
          EXPLORATION
        </span>
      </div>
    </section>
  );
}
