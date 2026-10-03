# Tân Phong — Interiors & Objects

An English-language editorial interior website built from an empty workspace. Vinext App Router, React 19, TypeScript and a custom responsive CSS design system. No code or assets from the neighboring projects are used.

## Run locally

```sh
yarn install
yarn dev --port 3000
```

Open the Local URL printed by the server. Node 22.13+ is required. The checked-in lockfile is authoritative.

## Deploy to Vercel

The default build remains configured for Cloudflare Sites. Vercel builds switch to Vinext's Nitro adapter and emit the Vercel Build Output API structure under `.vercel/output`.

```sh
yarn build:vercel
yarn dlx vercel@latest deploy --prod --yes --project tp3d-vn-v2
```

The local build verifies the Build Output API structure. Deploy from source so native dependencies are rebuilt for Vercel's Linux runtime. `vercel.json` selects the custom Vercel build command, and the project name provides the `tp3d-vn-v2.vercel.app` production alias.

## Validation

```sh
yarn lint
yarn check:content
yarn check:assets
yarn tsc --noEmit
yarn build
yarn check:routes http://localhost:3000
```

The route check requires a running server; it crawls every linked content page, verifies headings/titles/image availability, and checks eight unavailable detail routes, populated relationship sections and immediate 3D preparation states. `check:content` validates all content references, expected room/material membership, related projects and empty results. `check:assets` validates publication states, provider URLs, model specifications, server-rendered asset sections and outbound analytics without making third-party requests. Generated shadcn primitives and their supplied mobile hook are excluded from lint; authored application components remain fully linted. Images use a documented local WebP srcset implementation rather than runtime image optimization.

## Content and routes

- `/`: editorial discovery homepage
- `/spaces` and `/spaces/[slug]`: five room types
- `/projects` and `/projects/[slug]`: three residential studies
- `/worlds` and `/worlds/[slug]`: four curated digital interiors; detail pages load the Sketchfab viewer on request
- `/collections` and `/collections/[slug]`: five style collections
- `/products` and `/products/[slug]`: four furniture/object studies
- `/materials` and `/materials/[slug]`: six materials
- `/journal` and `/journal/[slug]`: four complete editorial articles
- `/about`, `/contact`
- `/experience/[slug]`: dedicated future scene entry for each project

This is 44 content routes. Unknown detail slugs return 404.

All relationships and content live in `data/`. Edit `data/projects.ts`, `spaces.ts`, `collections.ts`, `products.ts`, `materials.ts` and `journal.ts`. Each project stores `id`, `slug`, `title`, `location`, `year`, `style`, `area`, `description`, `coverImage`, `gallery`, `materials`, `products`, `spaces` and `threeScene`.

`Project.spaces`, `Project.products` and `Project.materials` are the canonical slug relationships. `data/relationships.ts` derives the reverse Space/Product/Material project lists; do not duplicate project arrays on those objects. Collections curate `projects` in display order, and their objects/materials are derived from those projects. Related projects are ranked by shared style, rooms, materials and objects, limited to two. Optional sections guard the resolved content before rendering their heading; single-project sections reuse the alternating editorial layout. Explicit material selections show three images and link the rest of the palette.

Shared layout is in `components/layout`; homepage sections in `components/sections`; detail templates in `components/project` and `components/space`; the experience integration in `components/experience`. Design tokens, grids, typography and responsive styles live in `app/globals.css`. The original planning record is `docs/DESIGN-DIRECTION.md`. The current source of truth for design and motion is [TP3D Design System](docs/TP3D-DESIGN-SYSTEM.md); motion tokens live in `lib/motion/tokens.ts` (mirrored as `--motion-*` in `app/globals.css`, verified by `yarn check:motion`).

## Replace photography

The Worlds catalogue uses locally optimized previews of the four supplied Sketchfab scenes, with featured studies, category/search/sort controls, twelve-item pagination and a subtle pointer depth effect. Its data, source credits, layout and QA notes are documented in [3D Worlds](docs/3D-WORLDS.md). It does not embed a viewer or load Three.js. Run `yarn check:worlds` to validate catalogue behaviour against 4/12/30/100-record fixtures.

Image paths are centralized in `data/images.ts`. Add a source JPG under `assets/reference-images` and run:

```sh
node scripts/optimize-images.mjs
```

It writes local 720px, 1280px and large WebP variants to `public/images`. Update the image data and meaningful alt text. `<EditorialImage>` reserves aspect ratio, uses `srcset`, lazily loads secondary images and prioritizes the main hero. Font files are self-hosted WOFF2. Image and font provenance is in `docs/ASSET-SOURCES.md`.

## Add digital objects

For individual digital objects, the existing product catalog also supports click-to-load Sketchfab showcases and outbound Fab listings. All current products remain unpublished (`asset.available: false`). See [Digital assets](docs/DIGITAL-ASSETS.md) for the schema, publishing workflow, analytics hook and verification notes. This integration is independent of the project scene architecture below.

## Add Three.js later

No model is supplied and no experience scene is registered, so each experience route is an honest editorial placeholder with no simulated tour or fake loading timer. Three.js is installed; today only the homepage atmospheric sky bridge imports it, lazily (see [Home motion context](docs/TANPHONG_HOME_MOTION_CONTEXT.md) §13). Rules for new 3D work are in the [design system](docs/TP3D-DESIGN-SYSTEM.md) §14.

1. Import Three.js only inside a scene module, never at module scope of shared code.
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
