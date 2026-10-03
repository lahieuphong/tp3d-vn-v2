# 3D Worlds catalogue

`/worlds` is a curated catalogue of digital interiors and spatial studies. It shares Tân Phong's existing fonts, colours, header and footer. This redesign changes only Worlds presentation and its data/validation support; Homepage, its Hero and the other content routes are unchanged.

Since TP3D PASS 05 the catalogue is also the World's **01 Gallery**: the `/world` Lobby links its one open room here. `/worlds` keeps its URL, filters, fragments and editorial header and footer. The Lobby is not a replacement for it. See [TP3D-PASS-05-WORLD-GATEWAY.md](TP3D-PASS-05-WORLD-GATEWAY.md).

## Content

Edit `data/worlds.ts`. A `World` contains `id`, `slug`, `title`, `category`, `style`, `type`, `year`, `description`, `image: { src, alt }`, `featured`, `available`, `sketchfabUid`, `externalUrl`, and author/licence `credit` metadata.

- `featured: true` selects up to three authored entries for the exhibition above the catalogue.
- `available: true` enables the external card link. False renders an unlinked preview labelled “In preparation”.
- `category`, `style`, and `type` are searchable content, not fixed UI enums. Category navigation derives from the entire dataset.
- `year` is the **curation edition**, not the model's original publication year. “Newest” orders by that year, preserving authored order for ties. A–Z sorts titles in English.
- The count in the Hero derives from the full dataset. Filtered counts reflect the matching collection.

The four existing scenes and exact external URLs are retained:

| World                       | Sketchfab scene                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| Modern Kitchen              | https://sketchfab.com/3d-models/modern-kitchen-9843a830b96142a9a53f45f25304d93c              |
| White Modern Living Room    | https://sketchfab.com/3d-models/white-modern-living-room-afb8cb0cbee1488caf61471ef14041e9    |
| Minimalistic Modern Bedroom | https://sketchfab.com/3d-models/minimalistic-modern-bedroom-4f3db3cb57bd4bce886f7b9a13273a2f |
| Modern Bathroom             | https://sketchfab.com/3d-models/modern-bathroom-9ba7e0a094694335bd8f4656611c0676             |

These are curated external scenes, independent of unpublished product assets. They do not publish or sell any of the four concept products. Author/licence records remain in `assets/world-preview-sources.json` and the expandable “Scene & preview credits” on the page. See [Asset sources](ASSET-SOURCES.md).

To replace imagery, add the source under `assets/reference-images`, run `yarn images:optimize`, and update the World's image and credit metadata. Existing responsive WebP variants reserve their dimensions through `EditorialImage`.

## Components

- `app/worlds/page.tsx`: server entry, metadata and initial query parsing.
- `WorldsHero`: compact typographic introduction, approximately 60svh on desktop, content-sized on mobile.
- `FeaturedWorlds`: up to three featured records; one large image beside two smaller studies on desktop.
- `WorldsCatalog`: client state, URL restoration, pagination and fragment discovery.
- `WorldsToolbar` / `WorldFilters`: labelled search, native sort select, derived category buttons and live result count.
- `WorldsGrid` / `WorldCard` / `WorldCardMedia`: one coherent grid, whole-card semantic links, consistent 4:3 catalogue images. Three columns above 1100px, two at 761–1100px, one below.
- `LoadMore`: twelve items per page, explicit progressive disclosure, focus moves to the first added card. No infinite scroll. The button disappears once all matches are shown.
- `WorldCredits`: source/licence disclosure kept outside the clickable cards.
- `useCardTilt`: reusable delegated pointer interaction.
- `useWorldReveal`: a single IntersectionObserver per grid, one-time entry transitions.
- `lib/world-catalog.ts`: pure category, selection, sort, query and pagination functions.
- `worlds.css`: scoped presentation using existing global tokens.

The old alternating `WorldEntry` is removed. No global style or navigation/footer redesign is involved.

## Browsing behaviour

