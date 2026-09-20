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
        <p className="eyebrow">3D / DIGITAL COLLECTION</p>
        <h1 id="worlds-title">
          Worlds, objects
          <br />
          <em>and space.</em>
        </h1>
      </div>
      <div className="worlds-hero-aside">
        <p>
          A growing library of digital interiors and objects, curated to
          explore, study and use.
        </p>
        <a href="#world-index" className="text-link">
          Browse the collection <span aria-hidden="true">↓</span>
        </a>
      </div>
      <div className="worlds-hero-edition eyebrow">
        <span>{String(count).padStart(2, '0')} MODELS</span>
        <span>
          CURATED IN {edition} <span aria-hidden="true">/</span> OPEN TO
          EXPLORATION
        </span>
      </div>
    </section>
  );
}
