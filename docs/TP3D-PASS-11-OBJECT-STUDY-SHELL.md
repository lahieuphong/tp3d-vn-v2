# TP3D PASS 11 — Objects → Object Study World-shell integration

PASS 11 closes the last seam in Room 02. A visitor who opens an object study
from `/world/objects` now stays inside the World. The study shows the World
chrome with Objects current, on the World ground and in the World's type,
from the first paint, with no editorial header or footer. It sits on the same
product route, `/products/[slug]`. Opened from the collection, the same URL
is still the editorial object study, its markup unchanged byte for byte.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). This pass
extends §9 rule 15 to Objects → Product studies and adds rule 20, "World rooms
contextualize existing content; they do not duplicate it". The previous pass
is [TP3D-PASS-10-OBJECTS.md](TP3D-PASS-10-OBJECTS.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-05 |
| Starting HEAD | `92ae111` — feat(world): add Room 02 Objects collection |
| Added | `lib/product-detail-context.ts`, `components/world/object-study-shell.tsx`, `components/world/object-study-shell.css`, `yarn check:object-study` |
| Changed | `app/products/[slug]/page.tsx` (validates the context, picks the shell); `ProductDetail` (one `context` prop); `ObjectSelection` (one `context` prop, plain by default); `world-objects.tsx` (study links through `productDetailHref`, labels from the shared helpers); `lib/product-assets.ts` (`imageRoleLabel`, `assetStatusLabel`); `world-chrome.css` (shares tokens, links and focus with the study); a comment in `editorial-chrome.tsx`; contract updates in `check-objects-room`, `check-world-shell`, `check-site` |
| Not changed | `/products`, the editorial study's markup, `ProductAssetSections`, the product `SketchfabViewer`, `ModelInformation`, `ProjectSelection`, `data/products.ts`, `data/relationships.ts`, `data/types.ts`, `data/world-objects.ts`, `data/world-building.ts`, `WorldChrome`, `isWorldPath`, the root layout, `SiteHeader`, `SiteFooter`, Room 02's composition and styles, the Lobby, the Gallery, its chamber, `/worlds`, the homepage, metadata |
| Not introduced | `/world/objects/[slug]`, a second product route, a redirect, a rewrite, middleware, a client effect or observer on the editorial chrome, a canonical link, previous/next controls, a page-level Escape, a Sketchfab id, a model file, an image, canvas, Three.js, a RAF, an observer, a dependency |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation, against
  local production builds (`yarn build` + `yarn start` on :8787).
- **Baseline.** The exact `92ae111` build, captured before any change and
  served again on :8788 next to the new build for side-by-side checks.
- **Browser QA** ran serially, one journey and one viewport per process, every
  step logged before and after, every wait bounded, and a watchdog per
  process (§33). Same-document fragment changes never wait for a load event.
- **First paint.** CPU throttled 4×, 150 ms latency, 1.6 Mbps down, cache
  disabled. Each load starts from a page already painted `#1c1712`, so an
  ivory frame could only come from the route.
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- This is not field data.

---

## 1. Starting state

At `92ae111`, Room 02 linked each study to `/products/[slug]` as a document
navigation. The study was the editorial page: the fixed ivory `SiteHeader`,
the ivory ground, "← All objects" back to `/products`, related objects back
to `/products/[slug]`, and the `SiteFooter`. No World chrome, no World map,
no way back to the room except the browser's Back button (PASS 10 known
issue 3).

## 2. Seam solved

Room 02 is a dark cabinet inside the World. Opening a study threw the visitor
out of the building into a bright catalogue page. Now the study reads as the
same room's examination table: the drawer taken out of the cabinet and set
down. The collection's study stays a utility and stays exactly as it was
(rule 13).

## 3. Why the product route remains `/products/[slug]`

- **One object, one content route** (rule 15). The study entered from the
  room and the study entered from the collection are the same `Product`, the
  same `ProductDetail` and the same metadata.
- **No room-only copy** (rule 20): no `/world/objects/[slug]`, no
  `WorldProductDetail`, no redirect, no rewrite. The reserved address
  `/world/objects/form-lounge-chair` returns 404 (`check-site`).

## 4. Objects context query

