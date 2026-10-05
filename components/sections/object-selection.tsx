import Link from 'next/link';
import { products } from '@/data/products';
import {
  CATALOGUE_PRODUCT_CONTEXT,
  productDetailHref,
  type ProductDetailContext,
} from '@/lib/product-detail-context';
import { EditorialImage } from '@/components/shared/editorial-image';
import { SectionHeading } from '@/components/shared/section-heading';
import { AssetAvailability } from '@/components/product/asset-availability';
export function ObjectSelection({
  ids,
  title = 'Objects with a sense of place.',
  context = CATALOGUE_PRODUCT_CONTEXT,
}: {
  ids?: string[];
  title?: string;
  /** Where the visitor is: inside Room 02, its studies keep the room's URL
   * (TP3D PASS 11). Everywhere else, plain `/products/[slug]`. */
  context?: ProductDetailContext;
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
            {/* TP3D PASS 12: a Product detail renders per request (its shell
                is read from the query) and vinext serves it no-store, so a
                prefetched payload is discarded unless the click lands while
                it is still in flight. Cards never prefetch; a real click
                makes one request for the object chosen. */}
            <Link
              className="image-link"
              href={productDetailHref(p.slug, context)}
              prefetch={false}
            >
              <EditorialImage
                src={p.image.src}
                alt={p.image.alt}
                className={`object-image object-${p.slug}`}
              />
              <div className="object-caption">
                <p className="eyebrow">{p.category}</p>
                <h3>{p.title}</h3>
                <p>{p.collection}</p>
                <AssetAvailability product={p} />
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
