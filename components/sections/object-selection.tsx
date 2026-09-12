import Link from 'next/link';
import { products } from '@/data/products';
import { EditorialImage } from '@/components/shared/editorial-image';
import { SectionHeading } from '@/components/shared/section-heading';
export function ObjectSelection({
  ids,
  title = 'Objects with a sense of place.',
}: {
  ids?: string[];
  title?: string;
}) {
  const selected = ids
    ? ids.flatMap((slug) => {
        const product = products.find((item) => item.slug === slug);
        return product ? [product] : [];
      })
    : products;
  if (!selected.length) return null;
  return (
    <section className="container section objects-section">
      <SectionHeading
        eyebrow="FURNITURE & OBJECTS"
        title={title}
        href="/products"
        link="Discover the objects"
      />
      <div className="objects-grid">
        {selected.map((p) => (
          <article key={p.slug}>
            <Link className="image-link" href={`/products/${p.slug}`}>
              <EditorialImage
                src={p.image.src}
                alt={p.image.alt}
                className={`object-image object-${p.slug}`}
              />
              <div className="object-caption">
                <p className="eyebrow">{p.category}</p>
                <h3>{p.title}</h3>
                <p>{p.collection}</p>
                <span className="object-cta">
                  View object <span aria-hidden="true">↗</span>
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
