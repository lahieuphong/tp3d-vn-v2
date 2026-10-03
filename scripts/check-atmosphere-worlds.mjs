/** TP3D PASS 04 — Atmosphere → Worlds / Atrium reveal, as pure functions of
 * master progress. Browser visual and performance QA remains separate. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { loadStoryMath } from './load-story-math.mjs';

const { MOTION, motionProfile } = loadStoryMath('home-motion');
const { homeStoryFrame, arrivalFrame, tpPose } =
  loadStoryMath('home-story-frame');
const {
  bridgeTiming,
  bridgeFrame,
  atriumPose,
  worldReveal,
  measureAtrium,
  storyTextDeparture,
} = loadStoryMath('atmospheric-bridge-frame');
const { atmosphericSkyFrame } = loadStoryMath('atmospheric-sky-frame');
const { bridgeBreezePose } = loadStoryMath('breeze-bridge-pose');
const { storyBreezeGeometry } = loadStoryMath('breeze-geometry');
const { HOME_PRODUCTION } = loadStoryMath('home-production');

const sizes = [
  [390, 844],
  [820, 1180],
  [1180, 820],
  [1440, 900],
  [1920, 1080],
  [844, 390],
];
const steps = (from, to, count) =>
  Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);
const digest = (value) =>
  createHash('sha256')
    .update(
      JSON.stringify(value, (_, v) =>
        typeof v === 'number' ? Number(v.toFixed(9)) : v,
      ),
    )
    .digest('hex')
    .slice(0, 16);
const ui = (p, reduced = false) =>
  Array.from({ length: 10 }, (_, order) => worldReveal(p, order, reduced));
// The plate is 1672×941, object-fit: cover, top-aligned (51% horizontally on
// phones). Map the viewport through the camera back to source pixels.
function visibleSource(p, width, height, reduced = false) {
  const g = measureAtrium(width, height);
  const pose = atriumPose(p, g, reduced);
  const cover = Math.max(width / 1672, height / 941);
  const left = (width - 1672 * cover) * (width < 768 ? 0.51 : 0.5);
  const back = (x, y) => [
    (g.originX + (x - pose.x - g.originX) / pose.scale - left) / cover,
    (g.originY + (y - pose.y - g.originY) / pose.scale) / cover,
  ];
  const [x0, y0] = back(0, 0);
  const [x1, y1] = back(width, height);
  return { x0, y0, x1, y1, height: y1 - y0, scale: pose.scale };
}
// Perceived camera speed: change of log scale per unit of progress.
const zoomRate = (p, width, height) => {
  const g = measureAtrium(width, height);
  const s = (q) => Math.log(atriumPose(q, g).scale);
  return Math.abs(s(p + 1e-4) - s(p - 1e-4)) / 2e-4;
};

// 1–3. PASS 01, 02 and 03 are unchanged through the hidden swap, which stays
// exactly at 0.64. Every master-written frame from 0 to 0.64 (six viewports,
// motion and reduced) equals 8baae05, the approved PASS 03 HEAD.
{
  const frames = [];
  for (const [width, height] of sizes) {
    const target = {
      x: 0,
      y: height * 0.13,
      scale: 0.86,
      width: width * 0.258,
      height: height * 0.49,
      opacity: 1,
    };
    const cloth = { ...storyBreezeGeometry(width, height), width, height };
    const g = measureAtrium(width, height);
    for (let i = 0; i <= 640; i++) {
      const p = i / 1000;
      for (const reduced of [false, true])
        frames.push([
          homeStoryFrame(p),
          arrivalFrame(p, width, true, reduced),
          tpPose(p, target, reduced),
          bridgeFrame(p, width, reduced),
          atmosphericSkyFrame(p),
          bridgeBreezePose(p, cloth),
          ['labels', 'body', 'heading'].map((role) =>
            storyTextDeparture(p, role, width, reduced),
          ),
          atriumPose(p, g, reduced),
          ui(p, reduced),
        ]);
    }
  }
  assert.equal(
    digest(frames),
    '3747acb79e6ea9d7',
    'PASS 01/02/03 frames through the world swap are unchanged',
  );
  assert.equal(bridgeTiming.swap, 0.64);
  for (const [width] of sizes)
    for (const reduced of [false, true]) {
      assert.equal(bridgeFrame(0.6399, width, reduced).swapped, false);
      assert.equal(bridgeFrame(0.64, width, reduced).swapped, true);
    }
}

// 4. Sky suspension: from the swap to camera start the camera is parked on
// the sky crop, with no interface, no interaction and dark header ink. The
// parked crop stops above the oculus rim (source y ≈ 205), and the rim only
// enters once the WebGL atmosphere has fully opened.
for (const [width, height] of sizes) {
  const { cameraStart } = motionProfile(width);
  const g = measureAtrium(width, height);
  const parked = atriumPose(bridgeTiming.swap, g);
  for (const p of steps(bridgeTiming.swap, cameraStart, 60)) {
    assert.deepEqual(atriumPose(p, g), parked, `camera parked @${p}`);
    const state = bridgeFrame(p, width);
    assert.equal(state.headerIvory, 0, 'dark ink over the sky');
    assert.equal(state.exposure, 0, 'no exposure shade over the sky');
    assert.equal(state.interactive, false);
    for (const reveal of ui(p)) {
      assert.equal(reveal.opacity, 0, 'no rooms, title or CTA in the sky');
      assert.equal(reveal.interactive, false);
    }
  }
  assert(
    visibleSource(bridgeTiming.swap, width, height).y1 < 205,
    'the parked crop shows sky only',
  );
  const rimEnters = steps(cameraStart, 1, 2000).find(
    (p) => visibleSource(p, width, height).y1 >= 205,
  );
  assert(
    atmosphericSkyFrame(rimEnters).opening === 1 &&
      atmosphericSkyFrame(rimEnters).density === 0,
    `${width}×${height}: the rim enters only after the atmosphere has opened (${rimEnters})`,
  );
  assert(
    cameraStart > 0.705,
    'the parked sky lasts longer than before PASS 04',
  );
}

// 5–7. The camera is monotonic from the sky crop to identity, never
// overshoots below 1 and rests exactly at identity from camera end.
for (const [width, height] of sizes) {
  const g = measureAtrium(width, height);
  const { cameraEnd } = motionProfile(width);
  let previous = Infinity;
  for (const p of steps(bridgeTiming.swap, 1, 3600)) {
    const pose = atriumPose(p, g);
    assert(pose.scale <= previous + 1e-12, 'pull-back is monotonic');
    assert(pose.scale >= 1 - 1e-12 && pose.scale <= g.skyScale + 1e-12);
    previous = pose.scale;
  }
  for (const p of steps(cameraEnd, 1, 40)) {
    const pose = atriumPose(p, g);
    assert.equal(pose.scale, 1, 'exact final scale');
    assert.equal(pose.x, 0);
    assert.equal(pose.y, 0);
    assert.equal(pose.moving, false);
  }
}

// 8–9. A visual recognition milestone precedes the interface. Before the
// opening is understood the frame shows only the oculus band; from
// `recognizable` it shows most of the architecture (oculus, columns, room
// openings, tree). Rooms never reveal before recognition, and the interface
// begins only once plate motion has decayed.
for (const [width, height] of sizes) {
  const before = visibleSource(
    MOTION.camera.recognizable - 0.04,
    width,
    height,
  );
  const after = visibleSource(MOTION.camera.recognizable, width, height);
  assert(
    before.height / 941 < 0.55,
    `${width}×${height}: still an opening before recognition`,
  );
  assert(
    after.height / 941 >= 0.55,
    `${width}×${height}: architecture recognisable at the milestone`,
  );
  let peak = 0;
  for (const p of steps(0.7, 0.9, 2000))
    peak = Math.max(peak, zoomRate(p, width, height));
  assert(
    zoomRate(MOTION.camera.settleStart, width, height) <= peak * 0.2,
    `${width}×${height}: settleStart marks plate motion under a fifth of peak`,
  );
  assert(
    zoomRate(MOTION.ui[0][0], width, height) <= peak * 0.4,
    'the first room label starts during the last part of the settle',
  );
  assert(
    zoomRate(MOTION.ui[5][0], width, height) <= peak * 0.05,
    '"Enter" lands on a still composition',
  );
  for (const p of steps(0.64, 1, 3600)) {
    const reveals = ui(p);
    const scale = atriumPose(p, measureAtrium(width, height)).scale;
    if (p < MOTION.camera.recognizable)
      for (const { opacity } of reveals.slice(0, 4)) assert.equal(opacity, 0);
    if (reveals.slice(0, 4).some((r) => r.opacity > 0))
      assert(scale < 1.06, 'room labels only over a nearly settled plate');
    if (reveals.slice(4).some((r) => r.opacity > 0))
      assert(scale < 1.01, 'typography only over a settled plate');
  }
}
assert(
  MOTION.camera.recognizable < MOTION.camera.settleStart &&
    MOTION.camera.settleStart <= MOTION.ui[0][0] + 0.01 &&
    bridgeTiming.revealStart === MOTION.ui[0][0],
  'recognition → settle → interface, and the chapter/rail return with it',
);

// 10–13. Semantic order: rooms 0–3, then 3D WORLDS, Enter, the worlds.,
// body, signoff, CTA + baseline last.
{
  const [r0, r1, r2, r3, eyebrow, enter, worlds, body, signoff, cta] =
    MOTION.ui;
  assert(r0[0] < r1[0] && r1[0] < r2[0] && r2[0] < r3[0], 'room order');
  assert(eyebrow[0] > r1[0], '3D WORLDS follows the room discovery');
  assert(enter[0] > eyebrow[0] && worlds[0] > enter[0], 'Enter, the worlds.');
  assert(enter[1] <= worlds[1]);
  assert(body[0] > worlds[0] && signoff[0] > body[0], 'body after title');
  for (const window of MOTION.ui.slice(0, 9)) {
    assert(cta[0] >= window[0] && cta[1] >= window[1], 'CTA is last');
    assert(
      window[1] - window[0] <= 0.03 + 1e-9,
      'restrained, block-level reveals',
    );
  }
  assert.equal(cta[1], bridgeTiming.settled, 'the hold starts with the CTA');
}

// 14–15. Interaction never precedes a complete reveal; the final Atrium is
// fully revealed and interactive, and room discovery opens with the hold.
{
  assert(
    bridgeTiming.interactive >=
      Math.max(...MOTION.ui.slice(0, 4).map((w) => w[1])),
    'the four room links become interactive together, fully revealed',
  );
  for (const reduced of [false, true])
    for (const p of steps(0.64, 1, 3600))
      for (const reveal of ui(p, reduced))
        if (reveal.interactive) {
          assert(reveal.opacity >= 0.999, 'never half-visible and focusable');
          assert(p >= bridgeTiming.interactive);
        }
  for (const p of steps(bridgeTiming.settled, 1, 20))
    for (const reduced of [false, true])
      for (const reveal of ui(p, reduced)) {
        assert.equal(reveal.opacity, 1);
        assert.equal(reveal.interactive, true);
      }
  assert.equal(HOME_PRODUCTION.discoveryStart, bridgeTiming.settled);
}

// 16. Final stillness: every narrative value is constant from settled to the
// end of the story, and the hold is at least as long as before PASS 04.
for (const [width, height] of sizes) {
  const g = measureAtrium(width, height);
  const frame = (p) =>
    JSON.stringify([
      bridgeFrame(p, width),
      atriumPose(p, g),
      ui(p),
      homeStoryFrame(p).chapter,
    ]);
  const settled = frame(bridgeTiming.settled);
  for (const p of steps(bridgeTiming.settled, 1, 40))
    assert.equal(frame(p), settled, 'nothing narrative moves in the hold');
}
assert(1 - bridgeTiming.settled >= 0.08, 'final hold not shortened');

// 17–18, 27. Reverse and fast skips: every value is a pure function of
// progress, and the reverse order is interface → rooms → camera → sky.
for (const [width, height] of sizes) {
  const g = measureAtrium(width, height);
  const frame = (p) =>
    JSON.stringify([
      bridgeFrame(p, width),
      bridgeFrame(p, width, true),
      atriumPose(p, g),
      ui(p),
      ui(p, true),
      atmosphericSkyFrame(p),
    ]);
  const dense = steps(0.64, 1, 720);
  assert.deepEqual(
    dense.map(frame),
    dense.toReversed().map(frame).reverse(),
    'reverse travel samples the same frames',
  );
  // Fast skips (0.66 ↔ 0.95) through the real master: check-home-chapters.
  // Walking back from the final Atrium the interface clears before the
  // camera starts back toward the oculus, and the header returns to ink
  // before the frame is sky again.
  for (const p of steps(1, 0.64, 3600)) {
    const pose = atriumPose(p, g);
    if (pose.scale > 1.06) for (const r of ui(p)) assert.equal(r.opacity, 0);
    if (visibleSource(p, width, height).height / 941 < 0.55)
      assert.equal(bridgeFrame(p, width).headerIvory, 0, 'ink over sky');
  }
}

// Exposure and header follow the architecture, not a chapter number.
{
  assert(
    MOTION.light[0] >= MOTION.camera.recognizable - 0.03 &&
      MOTION.light[1] <= MOTION.ui[4][0],
    'exposure adapts with the architecture and is complete before the title',
  );
  assert(
    MOTION.header[0] > MOTION.camera.recognizable &&
      MOTION.header[1] <= MOTION.ui[4][0],
    'header ink changes after recognition and before typography',
  );
}

// 23. Reduced motion: no pull-back, one world at a time, exposure and header
// change only inside the framing cut's dip, and the semantic order remains.
for (const [width, height] of sizes) {
  const g = measureAtrium(width, height);
  const { cut, halfDip, floor } = MOTION.reduced;
  for (const p of steps(0.64, 1, 3600)) {
    const pose = atriumPose(p, g, true);
    assert(
      pose.scale === g.skyScale || pose.scale === 1,
      'reduced framings are static: sky crop, then the full Atrium',
    );
    const state = bridgeFrame(p, width, true);
    assert.notEqual(state.scene2Visible, state.scene3Visible);
    if (state.scene3Visible) assert(state.worldOpacity >= floor - 1e-9);
    if (p < cut - halfDip || p > cut + halfDip) {
      assert(state.headerIvory === 0 || state.headerIvory === 1);
      assert(state.exposure === 0 || state.exposure === 1);
    }
    if (p < cut + halfDip)
      for (const r of ui(p, true)) assert.equal(r.opacity, 0);
  }
  const starts = MOTION.ui.map((_, order) =>
    steps(0.64, 1, 36000).find((p) => worldReveal(p, order, true).opacity > 0),
  );
  for (let i = 1; i < starts.length; i++)
    assert(starts[i] > starts[i - 1], 'reduced keeps the semantic order');
}

// 24. WebGL is enhancement: the Atrium camera, exposure, header and
// interface take no WebGL input, so Save-Data / failure / late WebGL share
// the same frame for the same progress (master-level checks are in
// check-home-chapters).
{
  const source = readFileSync(
    new URL(
      '../components/home/experience/atmospheric-bridge-frame.ts',
      import.meta.url,
    ),
    'utf8',
  );
  assert.doesNotMatch(
    source,
    /from '\.\/atmospheric-sky|from 'three'/,
    'the Atrium frame never reads renderer state',
  );
  assert.deepEqual(
    [bridgeFrame.length, atriumPose.length, worldReveal.length],
    [3, 3, 3],
  );
}

// 22. Short landscape phones keep the grouped composition sized by viewport
// height, so the title clears the fixed header (browser QA measures it).
{
  const css = readFileSync(
    new URL('../components/home/experience/home-story.css', import.meta.url),
    'utf8',
  );
  const block = css.slice(
    css.indexOf(
      '@media (max-width: 1199px) and (max-height: 540px) and (orientation: landscape)',
    ),
  );
  assert(block.length > 0, 'short-landscape Atrium rules exist');
  assert.match(block, /\.hc-atrium-copy \{\s*position: absolute;/);
  assert.match(block, /font-size: clamp\(46px, 15svh, 72px\)/);
  assert.match(
    block,
    /inset: auto auto max\(24px, 8svh\) var\(--atrium-gutter\)/,
  );
}

// The approved PASS 04 Atrium: camera, exposure, header, interaction and
// reveals from the swap to the end, locked so a later pass changes them
// deliberately.
{
  const frames = [];
  for (const [width, height] of sizes) {
    const g = measureAtrium(width, height);
    for (const p of steps(bridgeTiming.swap, 1, 720))
      for (const reduced of [false, true]) {
        const b = bridgeFrame(p, width, reduced);
        frames.push([
          atriumPose(p, g, reduced),
          ui(p, reduced),
          [
            b.phase,
            b.swapped,
            b.scene3Visible,
            b.worldOpacity,
            b.staticSky,
            b.exposure,
            b.headerIvory,
            b.interactive,
          ],
        ]);
      }
  }
  assert.equal(
    digest(frames),
    'cc65e7ea717ba103',
    'approved PASS 04 Atrium reveal is unchanged',
  );
}

console.log(
  'Atmosphere → Worlds passed: PASS 01–03 locked through the 0.64 swap, parked sky until the rim can follow an opened atmosphere, monotonic exact pull-back, recognition before settle before interface, semantic reveal order, complete-before-interactive links, still final hold, deterministic reverse/fast skips, reduced static framings and a locked Atrium reveal.',
);
