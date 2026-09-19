import type { ProductAsset } from '@/data/types';
import { assetSpecifications } from '@/lib/product-assets';

export function ModelInformation({ asset }: { asset: ProductAsset }) {
  const specs = assetSpecifications(asset);
  if (!specs.length) return null;
  return (
    <section
      className="container asset-model-information"
      aria-labelledby="model-information-title"
    >
      <h2 className="eyebrow" id="model-information-title">
        MODEL INFORMATION
      </h2>
      <dl className="asset-model-specs">
        {specs.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
