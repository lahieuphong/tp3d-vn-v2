# TP3D PASS 12 — Product route prefetch & cache discipline

PASS 11 put the object study inside the World on the same route,
`/products/[slug]`, with the shell read from the query on the server. Since
then that route renders per request and is served `no-store`. PASS 12 measures
what that does to navigation, and fixes the one seam it opened: speculative
prefetches of Product details that are almost never used.

- **Result.** Product-detail links no longer prefetch automatically. Viewport
  entry, hover, focus and Back produce zero Product-detail requests. A click
  makes exactly one request, for the object chosen.
- **What did not change.** The route stays dynamic: no framework-supported
  way exists in vinext 1.0.0-beta.9 to cache the plain URL while validating
  `?from=objects` on the same route (§14). Fewer prefetches are not "route
  caching restored".

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). This pass adds
§9 rule 21, "Prefetch according to cacheability, not habit". The previous pass
is [TP3D-PASS-11-OBJECT-STUDY-SHELL.md](TP3D-PASS-11-OBJECT-STUDY-SHELL.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-05 |
| Starting HEAD | `486e1cb` — feat(products): integrate Object studies into World shell |
| Changed | `ObjectSelection` (the card link gets `prefetch={false}`); `experience-shell.tsx` (its two Product-detail links get the same policy; materials keep theirs); `check-objects-room` (re-locks `object-selection.tsx`); `package.json` |
| Added | `yarn check:product-navigation` |
| Not changed | `/products/[slug]` (route, context validation, shells, metadata), `ProductDetail`, `lib/product-detail-context.ts`, Room 02 (still native anchors), `WorldChrome`, the header (`site-header.tsx`), `SectionHeading`, `TextLink`, every other link, every visible pixel |
| Not introduced | a global Link wrapper, `router.prefetch`, a hover/focus/touch listener, an observer, a timer, a RAF, a client component, a cache layer, middleware, a rewrite, a route, a dependency |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation.
  Local: production builds served by wrangler (`yarn start`), PASS 12 on
  :8787 and the exact `486e1cb` build on :8788. Production:
  https://tp3d-vn-v2.vercel.app (PASS 11 before deploy).
- **Harness** (`net12.mjs`, scratchpad): one page × one viewport × one mode
  per process, every wait bounded, a watchdog per process. Requests are
  attributed to the phase in which they start; RSC prefetches carry
  `Next-Router-Prefetch: 1`, navigation fetches do not.
- Cold cache unless stated. A "warm" session (cache enabled, fresh profile)
  gave the same Product-detail counts: those responses are `no-store`.
- This is not field data.

---

## 1. Starting PASS 11 behaviour

- One content route, two server-validated shells: the editorial study and the
  object study in the World (`?from=objects`).
- Every Product-detail card (the collection, related objects, Room 02's
  related studies, projects, spaces, collections) was a `next/link` with the
  default (auto) prefetch: vinext prefetched it when it entered the viewport
  and again on pointer enter or touch start.
- PASS 11 had already measured the symptom: the editorial study went from
  59 to 69 requests in a hover-everything-and-walk session, mostly repeated
  Product RSC prefetches.

## 2. Why `/products/[slug]` became dynamic

Measured in the installed vinext (1.0.0-beta.9):

1. **Cacheability is decided at runtime, per render.** The build's
   cacheability manifest is empty (`dist/server/__vinext_cacheability_manifest.js`
   is `export default null`), and the build lists the route as `ƒ
   /products/:slug` before and after PASS 11.
2. **Reading `searchParams` marks the render dynamic.** For a server-component
   page, vinext wraps `searchParams` in an observed thenable
   (`server/app-page-element-builder.js`). Awaiting it calls `then`, which
   observes every key (`shims/thenable-params.js`), even when the request has
   none, and calls `markDynamicUsage()`
   (`server/app-page-search-params-observation.js`).
3. **A render with dynamic usage is never cached.** The page-cache finalizer
   turns it into "dynamic API used during render": not cacheable, served
   `Cache-Control: no-store, must-revalidate`
   (`server/app-page-cache-finalizer.js`).
4. **Before PASS 11** the page never read the query, so vinext cached it
   (`Cache-Control: s-maxage=31536000, stale-while-revalidate`,
   `X-Vinext-Cache: HIT`). It even served that cached page to
   `?from=objects`: a cached value may answer a query request only with a
   proof that `searchParams` was never read (`hasQueryInvariantAppPageProof`
   in `server/app-page-cache.js`).

## 3. Why the server-first dual shell remains

The shell must be right in the first HTML frame (PASS 11's first-paint
contract), so it is decided on the server from the URL. Client detection,
storage, cookies, Referer, middleware or a second route would each break a
PASS 11 contract. PASS 12 keeps the route exactly as it was and works on the
links that point at it.

## 4. Product-link inventory

Every source of a `/products/[slug]` URL in the app (audited before editing;
`check:product-navigation` asserts the list):

| Source | Pages | Element (PASS 11) | Destination |
| --- | --- | --- | --- |
| `ObjectSelection` cards | `/products` | B. `next/link`, auto | `/products/[slug]` |
| `ObjectSelection` cards | editorial study: related objects | B. `next/link`, auto | `/products/[slug]` |
| `ObjectSelection` cards | Objects study: related studies | B. `next/link`, auto | `/products/[slug]?from=objects` |
| `ObjectSelection` cards | project, space and collection details | B. `next/link`, auto | `/products/[slug]` |
| Room 02 VIEW OBJECT STUDY | `/world/objects` | A. native `<a>` | `/products/[slug]?from=objects` |
| Experience object list | `/experience/[slug]` | B. `next/link`, auto | `/products/[slug]` |
| Experience selection sheet "View details" | `/experience/[slug]` (sheet) | B. `next/link`, auto | `/products/[slug]` or `/materials/[slug]` |
| Header search results (`data/search.ts`) | every editorial page (dialog) | B. `next/link`, auto | `/products/[slug]` among other kinds |

No source used C (`prefetch={false}`) or D (custom router navigation). The only
manual prefetch in the app is PASS 05's World gateway (`/world`, on intent).

## 5. PASS 11 prefetch behaviour

Measured at `486e1cb`, local, cold (phases: load, idle 3 s, viewport walk,
hover every Product-detail link, Tab through the page):

| Page | Viewport | Speculative Product-detail requests | Repeats (same destination twice or more) |
| --- | --- | --- | --- |
| `/products` | 1440×900 | 8 (4 on load, 4 on hover) | 4 |
| `/products` | 390×844 | 10 (4 / 2 viewport / 4 hover) | 4 |
| editorial study | both | 11 (3 viewport, 5 hover, 3 during Tab) | 3 |
| Objects study | both | 6 (3 viewport, 3 hover) | 3 |
| `/world/objects` | both | 0 (native anchors) | 0 |
| `/experience/quiet-house` | 1440×900 | 6 (3 on load, 3 on hover), 4 more on Back | 3 |
| Header search ("Lounge", "Copper") | 1440×900 | 1 per visible Product result | — |

- **Every one is an RSC prefetch** (`Next-Router-Prefetch: 1`), answered
  `Cache-Control: no-store, must-revalidate`.
- **Returning costs again:** Back to `/products` re-prefetched all visible
  cards (5 requests), Back to the editorial study its three related cards.
- **Prefetching a Product also fetched its hero image.** The RSC payload
  carries the study's priority-image preload, so on `/products` at 1440×900
  the four card prefetches also downloaded `chair.webp`, `sofa.webp`,
  `table.webp` and `pendant.webp` at full size (512,405 B) before anyone
  chose an object.

## 6. Prefetch reuse findings

The central question: does a click use the prefetched response?

- **Completed prefetches are thrown away.** Hover a card, wait for the
  prefetch to finish, click: the click makes its own navigation request
  every time (local and production, all three Product pages, 1440×900 and
  390×844). On production that click took 305–330 ms to the new title, the
  same as with no prefetch.
- **A prefetch still in flight can be joined.** On production, clicking a
  `/products` card 150 ms after the pointer reached it made no navigation
  request; the click took a median 136 ms. Waiting longer lost it:

  | Pointer dwell before click (production, `/products`, 10 clicks each) | Median | p90 | Navigation requests |
  | --- | --- | --- | --- |
  | 150 ms | 136 ms | 151 ms | 1 of 10 (the click joined the hover prefetch) |
  | 300 ms | 290.5 ms | 310 ms | 9 of 10 |
  | 500 ms | 296 ms | 306 ms | 9 of 10 |
  | 800 ms | 295 ms | 308 ms | 9 of 10 |

- **Touch taps join too:** `touchstart` starts the prefetch ~90 ms before
  the click. Production taps on `/products` cards: median 191 ms, each joined
  its prefetch.
- **Objects-context links never join.** For a URL with a query, vinext's
  automatic prefetch fetches a search-agnostic shell, not the page the click
  needs: every click and tap from the Objects study made its own navigation
  request (production: clicks median 295.5 ms, taps 298 ms).
- **Keyboard never joined:** vinext has no focus intent; Tab only prefetched
  through viewport entry, and those prefetches had completed long before
  Enter.

## 7. Chosen policy

**Product-detail links never prefetch automatically** (rule 21). The
evidence:

- the bulk of speculative requests (viewport entry, focus, returns, any hover
  longer than ~300 ms) were completed and discarded;
- each wasted prefetch also downloaded a full-size hero image;
- the only users who gained were quick pointer clicks and touch taps on
  plain (editorial) Product links, by ~100–160 ms, because they caught a
  prefetch still in flight;
- Objects-context and keyboard navigation never gained.

The cost is stated plainly in §22 and §30: those quick clicks and taps now
pay one server render, like every other Product navigation already did.

## 8. ObjectSelection change

```tsx
<Link
  className="image-link"
  href={productDetailHref(p.slug, context)}
  prefetch={false}
>
```

- One declarative prop on the one shared card link. The href still comes
  from `productDetailHref()`. No new prop: the route class decides the policy,
  so no caller can opt back in.
- `ObjectSelection` is a server component; the prop travels in the RSC
  payload (`"prefetch":false`). Visible markup is unchanged.
- The section heading's "Discover the objects" link (`/products`, a static
  page) keeps its default. `SectionHeading` and `TextLink` are untouched.