Search matches title, category, style and type, ignoring case/accents and extra whitespace. Multiple words must all match. Search and category combine. Any filter/search/sort change resets pagination to twelve. Empty results show “No worlds found”, guidance and “Clear filters”.

`category`, `q`, and `sort` sync with query parameters through `history.replaceState`; typing does not create a history entry for every keystroke. Unrelated parameters are retained. Server rendering honours an incoming query, and browser back/forward restores it. Invalid categories/sorts fall back to All/Newest.

Examples: `/worlds?category=kitchen`, `/worlds?q=minimal`, `/worlds?sort=az`.

Existing global-search anchors `/worlds#slug` still work. A linked scene beyond the first page expands the catalogue to include it. If a fragment conflicts with current filters, the filters are cleared so the target can be reached. There is no `/worlds/[slug]` detail route in this release.

Each available card is one anchor with `target="_blank"`, `rel="noopener noreferrer"`, an external arrow and an accessible name announcing the new tab. No nested anchors. Credit links live separately.

## Motion and performance

Fine mouse pointers use perspective 1200px, rotations bounded to ±3°/±4°, opposite image translation up to 6px, background/frame translation up to 3px and foreground translation up to 12px. Image scale reaches 1.035; metadata rises 3px and the arrow moves diagonally. Transitions take 400–500ms without spring motion.

Each grid has one delegated pointer-over listener. Only the active card owns pointer-move/leave/cancel listeners. Pointer events coalesce into one requested animation frame; there is no permanent animation loop. Leave, scroll, resize, media preference changes and unmount clean up tracking and transforms.

Touch input never tilts or uses device orientation. It receives the one-time image-scale/text reveal on entry. Cards already in view stay visible at hydration; remaining cards reveal through IntersectionObserver with a small row stagger and no replay. Keyboard focus reveals a pending card immediately. Reduced motion keeps cards static and disables tracking, tilt and parallax.

Only the leading featured image has high fetch priority; all catalogue images are lazy and use responsive local WebP srcsets. There is no Three.js dependency, WebGL renderer, iframe, Sketchfab API, model preload or external viewer request in this route.

## Validation

Run:

```sh
yarn lint
yarn exec tsc --noEmit
yarn check:content
yarn check:assets
yarn check:worlds
yarn build:vercel
node scripts/check-site.mjs http://127.0.0.1:4483
```

`check:worlds` exercises 4, 12, 30 and 100-record fixtures, bounded SSR card counts, pagination, dynamic categories, featured selection, search across all supported fields, sorting, URL round trips, empty results and unavailable scenes. Fixtures are never added to production data.

Browser QA also uses a temporary 30-item route to exercise 12 → 24 → 30, button removal, focus transfer, filter pagination reset and mobile layout. That route is removed before production build. Production retains the four supplied scenes.

Local verification does not deploy to Vercel. External scenes depend on the original authors keeping them available.

### Latest verification — 2026-09-19

- Production route crawl: **40 pages, 58 image paths, eight expected 404s**. The temporary 30-item QA route also returns 404 after removal.
- Chrome viewport widths **375, 390, 768, 1024, 1280, 1440 and 1920px**: no horizontal page overflow or clipped titles; catalogue media stays 4:3. Search, sort and filter targets meet 44px height. Mobile menu was checked at 375px.
- Filter/search combination, empty recovery, A–Z, reloadable query URLs and external new-tab behaviour were checked. SSR query checks cover category, style/type search, no match, sort and invalid-category fallback.
- The 30-record browser fixture verified **12 → 24 → 30**, focus to items 13/25, button removal and category-change reset back to the first page. Desktop and 375px layouts were inspected before removing the fixture.
- Fine-pointer tracking measured rotations within ±3°/±4°, one active card, and clean styles after leaving. Touch emulation kept zero active tilts. Reduced-motion emulation kept all cards visible, zero active tilts and no image transform.
- A fresh production load showed **zero console messages**, no hydration warnings, no iframe/canvas and no Sketchfab/model/viewer resource requests. One featured image is high priority; every catalogue image is lazy.
