# TP3D PASS 13 — Room 03 / Archive foundation

PASS 13 opens the third real room of the World, `/world/archive`. Its first
form is a quiet reading room, an accession register and a foundation for
provenance, built only from records TP3D already publishes.

- **A different question.** The Gallery asks where you can enter; Objects
  asks what you can inspect. The Archive asks what should be remembered and
  where it came from.
- **Provenance first.** Every record names its source collection and opens
  its source record. Nothing external was ingested, and nothing claims a
  rights status the repository cannot support.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). This pass adds
§9 rule 22, "The Archive begins with provenance". The previous pass is
[TP3D-PASS-12-PRODUCT-NAVIGATION.md](TP3D-PASS-12-PRODUCT-NAVIGATION.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-05 |
| Starting HEAD | `123af37` — perf(products): refine Product detail prefetch policy |
| Added | `app/world/archive/page.tsx`, `components/world/world-archive.tsx`, `components/world/world-archive.css`, `data/world-archive.ts`, `yarn check:archive` |
| Changed | `data/world-building.ts` (Archive available at `/world/archive`; a truthful description; comments); `world-chrome.css` (shares tokens, links and focus with the room); contract updates in `check-world-gateway`, `check-gallery`, `check-world-shell`, `check-objects-room`, `check-object-study`, `check-product-navigation`, `check-site`; `package.json` |
| Not changed | `data/materials.ts`, `data/journal.ts`, `/materials`, `/materials/[slug]`, `/journal`, `/journal/[slug]`, the Lobby's composition, `WorldChrome`, the Gallery, Room 02, both detail shells, every Product file, the homepage, `/worlds`, the header search |
| Not introduced | an external cultural record, a museum or archive API, a downloaded or generated image, a public-domain or ownership claim, `?from=archive`, a record route, a client component, an observer, a RAF, canvas, Three.js, a viewer, a dependency |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation,
  against local production builds (`yarn build` + `yarn start` on :8787);
  the exact `123af37` build served on :8788 for side-by-side checks.
- **Browser QA** ran serially, one journey and one viewport per process,
  every step logged and bounded, a watchdog per process; in-page fragment
  jumps never wait for a load event.
- **First paint.** CPU throttled 4×, 150 ms latency, 1.6 Mbps down, cache
  disabled, each load starting from a page already painted `#1c1712`.
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- This is not field data.

---

## 1. Starting state

At `123af37` the World had two real rooms, the Gallery and Objects. The
Archive was a planned wing: text in the Lobby and the World map, "Opening
later", no route, and `/world/archive` was a reserved 404 in `check-site`.
Its data entry promised "Art, craft and cultural memory, kept in three
dimensions."

## 2. Why Archive opens now

The World could already show spaces (Gallery) and objects (Objects). TP3D
also keeps material studies and writing about surface and light. Opening the
Archive with those records gives the building its third question — where
things come from — without waiting for an external collection, and it fixes
the rules that any future collection will have to meet.

## 3. Why no external cultural works were ingested

- The repository holds no museum, heritage or artwork dataset, and inventing
  one would be fabrication.
- A historical work, its photograph or scan, the database record and the
  institution's terms can each carry different rights. "Old" or "online" is
  not evidence of a publishable reproduction.
- So PASS 13 builds the structure that makes provenance unavoidable, and
  ingests nothing. No URL, download, API, Sketchfab scan or generated
  "historical" image entered production.

## 4. Archive concept

**Studio Records — Material, surface, light.** A first chapter of four
records: timber, stone, textile and light. It moves from physical surface to
material memory, to texture, to observation in writing. The Material Library
answers "what material can I use?"; the Archive asks "what traces, studies
and observations has TP3D kept?".

## 5. Gallery vs Objects vs Archive

| | Gallery (Room 01) | Objects (Room 02) | Archive (Room 03) |
| --- | --- | --- | --- |
| Question | Where can I enter? | What can I inspect? | What should be remembered, and where did it come from? |
| Metaphor | walls, exhibitions | cabinet, plinths, specimens | reading room, folios, index, accession register |
| Content type | `World` (spaces) | `Product` (objects) | records that point to `Material` and `Article` sources |
| Leads to | `/worlds/[slug]` in the World shell | `/products/[slug]` in the World shell | the editorial source records |
| Motion | reveal, pointer depth | reveal, one desktop depth | low CSS arrival, then stillness; no depth, no reveal |

## 6. Route architecture

- `app/world/archive/page.tsx`: metadata (`Archive — TP3D`, "a reading room
  of material and editorial records, each with its source") and the server
  room inside `<div data-world-page="archive">` (the established scroll-to-top
  wrapper).
- `isWorldPath('/world/archive')` was already true, so the editorial header
  and footer step aside without any new mechanism.
- No record route (`/world/archive/[slug]` stays a 404), no redirect, no
  middleware.

## 7. World-room status change

`worldRooms.archive`: `status: 'planned', href: null` became
`status: 'available', href: '/world/archive'`. Number, name, type, summary
("Art & cultural memory") and `futurePath` are unchanged. The description,
which no page renders, became truthful: "A growing record of material,
craft, sources and cultural memory." (the old line promised three
dimensions). Gallery and Objects stay available; Lab and Studio stay
planned. The file's comment now lists three real rooms.

## 8. Initial Studio Records collection

| Accession | Record | Source | Category | Date |
| --- | --- | --- | --- | --- |
| AR–001 | Natural Oak | Material Library | WOOD | Undated study |
| AR–002 | Travertine | Material Library | STONE | Undated study |
| AR–003 | Linen | Material Library | TEXTILE | Undated study |
| AR–004 | Light, Texture and Material | Journal | DESIGN NOTES | 12 Jun 2026 |

The recommended four, unchanged. No replacement made a clearly stronger
composition (Walnut repeats the oak photograph; Working with Natural Stone
repeats the travertine photograph).

## 9. Curation source

`data/world-archive.ts` holds only references, `{ kind, slug }`, in
accession order. Title, summary, image, alt text, family, category and date
all come from `data/materials.ts` and `data/journal.ts`, which stay the
canonical owners. `check:archive` asserts that no source title, description,
alt text or image path appears in the curation file.

## 10. Resolver architecture

`resolveArchiveRecords(refs, { materials, journal })` returns a read-only
`ArchiveRecord` per reference: `key`, `accession`, `kind`, `slug`,
`recordType`, `title`, `category`, `summary`, `excerpt` (the source's longer
text, shown for the record on the table), `image`, `source` and `date`.

- **Material:** category = family, record type "Material study", source
  "Material Library" → `/materials/[slug]`, date `null`.
- **Journal:** category = article category, record type "Editorial record",
  source "Journal" → `/journal/[slug]`, date = the article's own, labelled
  from the ISO string (`12 Jun 2026`, never shifted by a time zone).
- **A reference to a missing source throws** ("Archive: material-travertine
  has no source record in data/materials.ts"). The curation is deliberate: a
  broken accession is a build error, never a silently dropped record.

## 11. Accession IDs

`AR–001` … `AR–004`, derived from curation order (`accessionNumber(index)`).
They are TP3D presentation identifiers, not museum inventory numbers.

## 12. Source labels

Each record shows, in its label, a ruled fact row "Source — Material
Library" or "Source — Journal", and the accession line names the record type
("Material study", "Editorial record"). Nothing is behind hover.

## 13. Source routes

- Each record ends with "Open source record ↗" to its source route
  (`/materials/natural-oak`, …, `/journal/light-texture-and-material`); screen
  readers hear ": Natural Oak, in the Material Library".
- **Native anchors, deliberately** (the World's exit pattern, like Room 02's
  studies and the Gallery's catalogue link). Measured on the editorial
  `/materials` page: `next/link` prefetched every visible material record on
  load and, with each, that record's full-size hero image (`wood.webp`
  514,882 B, `stone.webp` 445,550 B, `textile.webp` 850,964 B transferred).
  The prefetch is reusable — those routes are cached (`s-maxage=31536000,
  stale-while-revalidate`) — but a reading room that already shows these
  photographs should not spend about 1.8 MB on them before anyone leaves.
  Measured here: 0 source-route requests on load, on scroll or on focus; one
  document request on click. Rule 21 allows a cacheable destination to
  prefetch; it does not require it.
- No `?from=archive`: the sources keep their editorial shell (§41).

## 14. Provenance foundation

The minimal contract every current record carries:

| Element | Value today |
| --- | --- |
| Source type | `material` or `journal` |
| Source record | the source's slug and title |
| Source route | `/materials/[slug]`, `/journal/[slug]` |
| Publication basis | `existing-project-content` |

## 15. Publication-basis meaning

"Existing TP3D project content" says why a record may appear in this first
internal collection: the underlying record already exists in the project. It
is **not** a copyright or ownership claim. The note says so in one line; no
record says "owned by TP3D".

## 16. External cultural-record boundary

Documented, not populated. An external record must not become publishable
until it has:

- a named source;
- a stable source URL or institution reference;
- a credit line;
- a documented publication basis;
- rights, licence, public-domain or permission evidence appropriate to the
  specific asset;
- image or model provenance;
- no ambiguity between the historical work and its digital reproduction.

`PublicationBasis` has exactly one value today. The first real external
record will drive the schema; no example, licence database or ingest
pipeline was built.

## 17. Copyright/provenance caution

- Public-domain status of a work does not make every photograph, scan or
  database record of it free to use.
- The Archive infers no rights from age, aesthetics or online availability
  (rule 22). `check:archive` fails on any public-domain, licence or ownership
  wording in code or rendered copy, and on any external URL.

## 18. Visual metaphor

A reading room rendered in the World's language: catalogue sheets with an
accession line, the source's own photograph on a plain stone mount, fine
rules, an index and a note. No ageing, grain, dust, torn edges, scan
borders, stamps or handwriting: credibility comes from structure and
provenance, not visual cosplay (asserted: no filter, blend or mask in the
stylesheet).

## 19. Reading Table

- A line across the room ("Reading table" / "Studio records · Material,
  surface, light"), one quiet sentence ("The Archive opens with material and
  editorial studies already published within TP3D."), then the first record
  open on the table.
- **AR–001 Natural Oak:** the large plate (4:5, at most the height of the
  view) beside its label — title, WOOD, the source's short description in
  italic, its longer study text, the Source and Date rows ("Undated
  study"), and "Open source record". It is a material reference, not a
  historical oak artefact; the photograph keeps its source alt text ("a
  close study of timber grain; an illustrative wood reference").

## 20. Secondary records

- **AR–002 Travertine** faces it from the other side of the table: label on
  the left, a smaller plate on the right, set lower.
- **AR–003 Linen and AR–004 Light, Texture and Material** are entered in the
  **accession register**: ledger rows with the accession number and record
  type, a small 2:3 plate, the title, category and description, and the
  Source / Date facts with the source link. AR–004's date is a real
  `<time dateTime="2026-06-12">`.

## 21. Accession Index

`<nav aria-labelledby>` listing all four records (number, title, source ·
category), each a native anchor to the record's collision-safe fragment
(`material-natural-oak`, `material-travertine`, `material-linen`,
`journal-light-texture-and-material`). Kind-prefixed, so a material and an
article sharing a slug can never collide.

## 22. Archive note

"Archive note — Source *before interpretation.*" beside two ruled rows:
"Current accession basis: Existing TP3D project content." and "External
records: Cultural records from outside TP3D require a documented source,
credit and publication basis before inclusion." Then quiet ways out: the
material library ↗, the journal ↗, Back to Lobby.

## 23. Desktop

Measured on the final build at rest (y in CSS px from the top of the first
view; boxes are left, top, right, bottom):

| Viewport | Chrome bottom | Room 03 (y) | Title (y) | Reading-table line (y) | Record 01 plate | Record 01 label | Smallest target | Smallest text |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 83 | 110 | 141–231 | 271 | 78, 486, 686, 1237 | 811, 840, 1362, 1237 | 44px | 11px |
| 1366×768 | 78 | 101 | 133–218 | 252 | 74, 451, 576, 1071 | 769, 678, 1292, 1071 | 44px | 11px |
| 1280×720 | 78 | 100 | 131–211 | 243 | 69, 437, 533, 1009 | 721, 620, 1211, 1009 | 44px | 11px |
| 1180×820 | 78 | 103 | 134–208 | 244 | 64, 450, 606, 1120 | 665, 734, 1116, 1120 | 44px | 11px |
| 820×1180 | 108 | 140 | 172–275 | 416 | 44, 659, 452, 1164 | 484, 756, 776, 1164 | 44px | 11px |
| 390×844 | 76 | 104 | 136–201 | 316 | 22, 559, 368, 986 | 22, 1008, 368, 1394 | 44px | 11px |
| 360×740 | 76 | 104 | 136–196 | 337 | 22, 578, 338, 968 | 22, 990, 338, 1373 | 44px | 11px |
| 844×390 | 68 | 88 | 120–183 | 207 | 46, 377, 281, 666 | 379, 377, 798, 760 | 44px | 11px |
| 740×360 | 68 | 88 | 120–176 | 282 | 40, 473, 251, 732 | 332, 473, 700, 865 | 44px | 11px |
| 667×375 | 68 | 88 | 120–170 | 276 | 36, 468, 259, 742 | 299, 468, 631, 859 | 44px | 11px |

- At 1440×900, 1366×768, 1280×720 and 1180×820 the plate (6 parts) and label
  (5 parts) share the table, the label set on the plate's baseline; the
  first record begins in the first view.
- The entry mirrors the other rooms: number, a large serif title, the
  statement "Records of material, light *and memory.*" and the record count.

## 24. Tablet

- **1180×820** uses the desktop composition.
- **820×1180:** the table stays asymmetric (plate 7 parts, label 5); the
  facing record keeps its side; the register rows stack their facts under
  the title; index and note become one column.
- No hover dependency.

## 25. Mobile

- **390×844, 360×740:** one reading column in the room's order — chrome,
  Room 03, Archive, statement, count, the table line and sentence, AR–001
  (accession line, plate, label), AR–002, the register (a small plate beside
  each record's label), the index, the note.
- Fact text 14px, labels 11px, targets ≥44px, no horizontal overflow.

## 26. Short landscape

- **844×390, 740×360, 667×375:** the title clears the 68px chrome (y 120);
  the reading table keeps its two sides at every width — the plate beside its
  label, both from the top of the sheet, the facing record mirrored — so the
  first record's title and source are reachable at once.
- Fixed during QA: below 768px the phone rule had stacked the table, leaving
  a small plate alone on a wide screen; a short-landscape rule now restores
  the two sides.
- Normal document scrolling; no fixed or giant plate.

## 27. Reduced motion

The arrival (room number, title, the table line drawing, the table's text,
the first record) is CSS only, with token durations. Under `reduce` the
global kill switch shows the composed room at once: 0 running animations and
no element below full opacity (measured at 1440×900, 390×844, 844×390). No
base rule ever hides content.

## 28. Accessibility

- One `h1` (Archive), one `main`, one header system (the World chrome); the
  entry is a labelled section.
- Each record is an `<article aria-labelledby>` with its own `h2`; record
  facts are a `dl`; the journal date is a `<time>`; materials say "Undated
  study" and carry no `<time>`.
- Images use their source alt text; only the first plate is eager
  (`fetchpriority=high`), the rest lazy with intrinsic sizes.
- The Accession Index is a labelled `nav`; source links are real anchors
  with full names for screen readers.
- **Tab order** (1440×900, 390×844, 844×390; 15 stops after the skip link):
  wordmark → Back to Lobby → World map → Exit → the four source links → the
  four index entries → the material library → the journal → Back to Lobby.
  World focus (1px ivory ring, offset 6px) everywhere; no link sits over a
  photograph.

## 29. First paint

Throttled cold loads, every screencast frame (83–85 per load):

| Load | First content | Header band ivory (first / +50 / +100 / +250 ms / settled / max) | Frame ivory / editorial ground (max) |
| --- | --- | --- | --- |
| 1440×900 | 1,252 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
| 390×844 | 1,242 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
| 844×390 | 1,298 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |

The first frame is the World ground with the chrome; the low arrival follows.
The editorial header is absent from the DOM (`EditorialChrome` on a World
path). CLS 0.0002 (1440×900), 0 (390×844, 844×390).

## 30. Network

Cold cache, `/world/archive`:

| | 1440×900 | 390×844 |
| --- | --- | --- |
| Load | 27 requests / 680,018 B | 27 / 680,019 B |
| Load + scrolled through, every link focused | 29 / 1,021,419 B | 29 / 1,021,420 B |
| Of which on scroll | the two lazy plates, `textile-720.webp`, `linen-720.webp` (341,401 B) | the same |
| Images on load | `wood-720.webp`, `stone-720.webp` | the same |
| External hosts | 0 | 0 |
| Source-route requests before a click | 0 | 0 |
| Sketchfab, Fab, model, Three.js, iframe, canvas | 0 | 0 |
| RAF callbacks at rest | 0 | 0 |

A click on "Open source record" makes one document request for the source;
Back restores the Archive (scrollY 715 → 715 at 1440×900).

## 31. Bundle delta

Client build output (`dist/client`), each file gzipped separately with
Node's default zlib level and summed:

| | `123af37` | PASS 13 |
| --- | --- | --- |
| JS (41 files) | 1,234,832 B raw / 358,845 B gzip | 1,235,301 / 358,884 (+469 / +39) |
| CSS | 310,115 / 58,636 (12 files) | 322,344 / 61,475 (+12,229 / +2,839; 13 files) |

The whole JS delta is the route manifest chunk (`index-*.js`, 121,944 →
122,413 B); every other chunk is the same size, and the room ships no
client code. CSS is the room's stylesheet (12,167 B) plus 62 B of shared
selectors in `world-chrome.css`.

## 32. Lobby change

Only the Archive's entries and the count: "03 Archive — Art & cultural
memory — Opening later" became a link with "Enter ↗", in both navigation
modes, and "2 of 5 rooms open" became "3 of 5 rooms open". The Lobby derives
it from `worldRooms` (asserted with the Archive re-planned: the PASS 05 Lobby
digest still matches). Pixels: only that card and the count differ
(1440×900, 390×844).

## 33. World Map change

Available: 01 Gallery, 02 Objects, 03 Archive; planned: 04 Lab, 05 Studio.
Verified current room in every context (served HTML and browser): Lobby (no
current room), Gallery, Objects, Archive, the Gallery chamber and the object
study — the Archive is current only in the Archive.

## 34. Material regression

`/materials` and all four material records checked (Natural Oak, Walnut,
Travertine, Linen) served HTML identical to `123af37` after build-hash
normalisation; `data/materials.ts` and both routes are digest-locked.
Viewport tiles: `/materials/natural-oak` identical at 1440×900 and 390×844;
`/materials` identical at 390×844, and at 1440×900 two tiles show photo
resampling noise only (200 and 69 pixels above the noise floor of 24,
maximum channel difference 52 and 72, spread across the photo grid, with
identical served HTML).

## 35. Journal regression

`/journal` and both journal records checked are byte-identical in served
HTML; `data/journal.ts` and both routes are digest-locked; tiles identical.

## 36. Gallery regression

Served HTML and rendered markup differ only by the World map's Archive entry
(now a link); `world-gallery.tsx`/`.css` are digest-locked; Gallery and
chamber tiles identical with the map closed.

## 37. Objects regression

Room 02 and the object study differ only by the World map's Archive entry
(rendered markup and served HTML); Room 02's and the study shell's files are
digest-locked; the PASS 10 room digest still matches with the Archive
re-planned.

## 38. Automated tests

`yarn check:archive` (`scripts/check-archive.mjs`) renders the real room,
the Lobby, the Gallery and the World chrome, resolves the curation against
the real sources and fixtures, and checks CSS, digests and source contracts.
Mutation-tested: 22 of 22 deliberate breaks fail it (Archive planned, wrong
href, missing source slug, duplicate record, invented material date, removed
or hidden source label, external URL, Archive current elsewhere, Lab made
available, source metadata in the curation, accession numbers not from
order, wrong source route, a public-domain claim, every plate priority, a
client room, a hard-coded Lobby link, an ageing filter, a broken index
fragment, the external-record boundary removed from the note, a source
record edited, a record route).

| # | Requirement | How |
| --- | --- | --- |
| 1–2 | Route, World path | page file, metadata, wrapper; `isWorldPath` |
| 3–8 | Room statuses | Archive available at `/world/archive`; Gallery, Objects available; Lab, Studio planned |
| 9–12 | Lobby and map from `worldRooms`; Archive current only in Archive | rendered Lobby with and without the Archive open; three map links; `aria-current` for every room |
| 13–26 | Curation | facts equal the source's; no source fact in the curation; missing source throws; order, count, accession, routes, dates |
| 27–35 | Provenance | type, collection, link, basis on every record; no rights claim, external URL or external asset; the note |
| 36–47 | Markup and CSS | h1, h2 per record, main, index nav and fragments, unique kind-prefixed ids, source alt, real links, 44px, phone and short-landscape rules, no hidden base state |
| 48–57 | Runtime | no 3D, iframe, network, RAF, observer, timer or client code |
| 58–62 | Other rooms and shells | markup differs only by the Archive entry |
| 63–72 | Sources, products, homepage, catalogue, gates | digest locks; route inventory; scripts wired |

Contract updates elsewhere (identities checked, not counts loosened):
`check-world-gateway` and `check-gallery` (three open rooms by id; the Lobby
lineage now re-plans the Archive for PASS 05–12 and proves PASS 13 changed
only its entries and count), `check-objects-room`, `check-world-shell`,
`check-object-study` and `check-product-navigation` (route inventories; Room
02 and the study locked against the pre-Archive building, the live map
adding only the Archive entry; `world-building.ts` and `world-chrome.css`
re-locked with notes), `check-site` (the Archive's served HTML; three map
links in each room; `/world/lab` and `/world/archive/material-natural-oak`
reserved 404s).

## 39. Browser QA

All serial and bounded, on the final build:

- **Journeys, 1440×900, 390×844, 844×390 — 30 of 30:** Lobby → Archive;
  direct `/world/archive#material-travertine` and the index to every record
  (same document); Natural Oak and Light, Texture and Material → source
  record in the editorial shell → Back to the same place → Forward; map
  Escape, Archive → Gallery, Gallery → Archive, Objects → Archive, the map in
  the object study and the Gallery chamber; Back to Lobby; Exit; refresh;
  keyboard; reduced motion; CLS. The 844×390 set was re-run after the
  short-landscape fix: 10 of 10.
- **Visual, 10 viewports — 10 of 10:** arrival, settled geometry, Record 01,
  Record 02, register, index, note, World map open (inside the viewport,
  Archive current), keyboard focus on a source link and an index entry,
  0 RAF at rest.
- **First paint, network, pixels, served HTML:** §29–37.

## 40. Known issues

1. The first records are TP3D's own material and editorial studies, not yet
   a cultural collection.
2. Source links leave the World for the editorial Material Library and
   Journal (by design in PASS 13).
3. No external artwork or cultural artefact has been rights-cleared or
   ingested; the provenance model stays minimal until the first real
   external record.
4. The Natural Oak study uses a dark timber photograph shared with Walnut,
   as in the Material Library.
5. No 3D archive assets.
6. Carried forward: the Product route renders per request; header search
   results prefetch Product details; canonical metadata streaming.
7. Measurement scope: headless desktop Chrome with emulated phones; no
   Safari, Firefox, real devices or field data.

## 41. PASS 14 boundary

**PASS 13 delivers** Room 03: a truthful reading room of four source-linked
records, an accession index and a provenance contract.

**Stable contracts:** `/world/archive`; `worldRooms.archive` available;
`data/world-archive.ts` (references only); kind-prefixed fragment ids;
accession numbers from order; `PublicationBasis`; rule 22;
`yarn check:archive`.

**Not started:** Archive source-detail World shells, `?from=archive`, museum
or archive APIs (Wikimedia, Smithsonian, Europeana, the Met), Sketchfab
scans, a GLB archive viewer, photogrammetry, IIIF, a CMS, a rights
dashboard, search or filters, a timeline or map, Room 04 Lab, Room 05
Studio, any GLB environment.

**PASS 14 is to be chosen after review:**

- **A.** Archive → source-detail World context, only if the
  Archive-to-editorial seam feels problematic;
- **B.** Room 04 / Lab foundation, if expanding the building matters more;
- **C.** External Archive ingestion architecture, only with at least one real
  candidate record with a verifiable source and publication basis;
- **D.** A real 3D environment, only with an approved GLB.
