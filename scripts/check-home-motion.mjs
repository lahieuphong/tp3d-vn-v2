/** Physical invariants, not measurements of browser FPS or perceived quality. */
import assert from 'node:assert/strict';
import { loadStoryMath } from './load-story-math.mjs';
const { MOTION, accelerate, arrive, motionProfile, settleVisual } =
  loadStoryMath('home-motion');
const { measureAtrium, atriumPose, bridgeFrame, storyTextDeparture } =
  loadStoryMath('atmospheric-bridge-frame');
const { bridgeBreezePose } = loadStoryMath('breeze-bridge-pose');
const { storyBreezeGeometry } = loadStoryMath('breeze-geometry');
const close = (a, b, label) =>
  assert(Math.abs(a - b) < 1e-7, `${label}: ${a} vs ${b}`);
const velocity = (fn, t) => (fn(t + 1e-6) - fn(t - 1e-6)) / 2e-6;
for (const fn of [accelerate, arrive]) {
  close(fn(0), 0, 'curve starts at rest');
  close(fn(1), 1, 'curve reaches exact endpoint');
  close(velocity(fn, 0), 0, 'no entrance velocity step');
  close(velocity(fn, 1), 0, 'no exit velocity step');
  for (let i = 1; i <= 1000; i++) assert(fn(i / 1000) >= fn((i - 1) / 1000));
}
assert(
  velocity(accelerate, 0.7) > velocity(accelerate, 0.2) * 8,
  'departure builds momentum',
);
assert(1 - arrive(0.7) < 0.04, 'last30% covers less than4% of camera travel');
assert(
  velocity(arrive, 0.9) < velocity(arrive, 0.4) / 30,
  'arrival has a long tail',
);
for (const [width, height] of [
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1728, 1117],
  [1920, 1080],
  [2560, 1440],
]) {
  const g = measureAtrium(width, height),
    profile = motionProfile(width);
  const cloth = { ...storyBreezeGeometry(width, height), width, height };
  for (const boundary of [
    MOTION.bridge.breezeStart,
    MOTION.breeze.peak,
    MOTION.breeze.crossingEnd,
    MOTION.bridge.breezeEnd,
  ]) {
    for (const key of ['x', 'y', 'scale', 'rotate', 'opacity']) {
      const sample = (p) => bridgeBreezePose(p, cloth)[key];
      const left = (sample(boundary) - sample(boundary - 1e-8)) / 1e-8;
      const right = (sample(boundary + 1e-8) - sample(boundary)) / 1e-8;
      assert(
        Math.abs(left - right) < 0.25,
        `${key} must not kick at ${boundary}`,
      );
    }
  }
  for (const p of [0.52, 0.55, 0.575, 0.6]) {
    const label = storyTextDeparture(p, 'labels', width).opacity;
    const body = storyTextDeparture(p, 'body', width).opacity;
    const heading = storyTextDeparture(p, 'heading', width).opacity;
    assert(
      label <= body && body <= heading,
      'secondary text exits before body and heading',
    );
    if (p >= 0.575)
      assert(
        bridgeFrame(p, width).tpOpacity > heading,
        'TP outlives departing heading',
      );
  }
  const end = atriumPose(profile.cameraEnd, g);
  close(end.scale, 1, 'no snap at camera end');
  close(end.x, 0, 'camera x');
  close(end.y, 0, 'camera y');
  for (const rate of [30, 60, 120]) {
    const dt = 1000 / rate;
    let current = null;
    // Irregular forward and reverse paths including input leaps.
    for (const p of [
      0.7, 0.72, 0.75, 0.79, 0.82, 0.89, 0.9, 0.87, 0.83, 0.76, 0.73, 0.64, 0.8,
      0.905,
    ]) {
      const target = atriumPose(p, g);
      const next = settleVisual(current, target, dt, width, height, true);
      const diff =
        Math.abs(next.pose.x - target.x) +
        Math.abs(next.pose.y - target.y) +
        Math.max(width, height) * Math.abs(next.pose.scale - target.scale);
      assert(
        diff <= profile.mass.pixels + 1e-7,
        'input always stays inside the pixel lag budget',
      );
      assert(
        next.pose.scale >= 1 && next.pose.scale <= g.skyScale,
        'mass never overshoots camera limits',
      );
      if (width < 768) {
        assert.equal(next.active, false);
        assert.deepEqual(next.pose, target);
      }
      current = next.pose;
      let settling = next;
      for (let elapsed = 0; elapsed < 220 && settling.active; elapsed += dt)
        settling = settleVisual(settling.pose, target, dt, width, height, true);
      assert.equal(
        settling.active,
        false,
        'mass settles in220ms at every tested rate',
      );
      assert.deepEqual(
        settling.pose,
        target,
        'rest is exact and independent of input direction',
      );
      current = settling.pose;
    }
    const target = atriumPose(0.82, g);
    const immediate = settleVisual(
      atriumPose(0.75, g),
      target,
      dt,
      width,
      height,
      false,
    );
    assert.deepEqual(
      immediate.pose,
      target,
      'reduced motion/restoration bypass physics',
    );
    assert.equal(immediate.active, false);
    assert.deepEqual(
      settleVisual(atriumPose(0.75, g), target, 100, width, height, true).pose,
      target,
      'long stalled frames resolve without a catch-up tail',
    );
  }
}
assert.equal(MOTION.scrub, 0, 'native browser scroll is never delayed');
console.log(
  'PASS4 motion passed: smooth velocity boundaries, asymmetric acceleration/arrival, staggered context loss, bounded30/60/120Hz mass,220ms rest, reverse and mobile/reduced bypass.',
);
