/** Test unpublished/published product states without adding sample assets to the catalog. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = fileURLToPath(new URL('../', import.meta.url));
const nativeRequire = createRequire(import.meta.url);
const modules = new Map();
const events = [];
function load(path) {
  const file = extname(path)
    ? path
    : ['.ts', '.tsx'].map((extension) => path + extension).find(existsSync);
  if (file.endsWith('.css')) return {};
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  if (modules.has(file)) return modules.get(file).exports;
  const loadedModule = { exports: {} };
  modules.set(file, loadedModule);
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const require = (id) => {
    if (id === 'next/link')
      return {
        __esModule: true,
        default: ({ prefetch: _prefetch, ...props }) =>
          React.createElement('a', props),
      };
    if (id.startsWith('@/')) return load(resolve(root, id.slice(2)));
    if (id.startsWith('.')) return load(resolve(dirname(file), id));
    return nativeRequire(id);
  };
  runInNewContext(
    compiled.outputText,
    {
      module: loadedModule,
      exports: loadedModule.exports,
      require,
      URL,
      URLSearchParams,
      console,
      window: {
        dispatchEvent: (event) => {
          events.push(event);
        },
      },
      CustomEvent: class {
        constructor(type, init) {
          this.type = type;
          this.detail = init.detail;
        }
      },
    },
    { filename: file },
  );
  return loadedModule.exports;
}
const get = (path) => load(resolve(root, path));
const {
  resolveProductAsset,
  assetSpecifications,
  resolveSketchfabViewer,
  assetExternalUrl,
  productDisclosure,
} = get('lib/product-assets.ts');
const { products } = get('data/products.ts');
const { getRelatedProducts } = get('data/relationships.ts');
const { ProductAssetSections } = get(
  'components/product/product-asset-sections.tsx',
);
const { ProductDetail } = get('components/product/product-detail.tsx');
const { AssetAvailability } = get('components/product/asset-availability.tsx');
const { AssetOutboundLink } = get('components/product/asset-outbound-link.tsx');
const uid = '0123456789abcdef0123456789abcdef';
const asset = {
  available: true,
  viewer: {
    provider: 'sketchfab',
    uid,
    url: `https://sketchfab.com/3d-models/test-object-${uid}`,
  },
  marketplace: {
    provider: 'fab',
    url: 'https://www.fab.com/listings/test-only-unpublished',
  },
  formats: ['GLB', ' FBX ', '', 'GLB'],
  software: ['Blender'],
  textures: '4K PBR',
  uv: '',
  realWorldScale: false,
  version: '1.0',
};
const product = { ...products[0], asset };
const render = (Component, props) =>
  renderToStaticMarkup(React.createElement(Component, props));
assert.ok(products.length > 0);
for (const p of products) {
  assert.equal(typeof p.asset.available, 'boolean');
  const detail = render(ProductDetail, { product: p });
  if (!p.asset.available) {
    assert.equal(resolveProductAsset(p.asset), null);
    assert.equal(render(ProductAssetSections, { product: p }), '');
    assert.equal(render(AssetAvailability, { product: p }), '');
    assert.doesNotMatch(
      detail,
      /<iframe|sketchfab\.com|fab\.com|Get the 3D asset|MODEL INFORMATION/,
    );
    assert.match(detail, /reference photography/);
  } else {
    const resolved = resolveProductAsset(p.asset);
    if (p.asset.viewer) assert.ok(resolved.viewer, `${p.slug}: invalid viewer`);
    if (p.asset.marketplace)
      assert.ok(resolved.marketplaceUrl, `${p.slug}: invalid marketplace`);
    assert.doesNotMatch(detail, /<iframe/);
  }
  assert.match(detail, /Related objects\./);
  const related = getRelatedProducts(p);
  assert.equal(related.length, Math.min(3, products.length - 1));
  assert.ok(related.every((other) => other.slug !== p.slug));
  assert.equal(
    new Set(related.map((other) => other.slug)).size,
    related.length,
  );
}
assert.equal(resolveProductAsset({ ...asset, available: false }), null);
assert.equal(assetSpecifications({ ...asset, available: false }).length, 0);
assert.equal(
  render(ProductAssetSections, {
    product: { ...product, asset: { ...asset, available: false } },
  }),
  '',
);
const resolved = resolveProductAsset(asset);
assert.equal(resolved.viewer.uid, uid);
assert.equal(resolved.marketplaceUrl, asset.marketplace.url);
assert.equal(new URL(resolved.viewer.embedUrl).hostname, 'sketchfab.com');
assert.equal(
  new URL(resolved.viewer.embedUrl).pathname,
  `/models/${uid}/embed`,
);
assert.equal(
  resolveSketchfabViewer({ provider: 'sketchfab', uid: 'not-a-model' }),
  null,
);
assert.equal(
  resolveSketchfabViewer({ ...asset.viewer, uid: 'a'.repeat(32) }),
  null,
);
assert.ok(
  resolveSketchfabViewer({ provider: 'sketchfab', uid: uid.toUpperCase() }),
);
for (const url of [
  'javascript:alert(1)',
  'http://sketchfab.com/models/' + uid,
  'https://sketchfab.com.evil.test/models/' + uid,
  'https://user:pass@sketchfab.com/models/' + uid,
  'https://sketchfab.com:444/models/' + uid,
]) {
  assert.equal(assetExternalUrl('sketchfab', url), null);
}
assert.equal(assetExternalUrl('fab', 'https://www.fab.com/'), null);
assert.equal(
  assetExternalUrl('fab', 'https://sketchfab.com/models/' + uid),
  null,
);
const specs = assetSpecifications(asset);
assert.ok(specs.every((entry) => entry.value.trim()));
assert.equal(
  specs.find((entry) => entry.label === 'FILE FORMATS').value,
  'GLB / FBX',
);
assert.equal(
  specs.find((entry) => entry.label === 'REAL-WORLD SCALE').value,
  'No',
);
assert.ok(!specs.some((entry) => entry.label === 'UV'));
const active = render(ProductAssetSections, { product });
assert.match(active, /EXPLORE THE OBJECT/);
assert.match(active, /Explore in 3D/);
assert.doesNotMatch(
  active,
  /<iframe|<script|rel="(?:preload|preconnect|dns-prefetch)"/,
);
assert.match(active, /MODEL INFORMATION/);
assert.match(active, /Get the 3D asset/);
assert.match(active, /Purchases, licensing and downloads are handled by Fab/);
assert.match(active, /target="_blank" rel="noopener noreferrer"/);
assert.equal((active.match(/opens in a new tab/g) ?? []).length, 2);
assert.match(render(AssetAvailability, { product }), /3D ASSET · AVAILABLE/);
assert.match(productDisclosure(product), /Reference photography/);
assert.match(
  productDisclosure({ ...product, imageRole: 'model-render' }),
  /No physical furniture/,
);
assert.equal(
  render(ProductAssetSections, {
    product: { ...product, asset: { available: true } },
  }),
  '',
);
const viewerOnly = render(ProductAssetSections, {
  product: { ...product, asset: { available: true, viewer: asset.viewer } },
});
assert.match(viewerOnly, /Explore in 3D/);
assert.doesNotMatch(
  viewerOnly,
  /Get the 3D asset|MODEL INFORMATION|AVAILABLE AS A DIGITAL ASSET/,
);
const marketplaceOnly = render(ProductAssetSections, {
  product: {
    ...product,
    asset: { available: true, marketplace: asset.marketplace },
  },
});
assert.doesNotMatch(marketplaceOnly, /EXPLORE THE OBJECT|MODEL INFORMATION/);
assert.match(marketplaceOnly, /Get the 3D asset/);
assert.equal(
  render(ProductAssetSections, {
    product: {
      ...product,
      asset: {
        available: true,
        viewer: { provider: 'sketchfab', uid: 'invalid' },
        marketplace: { provider: 'fab', url: 'https://example.com' },
      },
    },
  }),
  '',
);
const event = {
  product_slug: product.slug,
  destination: 'purchase',
  provider: 'fab',
};
const link = AssetOutboundLink({
  href: asset.marketplace.url,
  event,
  children: 'Get the 3D asset',
});
link.props.onClick();
link.props.onAuxClick({ button: 1 });
link.props.onAuxClick({ button: 2 });
assert.equal(events.length, 2);
assert.equal(events[0].type, 'asset_outbound_click');
assert.equal(JSON.stringify(events[0].detail), JSON.stringify(event));
assert.equal(link.props.target, '_blank');
assert.equal(link.props.rel, 'noopener noreferrer');
console.log(
  'Asset checks passed: unpublished catalog, valid/invalid providers and URLs, partial/empty data, specs, disclosure, related objects, lazy SSR, safe links and outbound events.',
);
