# Content relationship and UX validation — 12 September 2026

The existing art direction, fonts, image assets and homepage section order are preserved. The existing experience banner occupies the requested position between Selected Interiors and Collections, with the requested new copy.

## Content graph

- `Project.spaces`, `Project.products` and `Project.materials` are canonical slug lists. Reverse membership is derived in `data/relationships.ts`.
- Living → Walnut Residence, Quiet House; Bedroom → Walnut Residence, Quiet House; Kitchen → Walnut Residence, Courtyard Residence; Dining → Quiet House, Courtyard Residence; Workspace → Courtyard Residence.
- Each of five collections resolves its curated projects. Products and materials derive from those projects without duplicated membership arrays.
- All four products and six materials resolve project context. Walnut resolves Walnut Residence; Travertine resolves Walnut Residence and Quiet House.
- Every project has two related interiors, ranked by shared style, rooms, materials and objects.
- Optional project/object/material/gallery/related-space/experience-detail sections guard resolved content. A single project uses the existing image-and-copy editorial layout. Explicit object/material selections retain their authored order; material palettes beyond three photographs remain reachable through text links.
- `npm run check:content` validates unique slugs, references, expected relationships, order, ranking, missing/empty relationships and current disabled-scene flags.

## Production and browser checks

- `npm run build`: passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed for authored code; existing generated UI exclusions remain documented in README.
- `git diff --check`: passed.
- Production HTTP crawl: 39 content routes returned 200; 46 referenced image/source-set paths returned 200. Seven invalid detail routes (project, space, collection, product, material, journal, experience) returned 404. Populated context sections and immediate preparation copy were asserted.
- Chrome layout measurements covered all 39 routes at 375, 390, 768 and 1024px, and a partial additional route sweep at 1440px. No document overflow, broken images, empty project contexts, zero-height project previews, canvases or scene/model requests were found in completed measurements. The large sweep was stopped to release browser memory; it is not reported as a complete 234-case run.
- Direct visual checks used actual DevTools viewports: 375px homepage/mobile menu and experience; 390px Workspace context; 768px Contemporary collection; 1024px Walnut material context; 1440px Line Sofa context; 1920px homepage experience banner. All measured direct viewports had no horizontal overflow. Single/multiple project layouts, image proportions and content hierarchy were inspected.
- Mobile menu opened and closed correctly. Context and experience CTA heights measured 44px. The homepage banner's immediate neighbors are Selected Interiors and Collections.
- All three disabled experience routes render the static preview and preparation state in the server response. Chrome confirmed no `three-scene-loader`, scene registry, GLB request or canvas on the disabled experience; a fresh homepage confirmed no experience-shell/scene/model request or canvas.
- Both Cormorant and Manrope were verified loaded. Redundant manual font preload links were removed without changing fonts or typography. No application console errors, React hydration warnings or missing-key warnings were observed in the checked journeys. Chrome showed non-blocking image preload warnings while navigating and changing responsive sizes.

These are desktop Chrome and emulated viewport checks, not physical-device tests. No real Three.js scene exists; rendering, controls, GPU memory and model performance must be verified when an actual scene is registered and enabled.

## Files changed in this pass

- Data: `data/relationships.ts` (new), `data/types.ts`, `data/projects.ts`, `data/spaces.ts`.
- Detail routes: `app/collections/[slug]/page.tsx`, `app/products/[slug]/page.tsx`, `app/materials/[slug]/page.tsx`, `app/experience/[slug]/page.tsx`.
- Shared detail rendering: `components/project/project-selection.tsx` (new), `components/project/project-detail.tsx`, `components/space/space-detail.tsx`.
- Sections: `components/sections/experience-banner.tsx`, `components/sections/object-selection.tsx`, `components/sections/material-selection.tsx`.
- Experience: `components/experience/experience-shell.tsx`, `components/experience/scene-fallback.tsx`.
- Small presentation/performance fixes: `app/globals.css`, `app/layout.tsx`.
- Checks and documentation: `scripts/check-content.mjs` (new), `scripts/check-site.mjs`, `package.json`, `README.md`, `docs/VALIDATION.md`.
