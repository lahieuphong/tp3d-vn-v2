# Tân Phong — Interiors & Objects

An English-language editorial interior website built from an empty workspace. Vinext App Router, React 19, TypeScript and a custom responsive CSS design system. No code or assets from the neighboring projects are used.

## Run locally

```sh
npm install
npm run dev -- --port 3000
```

Open the Local URL printed by the server. Node 22.13+ is required. The checked-in lockfile is authoritative.

## Deploy to Vercel

The default build remains configured for Cloudflare Sites. Vercel builds switch to Vinext's Nitro adapter and emit the Vercel Build Output API structure under `.vercel/output`.

```sh
npm run build:vercel
npx vercel deploy --prod --yes --project tp3d-vn-v2
```

The local build verifies the Build Output API structure. Deploy from source so native dependencies are rebuilt for Vercel's Linux runtime. `vercel.json` selects the custom Vercel build command, and the project name provides the `tp3d-vn-v2.vercel.app` production alias.

## Validation

```sh
npm run lint
npm run check:content
npx tsc --noEmit
npm run build
node scripts/check-site.mjs http://localhost:3000
```

The route check crawls every linked content page, verifies headings/titles/image availability, and checks seven invalid detail routes, populated relationship sections and immediate 3D preparation states. `check:content` validates all content references, expected room/material membership, related projects and empty results. It requires a running server. Generated shadcn primitives and their supplied mobile hook are excluded from lint; authored application components remain fully linted. Images use a documented local WebP srcset implementation rather than runtime image optimization.

## Content and routes

- `/`: editorial discovery homepage
- `/spaces` and `/spaces/[slug]`: five room types
- `/projects` and `/projects/[slug]`: three residential studies
- `/collections` and `/collections/[slug]`: five style collections
- `/products` and `/products/[slug]`: four furniture/object studies
- `/materials` and `/materials/[slug]`: six materials
- `/journal` and `/journal/[slug]`: four complete editorial articles
- `/about`, `/contact`
- `/experience/[slug]`: dedicated future scene entry for each project

This is 39 content routes. Unknown detail slugs return 404.

All relationships and content live in `data/`. Edit `data/projects.ts`, `spaces.ts`, `collections.ts`, `products.ts`, `materials.ts` and `journal.ts`. Each project stores `id`, `slug`, `title`, `location`, `year`, `style`, `area`, `description`, `coverImage`, `gallery`, `materials`, `products`, `spaces` and `threeScene`.

`Project.spaces`, `Project.products` and `Project.materials` are the canonical slug relationships. `data/relationships.ts` derives the reverse Space/Product/Material project lists; do not duplicate project arrays on those objects. Collections curate `projects` in display order, and their objects/materials are derived from those projects. Related projects are ranked by shared style, rooms, materials and objects, limited to two. Optional sections guard the resolved content before rendering their heading; single-project sections reuse the alternating editorial layout. Explicit material selections show three images and link the rest of the palette.

Shared layout is in `components/layout`; homepage sections in `components/sections`; detail templates in `components/project` and `components/space`; the experience integration in `components/experience`. Design tokens, grids, typography and responsive styles live in `app/globals.css`. The planning record is `docs/DESIGN-DIRECTION.md`.

## Replace photography

Image paths are centralized in `data/images.ts`. Add a source JPG under `assets/reference-images` and run:

```sh
node scripts/optimize-images.mjs
```

It writes local 720px, 1280px and large WebP variants to `public/images`. Update the image data and meaningful alt text. `<EditorialImage>` reserves aspect ratio, uses `srcset`, lazily loads secondary images and prioritizes the main hero. Font files are self-hosted WOFF2. Image and font provenance is in `docs/ASSET-SOURCES.md`.

## Add Three.js later

No model is supplied and Three.js is intentionally not installed. The current experience is an honest editorial placeholder, with no simulated tour, fake loading timer or WebGL allocation on the homepage.

1. Add Three.js only when implementing an actual scene.
2. Create a module under `components/experience/scenes/` exporting `createScene(context)` matching `SceneFactory` in `scene-registry.ts`.
3. Register it behind a dynamic import: `'walnut-living': () => import('./scenes/walnut-living')`.
4. Keep `threeScene: { enabled: false }` while a scene is unavailable (an optional `roomId` may reserve its key). This renders the static project preview and preparation copy immediately, without importing the viewer. After registering a real scene, set `threeScene: { enabled: true, roomId: 'walnut-living' }`. Only that experience route then imports the viewer and the selected scene module.
5. The context supplies `host`, an AbortSignal and `onSelect({ kind: 'product' | 'material', slug })`. Restrict selections to that project's catalog. A selection opens the reusable detail sheet.
6. Return a `SceneHandle` with idempotent `dispose()` and optional `setPaused()`. Dispose all owned geometries, materials, textures, render targets, renderer, controls, listeners, observers and animation frames. Factories must also clean partial resources if setup rejects. Respect aborts during async asset loading, dispose late results, cap DPR, pause hidden tabs and prefer render-on-demand.
7. The factory owns camera/touch/keyboard controls; make its canvas focusable and expose accessible equivalent controls. `ExperienceShell`, `ExperienceUI`, `ThreeSceneLoader`, `LoadingScreen`, `SceneFallback` and `ExperienceBoundary` already provide the surrounding lifecycle and fallback flow.
8. Once real scenes exist, test repeated route entry/exit, asset failure, WebGL loss/restoration and real mobile GPUs. No claim of measured VRAM behavior is made for this placeholder.

## Before opening the studio website publicly

The residences, dates, areas, object names and specifications are illustrative. Photography comes from third-party reference images and is not presented as commissioned work. Material photos are mood references, not verified species/finish samples. Replace them with actual project photography, models and verified specifications. Contact details and social profiles are not supplied, so the contact page transparently says they are forthcoming; no form pretends to submit an enquiry.

The Sites deployment is owner-private. Its `.openai/hosting.json` stores the project binding. No source credentials are stored in the repository.