## 9. Room 02 behaviour

Unchanged and deliberately kept: VIEW OBJECT STUDY is a native `<a>`. It makes
no speculative request (measured 0), opens the study at its top, lets browser
Back restore the room's exact position, and lets the server validate
`?from=objects` with a correct first paint.

## 10. Related editorial Product behaviour

`/products/A` → related B → `/products/B` (no query, editorial shell). After
PASS 12: 0 requests on viewport, hover or focus; one navigation request on
click.

## 11. Related World study behaviour

`/products/A?from=objects` → related B → `/products/B?from=objects`, still in
the World shell, Back to Objects → `/world/objects#B`. After PASS 12: 0
speculative requests; one navigation request on click. Its latency is
unchanged, since these links never reused a prefetch (§6).

## 12. Product collection behaviour

`/products` cards stay editorial (`/products/[slug]`). The grid is unchanged.
On load at 1440×900 the page now makes 42 requests (1,204,098 B) instead of
52 (1,742,315 B): the four card prefetches and the four full-size hero images
they pulled are gone.

## 13. Project/Space/Collection callers

They render `ObjectSelection` and inherit the policy. None passes a policy of
its own, and none holds a direct Product-detail link (asserted). The
experience page's object list and selection sheet follow the same rule with
their own `prefetch={false}`; a material in the sheet keeps its default.