- Room 02's VIEW OBJECT STUDY links become `/products/[slug]?from=objects`,
  built by one helper, `productDetailHref(slug, context)`.

  | Study | Before | After |
  | --- | --- | --- |
  | Form Lounge Chair | `/products/form-lounge-chair` | `/products/form-lounge-chair?from=objects` |
  | Line Sofa | `/products/line-sofa` | `/products/line-sofa?from=objects` |
  | Round Coffee Table | `/products/round-coffee-table` | `/products/round-coffee-table?from=objects` |
  | Copper Pendant | `/products/copper-pendant` | `/products/copper-pendant?from=objects` |

- They stay plain `<a>` document navigations, as in PASS 10: the study opens
  at its top and browser Back restores the room where it was.
- `from=objects` exactly. No `source=`, `room=` or `world=`.
- The collection (`/products`), collections, projects and spaces keep plain
  `/products/[slug]` links: only `ProductDetail` passes a context to
  `ObjectSelection`.

## 5. Server validation

- **On the server, per request** (`app/products/[slug]/page.tsx`):
  `resolveProductDetailContext({ from, slug, curatedSlugs, objectsRoom })`.
  `curatedSlugs` is `objectStudies` from `data/world-objects.ts`; `objectsRoom`
  is Room 02 from `worldRooms`.
- **Objects context only if** `from === 'objects'` and the slug is curated and
  the room has a route.
- **Everything else is the editorial study** (never a 404 for the context
  alone): `from=OBJECTS`, `from=gallery`, `from=objects ` (trailing space),
  `from=` (empty), a repeated `from` (an array), another parameter name, and a
  product in the collection that the room does not hang. An unknown product
  is still a 404 in either context.

## 6. Context model

`lib/product-detail-context.ts`: pure, no imports, no browser storage, no
client code. Products are not worlds, so this is its own small model, not
`lib/world-detail-context.ts`.

```ts
type ProductDetailContext =
  | { kind: 'catalogue' }
  | { kind: 'objects'; label; roomName; returnPath; curatedSlugs };
```

| Helper | Does |
| --- | --- |
| `OBJECTS_ORIGIN` | The one query value, `'objects'` |
| `objectsContext(room, curatedSlugs)` | Room 02's context (catalogue if the room has no route) |
| `resolveProductDetailContext(…)` | The validation above |
| `productDetailHref(slug, context)` | `/products/[slug]?from=objects` for a curated study in the room, else `/products/[slug]` |
| `productReturn(slug, context)` | `← Back to Objects` → `/world/objects#slug`, or `← All objects` → `/products` |
| `relatedInContext(ranked, context)` | The shared relationship ranking; in the room, curated studies only |

## 7. Shell marker

```html
<div class="world-object-study" data-product-detail-shell="objects">
  <header class="wl-chrome wl-chrome--room">…</header>
  <main id="main">…the shared ProductDetail…</main>
</div>
```

- **The single source of truth for the shell.** Server-rendered in the first
  HTML, before any script.
- **Everything is scoped to it.** Every rule in `object-study-shell.css`
  starts with `.world-object-study` or
  `:root:has([data-product-detail-shell='objects'])`. The editorial study
  never matches one.
- The class is `world-object-study`, not `world-chamber`: that class is the
  Gallery's viewing chamber, a different grammar.

## 8. First-paint strategy

- **CSS ships in `<head>` with the server HTML.** `ObjectStudyShell` is a
  server component that imports `object-study-shell.css` and the shared
  `spatial-type.css`; vite-rsc emits them as render-blocking stylesheets.
- **The first frame is already the study:** the World ground on `html` and
  `body` (`color-scheme: dark`), no editorial header or footer, the World
  chrome in place, and stone (`#2a221b`) behind the photograph until it
  decodes, never paper.
- **Throttled cold loads, every screencast frame.** Ivory means every channel
  above 230. The excluded box is the photograph's plate, which is a white
  studio photograph by content (§14). "Editorial ground" is within 6 of
  `rgb(247 245 240)`.

  | Load | First content | Header band ivory (first / +50 / +100 / +250 ms / settled / max) | Outside the plate: ivory / editorial ground (max) |
  | --- | --- | --- | --- |
  | Objects 1440×900 | 1,209 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
  | Objects 390×844 | 1,008 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
  | Objects 844×390 | 1,143 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
  | Editorial 1440×900 (control) | 1,190 ms | 0.964 / 0.964 / 0.964 / 0.964 / 0.970 / 0.970 | 0.888 / 0.676 |

- **Results.** Ivory flash **PASS**. SiteHeader flash **PASS**. SiteFooter
  flash **PASS**. Double header **PASS**. The control shows the method
  detects the editorial page.
