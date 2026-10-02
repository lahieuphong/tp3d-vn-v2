/** Spatial and accessibility invariants; screenshot/performance QA is separate. */
import assert from 'node:assert/strict';
import { loadStoryMath } from './load-story-math.mjs';
const { bridgeTiming, measureAtrium, bridgeFrame, atriumPose, worldReveal } =
  loadStoryMath('atmospheric-bridge-frame');
const { motionProfile } = loadStoryMath('home-motion');
const { arrivalFrame, tpPose } = loadStoryMath('home-story-frame');
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
const close = (a, b, label) =>
  assert(Math.abs(a - b) < 1e-8, `${label}: ${a} != ${b}`);
const positions = Array.from({ length: 1001 }, (_, i) => i / 1000);
for (const [width, height] of sizes) {
  const geometry = measureAtrium(width, height);
  const cover = Math.max(width / 1672, height / 941);
  const imageLeft = (width - 1672 * cover) * (width < 768 ? 0.51 : 0.5);
  close(
    geometry.originX,
    imageLeft + 836 * cover,
    'real skylight horizontal centre',
  );
  close(geometry.originY, 110 * cover, 'real skylight vertical centre');
  close(
    geometry.originX + geometry.skyX,
    width / 2,
    'sky is centred horizontally',
  );
  close(
    geometry.originY + geometry.skyY,
    height / 2,
    'sky is centred vertically',
  );
  const sourceHeight = height / (geometry.skyScale * cover);
  assert(
    sourceHeight >= 159.99 && sourceHeight <= 176.01,
    'sky crop stays inside audited source bounds',
  );
  assert(
    geometry.skyScale > 5 && geometry.skyScale < 6.1,
    'actual source requires more than conceptual1.2× framing',
  );

  for (const reduced of [false, true]) {
    for (const p of positions.filter((p) => p <= bridgeTiming.exitStart)) {
      const state = bridgeFrame(p, width, reduced);
      assert.equal(
        state.textOpacity,
        1,
        'PASS2 content remains unchanged through0.48',
      );
      close(state.textY, 0, 'no content departure before bridge');
      assert.equal(state.tpScale, 1);
      close(state.tpY, 0, 'no TP departure before bridge');
      assert.equal(
        state.tpOpacity,
        1,
        'persistent TP is not faded before bridge',
      );
      assert.equal(state.architectureScale, 1);
      close(state.architectureY, 0, 'no architecture departure before bridge');
      assert.equal(state.scene2Opacity, 1);
      assert.equal(state.scene2Visible, true);
      assert.equal(state.scene3Visible, false);
    }
    const signature = (p) =>
      JSON.stringify([
        bridgeFrame(p, width, reduced),
        atriumPose(p, geometry, reduced),
        Array.from({ length: 10 }, (_, i) => worldReveal(p, i, reduced)),
      ]);
    const stops = [
      0, 0.47, 0.48, 0.55, 0.6, 0.6399, 0.64, 0.65, 0.7, 0.745, 0.75, 0.82, 0.9,
      0.92, 1,
    ];
    assert.deepEqual(
      stops.map(signature),
      stops.toReversed().map(signature).reverse(),
      'forward/reverse and stopped frames use the same progress mapping',
    );
    let previous = Infinity;
    for (const p of positions) {
      const state = bridgeFrame(p, width, reduced),
        pose = atriumPose(p, geometry, reduced);
      for (const value of [...Object.values(state), ...Object.values(pose)])
        if (typeof value === 'number') assert(Number.isFinite(value));
      if (!reduced)
        assert.notEqual(
          state.scene2Visible,
          state.scene3Visible,
          'readable architecture is exclusive; no Scene2/3 crossfade',
        );
      else {
        const scene2Alpha = state.scene2Visible ? state.scene2Opacity : 0;
        const scene3Alpha = state.scene3Visible ? state.worldOpacity : 0;
        const plateAlpha = 1 - (1 - scene2Alpha) * (1 - scene3Alpha);
        assert(
          plateAlpha >= 0.65 - 1e-9,
          'reduced transitions always retain a visible architectural plate',
        );
      }
      assert(
        pose.scale >= 1 - 1e-9 && pose.scale <= geometry.skyScale + 1e-9,
        'camera never overshoots its approved framings',
      );
      assert(pose.scale <= previous + 1e-9, 'pullback is monotonic');
      previous = pose.scale;
      // Transform the full camera box. Coverage must never expose its parent.
      const left = pose.x + pose.originX * (1 - pose.scale),
        top = pose.y + pose.originY * (1 - pose.scale);
      assert(left <= 1e-7 && top <= 1e-7, 'no exposed left/top camera edge');
      assert(
        left + width * pose.scale >= width - 1e-7 &&
          top + height * pose.scale >= height - 1e-7,
        'no exposed right/bottom camera edge',
      );
      for (let order = 0; order < 10; order++) {
        const reveal = worldReveal(p, order, reduced);
        assert(reveal.opacity >= 0 && reveal.opacity <= 1);
        if (p < 0.8)
          assert.equal(reveal.opacity, 0, 'no title/labels/CTA in sky hold');
        if (reveal.interactive) {
          assert(p >= 0.9, 'controls cannot become active before settlement');
          assert(
            reveal.opacity >= 0.999,
            'individual control must be meaningfully visible',
          );
        }
        if (reduced) assert.equal(reveal.y, 0, 'reduced UI does not travel');
      }
    }
    for (const p of [0.92, 0.95, 1]) {
      const pose = atriumPose(p, geometry, reduced);
      close(pose.scale, 1, 'approved final atrium scale');
      close(pose.x, 0, 'approved final atrium x');
      close(pose.y, 0, 'approved final atrium y');
      assert.equal(pose.moving, false);
      for (let order = 0; order < 10; order++)
        assert.equal(worldReveal(p, order, reduced).opacity, 1);
      assert.equal(bridgeFrame(p, width, reduced).tpOpacity, 0);
    }
    assert.equal(
      signature(0.92),
      signature(1),
      'final hold is completely still',
    );
    if (reduced) {
      const cut = bridgeFrame(0.745, width, true);
      assert.equal(cut.scene2Visible, false);
      assert.equal(cut.scene3Visible, true);
      assert(
        cut.worldOpacity >= 0.65,
        'exact reduced framing cut cannot become an empty zero-opacity frame',
      );
      assert.equal(cut.textOpacity, 0);
      assert.equal(cut.tpOpacity, 0);
      close(
        atriumPose(0.745, geometry, true).scale,
        1,
        'reduced framing cut lands directly on static final architecture',
      );
      assert.deepEqual(
        atriumPose(0.65, geometry, true),
        atriumPose(0.72, geometry, true),
        'reduced sky uses a static crop',
      );
      assert.deepEqual(
        atriumPose(0.76, geometry, true),
        atriumPose(0.92, geometry, true),
        'reduced final camera has no animated zoom',
      );
    } else {
      const start = motionProfile(width).cameraStart;
      assert.deepEqual(
        atriumPose(0.64, geometry),
        atriumPose(start, geometry),
        'sky gets a real reading pause',
      );
      const change = (a, b) =>
        atriumPose(a, geometry).scale - atriumPose(b, geometry).scale;
      assert(
        change(start, start + 0.01) < change(start + 0.07, start + 0.08),
        'slow camera departure',
      );
      assert(
        change(0.89, 0.9) < change(start + 0.07, start + 0.08),
        'long camera arrival',
      );
    }
  }
  assert(
    bridgeFrame(0.55, width).tpScale < 1 &&
      bridgeFrame(0.55, width).tpOpacity > 0.8,
    'TP first recedes with restrained opacity loss',
  );
  assert.equal(bridgeFrame(0.64, width).scene2Visible, false);
  assert.equal(bridgeFrame(0.65, width).textOpacity, 0);
  assert.equal(bridgeFrame(0.65, width).tpOpacity, 0);
  assert.equal(
    worldReveal(0.905, 9).interactive,
    false,
    'CTA stays inert while its own late reveal is incomplete',
  );
  assert.equal(worldReveal(0.92, 9).interactive, true);
  const target = {
    x: 0,
    y: height * 0.13,
    scale: 0.86,
    width: width * 0.258,
    height: height * 0.49,
    opacity: 1,
  };
  assert.deepEqual(
    tpPose(0.42, target),
    tpPose(0.48, target),
    'PASS2 anchor endpoint remains intact',
  );
  assert.deepEqual(
    arrivalFrame(0.42, width, true),
    arrivalFrame(0.48, width, true),
    'PASS2 settled manifesto remains intact',
  );
}
assert(
  bridgeTiming.swap > bridgeTiming.occlusionStart &&
    bridgeTiming.swap < bridgeTiming.breezeEnd,
  'world swap belongs inside shared Breeze occlusion interval',
);
console.log(
  'Atmospheric bridge passed:12 viewports, preserved PASS2 hold, exclusive architecture, audited sky origin/coverage, reversible camera/UI, per-control focus gates, reduced static framings and final stillness.',
);