**Exception kept: the header search results.** A Product result prefetches
when it is visible in the search dialog (1 per visible Product result, only
after an explicit query). The header is shared editorial chrome, digest-locked
since PASS 08, and its results mix kinds in one polymorphic link; changing it
is left to a later pass (§30).

## 14. Cache investigation

Can plain `/products/[slug]` stay cacheable while `?from=objects` is rendered
dynamically, on the same route? Checked against the installed vinext:

| Possibility | Finding |
| --- | --- |
| Read the query only when present | Not possible: reading `searchParams` at all marks the render dynamic, even with no keys (§2). |
| vinext's "dynamic only if the request has search params" branch | Exists (`markDynamic: hasRequestSearchParams` in `app-page-element-builder.js`), but only for React-owned page components (client references or class components). It would make the page a client component and break the server-first shell. |
| `dynamic = 'force-static'` | `searchParams` becomes empty: the Objects context is lost. |
| `revalidate` | Ignored once dynamic usage is observed (the finalizer refuses to cache). |
| A cached page answering a query request | Only with a proof that the render never read `searchParams` (§2.4), the opposite of what the shell needs. |
| Partial prerendering | The shell decision sits at the top of the page, so the whole page is the dynamic part. |
| Rewrite or middleware to a second internal route | Ruled out by the brief and the route contract. |

**Result: no safe, framework-supported split exists. The dynamic route is
retained intentionally.**

