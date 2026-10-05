# TP3D PASS 15 — Room 05 / Studio foundation

PASS 15 opens the fifth and last room of the World, `/world/studio`, and the
building is complete: all five rooms are open at their own routes.

- **The question.** The Studio asks how this could become a space of your own:
  the move from exploration to conversation, a brief, and a future
  collaboration.
- **Truthful first.** Project enquiries are not live on the site, so the Studio
  frames the conversation honestly — no form, no invented address or phone
  number, no booking link, no prices, and no concept study passed off as a
  commission.

Rules come from [TP3D-DESIGN-SYSTEM.md](TP3D-DESIGN-SYSTEM.md). This pass adds
§9 rules 25, "Commercial claims must match operational reality", and 26,
"Concept studies are not client portfolio". It also brings the §1 Rooms row up
to date and adds a §14 note on Room 05. The previous pass is
[TP3D-PASS-14-LAB.md](TP3D-PASS-14-LAB.md).

| Item | Value |
| --- | --- |
| Date | 2026-10-05 |
| Starting HEAD | `38ba63f` — feat(world): add Room 04 Lab foundation |
| Added | `app/world/studio/page.tsx`, `components/world/world-studio.tsx`, `components/world/world-studio.css`, `data/world-studio.ts`, `yarn check:studio` |
| Changed | `data/world-building.ts` (Studio available at `/world/studio`; a truthful description; comments); `world-chrome.css` (shares tokens, links and focus with the room); contract updates in `check-world-gateway`, `check-gallery`, `check-world-shell`, `check-objects-room`, `check-object-study`, `check-product-navigation`, `check-archive`, `check-lab`, `check-site`; `package.json` |
| Not changed | `/contact`, `/about`, `/projects` and `/projects/[slug]` (pages, components, `data/projects.ts`); the homepage and its Atrium shortcuts; the Gallery, Room 02, the Archive, the Lab (implementation), both detail shells, the Lobby's composition, `WorldChrome`; every Product file; materials, journal, `/worlds` |
| Not introduced | a form, input, button or submission; an email address, phone number, messaging link, scheduler, CRM or form service; a fetch or API route; pricing, packages, testimonials, logos, metrics, team or award claims; a client component, image, canvas, Three.js, iframe or model; `?from=studio`; a route below `/world/studio`; a dependency |

How measurements were taken:

- **Environment.** Headless Chrome 154 on this Windows 11 workstation, against
  local production builds: PASS 15 on :8787 and the exact `38ba63f` tree (a
  `git archive` export built in the scratchpad) on :8788.
- **Browser QA** ran serially: one journey and one viewport per process,
  every step logged and bounded, a watchdog per process. A document-start
  instrument counts WebGL contexts and `requestAnimationFrame` calls; the
  network listener records every request's method and type.
- **First paint.** CPU throttled 4×, 150 ms latency, 1.6 Mbps down, cache
  disabled, each load starting from a page already painted `#1c1712`.
- Reduced motion was pinned explicitly (this machine reports `reduce`).
- **Served-HTML comparisons** use the PASS 14 build made in the repository
  (`38ba63f` content). For pages that build did not capture, they use the
  :8788 build with vinext's path-dependent client-reference ids normalised.
- This is not field data.

---

## 1. Starting state

At `38ba63f` four rooms were open. The Studio was the last planned wing:
"Opening later", no route, `/world/studio` a reserved 404 in `check-site`.
Its data described it as "Where TP3D works with clients on spaces of their
own."

## 2. Why Studio is the final room

The first four rooms show what TP3D sees (spaces), keeps (objects, records)
and builds with (systems). The Studio is where that could become someone's
project, so it closes the building and opens onto the editorial site and
`/contact`.

## 3. Five-room taxonomy

| | Room | Holds | Asks |
| --- | --- | --- | --- |
| 01 | Gallery | spaces / exhibitions | Where can I enter? |
| 02 | Objects | forms / objects | What can I inspect? |
| 03 | Archive | records / provenance | Where did this record come from? |
| 04 | Lab | systems / experiments | What happens when space responds? |
| 05 | Studio | projects / collaboration | How could this become a space of your own? |

Ids, numbers, names, types and order are unchanged and asserted by
`check-studio` and `check-world-gateway`.