- **The frames** (contact sheet): first content is the World chrome and the
  label on the World ground with the stone mount in the plate; then the
  photograph; then the Spatial faces swap in (`font-display: swap`, as on
  every World page).

## 9. Editorial chrome suppression

```css
:root:has([data-product-detail-shell='objects']) .site-header,
:root:has([data-product-detail-shell='objects']) .site-footer {
  display: none;
}
```

- `SiteHeader` and `SiteFooter` stay mounted by the root layout. `isWorldPath`
  is unchanged: `/products/...` is not a World path, so a normal study keeps
  its chrome.
- **Hidden by the server marker only:** `display: none`, never opacity or
  visibility; no client effect, `MutationObserver`, polling or
  `querySelector`; no hydration difference.
- **Measured.** One `banner` landmark (the World chrome), no `contentinfo`,
  one `main`, and the World map as the only navigation landmark in the
  accessibility tree (the editorial study: one banner, one contentinfo, Main
  navigation). A full Tab cycle never reaches an editorial link (§28).
- `check-world-shell` now allows exactly two markers to do this, the Gallery
  chamber's and this one; `check-object-study` asserts the same.

## 10. WorldChrome integration

- `WorldChrome currentRoom="objects"`: the same component, markup and CSS as
  Room 02. No `ObjectsChrome`.
  - Back to Lobby → `/world`; Exit to website → `/`; wordmark → `/`.
  - World map from `worldRooms`: Objects `aria-current="page"`, "You are
    here"; Gallery open; Archive, Lab and Studio planned text.
- **PASS 09 map Escape works unchanged:** open map → Escape closes it, focus
  returns to its summary, no navigation; a second Escape does nothing (the
  study has no page Escape). Measured at 1440×900, 390×844 and 844×390.
- **Prefetch discipline unchanged:** the World chrome's links keep
  `prefetch={false}`.
- `world-chrome.css` adds `.world-object-study` to its token, link-reset and
  `:focus-visible` lists (+77 B), as PASS 08 and 10 did for their shells.

## 11. Back to Objects

- **Objects context:** `← Back to Objects`, a real `next/link` to
  `/world/objects#slug`, the first element of the study (before the
  photograph), so it is first in reading order on every layout.
- **Measured:** it lands on the study's own place in the room (the
  specimen's top at 154 px from the top at 1440×900 for Form Lounge Chair,
  and for Round Coffee Table after a related study), Room 02 intact, one
  World chrome. That is Room 02's own fragment position (its scroll margin
  plus the site's 100px scroll padding), unchanged from PASS 10.
- **Browser Back** still restores the room where it was (Line Sofa: scrollY
  1102 → 1102).
- No scroll storage: the fragment is the study's existing PASS 10 id.

## 12. Product detail shared architecture

- **One component.** `ProductDetail({ product, context = catalogue })`. No
  `EditorialProductDetail` / `WorldProductDetail` split.
- **The catalogue context is the PASS 10 page byte for byte.**
  `check-object-study` renders all four studies and compares them with
  markup digests rendered from the `92ae111` sources. Served HTML is
  identical too (§21).
- **What the Objects context changes, and nothing else:**
  - the way back (label, href, and placed before the plate);
  - the photograph wrapped as a plate: `<figure>` with a drawer caption,
    "Room 02 / Objects" and what the photograph is;
  - the digital model's status line in place of the catalogue's
    availability eyebrow (one status either way);
  - related studies: curated only, keeping `?from=objects`, titled
    "Related studies.".
- **Server components throughout.** The only product client component is
  still the product `SketchfabViewer`, and only for an available asset.

## 13. Object Study visual treatment

"A study taken out of the cabinet and set down on a larger examination
table":

- the World ground, warm stone mount, ivory, fine rules, Cormorant Spatial for
  names and Manrope Spatial for facts;
- both columns start on a drawer edge, as in Room 02: the plate's caption on
  the left, the category and OBJECT STUDY on the right;
- a label, not a card: no rounded corners, shadows, fills or product-page
  furniture.

The shell re-tones the editorial tokens inside `.world-object-study`
(`--background`, `--foreground`, `--muted-foreground`, `--border`, `--paper`,
`--font-body`, `--font-display`), so the shared study, its sections and any
future asset section read on the World ground without restyling each
component. A handful of explicit rules set the World's sizes and rhythm.

## 14. Image / reference-study treatment

- **The photograph rests whole on a stone mount** at its own proportion
  (`object-fit: contain`, a padded `#2a221b` plate). It is never cropped, cut
  out, tinted, shadowed or faked into a render.