## 15. Why route caching was or was not changed

Not changed. Every option fails at least one requirement (same route, same
query contract, server-validated shell, no client correctness, no rewrite, a
demonstrably cacheable plain response). PASS 12 removes the speculative work
around the route instead. The per-request render of every Product detail
remains a known cost (§30).

## 16. Cache headers

Identical before and after (local, both builds):

| Response | `Cache-Control` | `X-Vinext-Cache` | `Vary` |
| --- | --- | --- | --- |
| `/products/form-lounge-chair` | `no-store, must-revalidate` | absent | `RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Interception-Id, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode, X-Vinext-Rsc-State-Fingerprint` |
| `?from=objects` | `no-store, must-revalidate` | absent | the same |
| Product RSC (prefetch or navigation) | `no-store, must-revalidate` | absent | — |

For reference, at PASS 10 the same study was
`s-maxage=31536000, stale-while-revalidate`, `X-Vinext-Cache: HIT`.

## 17. Request-count before/after

Local, cold cache. Speculative = load, idle, viewport, pointer and keyboard
phases together; a whole session also includes one click and one Back.

| Page | Viewport | Load requests | Speculative Product-detail | Click → Product-detail requests | Back → Product-detail requests | Whole session |
| --- | --- | --- | --- | --- | --- | --- |
| `/products` | 1440×900 | 52 → 42 | 8 → 0 | 5 → 1 | 5 → 0 | 76 → 57 |
| `/products` | 390×844 | 42 → 36 | 10 → 0 | 4 → 1 | 5 → 0 | 70 → 53 |
| editorial study | 1440×900 | 44 → 44 | 11 → 0 | 7 → 1 | 4 → 0 | 82 → 59 |
| editorial study | 390×844 | 38 → 38 | 11 → 0 | 6 → 1 | 4 → 0 | 75 → 55 |
| Objects study | 1440×900 | 43 → 43 | 6 → 0 | 4 → 1 | 0 → 0 | 60 → 49 |
| Objects study | 390×844 | 35 → 35 | 6 → 0 | 3 → 1 | 0 → 0 | 52 → 44 |
| `/world/objects` | 1440×900 | 34 → 34 | 0 → 0 | 1 → 1 (the study's document) | 0 → 0 | 76 → 76 |
| `/world/objects` | 390×844 | 32 → 32 | 0 → 0 | 1 → 1 | 0 → 0 | 68 → 68 |
| `/experience/quiet-house` | 1440×900 | 58 → 50 | 6 → 0 | 5 → 1 | 4 → 0 | — |

The PASS 11 "click" counts include the destination's own related-card
prefetches; after PASS 12 the click's one request is the navigation itself.

## 18. Byte transfer before/after

| Page | Viewport | Load bytes | Speculative Product-detail payloads | Whole session |
| --- | --- | --- | --- | --- |
| `/products` | 1440×900 | 1,742,315 → 1,204,098 B | 43,328 → 0 B | 2,462,768 → 1,891,745 B |
| `/products` | 390×844 | 621,386 → 595,561 B | 54,093 → 0 B | 901,878 → 809,329 B |
| editorial study | 1440×900 | 1,024,875 → 1,024,895 B | 59,681 → 0 B | 2,731,293 → 2,444,280 B |
| editorial study | 390×844 | 526,291 → 526,294 B | 59,681 → 0 B | 950,313 → 846,015 B |
| Objects study | 1440×900 | 1,091,681 → 1,091,690 B | 27,577 → 0 B | 1,885,502 → 1,671,254 B |
| Objects study | 390×844 | 404,767 → 404,760 B | 27,577 → 0 B | 617,734 → 581,052 B |
| `/world/objects` | 1440×900 | 508,107 → 508,101 B | 0 | 1,599,358 → 1,599,362 B |

The whole-session savings exceed the payloads: each prefetched study also
pulled its hero image (§5).

## 19. Hover results

Hovering every Product-detail link: PASS 11 4–5 RSC prefetches per page
(repeats included); PASS 12 **0** on `/products`, both studies and the
experience page, at 1440×900 and 390×844. Hover visuals are unchanged (CSS
only).

## 20. Keyboard-focus results

Tabbing from the skip link through every Product card: PASS 11 3 prefetches
on the editorial study (viewport-triggered as focus scrolled the cards into
view); PASS 12 **0** on every page. Focus order, rings and targets are
unchanged (§26).

## 21. Viewport-entry results

Walking each page so every Product link enters the viewport: PASS 11 3
prefetches on each study, 2–4 on `/products` (plus 4 on load for the first
row); PASS 12 **0**.

## 22. Click-navigation latency

Click to the destination's title in the DOM (page clock), 10 navigations
each, pointer dwell 150 ms:

| | PASS 11 median / p90 | PASS 12 median / p90 |
| --- | --- | --- |
| Local `/products` 1440×900 | 20 / 25 ms | 20 / 22 ms |
| Local editorial study 1440×900 | 18 / 21 ms | 19 / 25 ms |
| Local Objects study 1440×900 | 19.5 / 23 ms | 18.5 / 20 ms |
| Local `/products` 390×844 | 16.5 / 18 ms | 18 / 21 ms |
| Local taps `/products` 390×844 | 18 / 21 ms (2 requests per tap) | 20.5 / 24 ms (1 request) |
| Local taps Objects study 390×844 | 18.5 / 20 ms | 18 / 20 ms |
| Production `/products` 1440×900 | 136 / 151 ms (dwell 150 ms); 290.5–296 ms at 300–800 ms | measured after deploy (release report) |
| Production taps `/products` 390×844 | 191 / 232 ms | measured after deploy (release report) |
| Production Objects study 1440×900 | 295.5 / 305 ms; taps 298 / 305 ms | measured after deploy (release report) |

- Locally the server renders in about 20 ms, so both builds look the same.
- On production, PASS 12 is expected to put every Product click and tap at
  the full round trip (~290–300 ms). That is what every click after a 300 ms
  hover, every keyboard navigation and every Objects-context navigation
  already cost in PASS 11. The quick-click and tap gain on plain links
  (~100–160 ms) is the price of removing the speculative traffic (§30).
- No spinner or wrong frame: navigation keeps the current page until the new
  one is ready; the shell is right on arrival (journeys §29).

**Render cost (TTFB), local, 20 runs each, both contexts:**

| | Median | p90 | Range |
| --- | --- | --- | --- |
| PASS 11 editorial | 220.7 ms | 227.3 ms | 211.4–244.9 ms |
| PASS 12 editorial | 220.9 ms | 228.6 ms | 210.3–237.2 ms |
| PASS 11 `?from=objects` | 222.6 ms | 229.4 ms | 210.9–233.2 ms |
| PASS 12 `?from=objects` | 223.2 ms | 229.4 ms | 210.1–239.5 ms |

The route is unchanged, so its render cost is too. Production before deploy:
editorial 398 ms, `?from=objects` 400 ms median (10 runs each, PASS 11
release report).

## 23. Browser Back/Forward

All serial, on PASS 12, 1440×900, 390×844 and 844×390:

- `/products` → A → related B → Back → Back → Forward: every step a client
  navigation in the same document (a window marker survives), editorial
  shell throughout, each study at its top, Back to `/products` restores the
  scroll position the click left, history exactly four entries (no
  duplicates).
- `/world/objects` → A?from=objects → related B?from=objects → Back → Back
  → Forward: World shell on every study, Room 02 restored at its place,
  history exactly four entries.
- PASS 11's journeys (Lobby → study → Back to Objects, Copper Pendant → map →
  Gallery, Back to Lobby, Exit, direct and refreshed loads, invalid contexts,
  Back/Forward in each shell, keyboard, CLS, reduced motion) all pass
  unchanged.