## 4. Current commercial reality audit

Read from the repository at `38ba63f`:

| Item | Finding |
| --- | --- |
| `/contact` | "Studio enquiries and project conversations will open here soon." Visits "by appointment — details to follow". Social profiles "will be added when the studio opens". |
| Contact channels in app code | no `mailto:`, `tel:`, `<form>`, scheduler, CRM or form service anywhere in `app/`, `components/`, `data/` or `lib/` |
| `/about` | "This website presents concept residences and illustrative object studies. The photography is a curated visual reference, not a portfolio of commissioned work." |
| `/projects` | three concept residential studies; "Selected concept studies. Project locations and specifications are illustrative; photography is used as a visual reference." |
| Project detail | "This is a concept study. Project information and object specifications are illustrative. Reference photography does not depict a commissioned Tân Phong project." |
| Testimonials, logos, metrics, team, pricing | none in the repository |

## 5. Why no enquiry form exists

There is no destination: no backend, address or CRM. A form would collect
something nobody receives. The Studio's only interaction is navigation.

## 6. Why no email/phone is invented

None exists in the repository, and inventing one would publish a channel that
does not work. Contact details belong to the Contact page when they are real.

## 7. Studio concept

**A conversation before a project exists.** The statement reads "From a
question *to a direction.*", with the summary "Design & collaboration".

## 8. Project Table metaphor

- One long warm-stone surface carries the three areas of conversation, set
  apart by placement (staggered offsets) and hairlines rather than unequal
  boxes.
- An agenda line holds how a project can begin.
- Concept studies are quiet ledger rows, and the starting brief is ruled
  notes.
- The project conversation closes the table.

There are no cards, pricing tiles, form fields, images or paper cosplay
(`check-studio`: no filter, rounding, shadow or loop).

## 9. Areas of conversation

Three areas on the table, introduced as "Areas of conversation, not packages:
the questions a project table returns to." There are no prices, deliverables,
timelines or package names.

## 10. Space

"What should the space make possible?" — proportion, sequence, use,
atmosphere.

## 11. Material

"What should it feel like to live with?" — surface, tone, texture, objects.

## 12. Visualization

"How can an idea become clear before it is built?" — spatial studies, 3D
worlds, interactive communication.

## 13. How a project can begin

An ordered agenda introduced as "One possible beginning, step by step. Every
project finds its own order."

| Step | Prompts |
| --- | --- |
| 01 Context | What kind of space is it? Where is it? Who will use it? |
| 02 Direction | What should change? What should remain? How should it feel? |
| 03 Study | Space, material, objects, relationships |
| 04 Visualize | Images, spatial studies, 3D or interactive work where it helps |

## 14. Why this is not claimed as a proven client process

There is no evidence of an operational client process, so the heading says
"How a project *can* begin". `check-studio` rejects "proven", "our process"
and similar wording.

## 15. Starting Brief

"A useful starting brief — before the conversation: what helps to know. Notes
to keep, not a form to fill in." Seven ruled prompts as a `dl`: type of
space, location, scale, stage, what should change, priorities, references.
There are no inputs.

## 16. Concept Study curation

`data/world-studio.ts` lists three slugs only, in order: `the-walnut-residence`,
`quiet-house`, `courtyard-residence`. `resolveStudioStudies` returns the
canonical `Project` objects; a missing slug throws ("Studio: quiet-house has no
project in data/projects.ts") and is never silently dropped.

## 17. Project source data

Every fact shown comes from `data/projects.ts`: title, location, style, year
and description. `check-studio` asserts that the curation authors none of the
titles, locations, styles, descriptions, areas, image sources or alt text.
The Studio shows no project photography.

## 18. Concept-study disclosure

Beside the studies' heading, in full ink with a rule (never on hover or in a
footer): "These are concept studies, shown for their design language.
Locations and specifications are illustrative; reference photography does not
depict commissioned Tân Phong work." Every row is labelled "Concept study".

## 19. Why current Projects are not described as commissions

The repository says they are concept studies with reference photography
(§4). "Commissioned" appears exactly once on the page, inside the
disclosure's denial. `check-studio` rejects client-work, commission,
completed-project and delivered-residence claims.

## 20. Studio → Project handoff