- **The white chair photograph stays pale:** a pale reference plate mounted on
  dark ground, like museum paper in a dark cabinet. Not tinted or darkened.
- **Named for what it is,** from the data: "Reference study", or "Model
  render" if a product ever sets `imageRole: 'model-render'` (fixture-tested).
  The words come from `imageRoleLabel`, shared with Room 02.
- **Same image, same loading:** the existing `EditorialImage` with `priority`
  (eager, `fetchpriority=high`) and the same `srcset`/`sizes`. No added image,
  no duplicate hero.
- **Sized to the first view:** at most `100svh − chrome − 232px` tall on
  desktop (at least 320px), 64svh on phones, 56svh on tablet portrait, and the
  whole plate inside the first view in short landscape.

## 15. Dimensions/material treatment

- A data sheet on fine rules, as in Room 02: DIMENSIONS and MATERIAL as small
  uppercase sans labels, values in 14px Manrope Spatial with tabular figures,
  side by side on one baseline.
- Every value comes from `data/products.ts`; nothing is authored in the
  shell.

## 16. Asset-status treatment

- **Today (all four `asset.available: false`):** "Digital model · in
  preparation", plain text in a `<p data-asset-status="in-preparation">`
  right after the specifications. Not a button, not a disabled control, no
  viewer placeholder.
- **The same words as Room 02,** from one shared helper, `assetStatusLabel`
  (`lib/product-assets.ts`). Room 02's local functions became these two
  shared helpers; its markup is unchanged.
- **No** Explore in 3D, View in 3D, Download, Get asset, Buy, Marketplace or
  Sketchfab iframe for current objects (`check-object-study` 30).
- **The disclosure stays `productDisclosure()`**, word for word.

## 17. Future available-asset compatibility

A fixture with an available asset (tests only, never production data):

- `ProductAssetSections` renders inside the shell exactly as in the
  catalogue: explore section, model information, acquisition.
- One product `SketchfabViewer`, in its `poster` state; no iframe before an
  explicit Explore in 3D.
- The status line reads "3D asset · available" and replaces the catalogue's
  availability eyebrow, so the page states it once.
- Scoped World styling covers the asset sections: the viewer frame and poster
  on the stone mount, the message on the World ground, the specification rules
  and the acquisition rule in World ivory. Only surfaces and ink change.
- The product viewer is not rewritten or merged with the World viewer: both
  files are digest-locked and nothing in the shell imports `components/worlds`.

## 18. In Context section

- `ProjectSelection` unchanged: IN CONTEXT, "At home in these interiors.", the
  same projects from `getProductProjects`.
- In the room it is the next drawer: one fine rule across the container,
  spatial type, project photographs on the stone mount, ivory text links.
- Its links go to the editorial projects, as everywhere.

## 19. Related Objects

- Same relationship logic (`getRelatedProducts`: collection, category,
  shared interiors), same `ObjectSelection` markup.
- **In the room** the candidates are the studies Room 02 hangs
  (`relatedInContext` filters the full ranking, then takes three), titled
  "Related studies.". With today's curation that is the same three objects as
  the catalogue. With a smaller curation (tested) an uncurated object never
  appears.
- **Three in one row** at 1200px and wider; narrower screens keep the
  collection's own grid.
- The section's quiet "Discover the objects" link still leads to `/products`,
  the room's catalogue (rule 13).

## 20. Context-preserving related links

- `ObjectSelection` gained one optional prop, `context`, defaulting to the
  catalogue; its links go through `productDetailHref`. Default output is
  byte-identical (`/products` grid digest-locked).
- **In the room:** Study A → related B → `/products/B?from=objects`, still in
  the World; Back to Objects → `/world/objects#B`.
- **Measured** (relatedHistory, three viewports): the related study opens at
  its top (scrollY 0) on a client navigation; browser Back returns to A in
  the World at its scroll position; Back again returns to Room 02 at its
  place; Forward returns to A in the World.

## 21. Catalogue Product regression

- **Markup:** the visible body of all four editorial studies and of
  `?from=OBJECTS` is byte-identical to `92ae111` (served HTML, after
  normalising build hashes).
- **Pixels:** viewport-by-viewport captures (every image decoded first) of
  `/products/form-lounge-chair`, `/products/line-sofa`, `/products` and
  `/world/objects` at 1440×900, 820×1180 and 390×844, `92ae111` against
  PASS 11: 47 of 50 tiles identical. The other three (two of `/products` at
  1440, the first view of the chair study at 390) differ only inside one
  photograph each: the same image resampled differently on that run (max
  channel difference 49–98 in 326–2,195 pixels), with identical markup.
