import Link from 'next/link';
import type { Product } from '@/data/types';
import { getProductProjects, getRelatedProducts } from '@/data/relationships';
import { productDisclosure } from '@/lib/product-assets';
import { EditorialImage } from '@/components/shared/editorial-image';
import { ProjectSelection } from '@/components/project/project-selection';
import { ObjectSelection } from '@/components/sections/object-selection';
import { AssetAvailability } from './asset-availability';
import { ProductAssetSections } from './product-asset-sections';

export function ProductDetail({ product: p }: { product: Product }) {
  return (
    <main id="main">
      <section className="container object-detail">
        <EditorialImage src={p.image.src} alt={p.image.alt} priority />
        <div className="object-detail-copy">
          <Link className="back-link" href="/products">
            ← All objects
          </Link>
          <p className="eyebrow">{p.category} / OBJECT STUDY</p>
          <h1>{p.title}</h1>
          <p className="object-collection">{p.collection}</p>
          <AssetAvailability product={p} />
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
        ids={getRelatedProducts(p).map((product) => product.slug)}
        title="Related objects."
      />
    </main>
  );
}