"Open concept study ↗" (screen readers hear the title) is a native anchor to
`/projects/[slug]`, a document navigation into the editorial site.

- **Measured:** the project opens in its editorial shell (header and footer,
  no World chrome) with its own concept disclosure.
- **Back** returns to the same Studio scroll position (1440×900: 1399 →
  1399; 390×844: 2936 → 2936; 844×390: 1960 → 1960). **Forward** returns to
  the project.

## 21. Studio → Contact handoff

"Open contact page ↗" is a native anchor to `/contact` in the same tab.

- **Measured:** Contact opens in its editorial shell, still saying enquiries
  "will open here soon", with no form.
- **Back** returns to the same Studio position (2105 → 2105, 4265 → 4265,
  2981 → 2981). **Forward** returns to Contact.

`/contact` is unchanged and digest-locked: it stays the source of truth.

## 22. Why there is no `?from=studio`

Project pages already carry editorial context and their own disclosure. A
Studio shell for them would be a new contextual route this pass does not
own. The sources stay canonical; Back brings the visitor home. `check-studio`
rejects `from=`, `source=` and `room=studio`.

## 23. Enquiry status

- One constant, `PROJECT_ENQUIRY_STATUS = 'opening-soon'`, labelled "Opening
  soon". It is never inferred from a date or environment.
- It is shown as text with a small square marker, not as a button: "Project
  conversation — Opening soon. The Studio is open as a place to understand the
  work. *Project enquiries and direct conversations are not yet live on the
  site.*"
- It matches `/contact`, which `check-studio` reads.

## 24. Studio Directory

- A labelled `nav` placed right after the entry, so the Contact handoff is one
  step away without scrolling the room.
- Five anchors: `#conversation`, `#begin`, `#studies`, `#brief`, `#contact`.
- It is fully in the first view at every viewport except short landscape,
  where it begins in the first view (§31).

## 25. Lobby 5-of-5 change

Only the Studio's two entries and the count changed: "05 Studio — Design &
collaboration — Opening later" became a link with "Enter ↗" in both
navigation modes, and "4 of 5 rooms open" became "5 of 5". The Lobby derives
it from `worldRooms`. Pixels (1440×900, 390×844): only that card and the
count differ.

## 26. World Map completion

- Every World map lists five real links (01 Gallery to 05 Studio), with no
  "Opening later".
- **Verified in the browser** from the Lobby (no current room), Gallery,
  Objects, Archive, Lab, Studio, the Gallery chamber and the object study:
  "You are here" marks the Studio only inside the Studio.
- Escape closes the map only, and focus returns to its summary.

## 27. Why planned-room support remains in architecture

The `planned` status, its `href: null` type and `PLANNED_ROOM_LABEL` stay in
`data/world-building.ts`, and `WorldChrome` still renders a planned wing as
text. No current room uses them, but a future wing may. `check-studio`
asserts all three remain, and the pre-opening fixtures in the room checks
still render planned wings as text.

## 28. Desktop

Measured at rest (y in CSS px from the top of the document):

| Viewport | Chrome bottom | Room 05 (y) | Title (y) | Directory (y) | Directory in first view | Project table (y) | Concept studies (y) | Project conversation (y) | Page height | Smallest target | Smallest text |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 83 | 110 | 141–231 | 348 | yes | 676 | 1607 | 2677 | 3005 | 44px | 11px |
| 1366×768 | 78 | 101 | 133–218 | 325 | yes | 625 | 1489 | 2530 | 2832 | 44px | 11px |
| 1280×720 | 78 | 100 | 131–211 | 314 | yes | 603 | 1430 | 2466 | 2750 | 44px | 11px |
| 1180×820 | 78 | 103 | 134–208 | 319 | yes | 674 | 1529 | 2961 | 3242 | 44px | 11px |
| 820×1180 | 108 | 140 | 172–275 | 498 | yes | 973 | 2519 | 4277 | 4735 | 44px | 11px |
| 390×844 | 76 | 104 | 136–201 | 415 | yes | 944 | 2704 | 4683 | 5109 | 44px | 11px |
| 360×740 | 76 | 104 | 136–196 | 407 | yes | 928 | 2700 | 4755 | 5166 | 44px | 11px |
| 844×390 | 68 | 88 | 120–183 | 277 | no | 572 | 1661 | 3085 | 3371 | 44px | 11px |
| 740×360 | 68 | 88 | 120–176 | 352 | no | 848 | 2452 | 4111 | 4502 | 44px | 11px |
| 667×375 | 68 | 88 | 120–170 | 346 | no | 839 | 2439 | 4091 | 4478 | 44px | 11px |

