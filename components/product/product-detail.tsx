import Link from 'next/link';
import type { Product } from '@/data/types';
import { getProductProjects, getRelatedProducts } from '@/data/relationships';
import {
  assetStatusLabel,
  imageRoleLabel,
  productDisclosure,
} from '@/lib/product-assets';
import {
  CATALOGUE_PRODUCT_CONTEXT,
  productReturn,
  relatedInContext,
  type ProductDetailContext,
} from '@/lib/product-detail-context';
import { EditorialImage } from '@/components/shared/editorial-image';
import { ProjectSelection } from '@/components/project/project-selection';
import { ObjectSelection } from '@/components/sections/object-selection';
import { AssetAvailability } from './asset-availability';
import { ProductAssetSections } from './product-asset-sections';

/** One object study for both shells. The catalogue context is the editorial
 * page exactly as before. A validated Room 02 context (TP3D PASS 11) changes
 * only the way back (first, before the plate), names the photograph and the
 * digital model as the room does, and keeps related studies inside the room.
 * Every fact still comes from the product. */
export function ProductDetail({
  product: p,
  context = CATALOGUE_PRODUCT_CONTEXT,
}: {
  product: Product;
  context?: ProductDetailContext;
}) {
  const back = productReturn(p.slug, context);
  const backLink = (
    <Link className="back-link" href={back.href}>
      {`← ${back.label}`}
    </Link>
  );
  const image = <EditorialImage src={p.image.src} alt={p.image.alt} priority />;
  return (
    <main id="main">
      <section className="container object-detail">
        {context.kind === 'objects' ? (
          <>
            {backLink}
            <figure className="object-study-plate">
              <figcaption className="object-study-drawer">
                <span>{context.label}</span>
                <span>{imageRoleLabel(p)}</span>
              </figcaption>
              {image}
            </figure>
          </>
        ) : (
          image
        )}
        <div className="object-detail-copy">
          {context.kind === 'catalogue' && backLink}
          <p className="eyebrow">{p.category} / OBJECT STUDY</p>
          <h1>{p.title}</h1>
          <p className="object-collection">{p.collection}</p>
          {context.kind === 'catalogue' && <AssetAvailability product={p} />}
          <p>{p.description}</p>
          <dl className="detail-specs">
            <div>
              <dt>DIMENSIONS</dt>
              <dd>{p.dimensions}</dd>
            </div>
            <div>
              <dt>MATERIAL</dt>
              <dd>{p.material}</dd>
            </div>
          </dl>
          {context.kind === 'objects' && (
            <p
              className="object-study-status"
              data-asset-status={
                p.asset.available ? 'available' : 'in-preparation'
              }
            >
              {assetStatusLabel(p.asset)}
            </p>
          )}
          <p className="content-note">{productDisclosure(p)}</p>
        </div>
      </section>
      <ProductAssetSections product={p} />
      <ProjectSelection
        projects={getProductProjects(p.slug)}
        eyebrow="IN CONTEXT"
        title="At home in these interiors."
      />
      <ObjectSelection
        ids={relatedInContext(
          getRelatedProducts(p, Number.POSITIVE_INFINITY),
          context,
        ).map((product) => product.slug)}
        title={
          context.kind === 'objects' ? 'Related studies.' : 'Related objects.'
        }
        context={context}
      />
    </main>
  );
}
