import type {
  Product,
  ProductAsset,
  SketchfabAssetViewer,
} from '../data/types';

export type AssetProvider = 'sketchfab' | 'fab';
const hosts: Record<AssetProvider, string[]> = {
  sketchfab: ['sketchfab.com', 'www.sketchfab.com'],
  fab: ['fab.com', 'www.fab.com'],
};

/** Keep embeds and outbound links on the configured provider's HTTPS origin. */
export function assetExternalUrl(provider: AssetProvider, value?: string) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      !hosts[provider]?.includes(url.hostname)
    )
      return null;
    if (provider === 'fab' && !/^\/listings\/[^/]+\/?$/.test(url.pathname))
      return null;
    if (
      provider === 'sketchfab' &&
      !/^\/(?:3d-models|models)\/[^/]+\/?$/.test(url.pathname)
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

export function resolveSketchfabViewer(viewer?: SketchfabAssetViewer) {
  if (viewer?.provider !== 'sketchfab') return null;
  const uid = viewer.uid.trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(uid)) return null;
  const url = assetExternalUrl(
    'sketchfab',
    viewer.url ?? `https://sketchfab.com/3d-models/${uid}`,
  );
  if (
    !url ||
    !new URL(url).pathname.replace(/\/$/, '').toLowerCase().endsWith(uid)
  )
    return null;
  const embed = new URL(`https://sketchfab.com/models/${uid}/embed`);
  embed.search = new URLSearchParams({
    autostart: '1',
    autospin: '0',
    dnt: '1',
    ui_vr: '0',
  }).toString();
  return { uid, url, embedUrl: embed.href };
}

export function resolveProductAsset(asset: ProductAsset) {
  if (!asset.available) return null;
  const viewer = resolveSketchfabViewer(asset.viewer);
  const marketplaceUrl =
    asset.marketplace?.provider === 'fab'
      ? assetExternalUrl('fab', asset.marketplace.url)
      : null;
  return { viewer, marketplaceUrl };
}

export function assetSpecifications(
  asset: ProductAsset,
): { label: string; value: string }[] {
  if (!asset.available) return [];
  const list = (values?: string[]) =>
    [...new Set(values?.map((value) => value.trim()).filter(Boolean))].join(
      ' / ',
    );
  const fields: [string, string | undefined][] = [
    ['FILE FORMATS', list(asset.formats)],
    ['SOFTWARE', list(asset.software)],
    ['TEXTURES', asset.textures],
    ['POLYGONS', asset.polygonCount],
    ['VERTICES', asset.vertices],
    ['UV', asset.uv],
    [
      'REAL-WORLD SCALE',
      typeof asset.realWorldScale === 'boolean'
        ? asset.realWorldScale
          ? 'Yes'
          : 'No'
        : undefined,
    ],
    ['FILE SIZE', asset.fileSize],
    ['VERSION', asset.version],
  ];
  return fields.flatMap(([label, value]) =>
    value?.trim() ? [{ label, value: value.trim() }] : [],
  );
}

export function productDisclosure(product: Product) {
  if (product.asset.available) {
    return product.imageRole === 'model-render'
      ? 'Shown as a digital model. No physical furniture is supplied. Refer to the linked listing for included files and licence details.'
      : 'Reference photography illustrates this object study and may differ from the digital model. Dimensions and materials are illustrative, not a manufacturer’s product listing. No physical furniture is supplied.';
  }
  return 'A concept object with reference photography. Specifications are illustrative and are not a manufacturer’s product listing.';
}

/** What a product photograph is, from the data (TP3D PASS 10): reference
 * photography stays named as such until a model render is supplied. Room 02
 * and an object study inside it say the same thing. */
export const imageRoleLabel = (product: Pick<Product, 'imageRole'>) =>
  product.imageRole === 'model-render' ? 'Model render' : 'Reference study';

/** The digital asset's state in plain words, from `asset.available` alone
 * (TP3D PASS 10): a status, never a control. Shared by Room 02 and its
 * object studies (TP3D PASS 11). */
export const assetStatusLabel = (asset: Pick<ProductAsset, 'available'>) =>
  asset.available ? '3D asset · available' : 'Digital model · in preparation';