At 1440, 1366 and 1280 the three areas sit side by side on the table,
staggered; the four steps share one agenda line; studies are five-column
ledger rows; the brief is two columns of notes.

## 29. Tablet

- **1180×820** keeps the table and the agenda. Below the desktop tier
  (≤1199px, an existing breakpoint), the directory runs in three columns and
  each study keeps its name and link on one line with its facts and
  description beneath.
- **820×1180** stacks the areas on the table, puts the agenda in two rows and
  the brief in one column.
- No hover dependency.

## 30. Mobile

- **390×844, 360×740:** one reading column in the brief's order — chrome,
  Room 05, Studio, statement, then the directory, the table (areas stacked),
  the beginning, the concept studies with the disclosure first, the brief,
  the project conversation, Contact, Back to Lobby.
- Targets are at least 44px, text at least 11px, and there is no horizontal
  overflow.

## 31. Short landscape

- **844×390, 740×360, 667×375:** the title clears the 68px chrome.
- The table's areas stack, so no name is squeezed.
- The directory starts in the first view (y 277–352) and the Contact handoff
  is reachable from it.
- Normal scrolling, no horizontal overflow, no oversized type.

## 32. Reduced motion

The arrival (room number, title, statement) is CSS-only with token durations;
then stillness. Under `reduce` the room is composed at once: 0 running
animations and no element below full opacity. There is no JavaScript motion.

## 33. Accessibility

- One `main`, one `h1`, an `h2` per section (each section labelled), and `h3`s
  inside it.
- The areas, steps and studies are ordered lists; the brief is a `dl`.
- The directory is a labelled `nav`. Studies and Contact are real links with
  names; Back to Lobby, the World map and Exit are present.
- The disclosure and status are visible text, with nothing on hover and no
  disabled control.
- **Tab order** (1440×900, 390×844, 844×390; 14 stops after the skip link):
  wordmark → Back to Lobby → World map → Exit → the five directory entries →
  the three concept studies → Open contact page → Back to Lobby.
- World focus (1px ring) on the Contact link and the directory at all 10
  viewports.

## 34. First paint

Throttled cold loads, every screencast frame (47 per load):

| Load | First content | Header band ivory (first / +50 / +100 / +250 ms / settled / max) | Frame ivory / editorial ground (max) |
| --- | --- | --- | --- |
| 1440×900 | 1,194 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
| 390×844 | 1,216 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |
| 844×390 | 1,194 ms | 0 / 0 / 0 / 0 / 0 / 0 | 0 / 0 |

- The first frame is the World ground with the chrome; the low arrival
  follows.
- No editorial header or footer; no client placeholder.
- CLS 0.00089 (1440×900), 0 (390×844, 844×390).

## 35. Network

Cold cache, `/world/studio`:

| | 1440×900 | 390×844 |
| --- | --- | --- |
| Load | 25 requests / 330,097 B | 25 / 330,099 B |
| By type | document 9,067 · CSS 5 / 40,433 · JS 15 / 177,962 · fonts 3 / 102,205 · other 430 | the same within 2 B |
| Images | 0 | 0 |
| After walking the room, hovering or focusing all 19 links and tabbing | no further request | no further request |
| POST requests, API requests, fetches | 0 | 0 |
| Three.js, WebGL contexts, canvases, iframes, Sketchfab, GLB | 0 | 0 |
| External hosts | 0 | 0 |
| RAF at rest | 0 | 0 |

All 10 viewports showed 25 requests, 0 images, 0 Three.js, 0 external, 0
POST, 0 canvases and 0 RAF over 2 s.

## 36. JS/CSS delta

Client build output, each file gzipped separately with Node's default zlib
level and summed, against the `38ba63f` build:

| | `38ba63f` | PASS 15 |
| --- | --- | --- |
| JS | 44 files, 1,241,920 B raw / 362,165 gzip | 44 files, 1,242,387 / 362,200 (+467 / +35) |
| CSS | 14 files, 336,399 / 64,849 | 15 files, 346,363 / 67,245 (+9,964 / +2,396) |

- **JS.** The whole delta is the route manifest (`index-*.js`, 123,136 →
  123,603 B), which every page loads. No chunk was added or changed, so
  Studio-specific client JavaScript is 0.
- **CSS.** The Studio stylesheet (9,905 B raw, 2,404 gzip) plus 59 B of
  shared selectors in `world-chrome.css`.

## 37. Contact regression

`app/contact/page.tsx` is unchanged and digest-locked, and its served HTML
is identical to the baseline. Viewport tiles: the first PASS 15 capture
differed inside the photograph only (2,010 pixels above the noise floor).
Two fresh captures of PASS 15 were pixel-identical to the baseline, and two
captures of the baseline were identical to each other: a capture artifact,
not a change.

## 38. About regression

Unchanged and digest-locked; served HTML and tiles identical.

## 39. Project regression

`/projects`, `/projects/quiet-house` and `/projects/the-walnut-residence`
serve identical HTML, and their tiles are identical. The project routes,
components and `data/projects.ts`, `types.ts`, `relationships.ts` and
`images.ts` are digest-locked. The pages show no World chrome and carry no
Studio query.

## 40. Gallery regression

The Gallery and its chamber differ only by the World map's Studio entry
(served HTML). Gallery tiles are identical.

## 41. Objects regression

Room 02 and the object study differ only by the Studio entry. With the
Archive, Lab and Studio re-planned, the PASS 10 room digest still matches.
Tiles are identical.

## 42. Archive regression

The Archive differs only by the Studio entry (served HTML), with tiles
identical. Its content and provenance are digest-locked, and `check-archive`
passes.

## 43. Lab regression

The Lab's implementation files are digest-locked (room, styles, island,
adapter, curation). Served HTML differs only by the Studio entry, tiles are
identical, and `check-lab` passes, including its opt-in, no-fork, RAF and
cleanup contracts. The Lab's browser runtime was not re-run in this pass;
its code is byte-identical to PASS 14.

## 44. Product regression

`/products`, the product detail and the object study serve unchanged HTML
(the study differs only by the Studio entry). `ProductDetail`,
`ObjectSelection`, the product context and routes are digest-locked;
`check-product-navigation` passes.

## 45. Automated tests

`yarn check:studio` (`scripts/check-studio.mjs`) renders the real room, the
Lobby and the chrome, resolves the curation against the real projects and
fixtures, and checks copy, markup, CSS, digests and the route inventory.

| # | Requirement | How |
| --- | --- | --- |
| 1–18 | The five-room building | route, paths, ids, order, types; Lobby 5 of 5 from the data; five map links; no planned room; planned support and label kept; current only in the Studio |
| 19–30 | Truthfulness | rendered copy and code: no testimonials, logos, metrics, commissions (one denial only), prices, quotes, bookings, schedulers, team, awards or history |
| 31–43 | Contact capability | no form, input, textarea, button, mailto, tel, messaging, scheduler, form service, fetch or POST; "Opening soon" from one constant, matching `/contact`; a real `/contact` link; nothing claims enquiries are live |
| 44–54 | Concept studies | same objects as `data/projects.ts`; no fact authored in the curation; a missing slug throws; editorial links with no Studio context; labelled; the disclosure in plain sight |
| 55–61 | Content | Space, Material, Visualization; not packages; the beginning; the brief; no proven-process claim; the directory and its fragments |
| 62–79 | Architecture and runtime | server-only, no island of its own, no sub-route, middleware, redirect or new dependency; no 3D, iframe, external host, RAF, timer, observer or listener |
| 80–90 | Accessibility | headings, lists, nav, real links, 44px, World focus, nothing hidden or hover-only |
| 91–106 | Regression | digest locks on Contact, About, projects, homepage, every other room and shell, the Lab, products, materials, journal, `/worlds`, layout; the chrome differs only by the Studio entry for every room |

**Contract updates in nine checks** (identities checked, counts not
loosened):

