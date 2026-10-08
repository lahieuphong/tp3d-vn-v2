# Homepage PASS 3 — atmospheric bridge

PASS 3 extends the existing native HomeStory progress from the settled manifesto
into the atrium. PASS 2 remains unchanged through progress 0.48. There is one
sticky stage, one SharedTP, one coordinated SVG Breeze, one Scene 3 camera and
one full-resolution atrium image. Footer release stays in native document flow.

This report distinguishes implemented state mapping and source measurements
from browser verification. No browser measurements are inferred from unit tests.

## Transition and shared material

The previous direct Scene 2 → Scene 3 crossfade at 0.59–0.65 is removed. Standard
motion now swaps the architectural plates once at 0.64, inside the Breeze's
intended peak occlusion interval of 0.632–0.646. The same cloth then exits over
0.646–0.84, exposing the real sky crop before the atrium pulls back. This does
not change PASS 2's arrival, settled TP bounds, text layout or reading hold
through 0.48.

Breeze has one SVG cloth definition and three `<use>` projections. On desktop
and tablet its two complementary masked reading planes transfer into one
unmasked near-camera projection over 0.525–0.595. Their geometry and material
remain shared; the transfer avoids carrying a reading-depth mask into the lens
crossing. Mobile paints only its existing front projection, removes its depth
mask and leaves the extra projection inactive.

The luminous close-up fills the existing curved cloth outline, with the same
folds and threads. It is not a rectangular flash or a new portal surface.
Increasing material density and the folded silhouette create the intended
organic occlusion. A labelled mathematical SVG/sharp preview revealed overly
graphic fold contrast. The applied refinement reduces near-phase dark-fold
opacity from 0.32 to 0.16 and the bright-fold maximum from 0.51 to 0.33 while
retaining the opaque luminous silhouette at the swap. This is a refinement
based on a static mathematical preview; browser acceptance of material,
compositing and continuous motion remains pending.

All scroll-time Breeze changes are transform, opacity, material opacity and
projection transfer. Outline, fold and thread paths are calculated only on
measurement, never per animation frame. The bridge uses the existing master
native-scroll driver and requestAnimationFrame owner, with no new clock or
scroll-height extension. Existing heights remain 360svh on desktop, 320svh on
tablet and 280svh on mobile (as of this pass; STEP 1 later paced them to
640/560/480svh where motion is allowed).

## Scene 3 source audit

The approved source is `public/images/home-chapters/worlds-atrium.webp`:
1672 × 941 pixels, 252,504 bytes, opaque WebP. A decoded RGBA equivalent occupies
6,293,408 bytes (about 6 MiB); this is an image-size calculation, not measured
browser or GPU memory. Existing variants are 1280 × 720 / 168,876 bytes and
720 × 405 / 67,048 bytes.

There is no independent sky, foliage, rim, tree, floor or depth asset. The older
`worlds-architecture.webp` depicts another arched corridor and is not used for
this bridge. The atrium's one image supplies sky, oculus and final architecture;
the small existing CTA thumbnail remains a separate preview, not a transition
scene.

The visible inner opening is approximately x430–1210, y17–223 in source pixels.
The useful sky centre is approximately (836, 110), or 50% / 11.69%. A real metal
mullion near y200 limits clean-sky framing. Inspection crops confirm a usable
height of only 160–176 native pixels. A conceptual 1.16–1.25× scale cannot create
a sky void with this asset. The implemented camera uses approximately 5.35× on
mobile/portrait, 5.60× on landscape tablet and 5.88× on desktop.

The one atrium image therefore uses its full 1672-pixel source at every
breakpoint. This avoids the extra degradation caused by the old mobile/tablet
source limits, but **it cannot recover missing sky detail**. The close-up is
visibly softer than the final architecture. At 2560 × 1440 the 160-pixel sky crop
is enlarged to 1440 CSS pixels vertically (9×); retina displays demand more
physical samples again. This is an explicit limitation of the supplied source.

