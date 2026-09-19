import type { Product } from '@/data/types';
import { resolveProductAsset } from '@/lib/product-assets';
import { EditorialImage } from '@/components/shared/editorial-image';
import { SectionHeading } from '@/components/shared/section-heading';
import { SketchfabViewer } from './sketchfab-viewer';
import { AssetOutboundLink } from './asset-outbound-link';
import { ModelInformation } from './model-information';
import './product-assets.css';

export function ProductAssetSections({ product }: { product: Product }) {
  const resolved = resolveProductAsset(product.asset);
  if (!resolved) return null;
  const { viewer, marketplaceUrl } = resolved;
  const poster = product.asset.poster ?? product.image;
  return (
    <>
      {viewer && (
        <section
          className="container section asset-exploration"
          aria-label={`Explore ${product.title} in 3D`}
        >
          <SectionHeading
            eyebrow="EXPLORE THE OBJECT"
            title="View every angle."
          />
          <SketchfabViewer
            key={viewer.uid}
            title={product.title}
            uid={viewer.uid}
            poster={
              <EditorialImage
                src={poster.src}
                alt={poster.alt}
                sizes="(max-width: 760px) 100vw, 90vw"
              />
            }
          />
          <div className="asset-viewer-outbound">
            <AssetOutboundLink
              href={viewer.url}
              event={{
                product_slug: product.slug,
                destination: 'viewer',
                provider: 'sketchfab',
              }}
            >
              View on Sketchfab
            </AssetOutboundLink>
          </div>
        </section>
      )}
      <ModelInformation asset={product.asset} />
      {marketplaceUrl && (
        <section
          className="container asset-acquisition"
          aria-labelledby="asset-acquisition-title"
        >
          <div>
            <p className="eyebrow">AVAILABLE AS A DIGITAL ASSET</p>
            <h2 id="asset-acquisition-title">
              An object for your
              <br />
              <em>own interiors.</em>
            </h2>
          </div>
          <div>
            <p>
              A digital 3D model for your visualisations. File contents and
              licence options are detailed on the linked listing.
            </p>
            <AssetOutboundLink
              href={marketplaceUrl}
              event={{
                product_slug: product.slug,
                destination: 'purchase',
                provider: 'fab',
              }}
            >
              Get the 3D asset
            </AssetOutboundLink>
            <p className="asset-purchase-note">
              Purchases, licensing and downloads are handled by Fab. This is a
              digital file; no physical furniture is supplied.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