- `check-world-gateway`: every room open at its path.
- `check-gallery`: the Lobby lineage now re-plans the Studio for PASS 05–14,
  with a new PASS 14 step, and proves PASS 15 changed only the Studio entries
  and the count. The PASS 05 digest still matches.
- `check-world-shell`, `check-objects-room`: route inventories; Studio
  available.
- `check-object-study`, `check-product-navigation`: fixtures re-plan the
  Archive, Lab and Studio; `world-building.ts` and `world-chrome.css`
  re-locked with notes.
- `check-archive`, `check-lab`: five open rooms; selector-list assertions made
  independent of later rooms.
- `check-site`: the Studio's served HTML; five map links in every room;
  `/world/studio/brief` and `/world/garden` reserved 404s.

## 46. Mutation tests

`check:studio` caught 31 of 31 deliberate breaks:

- **The brief's 21:**
  - Studio planned; wrong href; a sixth room; room order changed; the Lobby
    hard-coding the Studio; status "Open now";
  - a form; an email; a phone; a booking link; a testimonial;
  - a study labelled commissioned; a missing slug; duplicated project
    metadata; the disclosure hidden; `?from=studio`;
  - a client component; Three.js; a canvas; an external host; a broken
    directory.
- **Ten more:**
  - a price; "Book a consultation"; Contact pointing elsewhere; the
    disclosure hidden by CSS;
  - Contact turned operational; project data edited;
  - the planned label renamed; the planned type removed;
  - Studio added to the homepage shortcuts; a route below the Studio.

## 47. Browser journeys

All serial and bounded, on the final build:

- **Initial state, all 10 viewports:** 10 of 10 (§35).
- **Visual, all 10 viewports:** 10 of 10.
  - Arrival at 250 ms and the settled geometry.
  - The directory, table, beginning, studies, brief and conversation.
  - The World map inside the viewport with the Studio current and five links.
  - Focus on the Contact link and a directory entry.
  - 0 RAF at rest.
- **Journeys at 1440×900, 390×844, 844×390 — 33 of 33:**
  - **Lobby → Studio.**
  - **Fragments:** direct `/world/studio#…` for all five sections lands
    150–154px below the top (124 at 844×390). `#contact`, the last section,
    lands fully visible at the end of the page on taller views (572px at
    1440×900, 418 at 390×844). The directory links are same-document.
  - **Map navigation** from every room and shell.
  - **Concept study → Back → Forward** and **Contact → Back → Forward** (§20,
    §21).
  - **The rest:** Back to Lobby (chrome and room), Exit, refresh with
    Back/Forward, keyboard, reduced motion, CLS.

The fragments criterion was refined during QA to accept a last section that
sits fully visible at the end of the page (first run: `#contact` at 609px at
1440×900). No console errors in any run.

## 48. Known issues

1. Project enquiries are not yet operational: there is no enquiry endpoint,
   address or CRM, and the Studio says so.
2. Current Project content is concept and reference work; there is no
   commissioned portfolio, testimonial, client logo or pricing.
3. On tall views `#contact` cannot reach the top of the window: it is the last
   section and lands fully visible at the end of the page.
4. In short landscape the directory begins in the first view but is not fully
   inside it.
5. Adding a route grows the route manifest every page loads (+467 B raw).
6. The Lab's browser runtime was not re-run (its code is byte-identical to
   PASS 14).
7. Measurements come from headless Chrome on this workstation: no Safari,
   Firefox, real-device or field data.

## 49. Post-building boundary

**PASS 15 completes the five-room World:** Gallery, Objects, Archive, Lab and
Studio, all open. There is no Room 06, and no further room pass was started.

**Stable contracts:**

- the five-room taxonomy and order;
- `/world/studio` and its five fragments;
- `data/world-studio.ts` (Studio vocabulary, slug-only studies, one enquiry
  status);
- rules 25–26; `yarn check:studio`.

**Future work, chosen by evidence after review:**

- **A. Real enquiry infrastructure**, only once the user supplies a real
  email, backend, CRM or enquiry destination.
- **B. Real-device hardening:** Safari, Firefox, actual phones and tablets.
- **C. A real 3D environment**, only with an approved GLB.
- **D. Content and asset ingestion**, only with real assets and rights.
- **E. A World-wide polish or performance audit**, only where measurements
  show specific debt.