## 24. First-paint regression

`/products/form-lounge-chair?from=objects`, throttled cold loads, every
screencast frame: header-band ivory 0, ivory and editorial ground outside the
photograph 0, at 1440×900, 390×844 and 844×390. Unchanged from PASS 11.

## 25. Visual regression

Viewport-by-viewport tiles (images decoded first) of `/products`,
`/products/form-lounge-chair`, `?from=objects` and `/world/objects` at
1440×900 and 390×844, `486e1cb` against PASS 12: 33 of 34 tiles identical. The
other (`/products` first view, 1440×900) differs in 287 pixels inside two card
photographs: in PASS 11 the prefetch had already cached their full-size files,
which the browser then preferred. Served HTML: the visible body of every
Product page is byte-identical; only the RSC payload gained `"prefetch":false`.

## 26. Accessibility

`prefetch={false}` is a prop of the link, not markup: no change to roles,
names, tab order, focus styles, touch targets or `aria` attributes. Touch
still navigates on one tap (journeys at 390×844). Keyboard tabbing no longer
triggers background requests.

## 27. Bundle delta

| | PASS 11 | PASS 12 |
| --- | --- | --- |
| JS | 1,234,781 B raw / 358,686 B gzip | 1,234,832 / 358,701 (+51 / +15) |
| CSS | 310,115 / 58,499 B | unchanged |

