import type { Product } from '@/data/types';

export function AssetAvailability({ product }: { product: Product }) {
  if (!product.asset.available) return null;
  return (
    <p className="eyebrow" data-asset-availability>
      3D ASSET · AVAILABLE
    </p>
  );
}
