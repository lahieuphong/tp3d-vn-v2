/** TP3D PASS 03 — Perspective → Atmosphere choreography as pure functions of
 * master progress. Browser visual and performance QA remains separate. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
const { atmosphericSkyFrame, advanceAmbient, createAmbient, SKY_BRIDGE } =
  loadStoryMath('atmospheric-sky-frame');
const { bridgeBreezePose } = loadStoryMath('breeze-bridge-pose');
const { storyBreezeGeometry } = loadStoryMath('breeze-geometry');

const sizes = [
  [390, 844],
  [820, 1180],
  [1180, 820],
  [1440, 900],
  [1920, 1080],
];
const steps = (from, to, count) =>
  Array.from({ length: count + 1 }, (_, i) => from + ((to - from) * i) / count);
const round = (value) =>
  typeof value === 'number' ? Number(value.toFixed(9)) : value;
const digest = (value) =>
  createHash('sha256')
    .update(JSON.stringify(value, (_, v) => round(v)))
    .digest('hex')
    .slice(0, 16);
const text = (p, width, reduced = false) =>
  Object.fromEntries(
    ['labels', 'body', 'heading'].map((role) => [
      role,
      storyTextDeparture(p, role, width, reduced).opacity,
    ]),
  );

// 1. The approved PASS 01/02 frames are locked through the Perspective hold.
// Every master-written frame up to bridge.exitStart matches fefb910 exactly
// (TP3D PASS 02 HEAD). Only a deliberate earlier-pass change may update this.
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
    for (let i = 0; i <= 480; i++) {
      const p = i / 1000;
      for (const reduced of [false, true]) {
        const { weave, ...pose } = bridgeBreezePose(p, cloth);
        assert.equal(weave, 1, 'the reading weave is untouched in the hold');
        frames.push([
          homeStoryFrame(p),
          arrivalFrame(p, width, true, reduced),
          tpPose(p, target, reduced),
          bridgeFrame(p, width, reduced),
          atmosphericSkyFrame(p),
          reduced ? null : pose,
        ]);
      }
    }
  }
  assert.equal(
    digest(frames),
    'f4e42b9765c1085c',
    'PASS 01/02 approved frames through the Perspective hold are unchanged',
  );
  for (const [width, height] of sizes) {
    const cloth = { ...storyBreezeGeometry(width, height), width, height };
    for (const p of steps(0.42, bridgeTiming.exitStart, 60)) {
      assert.deepEqual(
        text(p, width),
        { labels: 1, body: 1, heading: 1 },
        'Perspective copy holds still',
      );
      const pose = bridgeBreezePose(p, cloth);
      assert.equal(pose.scale, 1, 'cloth rests during the reading hold');
      assert.equal(pose.x, 0);
      assert.equal(pose.y, 0);
      const sky = atmosphericSkyFrame(p);
      assert.equal(sky.active, false, 'no atmosphere during the hold');
      assert.equal(sky.density, 0);
    }
  }
}

// 2. Scene 02 departs block by block in semantic order; the heading is last.
for (const [width] of sizes)
  for (const reduced of [false, true]) {
    const end = { labels: 0, body: 0, heading: 0 };
    for (const p of steps(bridgeTiming.exitStart, 0.66, 1800)) {
      const { labels, body, heading } = text(p, width, reduced);
      assert(labels <= body + 1e-12 && body <= heading + 1e-12, `order @${p}`);
      for (const role of ['labels', 'body', 'heading'])
        if (text(p, width, reduced)[role] > 0) end[role] = p;
      const y = storyTextDeparture(p, 'heading', width, reduced).y;
      if (reduced) assert.equal(y, 0, 'reduced copy does not travel');
      else
        assert(
          y <= 0 && y >= -MOTION.departure.textY.heading,
          'existing small upward amplitude',
        );
    }
    assert(end.labels < end.body && end.body < end.heading);
    assert(
      end.heading <= bridgeTiming.occlusionStart,
      'Scene 02 copy is gone when context loss begins',
    );
    assert.equal(
      bridgeFrame(bridgeTiming.occlusionStart, width, reduced).textOpacity,
      0,
    );
  }
{
  const span = (role) => MOTION.departure[role][1] - MOTION.departure[role][0];
  assert(
    span('heading') >= span('body') && span('heading') >= span('labels'),
    'the headline remains the longest-lived block',
  );
  assert(
    MOTION.departure.labels[0] > bridgeTiming.exitStart - 1e-9 &&
      MOTION.departure.labels[1] <= MOTION.breeze.takeover[0],
    'labels leave as the cloth begins to yield',
  );
}

// 3. Atmosphere does not start too early, and copy leaves before the cloud
// can make it hard to read. The first sign of air is the cloth's restrained
// stir, which starts with the departure and stays small before breezeStart.
for (const [width, height] of sizes) {
  const cloth = { ...storyBreezeGeometry(width, height), width, height };
  const before = bridgeBreezePose(bridgeTiming.exitStart, cloth);
  const stir = bridgeBreezePose(bridgeTiming.breezeStart, cloth);
  assert(stir.scale > before.scale, 'the cloth stirs before the approach');
  assert(
    stir.scale - 1 < 0.06,
    'the first sign of air is perceivable but not dominant',
  );
  assert.equal(stir.density, 0, 'no foreground material before the approach');
  assert.equal(stir.transfer, 0);
  assert.equal(stir.foreground, false);
  for (const p of steps(0.42, 0.7, 2800)) {
    const sky = atmosphericSkyFrame(p);
    const copy = text(p, width);
    if (p <= 0.5 + SKY_BRIDGE.activeStart * (SKY_BRIDGE.end - SKY_BRIDGE.start))
      assert.equal(sky.active, false, 'renderer stays invisible early');
    if (p < bridgeTiming.breezeStart) assert.equal(sky.density, 0);
    if (sky.density >= 0.5)
      assert(
        copy.body <= 0.1 && copy.heading <= 0.5,
        `copy has largely left before dense cloud @${p}`,
      );
    if (sky.density >= 0.95)
      assert(
        Math.max(copy.labels, copy.body, copy.heading) <= 0.01,
        `no copy remains inside the formed atmosphere @${p}`,
      );
  }
}

// 4. DOM Breeze and WebGL overlap safely: the cloth only yields where the
// atmosphere has already formed, and it never yields before the handoff.
{
  const editorial = (t) => t * t * (3 - 2 * t);
  const [start, end] = MOTION.breeze.takeover;
  let worst = -Infinity;
  // Up to the swap; afterwards the cloud clears into the sky suspension.
  for (const p of steps(0.48, bridgeTiming.swap, 1600)) {
    const takeover = editorial(
      Math.min(1, Math.max(0, (p - start) / (end - start))),
    );
    const sky = atmosphericSkyFrame(p);
    worst = Math.max(worst, takeover - sky.density);
    if (p < start) assert.equal(takeover, 0);
    if (takeover > 0) assert.equal(sky.active, true);
  }
  assert(worst <= 0.02, `cloth never yields ahead of cloud (${worst})`);
  const atEnd = atmosphericSkyFrame(end);
  assert(atEnd.density > 0.99, 'atmosphere carries the frame at handoff end');
  for (const [width, height] of sizes) {
    const cloth = { ...storyBreezeGeometry(width, height), width, height };
    for (const p of steps(start, bridgeTiming.swap, 200)) {
      const pose = bridgeBreezePose(p, cloth);
      assert.equal(pose.opacity, 1, 'fallback cloth stays whole to the swap');
      assert(pose.weave <= 1 && pose.weave >= 0);
    }
    assert.equal(
      bridgeBreezePose(MOTION.breeze.transfer[1], cloth).weave,
      0,
      'magnified threads have resolved before they can read as stripes',
    );
  }
}

// 5/6/18. The world swap: complete coverage, exclusive scenes, deterministic
// and reversible around the exact threshold, in every mode.
for (const [width, height] of sizes) {
  const cloth = { ...storyBreezeGeometry(width, height), width, height };
  const around = [0.63, 0.6399, 0.64, 0.6401, 0.65];
  for (const reduced of [false, true]) {
    const forward = around.map((p) => bridgeFrame(p, width, reduced));
    const reverse = around
      .toReversed()
      .map((p) => bridgeFrame(p, width, reduced))
      .reverse();
    assert.deepEqual(forward, reverse, 'swap samples identically in reverse');
    for (const p of steps(0.42, 0.75, 3300)) {
      const state = bridgeFrame(p, width, reduced);
      assert.equal(state.swapped, p >= bridgeTiming.swap, 'scroll-owned swap');
      assert.notEqual(
        state.scene2Visible,
        state.scene3Visible,
        'no double exposure: one world at a time',
      );
      if (state.swapped) {
        assert.equal(state.tpOpacity, 0, 'TP never remains over Scene 3');
        assert.equal(state.textOpacity, 0);
      }
      if (reduced) {
        const plate = state.scene2Visible
          ? state.scene2Opacity
          : state.worldOpacity;
        assert(plate >= MOTION.reduced.floor - 1e-9, 'never an empty frame');
      }
    }
    const at = bridgeFrame(bridgeTiming.swap, width, reduced);
    assert.equal(at.scene2Visible, false);
    assert.equal(at.scene3Visible, true);
    if (reduced) {
      const before = bridgeFrame(bridgeTiming.swap - 1e-6, width, true);
      assert(
        Math.abs(before.scene2Opacity - MOTION.reduced.floor) < 1e-6 &&
          Math.abs(at.worldOpacity - MOTION.reduced.floor) < 1e-9,
        'reduced swap is a cut at the bottom of one exposure dip',
      );
      for (const p of steps(0.6, bridgeTiming.swap - 1e-6, 40)) {
        const dipped = bridgeFrame(p, width, true);
        assert(
          Math.abs(
            dipped.tpOpacity -
              dipped.scene2Opacity * bridgeFrame(p, width).tpOpacity,
          ) < 1e-12,
          'the reduced TP dips with its plate instead of popping at the cut',
        );
      }
    }
  }
  const sky = atmosphericSkyFrame(bridgeTiming.swap);
  // The sky plane's alpha threshold is (1 - skyCover) * 1.8 - 0.65 with a
  // 0.24 ramp; at or above 0.773 every non-negative structure value is covered.
  for (const p of steps(0.62, 0.65, 30))
    assert(atmosphericSkyFrame(p).skyCover >= 0.78, `full sky coverage @${p}`);
  assert.equal(sky.density, 1);
  assert.equal(sky.opening, 0, 'no opening reveals either world at the swap');
  const pose = bridgeBreezePose(bridgeTiming.swap, cloth);
  assert.equal(pose.density, 1, 'DOM fallback swap stays behind dense cloth');
  assert.equal(pose.opacity, 1);
}

// 7. Fast skips land on the frame for the current progress, independent of
// the frames in between.
for (const [width, height] of sizes) {
  const g = measureAtrium(width, height);
  const cloth = { ...storyBreezeGeometry(width, height), width, height };
  const frame = (p) =>
    JSON.stringify([
      bridgeFrame(p, width),
      bridgeFrame(p, width, true),
      atriumPose(p, g),
      atmosphericSkyFrame(p),
      bridgeBreezePose(p, cloth),
      text(p, width),
    ]);
  const path = [0.45, 0.7, 0.45, 0.7];
  const landed = path.map(frame);
  assert.equal(landed[0], landed[2]);
  assert.equal(landed[1], landed[3]);
  const sky = bridgeFrame(0.7, width);
  assert.equal(sky.scene3Visible, true);
  assert.equal(sky.tpOpacity, 0);
}

// 17. Ambient time integrates air only: the narrative frame takes no time.
// The rendered camera under live ambient time is checked by
// check-atmospheric-sky ('time never moves the camera').
{
  assert.equal(atmosphericSkyFrame.length, 1, 'progress is the only input');
  const before = steps(0.5, 0.75, 50).map(atmosphericSkyFrame);
  let ambient = createAmbient();
  for (let i = 0; i < 600; i++)
    ambient = advanceAmbient(ambient, 1 / 30, 1, [1, 1, 1]);
  assert(ambient.time > 0);
  assert.deepEqual(
    steps(0.5, 0.75, 50).map(atmosphericSkyFrame),
    before,
    'twenty seconds of ambient air leave every narrative frame unchanged',
  );
  // The sky suspension parks the camera: it is scroll-owned and monotonic.
  let previous = Infinity;
  for (const p of steps(0.5, 0.75, 500)) {
    const z = atmosphericSkyFrame(p).cameraZ;
    assert(z <= previous + 1e-12, 'camera never drifts back');
    previous = z;
  }
}

// 19. PASS 04 boundary: Atrium camera, exposure, header, interaction and
// reveals from cameraStart onward are unchanged from fefb910.
{
  const frames = [];
  for (const [width, height] of sizes) {
    const g = measureAtrium(width, height);
    const start = motionProfile(width).cameraStart;
    for (let i = 0; i <= 400; i++) {
      const p = start + ((1 - start) * i) / 400;
      for (const reduced of [false, true]) {
        const b = bridgeFrame(p, width, reduced);
        frames.push([
          atriumPose(p, g, reduced),
          Array.from({ length: 10 }, (_, order) =>
            worldReveal(p, order, reduced),
          ),
          [
            b.phase,
            b.swapped,
            b.scene2Visible,
            b.scene3Visible,
            b.worldOpacity,
            b.staticSky,
            b.exposure,
            b.headerIvory,
            b.interactive,
            b.textOpacity,
            b.tpOpacity,
          ],
          atmosphericSkyFrame(p),
        ]);
      }
    }
  }
  assert.equal(
    digest(frames),
    '608129eadcea9dff',
    'Atrium pull-back, exposure and reveals after cameraStart are unchanged',
  );
  for (const [width, height] of sizes) {
    const g = measureAtrium(width, height);
    const start = motionProfile(width).cameraStart;
    assert.deepEqual(
      atriumPose(bridgeTiming.swap, g),
      atriumPose(start, g),
      'the sky suspension is parked until PASS 04 starts the pull-back',
    );
    for (const p of steps(bridgeTiming.swap, start, 40))
      for (let order = 0; order < 10; order++)
        assert.equal(worldReveal(p, order).opacity, 0, 'no UI in suspension');
  }
}

console.log(
  'Perspective → Atmosphere passed: locked PASS 01/02 hold and PASS 04 Atrium range, semantic copy departure before dense cloud, restrained first stir, safe cloth/cloud overlap, exclusive deterministic swap with complete coverage, reduced dip-cut, fast skips and a time-free narrative camera.',
);