Foliage is baked into the same photograph. No independent parallax is invented
by duplicating or slicing that photograph. The narrowest clean mobile crop is
mostly cloud and sky; foliage enters as the framing widens.

## One camera coordinate space

`atmospheric-bridge-frame.ts` owns the timing and pure camera functions.
`measureAtrium()` measures the final `object-fit: cover` relationship and uses
the current mobile 51% horizontal object position; other sizes retain 50%.

For stage width W and height H:

- Cover factor: `b = max(W / 1672, H / 941)`.
- Origin X: `(W − 1672 × b) × objectPositionX + 836 × b`.
- Origin Y: `110 × b`.
- Initial scale: `H / (b × cleanSkyCropHeight)`.
- Initial translation: `(W/2 − originX, H/2 − originY)`.

The camera returns to translation zero and scale one. The architectural rim
enters through the image's framing; no ellipse, growing circle, portal ring or
secondary photographic layer is introduced. The pivot is not the image centre.
For example, at 390 × 844 it is approximately (183.90, 98.66) pixels, reflecting
the existing 51% image position.

The camera's progress curve has zero velocity at both ends, a weighted middle
and long arrival. It has no separate clock, spring, inertia loop or overshoot.
Forward, reverse, fast scroll and paused states derive from the same progress.

## Current progress map

| Progress                  | Behaviour                                                           |
| ------------------------- | ------------------------------------------------------------------- |
| 0.00–0.48                 | Existing PASS 2 arrival, TP travel and manifesto reading hold       |
| 0.48–0.56                 | Manifesto loses emphasis; TP recedes with modest opacity reduction  |
| 0.52 onward               | Shared Breeze approaches the foreground                             |
| 0.60–0.64                 | Context-loss interval before the architecture swap                  |
| 0.64                      | Scene 2 architecture gives way to the single sky-framed atrium      |
| 0.64–0.695 desktop/tablet | Static sky framing before camera departure                          |
| 0.64–0.684 mobile         | Shorter sky hold                                                    |
| 0.695–0.90 desktop/tablet | Oculus and atrium appear through camera pull-back                   |
| 0.684–0.90 mobile         | Earlier simplified camera departure                                 |
| 0.72–0.78                 | Single header transitions toward ivory                              |
| 0.82–0.89                 | Living, Bedroom, Bathroom and Kitchen labels reveal in order        |
| 0.846–0.92                | Eyebrow, title, body, signoff and CTA reveal in order               |
| 0.90 onward               | Links may become interactive only when their own reveal is complete |
| 0.92–1.00                 | Clean, fully settled Scene 3                                        |

The architecture swap is exclusive in standard motion: two readable rooms are
not crossfaded. Whether Breeze sufficiently conceals the swap is a visual QA
criterion; a timing assertion alone cannot prove the effect.

## Responsive depth and framing

TP departure multiplies the approved PASS 2 scale and adds a small upward
translation. The limits below describe the approach immediately before the
0.64 swap; the TP becomes hidden at the swap rather than continuing into sky.

| Width family       | Depth factor | TP scale multiplier | Additional TP Y | Maximum text Y |
| ------------------ | ------------ | ------------------- | --------------- | -------------- |
| Desktop, ≥1200px   | 1.00         | 1 → 0.805           | 0 → −26px       | −24px          |
| Tablet, 768–1199px | 0.75         | 1 → 0.85375         | 0 → −19.5px     | −18px          |
| Mobile, <768px     | 0.50         | 1 → 0.9025          | 0 → −13px       | −12px          |

The departure contribution first reduces scale by 6.5% × the depth factor;
context loss adds another 13% × that factor. TP opacity decreases progressively
to a limiting 0.484 of its approved base opacity just before the swap, then
becomes zero. The architecture's corresponding maximum scale is 1.035 desktop,
1.02625 tablet and 1.0175 mobile, with upward offsets of 8px, 6px and 4px.

