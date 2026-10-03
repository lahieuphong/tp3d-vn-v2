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
  // TP3D PASS 02: no double exposure. Scene 1 copy has fully left before any
  // Scene 2 copy enters; a negative-space breath sits between them, carried
  // by the architecture and the travelling TP. (Replaces the PASS 2-era
  // assertion that both headlines overlapped at p 0.29.)
  const scene1Copy = [
    '.sh-welcome-en h1',
    '.sh-welcome-title',
    '.sh-discovery .sh-signature, .sh-mobile-eyebrow, .sh-discovery-axis',
    '.sh-scroll-indicator',
    '.sh-portals',
  ];
  const scene2Groups = {
    heading: [
      '.sh-story-column > .sh-eyebrow:first-child',
      '.sh-story-en h2',
      '.sh-story-vi h2',
    ],
    body: [
      '.sh-story-en .sh-rule, .sh-story-en .sh-story-body',
      '.sh-story-vi .sh-rule, .sh-story-vi .sh-story-body',
    ],
    metadata: ['.sh-story-signoff, .sh-read-story, .sh-center-copy'],
  };
  const scene2Copy = Object.values(scene2Groups).flat();
  for (const reduced of [false, true]) {
    const level = (frame, keys) =>
      Math.max(...keys.map((key) => Number(frame[key].opacity)));
    let breath = 0;
    let longestBreath = 0;
    const firstVisible = {};
    for (let i = 0; i <= 600; i++) {
      const p = i / 1000;
      const frame = arrivalFrame(p, width, true, reduced);
      const one = level(frame, scene1Copy);
      const two = level(frame, scene2Copy);
      assert(
        !(one > 0 && two > 0),
        `p ${p}: Scene 1 and Scene 2 copy never share the frame`,
      );
      assert(
        !(
          level(frame, ['.sh-welcome-en h1', '.sh-welcome-title']) > 0 &&
          level(frame, scene2Groups.heading) > 0
        ),
        `p ${p}: the two headlines are never readable together`,
      );
      assert(
        !(
          Number(frame['.sh-portals'].opacity) > 0 &&
          Number(frame['[data-hero-layer="architecture-b"]'].opacity) > 0
        ),
        `p ${p}: portals never stack over the plate change`,
      );
      assert(
        !('opacity' in frame['[data-hero-layer="architecture-a"]']),
        'the architecture is present throughout (plate A never fades)',
      );
      for (const [group, keys] of Object.entries(scene2Groups))
        if (firstVisible[group] === undefined && level(frame, keys) > 0)
          firstVisible[group] = p;
      // Desktop/tablet: plate B is revealed through a centred aperture, never
      // blended full-frame over plate A, and is fully composed under any
      // Scene 2 copy. Phones and reduced motion: no moving edge, and the
      // dissolve happens entirely inside the copy-free breath.
      const plate = frame['[data-hero-layer="architecture-b"]'];
      const clip = plate['clip-path'];
      const edge =
        clip === 'none' ? 0 : Number(clip.match(/inset\(0 ([\d.]+)%/)[1]);
      const plateOpacity = Number(plate.opacity);
      if (reduced || width < 768) {
        assert.equal(clip, 'none', 'no moving edge on phones or reduced');
        if (plateOpacity > 0 && plateOpacity < 1)
          assert(
            one === 0 && two === 0,
            `p ${p}: the plates change inside the breath`,
          );
      } else {
        if (plateOpacity > 0 && plateOpacity < 1)
          assert(
            edge >= 32,
            `p ${p}: B only fades while the aperture is narrow`,
          );
        if (two > 0)
          assert(edge <= 6, `p ${p}: aperture edges clear the text columns`);
        if (i) {
          const before = arrivalFrame((i - 1) / 1000, width, true)[
            '[data-hero-layer="architecture-b"]'
          ]['clip-path'];
          const previous =
            before === 'none'
              ? 0
              : Number(before.match(/inset\(0 ([\d.]+)%/)[1]);
          assert(
            edge <= previous + 1e-9,
            `p ${p}: the aperture never closes going forward`,
          );
        }
      }
      breath = one === 0 && two === 0 && p > 0.1 && p < 0.42 ? breath + 1 : 0;
      longestBreath = Math.max(longestBreath, breath);
    }
    assert(
      longestBreath / 1000 >= (reduced ? 0.019 : 0.049),
      `a perceptible negative-space breath (${longestBreath / 1000})`,
    );
    assert(
      firstVisible.heading < firstVisible.body &&
        firstVisible.body < firstVisible.metadata,
      'Scene 2 enters by group: heading, body, metadata',
    );
    // Reverse scroll: identical frames on the way back, densely sampled.
    const dense = Array.from({ length: 121 }, (_, i) => 0.1 + i / 400);
    assert.deepEqual(
      dense.map((p) => arrivalFrame(p, width, true, reduced)),
      dense
        .toReversed()
        .map((p) => arrivalFrame(p, width, true, reduced))
        .reverse(),
      'reverse scroll reproduces every transition frame',
    );
    // The approved Scene 2 reading composition is unchanged.
    const depth = width < 768 ? 0.5 : width < 1200 ? 0.7 : 1;
    const settled = arrivalFrame(tpTiming.settle, width, true, reduced);
    for (const key of scene2Copy) {
      assert.equal(settled[key].opacity, '1.00000', `${key} fully revealed`);
      assert.equal(
        settled[key].transform,
        'translate3d(0.000px, 0.000px, 0) scale(1.000000)',
        `${key} at rest`,
      );
    }
    for (const key of [...scene1Copy, '.sh-discovery'])
      assert.equal(settled[key].opacity, '0.00000', `${key} gone`);
    assert.equal(
      settled['.sh-portals'].transform,
      reduced
        ? 'translate3d(0.000px, 0.000px, 0) scale(1.000000)'
        : `translate3d(0.000px, ${(12 * depth).toFixed(3)}px, 0) scale(0.982000)`,
    );
    assert.deepEqual(
      { ...settled['[data-hero-layer="architecture-b"]'] },
      {
        opacity: '1.00000',
        'clip-path': 'none',
        transform: 'translate3d(0.000px, 0.000px, 0) scale(1.000000)',
      },
      'Scene 2 plate at rest',
    );
  }
  const frame = arrivalFrame(0.335, width, true);
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
