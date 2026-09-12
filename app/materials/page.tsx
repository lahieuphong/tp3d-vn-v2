import type { Metadata } from 'next';
import Link from 'next/link';
import { PageIntro } from '@/components/shared/page-intro';
import { EditorialImage } from '@/components/shared/editorial-image';
import { materials } from '@/data/materials';
export const metadata: Metadata = {
  title: 'The material library',
  description:
    'Natural oak, walnut, travertine, linen, leather and brushed metal. A tactile palette for contemporary interiors.',
};
export default function MaterialsPage() {
  return (
    <main id="main">
      <PageIntro
        eyebrow="THE MATERIAL LIBRARY"
        title="A tactile language."
        description="Materials give a space its particular feeling. Explore a palette of natural surfaces, chosen for their texture, warmth and quiet character."
      />
      <section className="container section listing-content">
        <div className="material-grid">
          {materials.map((m) => (
            <article key={m.slug}>
              <Link className="image-link" href={`/materials/${m.slug}`}>
                <EditorialImage src={m.image.src} alt={m.image.alt} />
                <p className="eyebrow">{m.family}</p>
                <h2>
                  {m.title}{' '}
                  <span className="small-arrow" aria-hidden="true">
                    ↗
                  </span>
                </h2>
                <p>{m.description}</p>
              </Link>
            </article>
          ))}
        </div>
        <p className="content-note">
          Images are material mood references. Final species, stone samples and
          finishes are selected for each project.
        </p>
      </section>
    </main>
  );
}
