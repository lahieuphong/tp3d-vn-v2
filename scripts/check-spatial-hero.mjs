import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadStoryMath } from './load-story-math.mjs';
const loaded = { exports: loadStoryMath('home-story-frame') };
const { arrivalFrame, tpPose, tpTiming } = loaded.exports;
const sizes = [
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
];
const close = (actual, expected, message) =>
  assert(
    Math.abs(actual - expected) < 1e-9,
    `${message}: ${actual} !== ${expected}`,
  );
for (const [width, height] of sizes) {
  const mobile = width < 768;
  const tablet = width >= 768 && width < 1200;
  const portrait = tablet && height > width;
  const target = {
    x: mobile ? -0.21 * width : 0,
    y: height * (mobile ? 0.19 : portrait ? 0.24 : tablet ? 0.08 : 0.13),
    scale: mobile ? 0.88 : portrait ? 0.8 : 0.86,
    width: width * (mobile ? 0.38 : tablet ? 0.3 : 0.258),
    height: height * (mobile ? 0.18 : portrait ? 0.3 : tablet ? 0.37 : 0.49),
    opacity: mobile ? 0.75 : 1,
  };
  for (const reduced of [false, true]) {
    const positions = Array.from({ length: 501 }, (_, i) => i / 1000);
    const samples = positions.map((p) => tpPose(p, target, reduced));
    assert.deepEqual(
      samples,
      positions
        .toReversed()
        .map((p) => tpPose(p, target, reduced))
        .reverse(),
      'TP has identical forward/reverse states',
    );
    assert.deepEqual(
      tpPose(0, target, reduced),
      tpPose(0.1, target, reduced),
      'Scene 1 has a real reading hold',
    );
    const start = samples[0];
    close(start.x, 0, 'approved Scene 1 x');
    close(start.y, 0, 'approved Scene 1 y');
    close(start.scale, 1, 'approved Scene 1 scale');
    assert.equal(start.phase, 'scene1');
    const end = tpPose(0.47, target, reduced);
    assert.equal(end.phase, 'scene2');
    close(end.scale, target.scale, 'approved Scene 2 scale');
    // Preserve approved bounds after changing from the old central pivot to
    // the optical 52%/46% origin; checking transform strings would miss drift.
    close(
      end.x + target.width * 0.52 * (1 - end.scale),
      target.x + target.width * 0.5 * (1 - target.scale),
      'approved Scene 2 horizontal bounds',
    );
    close(
      end.y + target.height * 0.46 * (1 - end.scale),
      target.y + target.height * 0.5 * (1 - target.scale),
      'approved Scene 2 vertical bounds',
    );
    for (const p of [0.42, 0.47, 0.5, 0.56, 0.59, 0.6])
      assert.deepEqual(
        tpPose(p, target, reduced),
        end,
        'Scene 2 reading hold is steady',
      );
    for (let i = 0; i < samples.length; i++) {
      const pose = samples[i];
      assert.equal(
        pose.opacity,
        target.opacity,
        'the same artifact never fades away between Scene 1 and Scene 2',
      );
      for (const value of Object.values(pose))
        if (typeof value === 'number') assert(Number.isFinite(value));
      assert(
        pose.scale >= target.scale - 1e-9 && pose.scale <= 1,
        'no scale overshoot',
      );
      if (i) {
        const previous = samples[i - 1];
        assert(
          pose.scale <= previous.scale + 1e-9,
          'the sculpture continuously recedes',
        );
        assert(
          Math.abs(pose.x - previous.x) < target.width * 0.05,
          'no horizontal teleport',
        );
        assert(
          Math.abs(pose.y - previous.y) < target.height * 0.08,
          'no vertical teleport',
        );
      }
    }
  }
  const pickup = tpPose(0.13, target).travel - tpPose(0.12, target).travel;
  const middle = tpPose(0.25, target).travel - tpPose(0.24, target).travel;
  const settle = tpPose(0.42, target).travel - tpPose(0.41, target).travel;
  assert(
    pickup < middle && settle < middle,
    'controlled slow pickup and long settle, not linear scaling',
  );
  assert.notEqual(
    tpPose(0.26, target).y,
    0,
    'depth travel includes spatial alignment',
  );

  const positions = [0, 0.1, 0.18, 0.26, 0.34, 0.42, 0.47, 0.59];
  for (const reduced of [false, true]) {
    const samples = positions.map((p) => arrivalFrame(p, width, true, reduced));
    assert.deepEqual(
      samples,
      positions
        .toReversed()
        .map((p) => arrivalFrame(p, width, true, reduced))
        .reverse(),
    );
    // TP3D PASS 01: the Scene 1 reading hold belongs to the copy, portals and
    // TP. Only the far architecture plane and the near leaves answer the first
    // scroll, so the first ~300px are no longer dead input.
    const spatial = ['[data-hero-layer="architecture-a"]', '.sh-leaves'];
    const content = (frame) =>
      Object.fromEntries(
        Object.entries(frame).filter(([key]) => !spatial.includes(key)),
      );
    assert.deepEqual(
      content(arrivalFrame(0, width, true, reduced)),
      content(arrivalFrame(0.1, width, true, reduced)),
      'Scene 1 content has a real reading hold',
    );
    if (reduced)
      assert.deepEqual(
        arrivalFrame(0, width, true, true),
        arrivalFrame(0.1, width, true, true),
        'reduced motion keeps the whole first scroll still',
      );
    assert.deepEqual(
      arrivalFrame(0.42, width, true, reduced),
      arrivalFrame(0.59, width, true, reduced),
      'content has a quiet reading hold',
    );
    for (const frame of samples)
      for (const pose of Object.values(frame)) {
        if (pose.opacity !== undefined)
          assert(Number(pose.opacity) >= 0 && Number(pose.opacity) <= 1);
        if (pose.transform !== undefined) {
          assert(
            !/NaN|Infinity|rotate|perspective|matrix3d/.test(pose.transform),
          );
          if (reduced)
            assert.equal(
              pose.transform,
              'translate3d(0.000px, 0.000px, 0) scale(1.000000)',
              'reduced content has no parallax',
            );
        }
      }
  }
  const frame = arrivalFrame(0.29, width, true);
  assert(
    Number(frame['.sh-welcome-en h1'].opacity) > 0,
    'Scene 1 copy is still present at the overlap',
  );
  assert(
    Number(frame['.sh-story-en h2'].opacity) > 0,
    'Scene 2 begins before Scene 1 disappears',
  );
  assert(
    Number(frame['.sh-story-en h2'].opacity) >
      Number(frame['.sh-story-vi h2'].opacity),
    'manifesto heading reveals are offset',
  );
  const departure = arrivalFrame(0.21, width, true);
  assert(
    Number(
      departure[
        '.sh-discovery .sh-signature, .sh-mobile-eyebrow, .sh-discovery-axis'
      ].opacity,
    ) < Number(departure['.sh-portals'].opacity),
  );
  assert(
    Number(departure['.sh-portals'].opacity) <
      Number(departure['.sh-welcome-en h1'].opacity),
    'metadata and portals relinquish attention before the main headline',
  );
  assert.equal(
    arrivalFrame(0.47, width, false)['[data-hero-layer="architecture-b"]']
      .opacity,
    '0.00000',
    'unready Scene B retains architecture fallback',
  );
  assert.equal(
    arrivalFrame(0.47, width, true)['.sh-portals'].opacity,
    '0.00000',
  );
  assert.equal(
    arrivalFrame(0.47, width, true)['.sh-story-en h2'].opacity,
    '1.00000',
  );
  assert(
    !('.sh-monogram' in frame),
    'content choreography cannot fade the shared TP',
  );
  // First scroll: an immediate, sub-1% dolly of the far plane that grows
  // monotonically into the existing TP travel.
  const farScale = (p) =>
    Number(
      arrivalFrame(p, width, true)[
        '[data-hero-layer="architecture-a"]'
      ].transform.match(/scale\(([\d.]+)\)/)[1],
    );
  close(farScale(0), 1, 'approved Scene 1 architecture at rest');
  const approachEnd = farScale(0.12) - 1;
  assert(approachEnd > 0 && approachEnd <= 0.0081, 'first scroll stays sub-1%');
  assert(
    farScale(0.02) - 1 > approachEnd * 0.25,
    'the first wheel step already answers',
  );
  for (let p = 0.005; p <= 0.42; p += 0.005)
    assert(farScale(p) >= farScale(p - 0.005), 'the dolly never reverses');
  // The first-scroll approach hands off to the TP travel: Scene 2 keeps the
  // approved pre-PASS-01 planes exactly.
  const depth = width < 768 ? 0.5 : width < 1200 ? 0.7 : 1;
  const scene2 = arrivalFrame(tpTiming.settle, width, true);
  assert.equal(
    scene2['.sh-leaves'].transform,
    `translate3d(${(12 * depth).toFixed(3)}px, ${(-42 * depth).toFixed(3)}px, 0) scale(1.000000)`,
    'Scene 2 leaves unchanged',
  );
  close(farScale(tpTiming.settle), 1 + 0.012 * depth, 'Scene 2 plane A');
}
const hero = readFileSync(
  new URL('../components/home/hero/spatial-hero.tsx', import.meta.url),
  'utf8',
);
const composition = readFileSync(
  new URL('../components/sections/home-hero.tsx', import.meta.url),
  'utf8',
);
const stage = readFileSync(
  new URL('../components/home/experience/home-story.tsx', import.meta.url),
  'utf8',
);
assert.doesNotMatch(
  hero,
  /useLayoutEffect|requestAnimationFrame|mountSpatialHero/,
  'Hero is presentation only',
);
assert.doesNotMatch(
  composition,
  /<SharedTP/,
  'narrative TP does not belong to one scene',
);
assert.equal(
  (stage.match(/<SharedTP/g) ?? []).length,
  1,
  'exactly one shared stage TP',
);
console.log(
  'Persistent TP passed: 12 responsive targets, unchanged approved bounds, continuous opacity, depth travel, forward/reverse symmetry, staggered content overlap, steady reading holds and reduced motion.',
);