- **Behaviour:** "← All objects", related links plain, editorial header and
  footer, ivory ground (journey directBoth and backForward).
- **Cost:** the product page now links two more stylesheets from the static
  import graph (`world-chrome.css`, and the shell rules bundled into the
  page's CSS): one more request, +2,970 B transferred (§29). And it renders
  per request (§31).

## 22. Room 02 regression

- **Markup:** Room 02 renders the PASS 10 markup with only the four study
  hrefs gaining `?from=objects` (digest of the room with the query removed =
  PASS 10's).
- **Served HTML:** identical to `92ae111` apart from those four hrefs (also in
  the RSC payload).
- **Pixels:** identical at 1440×900, 820×1180 and 390×844.
- `world-objects.css`, the room's route, curation and building data are
  digest-locked.

## 23. Desktop

Measured on the final build at rest (y in CSS px from the top of the first
view; the plate is the mounted photograph; the smallest target is over Back
to Objects, the World chrome, the image links and the text links):

| Viewport | Chrome bottom | Back to Objects (y) | Plate (x, y → x, y) | Title (y) | Specifications (y) | Status (y) | Smallest target | Overflow |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 83 | 94–138 | 78, 203 → 780, 851 | 206–264 | 432–521 | 537–554 | 44px | no |
| 1366×768 | 78 | 87–131 | 74, 191 → 740, 710 | 195–250 | 408–497 | 513–530 | 44px | no |
| 1280×720 | 78 | 87–131 | 69, 189 → 693, 655 | 192–244 | 398–487 | 503–521 | 44px | no |
| 1180×820 | 78 | 88–132 | 64, 194 → 639, 756 | 197–245 | 405–515 | 531–549 | 44px | no |
| 820×1180 | 108 | 122–166 | 44, 241 → 776, 938 | 1043–1086 | 1263–1352 | 1368–1385 | 44px | no |
| 390×844 | 76 | 86–130 | 22, 189 → 368, 535 | 620–663 | 825–956 | 972–989 | 44px | no |
| 360×740 | 76 | 85–129 | 22, 186 → 338, 502 | 584–623 | 779–910 | 926–943 | 44px | no |
| 844×390 | 68 | 72–116 | 46, 115 → 398, 365 | 169–207 | 356–487 | 503–521 | 44px | no |
| 740×360 | 68 | 72–116 | 40, 115 → 349, 335 | 191–225 | 374–505 | 521–538 | 44px | no |
| 667×375 | 68 | 72–116 | 36, 115 → 315, 350 | 191–224 | 398–529 | 545–562 | 44px | no |

- Two columns: the plate (7 parts) and the label (5 parts), both starting on
  the drawer edge; Back to Objects above both.
- The title, collection, description, specifications and status are in the
  first view at every desktop and tablet-landscape size (at 1280×720 the
  status ends at y 521 of 720).

## 24. Tablet

- **1180×820** uses the desktop composition.
- **820×1180 (portrait):** one column; the plate up to 56svh, the label
  below. Title at y 1043 of 1180, specifications by natural scroll.
- No hover dependency: every control is a link with a visible focus state.

## 25. Mobile

- One vertical study in reading order: World chrome → Back to Objects → the
  plate (up to 64svh) → title, category, collection → description →
  dimensions, material → digital model status → disclosure → In context →
  related studies.
- 390×844: title at y 620 of 844. 360×740: title at y 584 of 740.
- Touch targets: Back to Objects, the World chrome, related studies and text
  links are at least 44px. The project titles' inline links (42px on phones)
  duplicate their 44px image link and "Explore interior", as in the
  editorial study.

## 26. Short landscape

- 844×390, 740×360, 667×375: the plate keeps the left half at full height
  (the whole plate in the first view); Back to Objects heads the label on the
  right, so the title is in the first view; the chrome is 68px.
- The drawer caption keeps one line (spacing tightened to 0.16em): measured
  279 of 279px at 667×375.
- Normal document scrolling; no viewport lock; no duplicate chrome.

## 27. Reduced motion

- PASS 11 adds no motion: no arrival animation, no depth effect, no reveal.
  The shell CSS has no transition, animation or keyframes (asserted).
- Measured under `reduce`: 0 running animations, map Escape unchanged.

## 28. Accessibility

- One `h1` (the product), one `main` (`#main`, the skip link's target), one
  visible header system (the World chrome).
- Hidden editorial chrome is `display: none`: absent from the accessibility
  tree and the tab order.
- **Tab order** (1440×900, 390×844, 844×390; 16 stops): skip link → wordmark →
  Back to Lobby → World map → Exit → Back to Objects → the two In context
  projects (image, title, Explore interior) → Discover the objects → the
  three related studies. Never an editorial link.
- **Focus:** the World ring (1px ivory, offset 6px) on the ground; over
  photographs (project and related images) a 2px ivory ring on a 4px World
  ground mat (PASS 09).
- Semantic specifications (`dl`), the status as text, real links throughout,
  the photograph's alt text from the data.
- The editorial study's accessibility is unchanged (its markup is).

## 29. Performance

- **JS:** unchanged, 1,234,781 B raw (−10 B gzip from chunk-hash names). The
  shell, marker, context and `WorldChrome` are server-rendered.
- **CSS** (raw / gzip):

  | | PASS 10 | PASS 11 |
  | --- | --- | --- |
  | All CSS | 303,727 / 57,110 B | 310,115 / 58,499 B (+6,388 / +1,389) |
  | Product page chunk (now with the shell rules) | 59,946 B | 66,257 B (+6,311) |
  | `world-chrome.css` | 3,368 B | 3,445 B (+77) |

- **Cold load** (cache disabled; "load" = page load and 3 s idle, "total" adds
  hovering or tabbing every link and walking the page):

  | Page | Load | Total |
  | --- | --- | --- |
  | Editorial study 1440×900, PASS 10 | 43 req / 1,021,905 B | 59 / 2,361,630 |
  | Editorial study 1440×900, PASS 11 | 44 / 1,024,875 | 69 / 2,413,632 |
  | Objects study 1440×900 | 43 / 1,091,684 | 50 / 1,123,371 |
  | Editorial study 390×844, PASS 10 | 37 / 523,318 | 54 / 826,050 |
  | Editorial study 390×844, PASS 11 | 38 / 526,296 | 58 / 845,455 |
  | Objects study 390×844 | 35 / 404,770 | 44 / 568,490 |

- **Objects context is lighter in total:** the hidden editorial header's links
  never enter the viewport, so their routes (and the homepage payload) are
  not prefetched. It adds one existing font file, `cormorant-italic.woff2`
  (39,487 B), for the collection's real italic, which Room 02 already loads.
- **Editorial study +10 requests in the "total" pass:** repeated RSC
  prefetches of the three related products (each 5.4 KB, four times instead
  of once). The product route now renders per request, and vinext does not
  reuse a prefetch whose response is `no-store` (§31). First load: +1
  request.
- No new image, model, WebGL, canvas, framework, RAF or observer; 0 rAF
  callbacks at rest in either context.

## 30. Network

For the current four products (all `asset.available: false`), idle 3 s,
every link hovered or focused, the whole page walked:

| | Objects 1440 | Objects 390 | Editorial 1440 | Editorial 390 |
| --- | --- | --- | --- | --- |
| Sketchfab | 0 | 0 | 0 | 0 |
| Fab | 0 | 0 | 0 | 0 |
| Model files | 0 | 0 | 0 | 0 |
| Three.js | 0 | 0 | 0 | 0 |
| iframes | 0 | 0 | 0 | 0 |
| canvases | 0 | 0 | 0 | 0 |
| External hosts | none | none | none | none |

## 31. SEO/canonical decision

- **Metadata is context-independent:** the same title and description in
  every context (asserted). The query is context, not content.
- **Canonical deferred,** as in PASS 08. This route's metadata streams into
  `<body>` with vinext (measured again: `canonicalInHead: false`), where a
  canonical cannot be verified as a head canonical. Revisit when vinext
  hoists streamed metadata or with a `metadataBase`.
- **Rendering cost.** Reading `searchParams` makes `/products/[slug]` render
  per request. At `92ae111` vinext served it from its prerender
  (`Cache-Control: s-maxage=31536000, stale-while-revalidate`,
  `X-Vinext-Cache: HIT`). Now it is `Cache-Control: no-store, must-revalidate`,
  as `/worlds/[slug]` has been since PASS 07. Local TTFB is unchanged within
  noise (median 217 ms → 222 ms, 10 runs). On production the PASS 10 study
  answered in a median 172 ms, while the already-dynamic
  `/worlds/modern-kitchen` answered in 398 ms (10 runs each, before deploy).
  This is the price of server-side context validation on the same route; the
  brief rules out the alternatives (a second route, a rewrite, client
  detection).

## 32. Automated tests

`yarn check:object-study` (`scripts/check-object-study.mjs`) renders the real
route module, `ProductDetail`, `ObjectSelection`, `ObjectStudyShell`,
`WorldChrome` and Room 02 to markup, then checks CSS, digests and source
contracts. Mutation-tested: 27 of 27 deliberate breaks fail it.

| # | Requirement | How |
| --- | --- | --- |
| 1 | Room 02 links use `?from=objects` | the four `wo-study` hrefs; `productDetailHref` in the source, no hand-built URL |
| 2, 44 | Collection links stay plain | `/products` grid = PASS 10 digest; every other `ObjectSelection` caller passes no context |
| 3, 5 | Only curated slugs; uncurated falls back | every curated slug; a smaller curation; a future product in the collection only |
| 4 | Invalid `from` falls back | 8 invalid contexts = PASS 10 page, byte for byte |
| 6 | No browser storage | the context module has no import, storage or browser API |
| 7–9 | World chrome, Objects current, marker | marker + one chrome + exact shared study, per product |
| 10–12, 14 | Header/footer `display: none` only under the two markers | CSS scan of every stylesheet; layout still mounts them; `isWorldPath('/products/…')` false |
| 13, 17, 19, 45 | Editorial study unchanged | route output = `ProductDetail` = PASS 10 digest, back to `/products`, plain related |
| 15 | No ivory first-paint dependency | ground and `color-scheme` from the root; stone behind images; CSS imported by a server component |
| 16 | Back to Objects | `/world/objects#slug`, before the plate |
| 18 | Related keep the context | every related href `?from=objects`; curated only |
| 20–22 | Map, Lobby, Exit | `worldRooms` order and status; `/world`; `/` |
| 23–28 | Facts and disclosure | title, category, collection, dimensions, material from the product; `productDisclosure` |
| 29–30 | Plain status, no fake action | the status `<p>`; no button, `aria-disabled`, iframe or asset words |
| 31–35 | Asset system | sections absent today; fixture: same sections, one poster-state viewer, no iframe, one status; viewers digest-locked and separate |
| 36–38 | Routes | route inventory; no middleware, redirect or rewrite; 404 for unknown products; static params |
| 39 | Metadata | identical with and without context; no canonical |
| 40–43, 46–47 | Regression | Room 02 markup digest; Lobby, Gallery, chamber, Room 02 CSS, `/products`, homepage, `/worlds` file digests |
| 48, 54 | Other gates | wired in `package.json`, run separately |
| 49–53 | No 3D, network or loop | sources and CSS: no canvas, Three.js, URL, RAF, observer, transition or animation |

Deliberate contract updates elsewhere:

- `check-objects-room`: study links carry `?from=objects` (23); the room may
  import exactly the two shared label helpers and nothing else of the asset
  system (35); the four revised product files are re-locked with a note.
- `check-world-shell`: a second marker may hide the editorial chrome.
- `check-site` (served HTML, local and production): Room 02 hrefs; the
  Objects shell for `?from=objects`, the editorial study for the plain URL and
  four invalid contexts; `/world/objects/[slug]` is a 404.

## 33. Browser QA

**Harness.** `qa11.mjs` (scratchpad): one journey × one viewport per
process, each capped by `timeout 130` and a 100 s watchdog that records the
URL, state, console errors and pending requests before it kills the browser.
Every step is logged before and after and bounded at 20 s. Fragment landings
are measured after the navigation that causes them, never by waiting for a
load event. A serial runner prints one result line per run. Console errors
fail a run.

**Final build: 30 of 30 journeys and 10 of 10 visual runs pass.**

| Journey | 1440×900 | 390×844 | 844×390 |
| --- | --- | --- | --- |
| lobbyToStudy | PASS (5 steps) | PASS (5 steps) | PASS (5 steps) |
| relatedHistory | PASS (7 steps) | PASS (7 steps) | PASS (7 steps) |
| pendantMapGallery | PASS (5 steps) | PASS (5 steps) | PASS (5 steps) |
| studyBackToLobby | PASS (2 steps) | PASS (2 steps) | PASS (2 steps) |
| studyExit | PASS (2 steps) | PASS (2 steps) | PASS (2 steps) |
| directBoth | PASS (9 steps) | PASS (9 steps) | PASS (9 steps) |
| backForward | PASS (8 steps) | PASS (8 steps) | PASS (8 steps) |
| keyboard | PASS (3 steps) | PASS (3 steps) | PASS (3 steps) |
| cls | PASS (1 steps) | PASS (1 steps) | PASS (1 steps) |
| reduced | PASS (2 steps) | PASS (2 steps) | PASS (2 steps) |

- **lobbyToStudy:** `/world` → 02 Objects → Form Lounge Chair (document
  navigation, opens at its top in the shell) → Back to Objects →
  `/world/objects#form-lounge-chair`, the study in view.
- **relatedHistory:** `/world/objects` → Line Sofa → related Round Coffee
  Table (keeps `?from=objects`, opens at its top) → Back → Line Sofa in the
  World → Back → Room 02 at its place → Forward → Line Sofa → related → Back
  to Objects → `/world/objects#round-coffee-table`.
- **pendantMapGallery:** Copper Pendant study → World map (Objects "You are
  here") → Escape closes it, focus on its summary, no navigation → a second
  Escape does nothing → map → Gallery.
- **studyBackToLobby / studyExit:** Back to Lobby → `/world`; Exit →
  `/` with the editorial header.
- **directBoth:** direct and refreshed loads of both contexts; five invalid
  contexts (`OBJECTS`, `gallery`, a repeated `from`, a trailing space,
  `source=`) are the editorial study.
- **backForward:** related → Back → Forward inside each shell; each keeps its
  own shell and URL.
- **keyboard, cls, reduced:** §28, §34 and §27.

**Visual QA** at 1440×900, 1366×768, 1280×720, 1180×820, 820×1180, 390×844,
360×740, 844×390, 740×360 and 667×375: top study, specifications, In context,
related studies, the World map open (inside the viewport, Objects current),
keyboard focus on Back to Objects and on a related study (ring and mat), the
bottom of the page, and 0 rAF callbacks at rest. Geometry in §23. Captures are
local evidence and not committed.

**Fixed during QA:**

- The drawer caption wrapped onto two lines at 740×360 (labels nowrap, tighter
  spacing in short landscape).
- Two harness faults, not product faults, both reproduced on the editorial
  study too: a tap on a card taller than a 390px viewport scrolled the card's
  top out of view, and the editorial study's fixed header covered the tap
  point. Taps now hit-test their point.

**Also measured:** first paint (§8), network (§29–30), the editorial and
Room 02 pixel locks (§21–22), and the accessibility tree (§9).

## 34. Known issues

1. **The product route renders per request** (§31). Measure on production
   after deploy; a future pass could revisit if vinext gains a way to
   prerender the no-query case.
2. **Editorial prefetch repetition** (§29): related product payloads are
   re-prefetched on later intents because responses are `no-store`.
3. **The white studio chair photograph** on dark ground, shown honestly as a
   pale plate (not solved, by design).
4. **Reference photography** with room backgrounds (table, sofa); every plate
   says "Reference study".
5. **No real 3D assets** yet; the asset path is fixture-tested only.
6. **Font swap** on a cold load: the Spatial faces replace the fallback after
   first paint (CLS 0.007 at 1440×900, 0 at 390×844 and 844×390).
7. **Carried forward:** `:has()` support in legacy browsers; extra
   stylesheets on catalogue pages from the static import graph; the deferred
   canonical; the future marketplace and local GLB viewer.
8. **Measurement scope.** Headless desktop Chrome with emulated phones and
   touch. No Safari, Firefox, real devices or field data.

## 35. PASS 12 boundary

**PASS 11 delivers** the object study inside Room 02 on the same product
route, with the editorial study unchanged.

**Stable contracts:**

- `/products/[slug]?from=objects` and its server validation.
- `data-product-detail-shell="objects"` and `.world-object-study`.
- `lib/product-detail-context.ts` (`productDetailHref`, `productReturn`,
  `relatedInContext`).
- `imageRoleLabel` and `assetStatusLabel`.
- Design-system §9 rules 15 (extended) and 20.
- `yarn check:object-study`.

**Not started:** Archive, Lab, Studio; a Lobby, Gallery or Objects GLB; new
Sketchfab models; a marketplace; a local asset viewer; an upload system; a
CMS.

**PASS 12 is to be chosen after review.** Likely options:

- **A. Room 03 — Archive foundation,** if expanding the building is now
  desirable;
- **B. A real 3D environment,** only with a proper approved Lobby, Gallery or
  Objects GLB;
- **C. The object asset experience,** only once at least one real Product
  asset is available.

Not chosen within PASS 11.