Breeze's crossing/exit displacement and rotation use amplitude factors of 1
desktop, 0.75 tablet and 0.58 mobile. Coverage scale is measured separately from
cloth breadth so reducing mobile motion does not leave the swap exposed. Tablet
keeps its own approved spine and two-plane reading composition; mobile uses its
portrait spine and one painted plane. Portrait tablet shares the 176-pixel sky
crop with mobile, while landscape tablet uses 168 pixels; desktop uses 160.
Mobile starts the pull-back at 0.684 rather than 0.695. Room navigation receives
the matching camera transform only on desktop; tablet/mobile retain their
approved layout and reveal without that additional travel.

For development inspection, `?storyDebug=1` displays native progress, bridge
phase, TP phase and camera scale. The overlay is gated by `import.meta.env.DEV`,
decorative to assistive technology and removed on cleanup; it is absent from
the production experience.

## Reduced motion and access

Reduced motion keeps the same content and shared stage. It uses a short
atmospheric fade, static sky framing and static final atrium framing, without
large animated zoom or a foreground cloth pass. A short exposure dip over
0.73–0.76 softens the static framing change at 0.745. The atrium retains at least
0.65 opacity throughout that dip, including the exact cut, so it never creates
a zero-opacity frame with both architectural plates absent. The visible plate
also remains still when paused at the cut in either scroll direction. Content
reveal uses opacity without vertical travel. Hidden Scene 2 links and unrevealed
room/CTA controls remain inert.

Each Scene 3 control has its own visibility gate. For example, the CTA is still
inert at 0.905 while its late reveal is incomplete; it is fully available by
0.92. Shared visuals remain decorative and do not add accessible duplicate copy.

## Validation status

The pure bridge checks cover all 12 requested sizes, preserved pre-bridge
compositions, audited sky origin, camera edge coverage, monotonic pull-back,
forward/reverse equality, sky without UI, per-control interaction gates, reduced
static framings and final stillness. Existing TP tests retain their endpoint,
responsive, reverse and content-overlap assertions.

The bridge, persistent-TP, lifecycle and image-readiness scripts pass. The
lifecycle checks exercise native restored progress, forward/reverse bridge
states, paused-frame idleness, hidden-control focus gates, individual late CTA
gating, reduced static framings, resize, BFCache-style page restoration and 30
complete teardown cycles. Slow or failed image decoding retains the readable
Scene 2 pose and chapter accessibility while preserving the actual scroll
progress. A later successful decode resolves directly to the current frame.
Header cleanup restores only the custom property and attributes owned by this
driver, including any previous custom-property priority.

Camera coverage is checked at 1,001 progress samples for each of all 12 sizes,
in both motion modes. These calculations verify that the transformed camera box
never exposes a parent edge; they do not certify browser rasterization or the
visual quality of the photographic crop.

Final lint, TypeScript and production build passed. The final production route
crawl passed for 44 pages, 75 image URLs and 8 expected invalid-route cases.
The two-plane / three-projection SVG assertion was corrected during that crawl;
the production page renders one cloth definition and one Scene 3 image.
The final local production preview is available at `http://127.0.0.1:4510/`.

Native browser access remains unavailable: opening the local production page in
Chrome through the browser tool timed out again after the final source review.
Therefore
Chrome screenshots, videos, FPS, long tasks, memory, compositor layers, GPU
observations and interactive visual approval are **not verified** for PASS 3.
The source-image inspection and mathematical compositor are supplementary checks,
not replacements for those browser runs.

The remaining acceptance work is the native 12-size screenshot matrix, stopped
frames and trackpad flicks, the forward/reverse recording, Chrome Performance
trace and 20-cycle memory/compositing inspection. The ignored harness and exact
checkpoint controls are ready in `work/pass3/README.md`; no native browser run
or performance measurement is claimed from that harness merely being present.

Inspection artifacts, including source crops and measured calculations, live in
ignored `work/pass3/asset-framing-audit.json` and `work/pass3/sky-*-clean.png`.