The only JS change is the experience shell's two props (+51 B raw).
`ObjectSelection` is server-rendered, so its prop costs no client JS.

## 28. Automated tests

`yarn check:product-navigation` (`scripts/check-product-navigation.mjs`)
renders the real components with a Link stand-in that records each link's
prefetch policy. It is mutation-tested: 17 of 17 deliberate breaks fail it.

| # | Requirement | How |
| --- | --- | --- |
| 1–2 | Card links never prefetch; href from `productDetailHref` | source contract; every rendered card `prefetch=false` |
| 3–4 | Plain in the catalogue, `?from=objects` in the room | rendered hrefs, every context |
| 5 | Room 02 stays native anchors | rendered `wo-study` anchors carry no Link policy; source |
| 6 | `/products` section link keeps its default | rendered `TextLink` policy `auto`; shared files digest-locked |
| 7–9, 31–34 | No Link wrapper, manual prefetch, listener, observer, timer or RAF | file scan; the one `router.prefetch` is PASS 05's gateway; experience shell counts |
| 10–14 | Context and ways back unchanged | context digest; behaviour; rendered back links |
| 15–18 | Shells unchanged | rendered marker and chrome; no shell on the editorial study |
| 19–22 | One owner; callers inherit | no policy prop; callers pass none; related objects and studies render `prefetch=false` |
| 23–26 | Visible markup unchanged | markup digests from the `486e1cb` sources: `/products`, project and space grids, all eight study renders, Room 02 |
| 27–30 | Lobby, Gallery, chamber, homepage | file digests |
| 35–37 | No request, 3D or viewer change | sources; both viewers digest-locked |
| 38–40 | No route, redirect or rewrite; gates wired | route inventory; config scan; `package.json` |
| — | Inventory | every source of a Product-detail URL is listed, header search included |

Also: `check-objects-room` re-locks `object-selection.tsx` with a note; every
existing check passes unchanged.

## 29. Browser QA

- **Network:** 17 phased runs on each build (4 pages × 2 viewports × cold and
  warm, plus the experience page), 6 reuse runs and 4 latency runs per
  build, 2 tap runs per build; production (PASS 11) reuse, dwell sweep and
  taps (§6). All bounded, serial, logged.
- **Journeys** (qa11 harness, PASS 12, 1440×900, 390×844, 844×390): 33 of 33
  pass (11 journeys including the new `collectionHistory`).
- **Fixed during QA** (harness only): the Tab pass started where the pointer
  pass ended (now from the skip link); a card taller than a short viewport
  was scrolled before its tap, so the restored scroll is compared with the
  position at click time.

## 30. Known issues

1. **The Product route renders per request.** Server-side context validation
   costs vinext's page cache (§2, §14): production TTFB was 172 ms at PASS 10
   and ~398 ms since PASS 11. PASS 12 does not change this.
2. **Quick clicks and taps on plain Product links lose the in-flight join**
   (~100–160 ms on production, §6, §22). Every Product navigation now costs
   one server render.
3. **Header search results** still prefetch a visible Product result (§13).
4. **Carried forward:** canonical metadata streaming; no real Product 3D
   assets; the white chair photograph and reference imagery; Safari, Firefox
   and real-device testing.

## 31. PASS 13 boundary

**PASS 12 delivers** a measured, declarative Product-detail prefetch policy
with no visual, content, route or 3D change.

**Stable contracts:** rule 21; `ObjectSelection` as the single owner of the
card policy; Room 02's native anchors; `yarn check:product-navigation`.

**Not started:** Archive, Lab, Studio; a Lobby, Gallery or Objects GLB; real
object assets; a marketplace; other performance work.

**PASS 13 is to be chosen after review:**

- **A. Room 03 — Archive foundation,** if the building should expand;
- **B. A real 3D environment,** only with an approved GLB;
- **C. The real object asset experience,** only with at least one real
  Product asset;
- **D. Broader performance polish,** only if a further measurable cross-site
  bottleneck appears (candidates from this pass: the per-request Product
  render and the header search prefetch).
