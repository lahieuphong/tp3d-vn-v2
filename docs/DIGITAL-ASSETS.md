# Digital objects in the existing catalog

The product catalog remains in `data/products.ts`, with `/products` and `/products/[slug]` as its discovery and detail routes. There is no separate asset catalog, cart, account or checkout. All four current object studies have `asset: { available: false }`: no model or marketplace listing has been published yet.

## Data and publication

`Product.asset` is required; the viewer, marketplace, poster and technical specifications are optional. This permits an object with a showcase only, a listing only, or both. `available: false` suppresses every asset indicator, viewer, specification and commerce CTA, even if draft values are present.

```ts
asset: {
  available: false,
  // Add these fields only when real model/listing values are known:
  // viewer: { provider: 'sketchfab', uid: 'YOUR_MODEL_UID', url: 'YOUR_PUBLIC_MODEL_URL' },
  // marketplace: { provider: 'fab', url: 'YOUR_HTTPS_FAB_LISTING_URL' },
  // poster: { src: '/images/your-object.webp', alt: 'Describe the model render' },
  // formats: ['BLEND', 'FBX', 'OBJ', 'GLB'],
  // software: ['Blender'],
  // textures: '4K PBR',
  // polygonCount: 'Verified triangle or polygon count',
  // vertices: 'Verified vertex count',
  // uv: 'Unwrapped',
  // realWorldScale: true,
  // fileSize: 'Verified download size',
  // version: '1.0',
}
```

The commented values illustrate the schema; they are not claims about the existing objects. Supply actual specifications, verify both public destinations, then set `available: true`. A modern Sketchfab UID is the 32-character hexadecimal identifier at the end of its model URL. `viewer.url` may be omitted to derive the public URL from that UID. If supplied, it must refer to the same UID. Fab links must point to an HTTPS `/listings/…` page. Invalid provider links are omitted rather than emitted into the page.

The optional `asset.poster` overrides the product image in the viewer. Use an accurate render and alt text when available. `imageRole: 'model-render'` identifies the main product image as a real digital model render. Otherwise the original reference-photography disclosure remains, including for an available digital asset. Never change the role to conceal reference imagery. The purchase disclosure always makes clear that no physical furniture is supplied and Fab handles purchases, licensing and downloads.

Empty fields and sections are omitted. `realWorldScale: false` displays **No**, rather than disappearing. Formats and software are trimmed and deduplicated.

## Discovery and relationships

`ObjectSelection` remains the shared editorial presentation on Home, Projects, Spaces, Collections and Products. Published objects gain a small typographic availability line. Every card still links internally to `/products/[slug]`.

`Project.products` remains the canonical relationship. Product Detail derives its **In Context** interiors from it. Related objects rank shared collection, category and interior membership, exclude the current object, and show up to three entries. No reverse project arrays are duplicated. A future `/assets` destination can filter the same product array and reuse these components.

## Viewer and external links

`ProductAssetSections` conditionally renders the showcase, model information and acquisition sections. `SketchfabViewer` initially renders a local poster and native button. There is no iframe until **Explore in 3D** is pressed. Returning to the image removes the iframe and restores focus to the launch button. A separate focus control moves keyboard focus into the interactive view.

The iframe has a descriptive title, reserved 16:9 dimensions and fullscreen capability. A 15-second slow-load message offers the static-image and external-view alternatives; it does not claim the model has loaded. An iframe load event indicates the embedded document has loaded, not that its cross-origin 3D scene is ready. The external link remains available for model/network/device failures. Sketchfab manages its own internal error state.

No Viewer API SDK, new dependency, GLB, Three.js renderer or external marketplace resource is loaded by this integration on Home or catalog cards. A native HTTPS anchor handles each outbound link, with `target="_blank"`, `rel="noopener noreferrer"`, an arrow and accessible new-tab text. Embed URLs are constructed centrally in `lib/product-assets.ts`, using the [official Sketchfab embed options](https://sketchfab.com/developers/viewer/initialization). Automatic rotation and VR UI are disabled; `dnt=1` requests disabled embed tracking. Model content remains hosted by Sketchfab.

## Analytics extension point

`lib/asset-analytics.ts` dispatches a browser `CustomEvent` named `asset_outbound_click`. Its detail is one of:

```ts
{ product_slug: 'your-object', destination: 'viewer', provider: 'sketchfab' }
{ product_slug: 'your-object', destination: 'purchase', provider: 'fab' }
```

Normal/keyboard activation and middle-click are supported. No analytics SDK, network collector or persistent tracking is added. Connect the existing helper or register a window event listener when an analytics provider is selected; remove that listener on cleanup.

## Validation

Run `yarn check:assets` for publication gating, malformed URLs and UID mismatches, optional fields, disclosure, related objects, poster-only server rendering, external-link attributes and event metadata. Run `yarn lint`, `yarn exec tsc --noEmit`, `yarn check:content`, `yarn build:vercel`, and `yarn check:routes <local-preview-url>` for the broader site checks.

Visual QA on 2026-09-19 used a temporary local-only product fixture, the official Sketchfab documentation's Cube Test demo, and clearly labelled sample specifications. The fixture was removed before the production build; no demonstration UID or fake Fab listing was added to catalog data.

| Width | Horizontal overflow | Viewer | Specifications | Asset CTA height |
| ----- | ------------------- | ------ | -------------- | ---------------- |
| 375   | None                | 16:9   | 2 columns      | 44 px            |
| 390   | None                | 16:9   | 2 columns      | 44 px            |
| 768   | None                | 16:9   | 2 columns      | 44 px            |
| 1024  | None                | 16:9   | 2 columns      | 44 px            |
| 1440  | None                | 16:9   | 4 columns      | 44 px            |
| 1920  | None                | 16:9   | 4 columns      | 44 px            |

Chrome QA verified the mobile menu, poster/iframe/return lifecycle, focus restoration, zero Sketchfab/Fab requests before opening the viewer, and both outbound event payloads. External navigation was suppressed only in the temporary fixture while checking its fake Fab link. Real marketplace availability, licensed downloads and the user's future model rendering must be checked when real listings exist. Sketchfab's embedded demo emits its own sensor-permission warnings; the integration does not broaden sensor permissions to silence them. No application hydration warning was observed.

The unpublished Product Detail also passed overflow checks at all six widths, with zero asset labels, iframes or provider requests. The production Vercel build passed, along with lint, TypeScript and both content/asset validation scripts. The local production crawl passed **39 content routes, 46 image paths and 7 expected 404 routes**. The temporary fixture route separately returned 404. Browser checks confirmed Home has no viewer modules or provider requests, and Project → Object navigation preserves the reference disclosure and populated context/related sections. No application console error or hydration warning appeared. Navigating away early from the project page produced an existing unused-image-preload warning; the build also reports Vinext's existing global-error dynamic-import warning. Neither is a failure of the asset integration. This verification is local; it does not deploy changes.

## Changed files

- `data/types.ts`, `data/products.ts`, `data/relationships.ts`
- `app/products/[slug]/page.tsx`
- `components/sections/object-selection.tsx`
- `components/product/product-detail.tsx`
- `components/product/product-asset-sections.tsx`
- `components/product/sketchfab-viewer.tsx`
- `components/product/model-information.tsx`
- `components/product/asset-availability.tsx`
- `components/product/asset-outbound-link.tsx`
- `components/product/product-assets.css`
- `lib/product-assets.ts`, `lib/asset-analytics.ts`
- `scripts/check-assets.mjs`, `package.json`
- `README.md`, `docs/DIGITAL-ASSETS.md`

Hero, global styles, header/footer and project scene integration are unchanged.
