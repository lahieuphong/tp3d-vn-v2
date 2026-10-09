/** Physical invariants, not measurements of browser FPS or perceived quality. */
import assert from 'node:assert/strict';
import { loadStoryMath } from './load-story-math.mjs';
const {
  MOTION,
  accelerate,
  arrive,
  followScroll,
  motionProfile,
  settleVisual,
  storyPacing,
} = loadStoryMath('home-motion');
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
    MOTION.bridge.exitStart,
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
// TP3D STEP 1 — the scroll follow. What the stage shows trails the hand and
// rests on it; the hand's own scrolling is never touched (the timeline has
// no wheel listener, prevents nothing and never calls scrollTo:
// check:atrium-orbit). Since 2026-10-09 the room orbit may scroll the page on
// to a room once the hand has let go between two rooms (MOTION.carry; its
// controller is the only writer: check:atrium-orbit-foundation).
{
  const { tau, floor, epsilon, maxFrameMs, frameMs } = MOTION.follow;
  assert.equal('scrub' in MOTION, false, 'the follow replaces scrub: 0');
  assert.ok(tau.fine >= 120 && tau.fine <= 200, 'pointer: a 0.12–0.2s trail');
  assert.ok(
    tau.coarse > 0 && tau.coarse <= tau.fine / 2,
    'touch stays closer to the finger',
  );
  assert.ok(maxFrameMs >= 2 * frameMs && maxFrameMs < 3 * frameMs);
  // First paint, restore, intro (null) and reduced motion (tau 0) are raw.
  assert.deepEqual(
    { ...followScroll(null, 1234.5, 16, tau.fine) },
    { value: 1234.5, active: false },
  );
  assert.deepEqual(
    { ...followScroll(200, 1234.5, 16, 0) },
    { value: 1234.5, active: false },
  );
  assert.deepEqual(
    { ...followScroll(700, 700, 16, tau.fine) },
    { value: 700, active: false },
    'at rest it asks for no frame',
  );
  const run = (from, to, rate, time, t = tau.fine) => {
    let shown = from,
      frames = 0,
      rest = null;
    const path = [shown];
    for (let at = 0; at < time; at += rate) {
      const next = followScroll(shown, to, frames ? rate : 0, t);
      shown = next.value;
      path.push(shown);
      frames++;
      if (!next.active) {
        rest = at + rate;
        break;
      }
    }
    return { shown, frames, rest, path };
  };
  for (const pointer of ['fine', 'coarse'])
    for (const rate of [1000 / 30, 1000 / 60, 1000 / 120])
      for (const [from, to] of [
        [0, 100],
        [0, 1500],
        [5000, 4200],
        [300, 0],
        [0, 6000],
      ]) {
        const { shown, rest, path } = run(from, to, rate, 3000, tau[pointer]);
        const label = `${pointer} ${from}→${to} @${Math.round(1000 / rate)}Hz`;
        assert.equal(shown, to, `${label}: rests exactly on the hand`);
        assert.ok(
          rest !== null && rest <= 1500,
          `${label}: at rest in ${rest}ms`,
        );
        const sign = Math.sign(to - from);
        for (let i = 1; i < path.length; i++) {
          assert.ok(
            (path[i] - path[i - 1]) * sign > 0,
            `${label}: one direction, never back`,
          );
          assert.ok((to - path[i]) * sign >= 0, `${label}: no overshoot`);
          // An ease-out: every stride is at most the one before it (the
          // first is one nominal frame; the last may close inside epsilon).
          if (i > 2)
            assert.ok(
              Math.abs(path[i] - path[i - 1]) <=
                Math.abs(path[i - 1] - path[i - 2]) + epsilon,
              `${label}: the stride only ever shortens`,
            );
        }
      }
  // The same motion at every display rate: positions 200ms in agree.
  const at200 = [1000 / 30, 1000 / 60, 1000 / 120].map((rate) => {
    let shown = 0;
    for (let at = 0; at < 200 - 1e-6; at += rate)
      shown = followScroll(shown, 1000, rate, tau.fine).value;
    return shown;
  });
  assert.ok(
    Math.max(...at200) - Math.min(...at200) < 1,
    `frame-rate independent: ${at200.map((v) => v.toFixed(2)).join(', ')}`,
  );
  close(at200[1], 1000 * (1 - Math.exp(-200 / tau.fine)), 'first-order');
  // A hand moving at a steady 1200 px/s is trailed by speed × tau.
  {
    let shown = 0,
      native = 0;
    for (let i = 0; i < 240; i++) {
      native += 20;
      shown = followScroll(shown, native, frameMs, tau.fine).value;
    }
    const lag = native - shown;
    assert.ok(
      Math.abs(lag - 1.2 * tau.fine) < 0.07 * 1.2 * tau.fine,
      `steady trail ${lag.toFixed(1)}px ≈ ${1.2 * tau.fine}px`,
    );
    // A notched wheel (100px every 8 frames) reaches the stage as an even
    // glide: no frame moves more than a fifth of a notch.
    shown = native = 0;
    let worst = 0;
    for (let i = 0; i < 160; i++) {
      if (i % 8 === 0) native += 100;
      const next = followScroll(shown, native, frameMs, tau.fine).value;
      worst = Math.max(worst, next - shown);
      shown = next;
    }
    assert.ok(
      worst < 20,
      `a 100px notch shows as ≤ ${worst.toFixed(1)}px a frame`,
    );
  }
  // A stalled frame advances like one frame; the first frame after rest is
  // one nominal frame, whatever the clock says.
  assert.equal(
    followScroll(0, 1000, 900, tau.fine).value,
    followScroll(0, 1000, maxFrameMs, tau.fine).value,
    'no jump after a stall',
  );
  for (const stale of [0, -5, Number.NaN])
    assert.equal(
      followScroll(0, 1000, stale, tau.fine).value,
      followScroll(0, 1000, frameMs, tau.fine).value,
      'first frame after rest',
    );
  // The tail ends at the floor pace and snaps inside epsilon.
  assert.equal(
    followScroll(10, 11, frameMs, tau.fine).value,
    11,
    'the last stride lands on the hand',
  );
  assert.ok(floor * frameMs > epsilon, 'the floor always clears epsilon');
  // The stage leaves at `limit`: the follow is there no later than the hand,
  // reaching it continuously, and never passes it.
  {
    const limit = 5000;
    let shown = 3000,
      native = 3000,
      before = shown;
    for (let i = 0; i < 400; i++) {
      native = Math.min(5600, native + 45);
      const next = followScroll(shown, native, frameMs, tau.fine, limit);
      assert.ok(next.value <= limit, 'never past the exit');
      assert.ok(
        Math.min(native, limit) - next.value <=
          Math.max(0, limit - native) + 1e-9,
        'never further behind than the room left before the exit',
      );
      assert.ok(next.value >= before, 'forward only');
      assert.ok(next.value - before <= 2 * 45 + 1e-9, 'at most twice the hand');
      if (native >= limit) {
        assert.equal(next.value, limit, 'complete when the stage moves');
        assert.equal(next.active, false, 'and asks for no frame past it');
      }
      before = shown = next.value;
    }
    // Coming back up from below the stage it starts from the exit.
    assert.deepEqual(
      { ...followScroll(limit, limit + 900, frameMs, tau.fine, limit) },
      { value: limit, active: false },
    );
    const up = followScroll(limit, limit - 300, frameMs, tau.fine, limit);
    assert.ok(up.active && up.value < limit && up.value > limit - 300);
  }
}
// Where the room orbit's camera travels between two rooms the same follow
// runs with more mass (MOTION.follow.travel): a longer trail, a slower tail,
// a nearer end. There the picture crosses the stage about two px for each px
// of scroll, so the journey's own tail (1.5 px of scroll a frame, then
// nothing) was a creep of several px a frame that stopped dead.
{
  const { tau, floor, epsilon, frameMs, travel } = MOTION.follow;
  assert.deepEqual(Object.keys(travel), ['tau', 'floor', 'epsilon']);
  assert.ok(
    travel.tau.fine >= 300 && travel.tau.fine <= 600,
    'a camera with mass, not a lag',
  );
  assert.ok(
    travel.tau.coarse >= 2 * tau.coarse && travel.tau.coarse < travel.tau.fine,
    'touch stays closer to the finger there too',
  );
  assert.ok(travel.floor * frameMs > travel.epsilon, 'the floor clears it');
  const path = (trail, t) => {
    let shown = 0;
    const strides = [];
    for (let i = 0; i < 4000; i++) {
      const next = followScroll(
        shown,
        400,
        frameMs,
        t,
        Infinity,
        trail.floor,
        trail.epsilon,
      );
      strides.push(next.value - shown);
      shown = next.value;
      if (!next.active) break;
    }
    assert.equal(shown, 400, 'it rests on the hand');
    return strides;
  };
  const camera = path(travel, travel.tau.fine);
  const journey = path({ floor, epsilon }, tau.fine);
  assert.ok(camera[0] < 400 / 20, 'a notch is never thrown in one frame');
  assert.ok(journey[0] > 2 * camera[0]);
  // The strides only shrink (the last one lands on the hand).
  for (let i = 1; i < camera.length - 1; i++)
    assert.ok(camera[i] <= camera[i - 1] + 1e-9, `stride ${i} shrinks`);
  assert.ok(
    camera.at(-1) <= travel.floor * frameMs + travel.epsilon + 1e-9,
    'and it ends on a stride too small to see',
  );
  assert.ok(
    journey.at(-2) > 8 * camera.at(-2),
    'where the journey would creep',
  );
  assert.ok(camera.length * frameMs < 4000, 'over in a few seconds');
}
// TP3D STEP 2 — pacing. The pace table decides how much of the scroll
// distance each stretch of the story gets; it never changes the story.
{
  const table = MOTION.pace;
  let before = 0;
  for (const [end, weight] of table) {
    assert.ok(end > before && end <= 1, 'stretches in story order');
    assert.ok(weight >= 0.4 && weight <= 2.5, 'a weight, not a cut or a stall');
    before = end;
  }
  assert.equal(before, 1, 'the table covers the whole story');
  const pacing = storyPacing(table);
  assert.equal(pacing.story(0), 0);
  assert.equal(pacing.story(1), 1);
  assert.equal(pacing.story(-0.2), 0, 'clamped');
  assert.equal(pacing.story(1.3), 1, 'clamped');
  // Strictly forward, and no step in speed: the story never runs backwards,
  // never stands still while the hand moves, and changes pace gradually.
  const N = 20000;
  let last = 0,
    lastSpeed = null,
    slowest = Infinity,
    fastest = 0,
    largestTurn = 0;
  for (let i = 1; i <= N; i++) {
    const value = pacing.story(i / N);
    const speed = (value - last) * N;
    assert.ok(speed > 0, `the story advances at share ${i / N}`);
    if (lastSpeed !== null)
      largestTurn = Math.max(largestTurn, Math.abs(speed - lastSpeed));
    slowest = Math.min(slowest, speed);
    fastest = Math.max(fastest, speed);
    last = value;
    lastSpeed = speed;
  }
  assert.ok(largestTurn < 0.02, `pace changes without a step (${largestTurn})`);
  assert.ok(
    slowest > 0.2 && fastest < 3,
    `bounded pace: ${slowest}–${fastest}`,
  );
  // Every stretch gets the distance its weight asks for.
  const total = table.reduce(
    (sum, [end, weight], i) => sum + (end - (i ? table[i - 1][0] : 0)) * weight,
    0,
  );
  let from = 0;
  for (const [end, weight] of table) {
    const got = pacing.share(end) - pacing.share(from);
    close(got, ((end - from) * weight) / total, `distance of ${from}–${end}`);
    from = end;
  }
  // The inverse is exact enough to place a story position on the page.
  for (let i = 0; i <= 400; i++) {
    const story = i / 400;
    assert.ok(Math.abs(pacing.story(pacing.share(story)) - story) < 1e-12);
  }
  // What the table is for (measured, see the motion context doc): the
  // pull-back out of the oculus gets about twice an even share, and the
  // stretches where almost nothing moves get less.
  const distance = (a, b) => pacing.share(b) - pacing.share(a);
  const { cameraStart, cameraEnd } = motionProfile(1440);
  assert.ok(
    distance(cameraStart, cameraEnd) > 1.7 * (cameraEnd - cameraStart),
    'the pull-back has room',
  );
  assert.ok(distance(0, 0.14) < 0.55 * 0.14, 'the first scroll answers soon');
  assert.ok(
    distance(MOTION.bridge.settled, 1) < 0.7 * (1 - MOTION.bridge.settled),
    'a shorter final hold',
  );
  assert.ok(
    distance(MOTION.bridge.settled, 1) > 0.04,
    'and still a hold: about a quarter of a viewport',
  );
  // No table: scroll share is story progress (reduced motion, the doubles).
  const even = storyPacing(null);
  for (const x of [-1, 0, 0.123, 0.5, 0.987, 1, 2]) {
    assert.equal(even.story(x), Math.min(1, Math.max(0, x)));
    assert.equal(even.share(x), Math.min(1, Math.max(0, x)));
  }
}
console.log(
  'PASS4 motion passed: smooth velocity boundaries, asymmetric acceleration/arrival, staggered context loss, bounded30/60/120Hz mass,220ms rest, reverse and mobile/reduced bypass; STEP 1 follow: exact rest, no overshoot, frame-rate independent, bounded before the stage exit; STEP 2 pacing: strictly forward, no step in pace, exact weights and inverse.',
);
