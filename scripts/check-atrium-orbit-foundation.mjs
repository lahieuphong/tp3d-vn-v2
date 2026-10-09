/** TP3D PASS 6A — the dormant Tier B room orbit foundation. Checked here:
 * the canonical model, the camera JSON contract and its validation, the
 * signed-angle weighting, the hold / move timeline and its stateless
 * sampler, the preload plan, the asset manifest, the transition contract,
 * and the source rules (no scroll owner, RAF, timer or invented asset).
 * PASS 6A.5 locks: Arrival has no public UI (no counter, no "Arrival"),
 * Living is the first public room state, exactly four public rooms, the
 * runtime format is WebP only, base story and room orbit progress are
 * separate 0 → 1 domains, and the orbit-mode UI exists only behind the gate.
 * PASS 6A.75 (interaction harness) locks: Arrival also hides the four room
 * labels; ENTER THE WORLD (the existing WorldGatewayLink, never duplicated,
 * still /world) returns only in late Kitchen; room previews stay inside the
 * small indicator, never orbiting portals; no camera data, no pan / zoom /
 * rotation of the Atrium photograph; WebP-only documented consistently.
 * PASS 6A.96 (live harness QA) locks: the approved Atrium stays in view for
 * the whole harness (the copy's exposure shade follows the editorial UI, so
 * Arrival and the release never show an empty shaded field); a final,
 * scroll-driven release clears the editorial UI and the gateway before the
 * sticky stage leaves for the Footer, and rebuilds them in reverse; the
 * engineering readout exists only on explicit request. The real controller
 * runs here in a small owned DOM double.
 * PASS 6B.0 (the orbit on comp plates) locks: every desktop view is a comp
 * plate named and sized like the approved Atrium plate, with nothing else in
 * public/ and no studio plate claimed; the camera pushes in from the wide
 * Atrium and then pans from doorway to doorway, two plates joined on the pier
 * they share; the stage is covered at every position on every screen; the
 * same position draws the same frame in either direction; reduced motion
 * only changes plates; the approved Atrium itself is never moved; the longer
 * orbit span exists in the preview alone. How the orbit looks is judged in
 * the browser, not here.
 * PASS 6B.1 locks: no plate is ever promoted to its own texture (it would
 * snap softer and sharper as each move begins and ends).
 * The timeline hook itself is checked in check-atrium-orbit. Nothing here
 * can validate how the future orbit looks: the render plates do not exist.
 * Generated camera rigs below are random test data, never product values. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import sharp from 'sharp';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';
import {
  DELIVERY_ROOT,
  PHASES,
  RIG_NAME,
  expectedPlates,
  formatReport,
  inspectDelivery,
  inspectRoot,
  statusOf,
} from './check-atrium-orbit-assets.mjs';

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));
const EXPERIENCE = 'components/home/experience/';
// Values from the vm realm compare by JSON (cross-realm prototypes differ).
const json = (value) =>
  JSON.stringify(value, (_, v) =>
    typeof v === 'number' ? Number(v.toFixed(9)) : v,
  );
const same = (a, b, message) => assert.equal(json(a), json(b), message);
const near = (a, b, message, epsilon = 1e-9) =>
  assert.ok(Math.abs(a - b) <= epsilon, `${message}: ${a} vs ${b}`);
// A seeded generator: reproducible arbitrary data.
let seed = 0x6a2b7;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};
const between = (low, high) => low + (high - low) * random();

const model = loadStoryMath('atrium-orbit-model');
const cameras = loadStoryMath('atrium-orbit-cameras');
const progress = loadStoryMath('atrium-orbit-progress');
const manifest = loadStoryMath('atrium-orbit-manifest');
const transition = loadStoryMath('atrium-orbit-transition');
const doorways = loadStoryMath('atrium-orbit-doors');
const { HOME_PRODUCTION } = loadStoryMath('home-production');

const STATES = ['arrival', 'living', 'bedroom', 'bathroom', 'kitchen'];
const ROOMS = STATES.slice(1);

// ---------------------------------------------------------------------------
// 1. The canonical model. Arrival is transitional: no public count.
// ---------------------------------------------------------------------------
{
  same(model.ATRIUM_ORBIT_STATES, STATES, 'locked order');
  same(model.ATRIUM_ROOMS, ROOMS, 'four editorial destinations');
  same(
    model.ATRIUM_ORBIT_TRANSITIONS,
    STATES.slice(1).map((to, i) => ({ from: STATES[i], to })),
    'one clockwise chain, Arrival → Living first',
  );
  assert.equal(model.ATRIUM_ORBIT_TITLE_LEAD, 'Enter');
  const arrival = model.atriumOrbitState('arrival');
  same(arrival, { id: 'arrival', index: 0, room: null, editorial: null });
  ROOMS.forEach((id, i) => {
    const state = model.atriumOrbitState(id);
    assert.equal(state.index, i + 1);
    assert.equal(state.room, id);
    same(state.editorial, {
      number: i + 1,
      counter: `0${i + 1} / 04`,
      label: id[0].toUpperCase() + id.slice(1),
      phrase: `the ${id === 'living' ? 'living room' : id}.`,
    });
  });
  const counters = STATES.map(
    (id) => model.atriumOrbitState(id).editorial?.counter ?? null,
  );
  assert.ok(!counters.some((c) => c && /0?0 \/|\/ 05/.test(c)));
  // PASS 6A.5: exactly four public rooms; Arrival has no public UI at all.
  const publicStates = STATES.filter(
    (id) => model.atriumOrbitState(id).editorial !== null,
  );
  same(publicStates, ROOMS, 'exactly four public rooms');
  same(
    publicStates.map((id) => model.atriumOrbitState(id).editorial.counter),
    ['01 / 04', '02 / 04', '03 / 04', '04 / 04'],
  );
  assert.ok(
    !publicStates.some((id) =>
      /arrival/i.test(json(model.atriumOrbitState(id).editorial)),
    ),
    'no ARRIVAL in public UI',
  );
  same(model.atriumOrbitNeighbours('arrival'), {
    previous: null,
    next: 'living',
  });
  same(model.atriumOrbitNeighbours('kitchen'), {
    previous: 'bathroom',
    next: null,
  });
}

// ---------------------------------------------------------------------------
// 2. The camera JSON contract (spec §6) and its validation.
// ---------------------------------------------------------------------------
/** A random, internally consistent rig (test data only). */
function rig({ sign = random() < 0.5 ? -1 : 1, portraits = true } = {}) {
  const deltas = model.ATRIUM_ORBIT_TRANSITIONS.map(
    () => sign * between(4, 70),
  );
  const start = between(-180, 180);
  const angles = [start];
  for (const d of deltas) angles.push(angles.at(-1) + d);
  // The spec's rig: one 32 mm lens, room cameras on one radius (Arrival may
  // stand further back), portrait cameras at their desktop camera.
  const roomRadius = between(2, 6);
  const camera = (id, angle) => ({
    id,
    angleDeg: ((angle + 540) % 360) - 180,
    radius: id === 'arrival' ? roomRadius * between(1, 1.4) : roomRadius,
    position: [between(-5, 5), between(1.55, 1.65), between(-5, 5)],
    target: [between(-5, 5), between(1, 2), between(-5, 5)],
    eyeHeight: between(1.56, 1.64),
    focalLengthMm: 32,
    sensor: { widthMm: 36, heightMm: 20.25, fit: 'horizontal' },
    hFovDeg: 58.7,
    vFovDeg: 35,
    lensShift: { x: 0, y: between(-0.1, 0.1) },
    rollDeg: 0,
    resolution: [3344, 1882],
    aspect: 3344 / 1882,
  });
  const desktops = STATES.map((id, i) => camera(id, angles[i]));
  const entries = STATES.map((id, i) => [id, desktops[i]]);
  if (portraits)
    STATES.forEach((id, i) => {
      const desktop = desktops[i];
      entries.push([
        `${id}-portrait`,
        {
          ...desktop,
          id: `${id}-portrait`,
          position: [...desktop.position],
          target: [...desktop.target],
          sensor: { widthMm: 20.25, heightMm: 36, fit: 'vertical' },
          hFovDeg: 29,
          vFovDeg: 58.7,
          lensShift: { x: 0, y: between(0.05, 0.2) },
          resolution: [1290, 2796],
          aspect: 1290 / 2796,
        },
      ]);
    });
  return {
    scene: {
      file: 'test.blend',
      revision: 'r1',
      renderer: 'test',
      rendererVersion: '0',
    },
    conventions: {
      units: 'm',
      upAxis: 'Y',
      handedness: 'right',
      angleZero: '+X',
      angleDirection: 'clockwise from above',
    },
    orbitCentre: [0, 0, 0],
    colourPipeline: {
      workingSpace: 'ACEScg',
      viewTransform: 'AgX',
      look: 'none',
      output: 'sRGB',
    },
    cameras: Object.fromEntries(entries),
    steps: model.ATRIUM_ORBIT_TRANSITIONS.map(({ from, to }, i) => ({
      from,
      to,
      deltaAngleDeg: deltas[i],
    })),
  };
}
const clone = (value) => JSON.parse(JSON.stringify(value));
{
  const { validateAtriumOrbitCameras: validate, angleDifference } = cameras;
  assert.equal(validate(null).status, 'missing');
  assert.equal(validate(undefined).status, 'missing');
  // angleDifference: signed, smallest, wrapped into (−180, 180].
  for (let i = 0; i < 400; i++) {
    const a = between(-720, 720),
      d = between(-179.9, 179.9);
    near(angleDifference(a, a + d), d, 'signed difference', 1e-7);
    near(
      angleDifference(a, a + d + 360 * Math.round(between(-2, 2))),
      d,
      'wrap',
      1e-7,
    );
  }
  assert.equal(angleDifference(0, 180), 180);
  assert.equal(angleDifference(0, -180), 180);
  // Arbitrary valid rigs, both rotation senses.
  for (let i = 0; i < 200; i++) {
    const data = rig();
    const result = validate(data);
    assert.equal(result.status, 'valid', json(result));
    same(
      result.stepAngles,
      data.steps.map((s) => s.deltaAngleDeg),
      'step angles in order',
    );
    same(result.warnings, [], 'a consistent rig has no warnings');
  }
  const invalid = (mutate, pattern) => {
    const data = rig();
    mutate(data);
    const result = validate(data);
    assert.equal(result.status, 'invalid', `${pattern}: ${json(result)}`);
    assert.ok(
      result.errors.some((e) => pattern.test(e)),
      `${pattern} in ${json(result.errors)}`,
    );
  };
  for (const id of STATES)
    invalid((d) => delete d.cameras[id], new RegExp(`"${id}" is missing`));
  invalid((d) => (d.cameras.living.id = 'bedroom'), /"id"/);
  invalid((d) => (d.cameras.kitchen.position = [0, 1]), /"position"/);
  invalid((d) => (d.cameras.bedroom.lensShift = { x: 0 }), /"lensShift"/);
  invalid((d) => (d.cameras.arrival.angleDeg = Number.NaN), /"angleDeg"/);
  invalid((d) => d.steps.pop(), /"steps" must list the 4/);
  invalid((d) => d.steps.reverse(), /step 1 must be arrival → living/);
  invalid(
    (d) => (d.steps[2].deltaAngleDeg *= -1),
    /change sign: the orbit must rotate one way/,
  );
  invalid((d) => (d.steps[1].deltaAngleDeg = 0), /non-zero deltaAngleDeg/);
  invalid(
    (d) => (d.cameras.bathroom.focalLengthMm += 4),
    /room cameras must share one focal length/,
  );
  invalid((d) => delete d.scene.revision, /"scene" needs/);
  invalid((d) => (d.orbitCentre = null), /"orbitCentre"/);
  // Warnings: humans decide (documented exceptions, tolerances).
  const warns = (mutate, pattern) => {
    const data = rig();
    mutate(data);
    const result = validate(data);
    assert.equal(result.status, 'valid', json(result));
    assert.ok(
      result.warnings.some((w) => pattern.test(w)),
      `${pattern} in ${json(result.warnings)}`,
    );
  };
  warns(
    (d) => (d.cameras.arrival.focalLengthMm += 6),
    /Arrival uses .* documented, approved exception/,
  );
  warns((d) => (d.cameras.living.eyeHeight = 1.7), /eye height/);
  warns((d) => (d.cameras.kitchen.rollDeg = 0.5), /roll/);
  warns((d) => (d.steps[0].deltaAngleDeg *= 1.5), /disagrees with the cameras/);
  warns((d) => (d.colourPipeline.output = 'Display P3'), /sRGB/);
  // PASS 6A.9 intake rules, from the spec: one 32 mm full-frame-equivalent
  // lens, one room radius, portrait cameras at their desktop camera.
  warns((d) => {
    for (const id of ROOMS)
      for (const key of [id, `${id}-portrait`])
        d.cameras[key].focalLengthMm = 35;
  }, /living is ≈ 35\.0 mm full-frame equivalent .* the spec locks 32 mm/);
  warns(
    (d) =>
      (d.cameras.kitchen.sensor = {
        widthMm: 24,
        heightMm: 13.5,
        fit: 'horizontal',
      }),
    /kitchen is ≈ 48\.0 mm full-frame equivalent/,
  );
  warns(
    (d) => (d.cameras.bathroom.radius *= 1.2),
    /room cameras do not share one orbit radius/,
  );
  warns(
    (d) => (d.cameras['bedroom-portrait'].target[0] += 0.5),
    /bedroom-portrait differs from bedroom in target: .* delivery notes/,
  );
  {
    // An approved Arrival lens exception is reported once, not twice.
    const data = rig();
    data.cameras.arrival.focalLengthMm = 28;
    data.cameras['arrival-portrait'].focalLengthMm = 28;
    const result = validate(data);
    assert.equal(result.status, 'valid');
    assert.equal(
      result.warnings.filter((w) => /arrival/i.test(w)).length,
      1,
      json(result.warnings),
    );
  }
  // A larger Arrival radius is allowed (spec §2.4): no warning.
  assert.equal(cameras.ATRIUM_ORBIT_CAMERA_RULES.lensMm, 32);
  {
    const result = validate(rig({ portraits: false }));
    assert.equal(result.status, 'valid');
    assert.equal(result.warnings.length, 5, 'five missing portrait cameras');
  }
  // Garbage never throws (development assets may be absent or broken).
  const junk = [0, 'x', [], true, {}, { cameras: [] }, { steps: {} }];
  for (let i = 0; i < 300; i++) {
    const data = rig();
    const keys = Object.keys(data);
    data[keys[Math.floor(random() * keys.length)]] =
      junk[Math.floor(random() * junk.length)];
    junk.push(clone(data));
  }
  for (const value of junk)
    assert.doesNotThrow(() => validate(value), 'validation never throws');
}

// ---------------------------------------------------------------------------
// 3. Signed-angle weighting: arbitrary data, never example values.
// ---------------------------------------------------------------------------
{
  const { angleWeights } = progress;
  same(angleWeights([]), []);
  same(angleWeights([0, 0, 0, 0]), [0.25, 0.25, 0.25, 0.25], 'nothing known');
  for (let i = 0; i < 500; i++) {
    const count = 1 + Math.floor(random() * 6);
    const sign = random() < 0.5 ? -1 : 1;
    const deltas = Array.from({ length: count }, () => sign * between(0.5, 90));
    const total = deltas.reduce((a, d) => a + Math.abs(d), 0);
    const plain = angleWeights(deltas);
    near(
      plain.reduce((a, b) => a + b, 0),
      1,
      'weights sum to 1',
      1e-12,
    );
    plain.forEach((w, j) =>
      near(w, Math.abs(deltas[j]) / total, 'weight ∝ |Δ|', 1e-12),
    );
    same(angleWeights(deltas.map((d) => -d)), plain, 'direction-agnostic');
    const floor = between(0, 1 / count);
    const floored = angleWeights(deltas, floor);
    near(
      floored.reduce((a, b) => a + b, 0),
      1,
      'floored sum',
      1e-9,
    );
    assert.ok(
      floored.every((w) => w >= floor - 1e-12),
      'floor respected',
    );
    // A larger physical angle never gets a shorter move.
    for (let a = 0; a < count; a++)
      for (let b = 0; b < count; b++)
        if (Math.abs(deltas[a]) > Math.abs(deltas[b]))
          assert.ok(floored[a] >= floored[b] - 1e-12, 'order preserved');
  }
}

// ---------------------------------------------------------------------------
// 4. Holds and moves are weighted separately; the timeline is contiguous.
// ---------------------------------------------------------------------------
const { ATRIUM_ORBIT_TIMING: TIMING, ATRIUM_ORBIT_TIMING_REDUCED: REDUCED } =
  progress;
{
  const { buildOrbitTimeline } = progress;
  assert.ok(TIMING.holds.arrival < TIMING.holds.room, 'Arrival is shorter');
  assert.ok(TIMING.holds.kitchen > TIMING.holds.room, 'Kitchen holds longer');
  assert.equal(REDUCED.movement, 0, 'reduced motion plays no camera move');
  const kinds = (t) =>
    t.segments.map((s) =>
      s.kind === 'hold'
        ? s.state
        : s.kind === 'release'
          ? `release:${s.state}`
          : `${s.from}>${s.to}`,
    );
  const states = STATES.flatMap((id, i) =>
    i < 4 ? [id, `${id}>${STATES[i + 1]}`] : [id],
  );
  // PASS 6A.96: the span ends with the release; Kitchen stays the room.
  const expected = [...states, 'release:kitchen'];
  const contiguous = (t) => {
    assert.equal(t.segments[0].start, 0);
    assert.equal(t.segments.at(-1).end, 1);
    t.segments.forEach((s, i) => {
      assert.ok(s.end >= s.start);
      if (i) assert.equal(s.start, t.segments[i - 1].end);
    });
  };
  const provisional = buildOrbitTimeline(TIMING, null);
  same(kinds(provisional), expected, 'hold, move, … , Kitchen hold, release');
  assert.equal(provisional.weighting, 'provisional-equal');
  contiguous(provisional);
  // The release is small and comes after the useful final state: Kitchen
  // keeps the longest hold and stays longer than the release. Without a
  // release weight the timeline is the five states alone.
  {
    const length = (s) => s.end - s.start;
    const hold = (id) =>
      provisional.segments.find((s) => s.kind === 'hold' && s.state === id);
    const release = provisional.segments.at(-1);
    assert.ok(TIMING.release.weight > 0, 'a release exists');
    assert.ok(length(release) > 0.05 && length(release) < 0.15, 'small');
    assert.ok(length(hold('kitchen')) > length(release), 'Kitchen outlasts it');
    for (const id of ROOMS.slice(0, 3))
      assert.ok(length(hold('kitchen')) > length(hold(id)), 'longest hold');
    // Kitchen is not shortened to make room: every hold and move keeps its
    // share of what the release leaves.
    const bare = buildOrbitTimeline(
      { ...TIMING, release: { ...TIMING.release, weight: 0 } },
      null,
    );
    same(kinds(bare), states, 'no release weight: the five states alone');
    contiguous(bare);
    const kept = 1 - length(release);
    provisional.segments
      .slice(0, -1)
      .forEach((s, i) =>
        near(length(s), length(bare.segments[i]) * kept, 'same proportions'),
      );
    assert.ok(length(hold('kitchen')) > 0.85 * length(bare.segments.at(-1)));
  }
  const moves = (t) =>
    t.segments.filter((s) => s.kind === 'move').map((s) => s.end - s.start);
  const holds = (t) =>
    t.segments.filter((s) => s.kind === 'hold').map((s) => s.end - s.start);
  moves(provisional).forEach((m) => near(m, moves(provisional)[0], 'equal'));
  for (let i = 0; i < 200; i++) {
    const deltas = cameras.validateAtriumOrbitCameras(rig()).stepAngles;
    const real = buildOrbitTimeline(TIMING, deltas);
    assert.equal(real.weighting, 'camera-angles');
    same(kinds(real), expected);
    contiguous(real);
    // Moves follow the angles; holds never change with the angles.
    const weights = progress.angleWeights(deltas, TIMING.minMoveShare);
    const movesTotal = moves(real).reduce((a, b) => a + b, 0);
    moves(real).forEach((m, j) =>
      near(m / movesTotal, weights[j], 'move ∝ angle weight', 1e-9),
    );
    same(holds(real), holds(provisional), 'holds are independent of angles');
  }
  const reduced = buildOrbitTimeline(REDUCED, null);
  contiguous(reduced);
  assert.ok(
    moves(reduced).every((m) => m === 0),
    'plain changes',
  );
  same(kinds(reduced), expected);
  // A wrong-length angle list is not trusted.
  assert.equal(
    buildOrbitTimeline(TIMING, [10, 20]).weighting,
    'provisional-equal',
  );
}

// ---------------------------------------------------------------------------
// 5. The stateless sampler: forward, reverse and landing mid-orbit agree.
// ---------------------------------------------------------------------------
{
  const { buildOrbitTimeline, sampleOrbit } = progress;
  for (const angles of [
    null,
    cameras.validateAtriumOrbitCameras(rig()).stepAngles,
  ]) {
    const t = buildOrbitTimeline(TIMING, angles);
    for (const s of t.segments) {
      const mid = sampleOrbit((s.start + s.end) / 2, t);
      assert.equal(mid.phase, s.kind);
      if (s.kind !== 'release') assert.equal(mid.releaseProgress, 0);
      if (s.kind === 'hold') {
        assert.equal(mid.activeState, s.state);
        assert.equal(mid.transitionFrom, null);
        near(mid.holdProgress, 0.5, 'hold progress', 1e-9);
      } else if (s.kind === 'release') {
        // The release adds no state: Kitchen is still the active room.
        assert.equal(mid.activeState, 'kitchen');
        assert.equal(mid.transitionFrom, null);
        assert.equal(mid.transitionIndex, null);
        assert.equal(mid.holdProgress, 0);
        near(mid.releaseProgress, 0.5, 'release progress', 1e-9);
      } else {
        assert.equal(mid.transitionFrom, s.from);
        assert.equal(mid.transitionTo, s.to);
        assert.equal(mid.transitionIndex, s.transition);
        near(mid.localTransitionProgress, 0.5, 'local progress', 1e-9);
        const at = (local) =>
          sampleOrbit(s.start + local * (s.end - s.start), t).activeState;
        assert.equal(at(TIMING.uiSwitchAt * 0.98), s.from);
        assert.equal(
          at(TIMING.uiSwitchAt + (1 - TIMING.uiSwitchAt) * 0.02),
          s.to,
        );
      }
      const { previous, next } = model.atriumOrbitNeighbours(mid.activeState);
      assert.equal(mid.previousState, previous);
      assert.equal(mid.nextState, next);
    }
    const positions = Array.from({ length: 401 }, (_, i) => i / 400);
    const forward = positions.map((p) => sampleOrbit(p, t));
    const reverse = [...positions].reverse().map((p) => sampleOrbit(p, t));
    same(forward, reverse.reverse(), 'reverse scrolling = same states');
    // Landing anywhere (reload, back/forward) needs no history.
    for (let i = 0; i < 100; i++) {
      const p = random();
      const first = sampleOrbit(p, t);
      sampleOrbit(random(), t);
      same(sampleOrbit(p, t), first, 'no hidden state');
    }
    // The UI order is monotonic: forward never skips or revisits a room.
    const order = forward.map((s) => STATES.indexOf(s.activeState));
    assert.ok(
      order.every((v, i) => !i || v === order[i - 1] || v === order[i - 1] + 1),
    );
    same([...new Set(order)], [0, 1, 2, 3, 4], 'every state is shown');
    assert.equal(forward[0].activeState, 'arrival');
    assert.equal(forward.at(-1).activeState, 'kitchen');
    // PASS 6A.5: Living is the first editorial destination.
    const firstPublic = forward.find(
      (s) => model.atriumOrbitState(s.activeState).editorial !== null,
    );
    assert.equal(firstPublic.activeState, 'living');
    assert.equal(
      model.atriumOrbitState(firstPublic.activeState).editorial.counter,
      '01 / 04',
    );
    // The sample stays in its own 0 → 1 domain.
    assert.ok(
      forward.every(
        (s) => s.roomOrbitProgress >= 0 && s.roomOrbitProgress <= 1,
      ),
    );
  }
  const t = buildOrbitTimeline(TIMING, null);
  for (const p of [-1, 2, Number.NaN, Infinity])
    assert.doesNotThrow(() => sampleOrbit(p, t));
  assert.equal(sampleOrbit(Number.NaN, t).activeState, 'arrival');
  assert.equal(sampleOrbit(5, t).activeState, 'kitchen');
  assert.equal(sampleOrbit(5, t).roomOrbitProgress, 1, 'never past 1');
  assert.equal(sampleOrbit(-3, t).roomOrbitProgress, 0);
}

// ---------------------------------------------------------------------------
// 5b. PASS 6A.75: the existing World gateway returns only in the later part
// of the Kitchen hold, eased by roomOrbitProgress, from the same shown state.
// ---------------------------------------------------------------------------
{
  const { buildOrbitTimeline, sampleOrbit, atriumGateway } = progress;
  const G = TIMING.gateway;
  assert.ok(G.revealFrom > 0 && G.revealFrom < G.revealTo && G.revealTo <= 1);
  assert.ok(G.interactiveAt > 0 && G.interactiveAt <= 1);
  assert.ok(G.handoff > 0 && G.handoff < 1);
  for (const timing of [TIMING, REDUCED]) {
    const t = buildOrbitTimeline(timing, null);
    // PASS 6A.96: the Kitchen hold is followed by the release only.
    const kitchen = t.segments.at(-2);
    const release = t.segments.at(-1);
    assert.equal(kitchen.kind, 'hold');
    assert.equal(kitchen.state, 'kitchen');
    assert.equal(release.kind, 'release');
    const positions = Array.from({ length: 4001 }, (_, i) => i / 4000);
    const frames = positions.map((p) => {
      const sample = sampleOrbit(p, t, timing);
      return {
        p,
        sample,
        ...atriumGateway(sample, sample.activeState, timing),
      };
    });
    for (const f of frames) {
      const local = (f.p - kitchen.start) / (kitchen.end - kitchen.start);
      if (f.p < kitchen.start || local < G.revealFrom)
        assert.equal(f.reveal, 0, `no gateway at ${f.p}`);
      if (local >= G.revealTo && f.p < release.start) assert.equal(f.reveal, 1);
      assert.equal(f.interactive, f.reveal >= G.interactiveAt);
    }
    const untilRelease = frames.filter((f) => f.p < release.start);
    assert.ok(
      untilRelease.every((f, i) => !i || f.reveal >= frames[i - 1].reveal),
      'the reveal only grows forward (and shrinks in reverse)',
    );
    // The useful final state, before the release: the gateway owns zone I.
    const whole = untilRelease.at(-1);
    same(
      [whole.reveal, whole.indicator, whole.interactive],
      [1, 0, true],
      'Kitchen with the whole gateway: the gateway owns zone I',
    );
    // PASS 6A.96: it then settles out; the indicator does not come back.
    const releasing = frames.filter((f) => f.p >= release.start);
    assert.ok(releasing.every((f) => f.indicator === 0));
    assert.ok(
      releasing.every((f, i) => !i || f.reveal <= releasing[i - 1].reveal),
      'the gateway only leaves in the release',
    );
    const end = frames.at(-1);
    same(
      [end.reveal, end.indicator, end.interactive],
      [0, 0, false],
      'the final frame is quiet: no gateway, no indicator',
    );
    // Zone I hand-off: the indicator leaves before the gateway enters; the
    // two never show at once, and the indicator is whole before the window.
    assert.ok(frames.every((f) => f.reveal === 0 || f.indicator === 0));
    for (const f of frames) {
      const local = (f.p - kitchen.start) / (kitchen.end - kitchen.start);
      if (f.p < kitchen.start || local <= G.revealFrom)
        assert.equal(f.indicator, 1, `indicator whole at ${f.p}`);
    }
    assert.ok(
      frames.every(
        (f, i) => !i || Math.abs(f.indicator - frames[i - 1].indicator) < 0.05,
      ),
      'the indicator eases out',
    );
    // A restrained reveal, never a pop: intermediate values and small steps.
    assert.ok(frames.filter((f) => f.reveal > 0 && f.reveal < 1).length >= 20);
    assert.ok(
      frames.every(
        (f, i) => !i || Math.abs(f.reveal - frames[i - 1].reveal) < 0.05,
      ),
      'the gateway eases in',
    );
    // Kitchen is readable alone first: a real share of its hold shows no
    // gateway at all.
    const alone = frames.filter(
      (f) => f.sample.activeState === 'kitchen' && f.reveal === 0,
    ).length;
    assert.ok(
      alone >=
        0.4 * frames.filter((f) => f.sample.activeState === 'kitchen').length,
    );
    // One authority: while the UI still shows another room (an undecoded
    // Kitchen plate), the gateway does not return.
    const settled = sampleOrbit(release.start - 1e-6, t, timing);
    assert.equal(atriumGateway(settled, 'bathroom', timing).reveal, 0);
    assert.equal(atriumGateway(settled, 'kitchen', timing).reveal, 1);
  }
}

// ---------------------------------------------------------------------------
// 5c. PASS 6A.96: the editorial presence and the final release. One value
// carries the copy, CTA, room labels, indicator and the copy's exposure
// shade: none through Arrival (the Atrium stays in view), whole through the
// rooms, gone before the sticky stage leaves. Pure: reverse rebuilds it.
// ---------------------------------------------------------------------------
{
  const {
    buildOrbitTimeline,
    sampleOrbit,
    atriumGateway,
    atriumRelease,
    atriumEditorial,
  } = progress;
  const R = TIMING.release;
  for (const window of [R.editorialOut, R.gatewayOut])
    assert.ok(window[0] >= 0 && window[0] < window[1] && window[1] < 1);
  assert.ok(
    R.editorialOut[1] <= R.gatewayOut[1] &&
      R.editorialOut[0] <= R.gatewayOut[0],
    'the copy leaves first, the gateway settles out last',
  );
  assert.ok(
    TIMING.editorialInteractiveAt > 0 && TIMING.editorialInteractiveAt <= 1,
  );
  for (const timing of [TIMING, REDUCED]) {
    const t = buildOrbitTimeline(timing, null);
    const release = t.segments.at(-1);
    const kitchen = t.segments.at(-2);
    const positions = Array.from({ length: 8001 }, (_, i) => i / 8000);
    const frame = (p) => {
      const sample = sampleOrbit(p, t, timing);
      return {
        p,
        sample,
        release: atriumRelease(sample, timing),
        ui: atriumEditorial(sample, sample.activeState, timing),
        gateway: atriumGateway(sample, sample.activeState, timing),
      };
    };
    const frames = positions.map(frame);
    const strip = ({ release, ui, gateway }) => ({ release, ui, gateway });
    same(
      frames.map(strip),
      [...positions].reverse().map(frame).reverse().map(strip),
      'Footer → quiet frame → Gateway → Kitchen: the same frames in reverse',
    );
    for (const f of frames) {
      const { presence, interactive } = f.ui;
      assert.ok(presence >= 0 && presence <= 1);
      assert.equal(interactive, presence >= timing.editorialInteractiveAt);
      // Arrival: no editorial UI, so no copy shade over the Atrium.
      if (f.sample.activeState === 'arrival')
        assert.equal(presence, 0, `Arrival is architecture only at ${f.p}`);
      // Whole through every room hold and every room-to-room move.
      if (
        f.p < release.start &&
        (f.sample.phase === 'hold'
          ? f.sample.activeState !== 'arrival'
          : f.sample.transitionFrom !== 'arrival')
      )
        assert.equal(presence, 1, `the room UI is whole at ${f.p}`);
      if (f.p < release.start)
        same(f.release, { editorial: 1, gateway: 1, quiet: false });
      assert.equal(
        f.release.quiet,
        f.release.editorial === 0 && f.release.gateway === 0,
      );
    }
    // Living brings the UI in from nothing, after the UI switch only.
    const entering = frames.filter(
      (f) => f.sample.phase === 'move' && f.sample.transitionFrom === 'arrival',
    );
    if (timing.movement > 0) {
      assert.ok(entering.length > 100);
      for (const f of entering)
        if (f.sample.localTransitionProgress < timing.uiSwitchAt)
          assert.equal(f.ui.presence, 0);
      assert.ok(
        entering.every(
          (f, i) => !i || f.ui.presence >= entering[i - 1].ui.presence,
        ),
      );
      assert.ok(
        entering.some((f) => f.ui.presence > 0.2 && f.ui.presence < 0.8),
        'eased in, never a pop',
      );
    } else assert.equal(entering.length, 0, 'reduced motion: a plain change');
    // The release: each part only leaves, in small steps, and the quiet
    // frame is held before roomOrbitProgress = 1 (the sticky stage's exit).
    const releasing = frames.filter((f) => f.p >= release.start);
    const local = (f) => (f.p - release.start) / (release.end - release.start);
    for (const key of ['editorial', 'gateway']) {
      assert.ok(
        releasing.every(
          (f, i) => !i || f.release[key] <= releasing[i - 1].release[key],
        ),
        `${key} only leaves`,
      );
      assert.ok(
        releasing.every(
          (f, i) => !i || releasing[i - 1].release[key] - f.release[key] < 0.05,
        ),
        `${key} eases out`,
      );
      const [from, to] = R[`${key}Out`];
      for (const f of releasing) {
        if (local(f) <= from) assert.equal(f.release[key], 1);
        if (local(f) >= to) assert.equal(f.release[key], 0);
      }
    }
    for (const f of releasing) {
      assert.equal(f.sample.activeState, 'kitchen', 'still Kitchen');
      assert.equal(f.ui.presence, f.release.editorial);
      assert.equal(f.gateway.reveal, f.release.gateway);
      assert.equal(f.gateway.indicator, 0, 'the indicator is already gone');
    }
    const quiet = releasing.filter((f) => f.release.quiet);
    assert.ok(quiet.length >= 0.2 * releasing.length, 'a held quiet frame');
    assert.ok(quiet[0].p < 1, 'quiet before the stage leaves');
    assert.ok(
      quiet.every(
        (f) =>
          f.ui.presence === 0 &&
          !f.ui.interactive &&
          f.gateway.reveal === 0 &&
          !f.gateway.interactive,
      ),
      'nothing editorial is left, and nothing takes focus',
    );
    same(strip(frames.at(-1)), {
      release: { editorial: 0, gateway: 0, quiet: true },
      ui: { presence: 0, interactive: false },
      gateway: { reveal: 0, indicator: 0, interactive: false },
    });
    // Kitchen stays readable: alone first, then with the whole gateway,
    // and only then the release.
    const inKitchen = frames.filter(
      (f) => f.p >= kitchen.start && f.p < kitchen.end,
    );
    const alone = inKitchen.filter(
      (f) => f.ui.presence === 1 && f.gateway.reveal === 0,
    );
    const withGateway = inKitchen.filter(
      (f) => f.ui.presence === 1 && f.gateway.reveal === 1,
    );
    assert.ok(alone.length >= 0.4 * inKitchen.length, 'Kitchen alone');
    assert.ok(withGateway.length >= 0.1 * inKitchen.length, 'then the gateway');
    assert.ok(inKitchen.every((f) => f.ui.presence === 1));
    // One authority: the presence follows the state the UI shows.
    const mid = sampleOrbit((kitchen.start + kitchen.end) / 2, t, timing);
    assert.equal(atriumEditorial(mid, 'arrival', timing).presence, 0);
    assert.equal(atriumEditorial(mid, 'kitchen', timing).presence, 1);
  }
}

// ---------------------------------------------------------------------------
// 6. Preload priority: Arrival, then Living, then the next room in the
// direction of travel. Never every plate.
// ---------------------------------------------------------------------------
{
  const { buildOrbitTimeline, sampleOrbit, planPlates } = progress;
  const t = buildOrbitTimeline(TIMING, null);
  const at = (p) => sampleOrbit(p, t);
  const plan = (baseStoryProgress, p, direction = 'forward') =>
    planPlates({ baseStoryProgress, sample: at(p), direction });
  same(plan(0, 0), { required: [], warm: [] }, 'nothing on homepage boot');
  same(plan(HOME_PRODUCTION.scenePreload - 0.001, 0), {
    required: [],
    warm: [],
  });
  same(plan(HOME_PRODUCTION.scenePreload, 0), {
    required: ['arrival'],
    warm: [],
  });
  same(plan(HOME_PRODUCTION.thumbnailPreload, 0), {
    required: ['arrival'],
    warm: ['living'],
  });
  for (const s of t.segments) {
    const p = (s.start + s.end) / 2;
    const sample = at(p);
    for (const direction of ['forward', 'reverse']) {
      const result = plan(1, p, direction);
      const all = [...result.required, ...result.warm];
      assert.ok(all.length <= 4 && new Set(all).size === all.length);
      assert.ok(all.length < STATES.length, 'never every plate');
      // The release shows the Kitchen plate, like the Kitchen hold.
      if (s.kind !== 'move') {
        same(result.required, [s.state]);
        const ahead =
          direction === 'forward' ? sample.nextState : sample.previousState;
        if (ahead)
          assert.equal(result.warm[0], ahead, 'travel direction first');
      } else same(result.required, [s.from, s.to], 'both plates of a move');
    }
  }
  same(plan(1, 0.0001, 'forward'), { required: ['arrival'], warm: ['living'] });
  same(plan(1, 0.9999, 'reverse'), {
    required: ['kitchen'],
    warm: ['bathroom'],
  });
}

// ---------------------------------------------------------------------------
// 7. The manifest: one naming source. No studio plate is delivered; the
// orbit is drawn on comp plates (PASS 6B.0), named and stored like the
// approved Atrium plate, and nothing is invented.
// ---------------------------------------------------------------------------
{
  const {
    ATRIUM_ORBIT_ASSETS: ASSETS,
    ATRIUM_ORBIT_PLATES,
    ATRIUM_ORBIT_CAMERA_DATA,
    ATRIUM_ORBIT_THUMBNAILS,
    ATRIUM_ORBIT_FASCIA,
    ATRIUM_ORBIT_COMP: COMP,
    ATRIUM_ORBIT_FOCUS,
    ATRIUM_ORBIT_PLATE_RATIO,
    plateFile,
    plateFiles,
    plateSources,
    compPlateFile,
    plateWindow,
    plateWindowStart,
    atriumOrbitRecord,
    atriumOrbitReadiness,
    atriumOrbitLayout,
    plateOrientation,
  } = manifest;
  // Today: every plate missing, no camera file. Flipping a status without
  // delivering its files fails here.
  for (const id of STATES) {
    for (const orientation of ['desktop', 'portrait'])
      if (ATRIUM_ORBIT_PLATES[id][orientation] === 'available')
        for (const file of plateFiles(id).filter((f) =>
          orientation === 'portrait'
            ? /-portrait/.test(f)
            : !/-portrait/.test(f),
        ))
          assert.ok(exists(`public${file}`), `${file} is delivered`);
  }
  // PASS 6B.0: no approved studio plate exists yet. Every desktop view is a
  // comp plate; there is no portrait view.
  same(
    STATES.map((id) => ATRIUM_ORBIT_PLATES[id]),
    STATES.map(() => ({ desktop: 'comp', portrait: 'missing' })),
    'comp plates, no studio plate',
  );
  assert.equal(ATRIUM_ORBIT_CAMERA_DATA, null, 'no camera data yet');
  assert.equal(
    cameras.validateAtriumOrbitCameras(ATRIUM_ORBIT_CAMERA_DATA).status,
    'missing',
  );
  const readiness = atriumOrbitReadiness();
  assert.equal(readiness.missing.length, 10, 'a comp is not a studio plate');
  assert.equal(readiness.desktopComplete, true, 'the orbit can be drawn');
  assert.equal(
    atriumOrbitReadiness({
      ...ATRIUM_ORBIT_PLATES,
      bedroom: { desktop: 'missing', portrait: 'missing' },
    }).desktopComplete,
    false,
  );
  // Comp plates: the approved Atrium's own size, widths and naming (widest
  // without a suffix); Arrival IS the approved Atrium's files. Every file
  // named exists, is WebP at exactly that width, and nothing else is there.
  same([...COMP.widths], [1672, 1280, 720]);
  same([...COMP.intrinsic], [1672, 941]);
  near(ATRIUM_ORBIT_PLATE_RATIO, 1672 / 941, 'plate ratio');
  const approved = JSON.parse(read('data/home-chapter-assets.json'))[
    'worlds-atrium'
  ];
  same([approved.width, approved.height], [...COMP.intrinsic]);
  same(
    COMP.widths.map((w) => `${compPlateFile('arrival', w)} ${w}w`).sort(),
    approved.srcSet.split(', ').sort(),
    'Arrival is the approved Atrium plate',
  );
  assert.equal(
    compPlateFile('bedroom', 1672),
    '/images/home-chapters/world-atrium-bedroom.webp',
  );
  assert.equal(
    compPlateFile('bedroom', 720),
    '/images/home-chapters/world-atrium-bedroom-720.webp',
  );
  const expectedFiles = [];
  for (const id of STATES) {
    const sources = plateSources(id);
    assert.ok(sources, `${id} is drawn`);
    if (id === 'arrival') {
      // STEP 2B: Arrival is a second drawing of the approved Atrium, shown
      // in its place from the frame the camera leaves it, so it must be the
      // very file the approved backdrop shows on that screen. The backdrop
      // (chapter-image.tsx, scenePlate) chooses by breakpoint, not density.
      const chapterImage = read(`${EXPERIENCE}chapter-image.tsx`);
      assert.match(
        chapterImage,
        /<source\s+media="\(max-width: 1199px\)"\s+srcSet=\{\s*deferred \? undefined : `\/images\/home-chapters\/\$\{asset\}-1280\.webp`\s*\}/,
        'the approved backdrop: the 1280 file up to 1199px',
      );
      assert.match(
        chapterImage,
        /srcSet=\{deferred \|\| scenePlate \? undefined : metadata\.srcSet\}/,
        'and the full plate above, with no density choice',
      );
      same(
        sources.sources.map((s) => [s.media, s.type, s.srcset]),
        [
          [
            '(max-width: 1199px)',
            'image/webp',
            '/images/home-chapters/worlds-atrium-1280.webp',
          ],
        ],
      );
      same(sources.fallback, {
        src: approved.src,
        width: 1672,
        height: 941,
        sizes: COMP.sizes,
      });
      assert.equal(approved.src, '/images/home-chapters/worlds-atrium.webp');
    } else {
      same(
        sources.sources.map((s) => [s.media, s.type]),
        [[null, 'image/webp']],
      );
      same(
        sources.sources[0].srcset.split(', '),
        COMP.widths.map((w) => `${compPlateFile(id, w)} ${w}w`),
      );
      same(sources.fallback, {
        src: compPlateFile(id, COMP.fallbackWidth),
        width: 1672,
        height: 941,
        sizes: COMP.sizes,
      });
    }
    for (const w of COMP.widths) {
      const file = compPlateFile(id, w);
      assert.ok(exists(`public${file}`), `${file} exists`);
      const meta = await sharp(
        fileURLToPath(new URL(`../public${file}`, import.meta.url)),
      ).metadata();
      same([meta.format, meta.width], ['webp', w], file);
      near(meta.width / meta.height, 1672 / 941, file, 0.003);
      if (id !== 'arrival') expectedFiles.push(file.split('/').pop());
    }
  }
  for (const room of ROOMS)
    expectedFiles.push(ATRIUM_ORBIT_THUMBNAILS[room].src.split('/').pop());
  // The closed doors of a room view: one picture for each file of its plate
  // (atrium-orbit-doors.ts; check:atrium-doors proves them).
  for (const room of ROOMS)
    for (const w of COMP.widths)
      expectedFiles.push(compPlateFile(room, w, '-doors').split('/').pop());
  same(
    readdirSync(new URL('../public/images/home-chapters/', import.meta.url))
      .filter((name) => name.startsWith(`${ASSETS.stem}-`))
      .toSorted((a, b) => a.localeCompare(b)),
    expectedFiles.toSorted((a, b) => a.localeCompare(b)),
    'only the comp plates, their doors and their thumbnails: no other world-atrium-* file',
  );
  // The plates agree. They were four separate drawings: each showed the
  // doorway beside its own at another size, height and slant than that
  // doorway's own plate does, so a pan showed two versions of a doorway and
  // of its label. The neighbour's own doorway is now laid into the plate,
  // the pan's shift away (work/atrium-orbit/comp-plates/stitch.mjs, outside
  // Git). On both doorways of such a pan the two plates are one picture:
  // what differs is the encoder's noise (about 2 of 255; 36 to 45 before).
  {
    const pixels = async (room) =>
      sharp(
        fileURLToPath(
          new URL(`../public${compPlateFile(room, 1672)}`, import.meta.url),
        ),
      )
        .removeAlpha()
        .raw()
        .toBuffer();
    const plate = {};
    for (const room of ROOMS) plate[room] = await pixels(room);
    const at = (x, y) => (y * 1672 + x) * 3;
    const apart = (a, b, shift, [x0, y0, x1, y1]) => {
      let sum = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++)
          for (let c = 0; c < 3; c++)
            sum += Math.abs(a[at(x, y) + c] - b[at(x - shift, y) + c]);
      return sum / ((x1 - x0) * (y1 - y0) * 3);
    };
    const shiftOf = (from) =>
      Math.round(
        transition.ATRIUM_ORBIT_SHOTS[
          model.ATRIUM_ORBIT_TRANSITIONS.findIndex((t) => t.from === from)
        ].shift * 1672,
      );
    for (const { doorway, from, to, box } of [
      {
        doorway: 'Bedroom',
        from: 'living',
        to: 'bedroom',
        box: [1360, 150, 1660, 650],
      },
      {
        doorway: 'Living',
        from: 'living',
        to: 'bedroom',
        box: [790, 125, 1150, 640],
      },
      {
        doorway: 'Kitchen',
        from: 'bathroom',
        to: 'kitchen',
        box: [1345, 130, 1660, 650],
      },
    ]) {
      const off = apart(plate[from], plate[to], shiftOf(from), box);
      assert.ok(
        off < 5,
        `${from} | ${to}: the ${doorway} doorway is one picture (${off})`,
      );
    }
    // Where a planter stands in front of the neighbouring doorway it cannot
    // be the neighbour's own drawing. Its label is taken out instead, so no
    // label is ever seen twice: no ivory ink is left on those fascias.
    const ink = (pixels, [x0, y0, x1, y1]) => {
      const marks = [];
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const i = at(x, y);
          const low = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
          const high = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
          marks.push([low, high - low]);
        }
      const mean = marks.reduce((sum, [low]) => sum + low, 0) / marks.length;
      return marks.filter(([low, chroma]) => chroma < 58 && low - mean > 45)
        .length;
    };
    for (const { room, box } of [
      { room: 'bedroom', box: [1440, 150, 1672, 225] }, // "03 Bathroom"
      { room: 'bathroom', box: [20, 88, 232, 190] }, // "02 Bedroom"
      { room: 'kitchen', box: [246, 128, 470, 222] }, // "03 Bathroom"
    ])
      assert.ok(ink(plate[room], box) < 40, `${room}: no label there`);
  }
  // Lossless sources and the comps themselves stay out of Git and of public/.
  assert.ok(
    readdirSync(new URL('../public/images/home-chapters/', import.meta.url))
      .filter((name) => name.startsWith(`${ASSETS.stem}-`))
      .every((name) => name.endsWith('.webp')),
  );
  // The stage is a window onto a plate: the whole plate when it is at least
  // as wide, a centred window on the doorway when it is narrower; Arrival
  // repeats the approved Atrium's crop (50%, 51% on phones).
  same(plateWindow(1672, 941), { width: 1, height: 1 });
  near(plateWindow(1440, 900).width, 1440 / (900 * (1672 / 941)), 'window');
  assert.equal(plateWindow(1440, 900).height, 1);
  assert.equal(plateWindow(2560, 1080).width, 1);
  near(plateWindow(2560, 1080).height, (2560 / (1672 / 941)) ** -1 * 1080, 'h');
  for (const [w, h] of [
    [2560, 1080],
    [1440, 900],
    [768, 1024],
    [390, 844],
    [844, 390],
  ]) {
    const window = plateWindow(w, h);
    const layout = atriumOrbitLayout(w);
    for (const id of STATES) {
      const start = plateWindowStart(id, window, layout);
      assert.ok(start >= 0 && start + window.width <= 1 + 1e-12, `${id} ${w}`);
      if (id === 'arrival')
        near(start, (1 - window.width) * (w < 768 ? 0.51 : 0.5), 'crop');
      else if (window.width < 0.5)
        near(start + window.width / 2, ATRIUM_ORBIT_FOCUS[id], 'on the door');
    }
  }
  assert.ok(ROOMS.every((id) => ATRIUM_ORBIT_FOCUS[id] > 0.45));
  // PASS 6A.5: the runtime format is WebP only (what the optimiser writes);
  // AVIF is not advertised, lossless masters are never served.
  same([...ASSETS.formats], ['webp'], 'WebP only');
  assert.ok(!ASSETS.formats.some((f) => /avif|png|tiff?|exr/.test(f)));
  assert.equal(
    plateFile('bedroom', 'desktop', 3344, 'webp'),
    '/images/home-chapters/world-atrium-bedroom.webp',
  );
  assert.equal(
    plateFile('bedroom', 'desktop', 1280, 'webp'),
    '/images/home-chapters/world-atrium-bedroom-1280.webp',
  );
  assert.equal(
    plateFile('bathroom', 'portrait', 860, 'webp'),
    '/images/home-chapters/world-atrium-bathroom-portrait-860.webp',
  );
  assert.equal(plateFiles('living').length, 7, '5 + 2 widths, WebP');
  assert.ok(
    STATES.every((id) => plateFiles(id).every((f) => f.endsWith('.webp'))),
  );
  // A complete delivery's <picture>: portrait first, preferred format first.
  const all = Object.fromEntries(
    STATES.map((id) => [id, { desktop: 'available', portrait: 'available' }]),
  );
  const sources = plateSources('kitchen', all);
  same(
    sources.sources.map((s) => [s.media, s.type]),
    [
      [ASSETS.portraitMedia, 'image/webp'],
      [null, 'image/webp'],
    ],
  );
  assert.match(
    sources.sources[0].srcset,
    /world-atrium-kitchen-portrait\.webp 1290w, .*-portrait-860\.webp 860w$/,
  );
  assert.match(
    sources.sources[1].srcset,
    /world-atrium-kitchen\.webp 3344w, .*-2560\.webp 2560w, .*-1920\.webp 1920w, .*-1280\.webp 1280w, .*-720\.webp 720w$/,
  );
  same(sources.fallback, {
    src: '/images/home-chapters/world-atrium-kitchen-1920.webp',
    width: 3344,
    height: 1882,
    sizes: ASSETS.sizes.desktop,
  });
  const desktopOnly = plateSources('kitchen', {
    ...all,
    kitchen: { desktop: 'available', portrait: 'missing' },
  });
  assert.ok(desktopOnly.sources.every((s) => s.media === null));
  assert.equal(
    plateSources('kitchen', {
      ...all,
      kitchen: { desktop: 'missing', portrait: 'available' },
    }),
    null,
    'no portrait-only partial plate',
  );
  // Thumbnails: 192px, never a full plate. PASS 6B.0: the room's doorway,
  // cut from its comp plate.
  for (const room of ROOMS) {
    const thumb = ATRIUM_ORBIT_THUMBNAILS[room];
    same(thumb, {
      src: `/images/home-chapters/world-atrium-${room}-preview.webp`,
      width: 192,
      height: 192,
    });
    assert.ok(exists(`public${thumb.src}`), `${thumb.src} exists`);
    const meta = await sharp(
      fileURLToPath(new URL(`../public${thumb.src}`, import.meta.url)),
    ).metadata();
    same([meta.format, meta.width, meta.height], ['webp', 192, 192]);
  }
  // Fascia labels are not positioned before plates are measured.
  assert.ok(
    STATES.every((id) =>
      Object.values(ATRIUM_ORBIT_FASCIA[id]).every((a) => a === null),
    ),
  );
  // Records: routes come from the rendered links, never invented.
  const routes = { living: '/a', kitchen: '/b' };
  const living = atriumOrbitRecord('living', routes);
  assert.equal(living.route, '/a');
  assert.equal(atriumOrbitRecord('bedroom', routes).route, null);
  assert.equal(atriumOrbitRecord('arrival', routes).route, null);
  assert.equal(atriumOrbitRecord('arrival').thumbnail, null);
  same(living.camera, { desktop: 'living', portrait: 'living-portrait' });
  same(living.plate, {
    desktop: 'world-atrium-living',
    portrait: 'world-atrium-living-portrait',
  });
  assert.equal(living.previous, 'arrival');
  assert.equal(living.next, 'bedroom');
  // Routes the homepage actually renders (worldsChapterOptions).
  const chapters = read('data/home-chapters.ts');
  assert.match(chapters, /export const worldsChapterOptions/);
  // Responsive states on the homepage's breakpoints.
  same([360, 767, 768, 1199, 1200, 1920].map(atriumOrbitLayout), [
    'mobile',
    'mobile',
    'tablet',
    'tablet',
    'desktop',
    'desktop',
  ]);
  same(
    [
      [390, 844],
      [767, 767],
      [844, 390],
      [768, 1024],
      [1440, 900],
    ].map(([w, h]) => plateOrientation(w, h)),
    ['portrait', 'portrait', 'desktop', 'desktop', 'desktop'],
  );
}

// ---------------------------------------------------------------------------
// 8. The transition extension point. PASS 6B.0: the orbit. Wide Atrium →
// first doorway is a push; doorway → next doorway is a pan of two plates
// joined on the pier they share. Pure: the same position draws the same
// frame in either direction, the stage is covered at every position on
// every screen, and reduced motion only changes plates.
// ---------------------------------------------------------------------------
{
  const { buildOrbitTimeline, sampleOrbit } = progress;
  const {
    plateTransitionInput,
    orbitTransition,
    reducedTransition,
    plainChange,
    plateRest,
    selectPlateTransition,
    ATRIUM_ORBIT_OCCLUDERS,
    ATRIUM_ORBIT_SHOTS: SHOTS,
    ATRIUM_ORBIT_SEAM: SEAM,
    ATRIUM_ORBIT_IRIS: IRIS,
  } = transition;
  const { plateWindow, atriumOrbitLayout, plateWindowStart } = manifest;
  const angles = cameras.validateAtriumOrbitCameras(rig()).stepAngles;
  const t = buildOrbitTimeline(TIMING, angles);
  assert.equal(ATRIUM_ORBIT_OCCLUDERS.length, 4);
  assert.ok(ATRIUM_ORBIT_OCCLUDERS.every((o) => o.regions === null));
  same(
    ATRIUM_ORBIT_OCCLUDERS.map((o) => o.alphaPassPriority),
    [1, 2, 1, 2],
    'spec §9 priorities',
  );
  // One shot per transition: in from the wide Atrium, then around it.
  same(
    SHOTS.map((shot) => shot.kind),
    ['push', 'pan', 'pan', 'pan'],
  );
  // The push is matched on the doorway: its opening in the wide view and in
  // the next view, both measured on the pictures (jamb to jamb, lintel to
  // floor). The wide view sees it at an angle, so it must widen more than
  // it grows.
  {
    const { door, goal, zoom, turn, iris } = SHOTS[0];
    for (const box of [door, goal]) {
      assert.ok(0 < box.x[0] && box.x[0] < box.x[1] && box.x[1] < 1);
      assert.ok(0 < box.y[0] && box.y[0] < box.y[1] && box.y[1] < 1);
    }
    const across = (goal.x[1] - goal.x[0]) / (door.x[1] - door.x[0]);
    const down = (goal.y[1] - goal.y[0]) / (door.y[1] - door.y[0]);
    assert.ok(across > 2 && across < 3, `the doorway widens ${across}×`);
    assert.ok(down > 1.3 && down < 2, `and grows ${down}×`);
    assert.ok(across > down * 1.2, 'seen at an angle, then square on');
    near(
      (goal.x[0] + goal.x[1]) / 2,
      manifest.ATRIUM_ORBIT_FOCUS.living,
      'the opening is centred on the view',
      0.01,
    );
    // Grown first; the turn and the opening follow, and the next view only
    // opens once the doorways are the same size.
    assert.ok(0.4 < zoom && zoom < 0.75);
    assert.ok(
      turn[0] < zoom && zoom < turn[1] && turn[1] < 1,
      'the turn overlaps',
    );
    assert.ok(iris[0] >= zoom && iris[0] < turn[1] && iris[1] === 1);
    assert.ok(IRIS.whole > 0.4 && IRIS.whole < 0.85, 'a soft rim, not a line');
    assert.ok(IRIS.door > 0.6 && IRIS.door <= 1.2, 'it starts as the doorway');
    assert.ok(IRIS.fade > 0.05 && IRIS.fade < 0.3);
    assert.ok(
      0 < IRIS.join[0] && IRIS.join[0] < IRIS.join[1] && IRIS.join[1] < 0.1,
    );
  }
  // A pan is one picture travelling. It carries no fit of one plate to the
  // other, only how far apart the two lie (a whole number of px of the
  // 1672 × 941 picture, as the plates were stitched) and where the pier
  // they share stands.
  for (const shot of SHOTS.slice(1)) {
    same(Object.keys(shot), ['kind', 'shift', 'pier']);
    assert.ok(shot.shift > 0.3 && shot.shift < 0.6, 'half a view at a time');
    assert.ok(shot.pier > shot.shift && shot.pier < 1, 'the pier is shared');
  }
  const SHIFT_PX = SHOTS.slice(1).map((shot) => shot.shift * 1672);
  SHIFT_PX.forEach((px) => near(px, Math.round(px), 'a whole px', 1e-9));
  same(SHIFT_PX.map(Math.round), [772, 690, 654]);
  same(Object.keys(SEAM), ['feather', 'dwell']);
  assert.ok(SEAM.feather > 0 && SEAM.feather < 0.1, 'a join, not a dissolve');
  assert.ok(
    0 < SEAM.dwell[0] && SEAM.dwell[0] < SEAM.dwell[1] && SEAM.dwell[1] < 1,
  );

  // Stage geometry of one posed plate (the runtime's own box model).
  const tallOf = (layer) => layer.scaleY ?? layer.scale;
  const extent = (layer, window) => ({
    left: (0.5 - 0.5 * layer.scale + layer.x) / window.width,
    right: (0.5 + 0.5 * layer.scale + layer.x) / window.width,
    top: 0.5 - 0.5 * tallOf(layer) + layer.y,
    bottom: 0.5 + 0.5 * tallOf(layer) + layer.y,
  });
  // A point of a plate (shares of its own box) on the stage (x in stage
  // widths, y in stage heights), and back.
  const onStage = (layer, window, px, py) => [
    ((px - 0.5) * layer.scale + 0.5 + layer.x) / window.width,
    (py - 0.5) * tallOf(layer) + 0.5 + layer.y,
  ];
  const onPlate = (layer, window, sx, sy) => [
    (sx * window.width - layer.x - 0.5) / layer.scale + 0.5,
    (sy - layer.y - 0.5) / tallOf(layer) + 0.5,
  ];
  // How much of the plate is there at one stage position (0 → 1): its box,
  // then what its mask shows. A soft edge (either way round) and an ellipse
  // add up, as two CSS mask images do.
  const alphaAt = (layer, window, sx, sy = 0.5) => {
    if (layer.opacity <= 0) return 0;
    const box = extent(layer, window);
    if (sx < box.left - 1e-9 || sx > box.right + 1e-9) return 0;
    if (sy < box.top - 1e-9 || sy > box.bottom + 1e-9) return 0;
    if (!layer.edge && !layer.iris) return layer.opacity;
    const [px, py] = onPlate(layer, window, sx, sy);
    let edge = 0;
    if (layer.edge) {
      const [clear, whole] = layer.edge;
      // A line (clear === whole) is whole on its right, as the runtime's
      // gradient draws it.
      edge =
        whole === clear
          ? px >= clear
            ? 1
            : 0
          : Math.min(1, Math.max(0, (px - clear) / (whole - clear)));
    }
    let iris = 0;
    if (layer.iris) {
      const { x, y, rx, ry, whole, alpha } = layer.iris;
      const r = Math.hypot((px - x) / rx, (py - y) / ry);
      iris = alpha * Math.min(1, Math.max(0, (1 - r) / (1 - whole)));
    }
    return layer.opacity * (edge + iris - edge * iris);
  };
  const VIEWPORTS = [
    [2560, 1080],
    [1920, 1080],
    [1672, 941],
    [1440, 900],
    [1024, 768],
    [800, 1000],
    [768, 1024],
    [390, 844],
    [844, 390],
  ];
  const stageXs = Array.from({ length: 161 }, (_, i) => i / 160);
  const stageYs = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];
  const innerXs = Array.from({ length: 80 }, (_, i) => (i + 0.5) / 80);
  const locals = Array.from({ length: 241 }, (_, i) => i / 240);
  for (const s of t.segments) {
    const p = (s.start + s.end) / 2;
    const window = plateWindow(1440, 900);
    // Holds and the release rest on one plate: no transition to play.
    if (s.kind !== 'move') {
      assert.equal(
        plateTransitionInput(
          sampleOrbit(p, t),
          'forward',
          angles,
          'desktop',
          window,
          'desktop',
        ),
        null,
      );
      continue;
    }
    for (const [width, height] of VIEWPORTS) {
      const window = plateWindow(width, height);
      const layout = atriumOrbitLayout(width);
      const inputAt = (local, direction) =>
        plateTransitionInput(
          sampleOrbit(
            Math.min(s.end - 1e-12, s.start + local * (s.end - s.start)),
            t,
          ),
          direction,
          angles,
          'desktop',
          window,
          layout,
        );
      const probe = inputAt(0.5, 'forward');
      assert.equal(probe.from, s.from);
      assert.equal(probe.to, s.to);
      same([probe.outgoing, probe.incoming], [s.from, s.to]);
      const back = inputAt(0.5, 'reverse');
      same([back.outgoing, back.incoming], [s.to, s.from]);
      assert.equal(probe.deltaAngleDeg, angles[s.transition]);
      assert.equal(probe.occluder, ATRIUM_ORBIT_OCCLUDERS[s.transition]);
      assert.equal(probe.shot, SHOTS[s.transition]);
      same(probe.window, window);
      const shot = SHOTS[s.transition];
      const restFrom = plateRest(s.from, window, layout);
      const restTo = plateRest(s.to, window, layout);
      for (const rest of [restFrom, restTo]) {
        // A view at rest is the whole plate, covering the stage.
        same([rest.opacity, rest.y, rest.scale, rest.edge], [1, 0, 1, null]);
        const box = extent(rest, window);
        assert.ok(box.left <= 1e-9 && box.right >= 1 - 1e-9, 'rest covers');
      }
      near(restFrom.x, -plateWindowStart(s.from, window, layout), 'window');
      for (const adapter of [orbitTransition, reducedTransition]) {
        const orbit = adapter === orbitTransition;
        let previous = null;
        for (const local of locals) {
          const forward = {
            ...inputAt(local, 'forward'),
            localProgress: local,
          };
          const reverse = {
            ...inputAt(local, 'reverse'),
            localProgress: local,
          };
          const frame = adapter(forward);
          same(
            frame,
            adapter(reverse),
            'the same position draws the same frame both ways',
          );
          assert.equal(
            frame.lead,
            local < TIMING.uiSwitchAt ? 'from' : 'to',
            'the plate and the UI switch together',
          );
          for (const layer of [frame.from, frame.to]) {
            assert.ok(layer.opacity >= 0 && layer.opacity <= 1);
            assert.ok(layer.scale >= 1, 'a plate never shrinks into view');
            assert.ok(Number.isFinite(layer.x) && Number.isFinite(layer.y));
          }
          // Each end is one view at rest: the hold it joins.
          if (local === 0) same([frame.from, frame.to.opacity], [restFrom, 0]);
          if (local === 1) same([frame.to, frame.from.opacity], [restTo, 0]);
          // The stage is covered by the two plates alone, everywhere.
          const [under, top] =
            frame.over === 'to'
              ? [frame.from, frame.to]
              : [frame.to, frame.from];
          for (const sx of stageXs)
            for (const sy of stageYs) {
              const a = alphaAt(top, window, sx, sy);
              const b = alphaAt(under, window, sx, sy);
              assert.ok(
                a + (1 - a) * b >= 1 - 1e-9,
                `${s.from}→${s.to} ${width}×${height} local ${local} at ` +
                  `${sx}, ${sy}: covered ${a + (1 - a) * b}`,
              );
            }
          for (const layer of [frame.from, frame.to]) {
            if (layer.opacity <= 0) continue;
            const box = extent(layer, window);
            assert.ok(
              box.top <= 1e-9 && box.bottom >= 1 - 1e-9,
              'top to bottom',
            );
          }
          if (!orbit) {
            // Reduced motion: one plate at a time, at rest, no camera move.
            assert.equal(frame.from.opacity + frame.to.opacity, 1);
            same(
              frame.from.opacity ? frame.from : frame.to,
              local < TIMING.uiSwitchAt ? restFrom : restTo,
            );
          } else if (local > 0 && local < 1) {
            if (shot.kind === 'pan') {
              // One strip: the two plates stay `shift` apart, so the pier
              // they share stays in one piece; nothing scales or lifts.
              assert.equal(frame.over, 'to');
              near(frame.to.x - frame.from.x, shot.shift, 'one strip', 1e-9);
              same(
                [
                  frame.from.opacity,
                  frame.to.opacity,
                  frame.from.scale,
                  frame.to.scale,
                  frame.from.y,
                  frame.to.y,
                  frame.from.edge,
                ],
                [1, 1, 1, 1, 0, 0, null],
              );
              // Nothing is fitted: neither plate is stretched or sheared.
              same(
                [frame.from.scaleY, frame.to.scaleY],
                [undefined, undefined],
              );
              // And the picture only ever travels one way.
              if (previous && previous.from.opacity > 0)
                assert.ok(
                  frame.from.x <= previous.from.x + 1e-12,
                  `${s.from}→${s.to} ${width}×${height} local ${local}: ` +
                    'the picture never turns back',
                );
              // The join: soft only where both plates exist.
              const [clear, whole] = frame.to.edge;
              assert.ok(
                whole >= clear && whole - clear <= 2 * SEAM.feather + 1e-9,
              );
              assert.ok(clear >= -1e-9 && whole <= 1 - shot.shift + 1e-9);
              // And never wider than what the stage shows beside it: a
              // plate comes into view, and goes, as a soft sliver. (Off the
              // stage, on a narrow one, the join is a line.)
              const at = ((clear + whole) / 2 + frame.to.x) / window.width;
              assert.ok(
                (whole - clear) / 2 / window.width <=
                  Math.max(0, Math.min(at, 1 - at)) + 1e-9,
                `${s.from}→${s.to} ${width}×${height} local ${local}: the ` +
                  'join is soft on the stage only',
              );
            } else {
              // The wide plate is whole and unmasked beneath; the next view
              // lies on top at its own size and only ever shows through its
              // mask. Neither is ever a second, displaced picture.
              assert.equal(frame.over, 'to');
              same(
                [frame.from.opacity, frame.from.edge, frame.from.iris],
                [1, null, undefined],
              );
              const across =
                (shot.goal.x[1] - shot.goal.x[0]) /
                (shot.door.x[1] - shot.door.x[0]);
              const down =
                (shot.goal.y[1] - shot.goal.y[0]) /
                (shot.door.y[1] - shot.door.y[0]);
              assert.ok(frame.from.scale <= across + 1e-9);
              assert.ok(frame.from.scaleY <= down + 1e-9);
              assert.ok(frame.from.scaleY <= frame.from.scale + 1e-9);
              if (frame.to.opacity > 0) {
                same([frame.to.scale, frame.to.y], [1, 0]);
                assert.ok(
                  frame.to.edge || frame.to.iris,
                  'only through a mask',
                );
                // The next plate's own edges are never shown: where it does
                // not reach the stage's side yet, the ellipse stops inside.
                const box = extent(frame.to, window);
                if (frame.to.iris && box.right < 1 - 1e-9)
                  assert.ok(
                    frame.to.iris.x + frame.to.iris.rx <= 1 + 1e-9,
                    'the ellipse stays inside the plate',
                  );
                assert.ok(
                  box.left <= 1e-9,
                  'the next view holds the near side',
                );
              }
              // Matched on the doorway: whenever the next view shows inside
              // it, the opening of the wide plate lies on the opening of the
              // next view, jamb on jamb, lintel on lintel, floor on floor.
              if (frame.to.iris) {
                const tall = (y) => y / window.height;
                const corners = (layer, box) => [
                  onStage(layer, window, box.x[0], tall(box.y[0])),
                  onStage(layer, window, box.x[1], tall(box.y[1])),
                ];
                const wide = corners(frame.from, shot.door).flat();
                const next = corners(frame.to, shot.goal).flat();
                wide.forEach((value, i) =>
                  assert.ok(
                    Math.abs(value - next[i]) < 1e-9,
                    `${width}×${height} local ${local}: the doorways ` +
                      `coincide (${wide.join(', ')} vs ${next.join(', ')})`,
                  ),
                );
                near(frame.from.scale, across, 'fully grown', 1e-9);
                near(frame.from.scaleY, down, 'fully grown', 1e-9);
              }
            }
          }
          // No jump between neighbouring positions (except the plain cut):
          // neither plate moves far, and what the top one shows changes
          // gradually at every point of the stage.
          if (orbit && previous && local < 1 && local - 1 / 240 > 0) {
            for (const key of ['from', 'to']) {
              if (frame[key].opacity <= 0 || previous[key].opacity <= 0)
                continue;
              assert.ok(
                Math.abs(frame[key].x - previous[key].x) < 0.05,
                `${key} x`,
              );
              assert.ok(
                Math.abs(frame[key].scale - previous[key].scale) < 0.06,
              );
            }
            const [, topNow] =
              frame.over === 'to'
                ? [frame.from, frame.to]
                : [frame.to, frame.from];
            const [, topBefore] =
              previous.over === 'to'
                ? [previous.from, previous.to]
                : [previous.to, previous.from];
            // A soft edge may travel, so a point is compared with what was
            // near it one position ago: nothing may appear or vanish there
            // at once.
            const near4 = [-0.04, -0.02, 0, 0.02, 0.04];
            const near6 = [-0.06, 0, 0.06];
            for (const sx of innerXs)
              for (const sy of stageYs) {
                const now = alphaAt(topNow, window, sx, sy);
                const around = near4.flatMap((dx) =>
                  near6.map((dy) =>
                    alphaAt(topBefore, window, sx + dx, sy + dy),
                  ),
                );
                assert.ok(
                  now <= Math.max(...around) + 0.3 &&
                    now >= Math.min(...around) - 0.3,
                  `${s.from}→${s.to} ${width}×${height} local ${local}: ` +
                    `no jump in what shows at ${sx}, ${sy}`,
                );
              }
          }
          previous = frame;
        }
      }
      if (shot.kind === 'pan') {
        // The join rests on the pier through the middle of the move, and the
        // doorway the UI names is the one in the middle of the stage at rest.
        const mid = orbitTransition({
          ...inputAt(0.5, 'forward'),
          localProgress: 0.5,
        });
        const start = plateWindowStart(s.from, window, layout);
        const goal = plateWindowStart(s.to, window, layout);
        const low = Math.min(start + window.width, goal + shot.shift);
        const high = Math.max(start + window.width, goal + shot.shift);
        near(
          (mid.to.edge[0] + mid.to.edge[1]) / 2 + shot.shift,
          Math.min(high, Math.max(low, shot.pier)),
          'the join is on the pier',
          1e-9,
        );
      } else {
        // The push ends on the next view alone: the ellipse holds the whole
        // stage in its solid part, at the next view's resting place.
        const late = orbitTransition({
          ...inputAt(0.9995, 'forward'),
          localProgress: 0.9995,
        });
        near(late.to.x, restTo.x, 'at rest', 1e-6);
        for (const sx of stageXs)
          for (const sy of stageYs)
            assert.ok(
              alphaAt(late.to, window, sx, sy) > 1 - 1e-6,
              `${width}×${height}: the next view is the whole frame`,
            );
        // And it begins on the wide view alone.
        const early = orbitTransition({
          ...inputAt(0.2, 'forward'),
          localProgress: 0.2,
        });
        for (const sx of stageXs)
          assert.ok(alphaAt(early.to, window, sx, 0.5) < 1e-9);
      }
    }
  }
  // A pair without a shot is a plain change; so is reduced motion.
  {
    const window = plateWindow(1440, 900);
    const input = {
      ...plateTransitionInput(
        sampleOrbit(t.segments[3].start + 1e-6, t),
        'forward',
        null,
        'portrait',
        window,
        'desktop',
      ),
      shot: null,
      localProgress: 0.3,
    };
    assert.equal(input.deltaAngleDeg, null, 'no invented angle');
    same(orbitTransition(input), plainChange(input));
  }
  assert.equal(reducedTransition, plainChange);
  assert.equal(selectPlateTransition(true), reducedTransition);
  assert.equal(selectPlateTransition(false), orbitTransition);
}

// ---------------------------------------------------------------------------
// 8b. A room change is carried through (owner decision, 2026-10-09). A hand
// that stops between two rooms left the camera halfway, on a frame that
// belongs to neither. Once it has rested inside a pan the page itself is
// scrolled on to the room it was heading for; the hand is never held back,
// and the moment it moves the page again it has it back.
// ---------------------------------------------------------------------------
{
  const { carryOrbit, ATRIUM_ORBIT_CARRY_IDLE: IDLE, sampleOrbit } = progress;
  const { buildOrbitTimeline } = progress;
  const { MOTION } = loadStoryMath('home-motion');
  const timing = MOTION.carry;
  same(Object.keys(timing), ['rest', 'edge', 'duration']);
  same(Object.keys(timing.duration), ['least', 'perPx', 'most']);
  assert.ok(timing.rest >= 80 && timing.rest <= 200, 'a rest, not a pause');
  assert.ok(timing.edge >= 4 && timing.edge <= 24);
  assert.ok(
    timing.duration.least >= 300 && timing.duration.most <= 1500,
    'a glide: never a jump, never a wait',
  );
  same(IDLE, { at: null, heading: 0, since: 0, run: null });
  const SHOTS = transition.ATRIUM_ORBIT_SHOTS;
  const travelled = (index) => SHOTS[index].kind === 'pan';
  const t = buildOrbitTimeline(TIMING, null);
  const FRAME = 1000 / 60;
  for (const [top, length] of [
    [4860, 3420], // 1440 × 900
    [3207.2, 3207.2], // a phone: fractional positions
    [6912, 4104], // 1920 × 1080
  ]) {
    const where = { top, length };
    const px = (share) => top + share * length;
    const pans = t.segments.filter(
      (s) => s.kind === 'move' && travelled(s.transition),
    );
    assert.equal(pans.length, 3);
    // One page, one hand: every frame the carry is asked, and what it
    // writes is where the page is.
    const page = (scroll) => {
      const world = { scroll, now: 1000, touching: false, state: IDLE };
      world.frame = () => {
        const out = carryOrbit(
          world.state,
          { scroll: world.scroll, now: world.now, touching: world.touching },
          where,
          t,
          travelled,
          timing,
        );
        if (out.write !== null) {
          assert.ok(Number.isInteger(out.write), 'whole px');
          world.scroll = out.write;
        }
        world.state = out.carry;
        world.now += FRAME;
        return out;
      };
      // The hand moves the page itself.
      world.hand = (to) => {
        world.scroll = to;
        return world.frame();
      };
      // Frames until nothing more is wanted; the path the page took.
      world.rest = (limit = 400) => {
        const path = [world.scroll];
        let frames = 0;
        for (; frames < limit; frames++) {
          const out = world.frame();
          path.push(world.scroll);
          if (!out.active) break;
        }
        assert.ok(frames < limit, 'the carry comes to rest');
        return path;
      };
      return world;
    };
    const roomAt = (scroll) => {
      const at = sampleOrbit((scroll - top) / length, t, TIMING);
      return at.phase === 'move' ? null : at.activeState;
    };
    // 1. In a room, in the push and in the release nothing is ever written.
    for (const s of t.segments) {
      if (s.kind === 'move' && travelled(s.transition)) continue;
      for (const share of [0.02, 0.5, 0.98]) {
        const world = page(px(s.start + share * (s.end - s.start)));
        for (let i = 0; i < 60; i++) {
          const out = world.frame();
          same([out.write, out.active], [null, false], `${s.kind} at rest`);
        }
      }
    }
    for (const pan of pans) {
      const [a, b] = [px(pan.start), px(pan.end)];
      const within = (share) => Math.round(a + share * (b - a));
      const label = `${pan.from}→${pan.to} at ${top}`;
      // The page is taken to the middle of the room's hold: from there the
      // next room is as far going on as the last one is going back.
      const at = t.segments.indexOf(pan);
      const [last, next] = [t.segments[at - 1], t.segments[at + 1]];
      same(
        [last.kind, last.state, next.kind, next.state],
        ['hold', pan.from, 'hold', pan.to],
      );
      const onward = Math.round(px((next.start + next.end) / 2));
      const back = Math.round(px((last.start + last.end) / 2));
      // 2. Heading on: the hand scrolls down into the pan and stops. Nothing
      // happens while it has rested for less than `rest`; then the page
      // goes on, one way, with no jump, and lands in the middle of the next
      // room's hold, on a whole px.
      {
        const world = page(a - 40);
        world.frame();
        for (const share of [0.1, 0.2, 0.3, 0.4]) world.hand(within(share));
        const waiting = Math.floor(timing.rest / FRAME) - 1;
        for (let i = 0; i < waiting; i++) {
          const out = world.frame();
          same([out.write, out.active], [null, true], `${label}: it waits`);
        }
        const from = world.scroll;
        const path = world.rest();
        assert.equal(world.scroll, onward, `${label}: on to the room`);
        assert.equal(roomAt(world.scroll), pan.to, `${label}: it is that room`);
        const distance = world.scroll - from;
        const frames = path.length - 1;
        const expected = Math.min(
          timing.duration.most,
          timing.duration.least + timing.duration.perPx * distance,
        );
        for (let i = 1; i < path.length; i++) {
          assert.ok(path[i] >= path[i - 1], `${label}: one way`);
          // It sets off at once and eases to rest: never faster than that.
          assert.ok(
            path[i] - path[i - 1] <= (2 * distance * FRAME) / expected + 1,
            `${label}: no jump`,
          );
        }
        assert.ok(
          Math.abs(frames * FRAME - expected) < 5 * FRAME,
          `${label}: ${frames} frames for ${expected}ms`,
        );
        // And then nothing more: the room is at rest, 0 frames wanted.
        for (let i = 0; i < 30; i++)
          same([world.frame().write, world.frame().active], [null, false]);
      }
      // 3. Heading back: the hand scrolls up into the pan and stops.
      {
        const world = page(b + 40);
        world.frame();
        for (const share of [0.9, 0.8, 0.7]) world.hand(within(share));
        const path = world.rest();
        assert.equal(world.scroll, back, `${label}: back to the room`);
        assert.equal(roomAt(world.scroll), pan.from, label);
        for (let i = 1; i < path.length; i++)
          assert.ok(path[i] <= path[i - 1], `${label}: one way back`);
      }
      // 4. Not known (a page opened or restored inside a pan): the nearer.
      for (const [share, room, middle] of [
        [0.3, pan.from, back],
        [0.7, pan.to, onward],
      ]) {
        const world = page(within(share));
        world.rest();
        assert.equal(world.scroll, middle, `${label}: the nearer room`);
        assert.equal(roomAt(world.scroll), room);
      }
      // 5. A slip past a room's edge is only put back on that edge,
      // whichever way the hand was heading.
      {
        const world = page(a - 30);
        world.frame();
        world.hand(Math.ceil(a) + Math.floor(timing.edge / 2));
        world.rest();
        assert.equal(world.scroll, Math.floor(a), `${label}: a slip, back`);
        const back = page(b + 30);
        back.frame();
        back.hand(Math.floor(b) - Math.floor(timing.edge / 2));
        back.rest();
        assert.equal(back.scroll, Math.ceil(b), `${label}: a slip, on`);
      }
      // 6. The hand takes the page back. While a carry runs, the hand
      // scrolls the other way: that frame nothing is written, the carry is
      // over, and once the hand rests again the page goes where it now heads.
      {
        const world = page(a - 40);
        world.frame();
        world.hand(within(0.3));
        for (let i = 0; i < Math.ceil(timing.rest / FRAME) + 6; i++)
          world.frame();
        assert.ok(world.state.run, `${label}: a carry is under way`);
        const out = world.hand(world.scroll - 60);
        same(
          [out.write, world.state.run],
          [null, null],
          `${label}: given back`,
        );
        assert.equal(world.state.heading, -1);
        world.rest();
        assert.equal(world.scroll, back, `${label}: now back`);
        // The same way on: still given back at once, then carried on again.
        const again = page(a - 40);
        again.frame();
        again.hand(within(0.3));
        for (let i = 0; i < Math.ceil(timing.rest / FRAME) + 6; i++)
          again.frame();
        const pushed = again.hand(again.scroll + 50);
        same([pushed.write, again.state.run], [null, null]);
        again.rest();
        assert.equal(again.scroll, onward, `${label}: on again`);
      }
      // 7. A finger on the glass holds the page: nothing starts under it
      // however long it rests, a carry under way stops when it lands, and
      // the rest is counted from when it lifts.
      {
        const world = page(a - 40);
        world.frame();
        world.touching = true;
        world.hand(within(0.5));
        for (let i = 0; i < 120; i++) {
          const out = world.frame();
          same([out.write, out.active], [null, false], `${label}: held`);
        }
        world.touching = false;
        const lifted = world.frame();
        same([lifted.write, lifted.active], [null, true], 'it waits again');
        for (let i = 0; i < Math.ceil(timing.rest / FRAME) + 4; i++)
          world.frame();
        assert.ok(world.state.run, `${label}: carried once the finger lifts`);
        world.touching = true;
        const landed = world.frame();
        same(
          [landed.write, world.state.run],
          [null, null],
          'a finger stops it',
        );
        world.touching = false;
        world.rest();
        assert.equal(world.scroll, onward, `${label}: then on`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 9. Source rules: one scroll owner, no new loop, no invented asset, no
// other image pipeline, one lazy chunk (the homepage's orbit since STEP 2B;
// dormant and gated out of production until then).
// ---------------------------------------------------------------------------
{
  const names = readdirSync(new URL(`../${EXPERIENCE}`, import.meta.url))
    .filter((name) => name.startsWith('atrium-orbit-'))
    .sort();
  same(names, [
    'atrium-orbit-cameras.ts',
    'atrium-orbit-controller.ts',
    'atrium-orbit-doors.ts',
    'atrium-orbit-manifest.ts',
    'atrium-orbit-model.ts',
    'atrium-orbit-preview.css',
    'atrium-orbit-progress.ts',
    'atrium-orbit-transition.ts',
  ]);
  const sources = Object.fromEntries(
    names.map((name) => [name, read(`${EXPERIENCE}${name}`)]),
  );
  const code = Object.entries(sources)
    .filter(([name]) => name.endsWith('.ts'))
    .map(([, text]) => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))
    .join('\n');
  for (const [pattern, why] of [
    [/addEventListener\(/, 'no listeners: the timeline owns scroll and resize'],
    [/requestAnimationFrame|cancelAnimationFrame/, 'no RAF to show plates'],
    [/setTimeout|setInterval/, 'no timers'],
    [/IntersectionObserver|ResizeObserver|MutationObserver/, 'no observers'],
    // The hand's scrolling is never intercepted (no wheel listener, nothing
    // prevented). The one write of the scroll position is the carry's,
    // asserted just below.
    [/scrollBy|scrollIntoView|preventDefault|wheel/, 'no scroll control'],
    [
      /from 'three'|import\('three'|getContext|<canvas|createElement\('canvas'\)/,
      'no WebGL plates',
    ],
    [/gsap|ScrollTrigger|lenis|framer-motion|from 'motion'/i, 'no library'],
    [/new Image\(|fetch\(/, 'the existing scene-image pipeline only'],
    [
      /aria-live|role="status"|role='status'/,
      'no announcements while scrolling',
    ],
    [/Math\.random/, 'deterministic'],
    [/useState|useEffect|'use client'/, 'no React state per frame'],
  ])
    assert.doesNotMatch(code, pattern, why);
  // A room change is carried through (owner decision, 2026-10-09): the
  // controller writes the scroll position in one place, at once (the site
  // smooths anchors globally), and only what the carry decided.
  assert.equal(code.match(/scrollTo/g).length, 1, 'one write: the carry');
  assert.match(
    sources['atrium-orbit-controller.ts'],
    /if \(next\.write !== null\)\s*window\.scrollTo\(\{ top: next\.write, behavior: 'instant' \}\);/,
  );
  assert.match(
    sources['atrium-orbit-controller.ts'],
    /import \{ prepareSceneImage, type SceneImagePreparation \} from '\.\/scene-image';/,
  );
  const css = sources['atrium-orbit-preview.css'].replace(
    /\/\*[\s\S]*?\*\//g,
    '',
  );
  assert.doesNotMatch(
    css,
    /rotate|skew|perspective|matrix3d|@keyframes|transition:|animation:/,
  );
  // No magic plate paths: only the manifest names Tier B files.
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(new URL(`../${dir}`, import.meta.url), {
      withFileTypes: true,
    })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) walk(`${path}/`);
      else if (
        /\.(tsx?|css|json)$/.test(entry.name) &&
        /world-atrium-(arrival|living|bedroom|bathroom|kitchen)/.test(
          read(path),
        ) &&
        path !== `${EXPERIENCE}atrium-orbit-manifest.ts`
      )
        offenders.push(path);
    }
  };
  for (const dir of ['app/', 'components/', 'data/', 'lib/']) walk(dir);
  same(offenders, [], 'plate names live in the manifest only');
  // The gate. From PASS 6A to STEP 2: development or a preview build, and
  // ?atriumOrbit=1. Since STEP 2B the room orbit is the homepage's orbit:
  // every URL but ?atriumOrbit=0, still through one dynamic import, with
  // the portal orbit left in place when the load fails.
  const timeline = read(`${EXPERIENCE}home-story-timeline.ts`);
  assert.match(
    timeline,
    /if \(new URLSearchParams\(window\.location\.search\)\.get\('atriumOrbit'\) !== '0'\) \{\s*roomOrbitPending = true;\s*void import\('\.\/atrium-orbit-controller'\)\.then\(/,
  );
  assert.doesNotMatch(timeline, /VITE_ATRIUM_ORBIT_PREVIEW/);
  assert.equal(
    timeline.match(/import\('\.\/atrium-orbit-controller'\)/g).length,
    2,
    'one load and one type reference',
  );
  assert.doesNotMatch(
    timeline,
    /from '\.\/atrium-orbit-/,
    'never a static import',
  );
  // PASS 6A.5: two normalised domains, each clamped over its own span.
  // STEP 2: the share of that span travelled becomes story progress through
  // the pace table (one to one under reduced motion).
  assert.match(
    timeline,
    /const share = clamp\(\(position - geometry\.top\) \/ geometry\.span\);\s*return still \? share : pacing\.story\(share\);/,
    'baseStoryProgress: the approved journey span, clamped, then paced',
  );
  assert.match(timeline, /const p = paced\(scroll\);/);
  assert.match(
    timeline,
    /const roomOrbitProgress =\s*roomOrbit && geometry\.orbit > 0 && sceneImage === 'ready'\s*\? clamp\(\(scroll - geometry\.top - geometry\.span\) \/ geometry\.orbit\)\s*: 0;/,
    'roomOrbitProgress: the appended span only, clamped',
  );
  assert.match(
    timeline,
    /roomOrbit\?\.update\(\{\s*baseStoryProgress: p,\s*roomOrbitProgress,/,
  );
  // Orbit-mode UI (PASS 6A.5, owner decisions of PASS 6A.75): only under
  // the preview attribute, the approved copy never shows and Arrival (no
  // data-atrium-room) hides the four room labels; the production fallback
  // never sees a data-atrium-* selector or attribute.
  assert.match(
    css,
    /\.home-story-stage\s+\.hc-worlds\[data-atrium-orbit-preview\]\s+> \.hc-atrium-copy:not\(\.hc-room-orbit-copy\) \{\s*display: none;\s*\}/,
    'orbit mode: no approved "Enter the worlds." copy',
  );
  assert.match(
    css,
    /\.home-story-stage\s+\.hc-worlds\[data-atrium-orbit-preview\]:not\(\[data-atrium-room\]\)\s+> \.hc-atrium-rooms \{\s*visibility: hidden;\s*\}/,
    'Arrival hides the four room labels (and their tab stops)',
  );
  // ENTER THE WORLD is never styled or written by Tier B: the timeline keeps
  // writing its opacity and inert state, now from the late-Kitchen reveal.
  assert.doesNotMatch(css, /hc-atrium-cta|data-world-gateway/);
  for (const rule of css.match(/[^{}]+\{/g))
    if (/hc-atrium-(cta|copy)\b/.test(rule) && !/hc-room-orbit/.test(rule))
      assert.match(rule, /\[data-atrium-orbit-preview\]/, rule.trim());
  const atriumData = [];
  const sweep = (dir) => {
    for (const entry of readdirSync(new URL(`../${dir}`, import.meta.url), {
      withFileTypes: true,
    })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) sweep(`${path}/`);
      else if (
        /\.(tsx?|css)$/.test(entry.name) &&
        !entry.name.startsWith('atrium-orbit-') &&
        /data-atrium-|atriumRoom|atriumOrbitPreview/.test(read(path))
      )
        atriumData.push(path);
    }
  };
  for (const dir of ['app/', 'components/', 'lib/', 'hooks/']) sweep(dir);
  same(atriumData, [], 'orbit-mode attributes live only in the Tier B files');
  // Arrival: the controller clears and hides every editorial element.
  const controller = sources['atrium-orbit-controller.ts'];
  assert.match(
    controller,
    /editorial\.hidden = indicator\.hidden = !room;/,
    'Arrival: no room copy, CTA, counter or indicator',
  );
  assert.doesNotMatch(controller, /'(00|0) \/ 05'|ARRIVAL'/);
  // PASS 6A.75: the existing WorldGatewayLink is neither duplicated nor
  // written by Tier B, and still goes to /world.
  assert.equal(
    read(`${EXPERIENCE}worlds-chapter.tsx`).match(/<WorldGatewayLink\b/g)
      .length,
    1,
    'one WorldGatewayLink',
  );
  assert.match(
    read('components/world/world-gateway-link.tsx'),
    /href=\{WORLD_PATH\}[\s\S]*data-world-gateway=""/,
  );
  assert.match(
    read('data/world-building.ts'),
    /export const WORLD_PATH = '\/world';/,
  );
  // Code only: comments may name the gateway they describe.
  const tierBCode = Object.entries(sources)
    .map(([name, text]) =>
      text.replace(
        name.endsWith('.css')
          ? /\/\*[\s\S]*?\*\//g
          : /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
        '',
      ),
    )
    .join('\n');
  assert.doesNotMatch(
    tierBCode,
    /WorldGatewayLink|data-world-gateway|ENTER THE WORLD'|'\/world'|createElement\('a'\)[\s\S]{0,80}\/world/,
    'no second gateway',
  );
  assert.doesNotMatch(
    controller,
    /gateway\??\.(style|inert|hidden|setAttribute|removeAttribute|remove\(|click)/,
    'Tier B never writes the gateway',
  );
  // Room previews stay in the small indicator: no portal nodes, no orbiting
  // room imagery, no ellipse, no portal-orbit coupling.
  assert.doesNotMatch(
    tierBCode,
    /hc-room-portal|data-room-portal|data-room-orbit|--orbit-|Math\.(cos|sin|atan2)|radiusX|ellipse/,
    'no orbiting room portals',
  );
  assert.match(
    controller,
    /add\(thumbFrame, image\);/,
    'thumbnails stay in the indicator',
  );
  // Zone I: the indicator yields to the returning gateway by the same reveal.
  assert.match(
    controller,
    /property\(indicator, '--atrium-indicator', next\.indicator\.toFixed\(4\)\)/,
  );
  assert.match(
    css,
    /\.hc-room-orbit-indicator \{\s*opacity: calc\(var\(--atrium-indicator, 1\) \* var\(--atrium-editorial, 0\)\);/,
    'the indicator yields zone I to the returning gateway',
  );
  // The approved Atrium is never moved by Tier B: not the photograph, the
  // camera or the backdrop. Only its own plate layers take a pose (PASS
  // 6B.0: the plate that pushes in from the wide Atrium is a second drawing
  // of the same file, inside the stage).
  assert.doesNotMatch(
    controller,
    /scene3-camera|data-scene3|hc-atrium-camera|backdrop\??\.style|hc-room-focus/,
    'the approved Atrium, its camera and its backdrop are never written',
  );
  assert.equal(
    (controller.match(/'transform'/g) ?? []).length,
    1,
    'only the plate layers take a transform',
  );
  // Every provisional number lives in the one timing config.
  for (const name of [
    'atrium-orbit-controller.ts',
    'atrium-orbit-transition.ts',
    'atrium-orbit-manifest.ts',
  ])
    assert.doesNotMatch(
      sources[name],
      /revealFrom:|revealTo:|interactiveAt:|holds:|movement:|uiSwitchAt:|editorialOut:|gatewayOut:|editorialInteractiveAt:|weight:/,
      `${name}: timing only in ATRIUM_ORBIT_TIMING`,
    );
  // WebP-only runtime, documented consistently.
  const spec = read('docs/TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md');
  const contract = read('docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md');
  assert.doesNotMatch(spec, /AVIF and WebP|AVIF\/WebP|\{avif,webp\}/i);
  assert.match(spec, /\*\*WebP\*\* responsive variants/);
  assert.match(contract, /\| Formats \| `\['webp'\]` only/);
  assert.doesNotMatch(contract, /\['avif', 'webp'\]/);
  // Nothing else in the app reaches the dormant modules.
  const importers = [];
  const scan = (dir) => {
    for (const entry of readdirSync(new URL(`../${dir}`, import.meta.url), {
      withFileTypes: true,
    })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) scan(`${path}/`);
      else if (
        /\.tsx?$/.test(entry.name) &&
        !entry.name.startsWith('atrium-orbit-') &&
        /atrium-orbit-/.test(read(path))
      )
        importers.push(path);
    }
  };
  for (const dir of ['app/', 'components/', 'lib/', 'hooks/']) scan(dir);
  // The timeline loads them; the room entry reads the doors' outlines. The
  // entry is the one part that listens and knows time, which is why it is
  // not one of these modules (their rules above would forbid it). Only the
  // controller loads it, so it travels in the same lazy chunk.
  same(importers, [
    `${EXPERIENCE}home-story-timeline.ts`,
    `${EXPERIENCE}room-door-entry.ts`,
  ]);
  const enterers = [];
  const seek = (dir) => {
    for (const entry of readdirSync(new URL(`../${dir}`, import.meta.url), {
      withFileTypes: true,
    })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) seek(`${path}/`);
      else if (
        /\.tsx?$/.test(entry.name) &&
        /from '[^']*room-door-entry'|import\('[^']*room-door-entry'\)/.test(
          read(path),
        )
      )
        enterers.push(path);
    }
  };
  for (const dir of ['app/', 'components/', 'lib/', 'hooks/']) seek(dir);
  same(
    enterers,
    [`${EXPERIENCE}atrium-orbit-controller.ts`],
    'only the controller loads the room entry',
  );
  assert.match(
    sources['atrium-orbit-controller.ts'],
    /import \{ createRoomDoorEntry \} from '\.\/room-door-entry';/,
  );
}

// ---------------------------------------------------------------------------
// 9b. PASS 6A.96: live harness QA. (A) The approved Atrium stays in view for
// the whole harness: the exposure shade is drawn in two parts, and the part
// that backs the copy follows the editorial UI. (B) The final release.
// (C) The engineering readout only on explicit request. Source rules first,
// then the real controller in a small owned DOM double.
// ---------------------------------------------------------------------------
{
  const BACKDROP = '.hc-atrium-backdrop';
  const PREVIEW = `.home-story-stage .hc-worlds[data-atrium-orbit-preview] ${BACKDROP}`;
  const MEDIA = {
    base: null,
    tablet: '(min-width: 768px) and (max-width: 1199px)',
    phone: '(max-width: 767px)',
    landscape:
      '(max-width: 1199px) and (max-height: 540px) and (orientation: landscape)',
  };
  // Top-level rules and one level of @media, in source order.
  const rules = (text) => {
    const css = text.replace(/\/\*[\s\S]*?\*\//g, '');
    const out = [];
    const walk = (from, to, media) => {
      let at = from;
      while (at < to) {
        const open = css.indexOf('{', at);
        if (open < 0 || open >= to) break;
        let depth = 1,
          close = open + 1;
        for (; depth && close < to; close++)
          depth += css[close] === '{' ? 1 : css[close] === '}' ? -1 : 0;
        const head = css.slice(at, open).replace(/\s+/g, ' ').trim();
        if (head.startsWith('@media'))
          walk(open + 1, close - 1, head.slice(6).trim());
        else
          out.push({
            media,
            selector: head,
            body: css.slice(open + 1, close - 1),
          });
        at = close;
      }
    };
    walk(0, css.length, null);
    return out;
  };
  const declarations = (body) =>
    Object.fromEntries(
      body
        .split(';')
        .map((d) => d.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .map((d) => [
          d.slice(0, d.indexOf(':')).trim(),
          d.slice(d.indexOf(':') + 1).trim(),
        ]),
    );
  // "linear-gradient(a, b c%), linear-gradient(…)" → [{ angle, stops }].
  const gradients = (value) =>
    [...value.matchAll(/linear-gradient\(([^()]*)\)/g)].map(([, inner]) => {
      const [angle, ...stops] = inner
        .split(',')
        .map((part) => part.replace(/\s+/g, ' ').trim());
      return { angle, stops };
    });
  const shade = (list, media, selector) => {
    const found = list.filter(
      (rule) => rule.media === media && rule.selector === selector,
    );
    assert.equal(found.length, 1, `${selector} @ ${media ?? 'base'}`);
    return found[0];
  };
  const preview = rules(read(`${EXPERIENCE}atrium-orbit-preview.css`));
  const chapter = rules(read(`${EXPERIENCE}worlds-chapter.css`));
  const storyCss = rules(read(`${EXPERIENCE}home-story.css`));
  const approved = {
    base: shade(chapter, MEDIA.base, `${BACKDROP}::after`),
    tablet: shade(chapter, MEDIA.tablet, `${BACKDROP}::after`),
    phone: shade(chapter, MEDIA.phone, `${BACKDROP}::after`),
    landscape: shade(
      storyCss,
      MEDIA.landscape,
      `.home-story-stage ${BACKDROP}::after`,
    ),
  };
  // (A) Drawn apart, the two parts are exactly the approved shade: the
  // zenith band is the approved vertical gradient up to its first
  // transparent stop, the copy field is the rest (from its last transparent
  // stop) and any second layer. Nothing lies between the two cuts, so with
  // both whole every pixel is the approved one.
  for (const [layout, media] of Object.entries(MEDIA)) {
    const [vertical, ...others] = gradients(
      declarations(approved[layout].body).background,
    );
    assert.equal(vertical.angle, '180deg', layout);
    const clear = vertical.stops
      .map((stop, i) => (stop.startsWith('transparent') ? i : -1))
      .filter((i) => i >= 0);
    assert.ok(clear.length >= 1 && clear[0] === 1, `${layout}: a zenith band`);
    assert.ok(
      vertical.stops
        .slice(clear[0], clear.at(-1) + 1)
        .every((stop) => stop.startsWith('transparent')),
      `${layout}: the cut is lossless`,
    );
    const zenith = declarations(
      shade(preview, media, `${PREVIEW}::after`).body,
    );
    const field = declarations(
      shade(preview, media, `${PREVIEW}::before`).body,
    );
    same(
      gradients(zenith.background),
      [{ angle: '180deg', stops: vertical.stops.slice(0, clear[0] + 1) }],
      `${layout}: the zenith band keeps the header readable`,
    );
    same(
      gradients(field.background),
      [
        { angle: '180deg', stops: vertical.stops.slice(clear.at(-1)) },
        ...others,
      ],
      `${layout}: the copy field is the rest of the approved shade`,
    );
    // The zenith band changes its gradient only: it keeps following the
    // bridge's exposure through the unchanged story rule.
    same(Object.keys(zenith), ['background'], layout);
    if (layout !== 'base')
      same(Object.keys(field), ['background'], `${layout}: gradient only`);
  }
  same(
    declarations(
      shade(storyCss, null, `.home-story-stage ${BACKDROP}::after`).body,
    ),
    { opacity: 'var(--world-exposure, 1)' },
    'the exposure rule is the approved one',
  );
  // The copy field shows only with the editorial UI, above every plate.
  const field = declarations(shade(preview, null, `${PREVIEW}::before`).body);
  assert.equal(
    field.opacity,
    'calc(var(--world-exposure, 1) * var(--atrium-editorial, 0))',
    'no copy, no copy shade: Arrival and the release show the Atrium',
  );
  same(
    [field.content, field.position, field.inset, field['z-index']],
    ["''", 'absolute', '0', '2'],
  );
  // Later rules win at equal specificity: short landscape comes last.
  const order = Object.values(MEDIA).map((media) =>
    preview.findIndex(
      (rule) => rule.media === media && rule.selector === `${PREVIEW}::before`,
    ),
  );
  assert.ok(
    order.every((index, i) => index >= 0 && (!i || index > order[i - 1])),
  );
  // Nothing in the preview hides, fades or moves the Atrium itself: the only
  // backdrop rules are the two shade parts above.
  for (const rule of preview) {
    if (
      /hc-atrium-(camera|backdrop)|hc-scene-picture|scene3/.test(rule.selector)
    )
      assert.match(
        rule.selector,
        /^\.home-story-stage \.hc-worlds\[data-atrium-orbit-preview\] \.hc-atrium-backdrop::(before|after)$/,
        rule.selector,
      );
    if (/^\.(home-story-stage )?\.?hc-worlds(\[[^\]]*\])*$/.test(rule.selector))
      assert.doesNotMatch(
        rule.body,
        /\b(display|visibility|opacity|clip-path|background)\s*:/,
        'the Atrium section is never hidden by the preview',
      );
  }
  // PASS 6B.0: a plate is a box of the plate's ratio that covers the stage
  // (so the controller's percentages are shares of the picture on every
  // screen); the stage is its own stacking context, under both shades; the
  // layer on top is the frame's.
  const plateRule = declarations(
    shade(preview, null, '.hc-room-orbit-plate').body,
  );
  same(
    [
      plateRule.position,
      plateRule.top,
      plateRule.left,
      plateRule.height,
      plateRule['min-width'],
      plateRule['aspect-ratio'],
    ],
    ['absolute', '0', '0', '100%', '100%', '1672 / 941'],
  );
  assert.equal(
    declarations(shade(preview, null, '.hc-room-orbit-stage').body).isolation,
    'isolate',
  );
  same(
    declarations(
      shade(preview, null, ".hc-room-orbit-plate[data-plate-role='over']").body,
    ),
    { 'z-index': '1' },
  );
  // STEP 2B: the orbit's span belongs to the story's own distances, so the
  // page has its final height before this stylesheet arrives: 380svh for the
  // camera's travel between four rooms (160svh would rush it: a pan of half
  // a screen in a seventh of one), 160svh under reduced motion.
  same(
    preview.filter((rule) => /--story-orbit-height/.test(rule.body)),
    [],
    'the orbit stylesheet never changes the page height',
  );
  same(
    storyCss
      .filter((rule) => /--story-orbit-height:/.test(rule.body))
      .map((rule) => [
        rule.media,
        declarations(rule.body)['--story-orbit-height'],
      ]),
    [
      [null, '160svh'],
      ['(prefers-reduced-motion: no-preference)', '380svh'],
    ],
    'the room orbit: 380svh, 160svh under reduced motion',
  );
  // The plates carry their own fascia labels; the HTML ones, placed for the
  // wide Atrium, leave the desktop layout only.
  same(
    preview
      .filter(
        (rule) =>
          rule.selector.endsWith('hc-atrium-rooms') &&
          /display: none/.test(rule.body),
      )
      .map((rule) => [rule.media, rule.selector]),
    [
      [
        '(min-width: 1200px)',
        ".home-story-stage .hc-worlds[data-atrium-orbit-preview='plates'] > .hc-atrium-rooms",
      ],
    ],
  );
  // One value carries the whole editorial UI in and out.
  same(
    declarations(
      shade(
        preview,
        null,
        '.home-story-stage .hc-worlds[data-atrium-orbit-preview] > :is(.hc-room-orbit-copy, .hc-atrium-rooms)',
      ).body,
    ),
    { opacity: 'var(--atrium-editorial, 0)' },
  );
  same(
    declarations(shade(preview, MEDIA.phone, '.hc-room-orbit-indicator').body)
      .opacity,
    'var(--atrium-editorial, 0)',
    'phones: the indicator keeps its place but leaves with the copy',
  );
  const controllerSource = read(`${EXPERIENCE}atrium-orbit-controller.ts`);
  // PASS 6B.1: nothing in Tier B is promoted to its own texture. A promoted
  // plate is resampled and softer than the same plate at rest, so each move
  // would begin and end with a snap of the whole picture; plates are posed
  // by 2D transforms and drawn directly instead.
  assert.doesNotMatch(
    controllerSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''),
    /will-change|willChange|translate3d|translateZ|backface/,
    'the controller never promotes a plate',
  );
  assert.ok(
    preview.every(
      (rule) =>
        !/will-change|translate3d|translateZ|backface-visibility/.test(
          rule.body,
        ),
    ),
    'the preview stylesheet never promotes a layer',
  );
  assert.match(
    controllerSource,
    /`translate\(\$\{percent\(layer\.x\)\}, \$\{percent\(layer\.y\)\}\) scale\(\$\{scaleOf\(layer\)\}\)`/,
    'a plate is posed by a 2D transform',
  );
  // One scale, or across and down for the push's turn: still 2D, no skew,
  // rotation, matrix or perspective.
  assert.match(
    controllerSource,
    /const scaleOf = \(\{ scale, scaleY = scale \}: PlateLayer\) =>\s*scaleY\.toFixed\(5\) === scale\.toFixed\(5\)\s*\? scale\.toFixed\(5\)\s*: `\$\{scale\.toFixed\(5\)\}, \$\{scaleY\.toFixed\(5\)\}`;/,
  );
  assert.doesNotMatch(
    controllerSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''),
    /matrix\(|matrix3d|skew|rotate|perspective/,
    'never a skew, rotation or perspective',
  );
  assert.match(
    controllerSource,
    /property\(worlds, '--atrium-editorial', presence\.toFixed\(4\)\)/,
  );
  // (C) Off by default; the node is created only on explicit request.
  assert.match(
    controllerSource,
    /\{ diagnostics = false \}: AtriumOrbitOptions = \{\},/,
  );
  assert.match(
    controllerSource,
    /const diagnostic = diagnostics\s*\? element\('p', 'hc-room-orbit-diagnostic'\)\s*: null;/,
  );
  assert.equal(
    controllerSource.match(/hc-room-orbit-diagnostic/g).length,
    1,
    'one readout node, in one place',
  );

  // The real controller in a small owned DOM double.
  class Style {
    values = new Map();
    setProperty(name, value) {
      this.values.set(name, value);
    }
    getPropertyValue(name) {
      return this.values.get(name) ?? '';
    }
    removeProperty(name) {
      this.values.delete(name);
    }
  }
  class Node {
    attrs = new Map();
    style = new Style();
    children = [];
    parentNode = null;
    dataset = {};
    hidden = false;
    inert = false;
    textContent = '';
    queries = {};
    constructor(tag, className = '') {
      this.tagName = tag.toUpperCase();
      this.className = className;
    }
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    }
    getAttribute(name) {
      return this.attrs.has(name) ? this.attrs.get(name) : null;
    }
    hasAttribute(name) {
      return this.attrs.has(name);
    }
    removeAttribute(name) {
      this.attrs.delete(name);
    }
    appendChild(child) {
      return this.insertBefore(child, null);
    }
    insertBefore(child, reference) {
      child.remove();
      child.parentNode = this;
      const at = reference ? this.children.indexOf(reference) : -1;
      if (at < 0) this.children.push(child);
      else this.children.splice(at, 0, child);
      return child;
    }
    get nextSibling() {
      const siblings = this.parentNode?.children ?? [];
      return siblings[siblings.indexOf(this) + 1] ?? null;
    }
    remove() {
      if (!this.parentNode) return;
      const siblings = this.parentNode.children;
      siblings.splice(siblings.indexOf(this), 1);
      this.parentNode = null;
    }
    querySelector(selector) {
      return this.queries[selector] ?? null;
    }
    querySelectorAll(selector) {
      return this.queries[selector] ?? [];
    }
  }
  const tree = (node) => [node, ...node.children.flatMap(tree)];
  const byClass = (root, name) =>
    tree(root).filter((node) => node.className.split(' ').includes(name));
  const allText = (root) =>
    tree(root)
      .map((node) => node.textContent)
      .join(' ');
  // The controller's only use of the window: the carry writes the scroll
  // position (recorded here).
  const scrolled = [];
  const entries = [];
  const controllerModule = (() => {
    const loaded = { exports: {} };
    runInNewContext(
      ts.transpileModule(controllerSource, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
        },
      }).outputText,
      {
        module: loaded,
        exports: loaded.exports,
        console: { warn: () => assert.fail('no camera warning: data is null') },
        document: { createElement: (tag) => new Node(tag) },
        window: { scrollTo: (options) => scrolled.push({ ...options }) },
        require(specifier) {
          if (specifier === './atrium-orbit-preview.css') return {};
          // Entering a room is another module (the one that listens and
          // knows time; check:atrium-doors drives it). Here it is a stand-in
          // that keeps what the controller hands it.
          if (specifier === './room-door-entry')
            return {
              createRoomDoorEntry(host) {
                const entry = { host, destroyed: 0 };
                entries.push(entry);
                return { destroy: () => entry.destroyed++ };
              },
            };
          if (specifier === './scene-image')
            return {
              // Decoded at once: the indicator thumbnails are small.
              prepareSceneImage: (image, callbacks) => ({
                start: () => callbacks.ready(),
                destroy() {},
              }),
            };
          return loadStoryMath(specifier.slice(2));
        },
      },
    );
    return loaded.exports;
  })();
  const harness = (options) => {
    const worlds = new Node('section', 'hc-chapter hc-worlds');
    const camera = worlds.appendChild(new Node('div', 'hc-atrium-camera'));
    const backdrop = camera.appendChild(new Node('div', 'hc-atrium-backdrop'));
    const picture = backdrop.appendChild(
      new Node('picture', 'hc-scene-picture'),
    );
    const image = picture.appendChild(new Node('img'));
    image.setAttribute('src', '/images/home-chapters/worlds-atrium.webp');
    const copy = worlds.appendChild(new Node('div', 'hc-atrium-copy'));
    const eyebrow = copy.appendChild(new Node('p', 'hc-eyebrow'));
    eyebrow.textContent = '3D WORLDS';
    const body = copy.appendChild(new Node('p', 'hc-body'));
    body.textContent = 'Step inside our interiors.';
    copy.queries = {
      '.hc-eyebrow:not(.hc-signoff)': eyebrow,
      '.hc-body': body,
    };
    const rooms = worlds.appendChild(new Node('nav', 'hc-atrium-rooms'));
    const links = ROOMS.map((room) => {
      const link = rooms.appendChild(new Node('a', 'hc-atrium-room-link'));
      link.dataset.room = room;
      link.setAttribute('href', `/worlds/${room}`);
      return link;
    });
    const gateway = worlds.appendChild(new Node('a', 'hc-atrium-cta'));
    gateway.setAttribute('href', '/world');
    worlds.appendChild(new Node('div', 'hc-atrium-baseline'));
    worlds.queries = {
      '.hc-atrium-backdrop': backdrop,
      '.hc-atrium-copy': copy,
      '.hc-atrium-cta': gateway,
      '.hc-atrium-rooms': rooms,
      '.hc-atrium-rooms a[data-room]': links,
    };
    let wakes = 0;
    const controller = controllerModule.createAtriumOrbitController(
      worlds,
      () => wakes++,
      ...(options ? [options] : []),
    );
    const untouched = json([
      [...backdrop.attrs],
      [...image.attrs],
      [...camera.attrs],
      [...gateway.attrs],
    ]);
    return {
      worlds,
      controller,
      // What the controller handed the room entry.
      entry: entries.at(-1),
      links,
      rooms,
      gateway,
      one(name) {
        const found = byClass(worlds, name);
        assert.equal(found.length, 1, name);
        return found[0];
      },
      at: (roomOrbitProgress, baseStoryProgress = 1, reduced = false) =>
        controller.update({
          baseStoryProgress,
          roomOrbitProgress,
          width: 1440,
          height: 900,
          reduced,
        }),
      // The Atrium photograph and its camera are never touched: no style,
      // no attribute, no `hidden`; the backdrop only gains the plate stage.
      atriumIntact() {
        for (const node of [camera, backdrop, picture, image, gateway]) {
          assert.equal(node.style.values.size, 0, `${node.className} style`);
          assert.equal(node.hidden, false);
          assert.equal(node.inert, false);
        }
        assert.equal(
          json([
            [...backdrop.attrs],
            [...image.attrs],
            [...camera.attrs],
            [...gateway.attrs],
          ]),
          untouched,
        );
        same(
          backdrop.children.map((node) => node.className),
          ['hc-scene-picture', 'hc-room-orbit-stage'],
        );
        assert.equal(picture.children[0], image, 'the approved plate stays');
      },
    };
  };
  // A room change is carried through: the controller asks the carry and
  // writes what it decides, at once, in whole px; it gives the page back
  // when told to (null), when the tab hides, and for good when destroyed.
  // Under reduced motion there is no pan to carry through.
  {
    const { MOTION } = loadStoryMath('home-motion');
    const where = { top: 4860, length: 3420 };
    const pan = progress
      .buildOrbitTimeline(TIMING, null)
      .segments.find((s) => s.kind === 'move' && s.from === 'living');
    const inside = Math.round(
      where.top + (pan.start + 0.4 * (pan.end - pan.start)) * where.length,
    );
    const hold = progress
      .buildOrbitTimeline(TIMING, null)
      .segments.find((s) => s.kind === 'hold' && s.state === 'bedroom');
    const room = Math.round(
      where.top + ((hold.start + hold.end) / 2) * where.length,
    );
    const run = (h, { from = 1000, frames = 200, scroll = inside } = {}) => {
      const start = scrolled.length;
      let page = scroll;
      let wanted = true;
      for (let i = 0; i < frames && wanted; i++) {
        wanted = h.controller.carry(
          { scroll: page, now: from + (i * 1000) / 60, touching: false },
          where,
          MOTION.carry,
        );
        if (scrolled.length > start) page = scrolled.at(-1).top;
      }
      return { page, writes: scrolled.slice(start), wanted };
    };
    const h = harness();
    h.at(0.2);
    // Nothing is written while the hand has only just stopped.
    const waiting = run(h, { frames: 3 });
    same([waiting.writes.length, waiting.wanted], [0, true]);
    // Given back and asked afresh: the rest is counted again, then the page
    // is carried on to the room (unknown heading: the nearer one is behind
    // at 0.4, so say the hand came from above the pan first).
    assert.equal(h.controller.carry(null), false);
    h.controller.carry(
      { scroll: inside - 200, now: 0, touching: false },
      where,
      MOTION.carry,
    );
    const carried = run(h);
    assert.equal(carried.page, room, 'on to the Bedroom');
    assert.equal(carried.wanted, false, 'and at rest: no frame wanted');
    assert.ok(carried.writes.length > 10, 'a glide, not a jump');
    for (const write of carried.writes) {
      same(Object.keys(write), ['top', 'behavior']);
      assert.equal(write.behavior, 'instant');
      assert.ok(Number.isInteger(write.top));
    }
    // Hidden tab: a carry under way is dropped; the page stays put.
    h.controller.carry(null);
    h.controller.carry(
      { scroll: inside - 200, now: 0, touching: false },
      where,
      MOTION.carry,
    );
    const partial = run(h, { frames: 12 });
    assert.ok(partial.writes.length > 0 && partial.wanted);
    h.controller.suspend();
    const after = run(h, { frames: 3, scroll: partial.page, from: 9000 });
    assert.equal(after.writes.length, 0, 'dropped: it must rest again first');
    // Reduced motion: no camera move, so nothing to carry through.
    const still = harness();
    still.at(0.2, 1, true);
    const none = run(still);
    same([none.writes.length, none.wanted], [0, false]);
    // Destroyed: never again.
    h.controller.destroy();
    const gone = run(h);
    same([gone.writes.length, gone.wanted], [0, false]);
    still.controller.destroy();
  }
  // A room is entered through its door (room-door-entry.ts). The controller
  // hands the entry the stage, the room links and what is on the stage, and
  // stands still while it plays: no frame is repainted, no carry runs. The
  // wide Atrium's own plate comes onto the stage for it (the stage is what
  // the entry moves), lying exactly on the photograph. Let go, the page's
  // own frame is drawn again.
  {
    const { MOTION } = loadStoryMath('home-motion');
    const t = progress.buildOrbitTimeline(TIMING, null);
    const hold = (state) =>
      t.segments.find((s) => s.kind === 'hold' && s.state === state);
    const mid = (segment) => (segment.start + segment.end) / 2;
    const h = harness();
    const { host } = h.entry;
    assert.equal(host.worlds, h.worlds);
    assert.equal(host.stage, h.one('hc-room-orbit-stage'));
    same(
      host.links.map((link) => link.dataset.room),
      ROOMS,
      'the entry follows the rendered room links',
    );
    const stage = () => ({
      plates: byClass(h.worlds, 'hc-room-orbit-plate')
        .filter((node) => !node.hidden && !node.children[0].hidden)
        .map((node) => [node.dataset.plate, [...node.style.values]]),
      doors: byClass(h.worlds, 'hc-room-orbit-doors')
        .filter((node) => !node.hidden && !node.parentNode.hidden)
        .map((node) => [node.dataset.doors, [...node.style.values]]),
      presence: h.worlds.style.getPropertyValue('--atrium-editorial'),
    });
    // In a room: its doors, on its own plate; the copy's room.
    const living = h.at(mid(hold('living')));
    same(
      host.doors().map(({ view, picture }) => [view, picture.dataset.doors]),
      [['living', 'living']],
    );
    same(
      [host.whole('living'), host.room(), host.reduced(), host.tall()],
      [true, 'living', false, 1],
    );
    same(host.risen(), doorways.doorsRisen(1, ROOMS, false));
    // Held: the frame on stage stays, wherever the page is taken.
    const held = stage();
    host.hold(true);
    for (const p of [0, mid(hold('bedroom')), 1]) {
      assert.equal(h.at(p), living, 'the same frame is handed back');
      same(stage(), held, `nothing repainted at ${p}`);
    }
    const written = scrolled.length;
    assert.equal(
      h.controller.carry(
        { scroll: 6000, now: 0, touching: false },
        { top: 4860, length: 3420 },
        MOTION.carry,
      ),
      false,
      'no carry while a room is entered',
    );
    assert.equal(scrolled.length, written, 'and the page is not written');
    // Let go: the page's own frame again.
    host.hold(false);
    h.at(mid(hold('bedroom')));
    same(
      stage().plates.map(([id]) => id),
      ['bedroom'],
    );
    assert.equal(host.room(), 'bedroom');
    // The wide Atrium at rest: only its doors lie on the photograph. Held,
    // its plate comes under them, at rest on the photograph's own crop.
    h.at(0);
    same(
      [stage().plates, host.doors().map(({ view }) => view)],
      [[], ['arrival']],
    );
    assert.equal(host.whole('arrival'), false);
    host.hold(true);
    same(
      stage().plates.map(([id]) => id),
      ['arrival'],
    );
    assert.equal(host.whole('arrival'), true);
    // In the one box, at rest on the photograph's own crop: nothing moves
    // when it appears.
    const [leaves] = host.doors();
    const box = leaves.picture.parentNode;
    assert.equal(box.dataset.plate, 'arrival');
    same(
      ['transform', 'opacity', 'mask-image'].map((name) =>
        box.style.getPropertyValue(name),
      ),
      [
        `translate(${(-manifest.plateWindowStart('arrival', manifest.plateWindow(1440, 900), 'desktop') * 100).toFixed(3)}%, 0.000%) scale(1.00000)`,
        '1.0000',
        'none',
      ],
    );
    host.hold(false);
    h.at(0);
    same(stage().plates, [], 'and leaves the photograph alone again');
    h.atriumIntact();
    // Home leaving is told to the entry (for a room being entered, that is
    // its arrival), once.
    assert.equal(h.entry.destroyed, 0);
    h.controller.destroy();
    h.controller.destroy();
    assert.equal(h.entry.destroyed, 1);
    host.hold(true);
    assert.equal(byClass(h.worlds, 'hc-room-orbit-stage').length, 0);
  }
  const READOUT =
    /DEVELOPMENT PREVIEW|roomOrbitProgress|segment \d|plate missing|Camera data|gateway reveal/;
  const positions = Array.from({ length: 801 }, (_, i) => i / 800);
  const { buildOrbitTimeline, sampleOrbit, atriumGateway, atriumRelease } =
    progress;

  // (C) The review URL (no option, or diagnostics: false): the harness runs
  // and no technical text is ever in the page.
  for (const options of [undefined, {}, { diagnostics: false }]) {
    const h = harness(options);
    assert.ok(h.worlds.hasAttribute('data-atrium-orbit-preview'), 'harness on');
    for (const p of positions) {
      h.at(p);
      assert.equal(
        byClass(h.worlds, 'hc-room-orbit-diagnostic').length,
        0,
        'clean preview: no readout node',
      );
      assert.doesNotMatch(allText(h.worlds), READOUT, `clean at ${p}`);
    }
    h.atriumIntact();
  }
  // (C) Explicit debug: the readout exists, is decorative, and reports the
  // position, the segment, the hold / move / release, the gateway reveal,
  // the missing plates and the missing camera data.
  {
    const h = harness({ diagnostics: true });
    const readout = h.one('hc-room-orbit-diagnostic');
    assert.equal(readout.parentNode, h.worlds);
    assert.equal(readout.getAttribute('aria-hidden'), 'true');
    const t = buildOrbitTimeline(TIMING, null);
    const mid = (segment) => (segment.start + segment.end) / 2;
    const text = (p) => {
      h.at(p);
      return readout.textContent;
    };
    for (const segment of t.segments) {
      const line = text(mid(segment));
      assert.match(line, /^DEVELOPMENT PREVIEW · Tier B interaction harness/);
      assert.match(line, /roomOrbitProgress \d\.\d{4} · segment \d+\/10 \[/);
      assert.match(line, /gateway reveal \d\.\d{3}/);
      assert.match(line, /editorial \d\.\d{3}/);
      assert.match(line, /Camera data missing: provisional-equal weighting/);
      assert.match(
        line,
        segment.kind === 'hold'
          ? new RegExp(`hold ${segment.state} · 0\\.500 · UI ${segment.state}`)
          : segment.kind === 'move'
            ? new RegExp(`move ${segment.from} → ${segment.to} · local 0\\.500`)
            : /release kitchen · 0\.500 · UI kitchen/,
      );
    }
    assert.match(
      text(0),
      /Arrival production plate missing \(approved Atrium shown\)/,
    );
    for (const [index, room] of ROOMS.entries())
      assert.match(
        text(mid(t.segments[2 + 2 * index])),
        new RegExp(
          `${room[0].toUpperCase()}${room.slice(1)} production plate missing`,
        ),
      );
    assert.match(
      text(1),
      /release kitchen · 1\.000 · UI kitchen · quiet frame/,
    );
    h.atriumIntact();
    h.controller.destroy();
    assert.equal(byClass(h.worlds, 'hc-room-orbit-diagnostic').length, 0);
  }

  // (A) + (B) The whole harness, forward and in reverse.
  for (const reduced of [false, true]) {
    const timing = reduced ? REDUCED : TIMING;
    const t = buildOrbitTimeline(timing, null);
    const release = t.segments.at(-1);
    const h = harness();
    const copy = h.one('hc-room-orbit-copy');
    const indicator = h.one('hc-room-orbit-indicator');
    const title = h.one('hc-room-orbit-title');
    // A view's box holds its plate's picture, then its doors'.
    const picture = (plate) => {
      same(
        plate.children.map((node) => node.className),
        ['hc-room-orbit-picture', 'hc-room-orbit-doors'],
      );
      assert.equal(plate.children[1].dataset.doors, plate.dataset.plate);
      return plate.children[0];
    };
    const snapshot = (p, base = 1) => {
      const frame = h.at(p, base, reduced);
      return {
        frame,
        presence: h.worlds.style.getPropertyValue('--atrium-editorial'),
        room: h.worlds.getAttribute('data-atrium-room'),
        release: h.worlds.getAttribute('data-atrium-release'),
        hidden: [copy.hidden, indicator.hidden],
        inert: [copy.inert, indicator.inert, h.rooms.inert],
        title: allText(title).replace(/\s+/g, ' ').trim(),
        indicator: allText(indicator).replace(/\s+/g, ' ').trim(),
        yield: indicator.style.getPropertyValue('--atrium-indicator'),
        // PASS 6B.0: the plates this position draws.
        plates: byClass(h.worlds, 'hc-room-orbit-plate')
          .filter((plate) => !plate.hidden && !picture(plate).hidden)
          .map((plate) => ({
            id: plate.dataset.plate,
            role: plate.getAttribute('data-plate-role'),
            opacity: plate.style.getPropertyValue('opacity'),
            transform: plate.style.getPropertyValue('transform'),
            mask: plate.style.getPropertyValue('mask-image'),
            webkitMask: plate.style.getPropertyValue('-webkit-mask-image'),
          }))
          .sort((a, b) => STATES.indexOf(a.id) - STATES.indexOf(b.id)),
        // The closed doors that lie on them: a second picture in the
        // plate's own box, so they share its pose, its join and its place
        // in the stack, and add only the leaves' outline.
        doors: byClass(h.worlds, 'hc-room-orbit-doors')
          .filter((doors) => !doors.hidden && !doors.parentNode.hidden)
          .map((doors) => ({
            id: doors.dataset.doors,
            role: doors.parentNode.getAttribute('data-plate-role'),
            opacity: doors.parentNode.style.getPropertyValue('opacity'),
            transform: doors.parentNode.style.getPropertyValue('transform'),
            mask: doors.parentNode.style.getPropertyValue('mask-image'),
            webkitMask:
              doors.parentNode.style.getPropertyValue('-webkit-mask-image'),
            clip: doors.style.getPropertyValue('clip-path'),
            own: [...doors.style.values.keys()],
          }))
          .sort((a, b) => STATES.indexOf(a.id) - STATES.indexOf(b.id)),
      };
    };
    const window = manifest.plateWindow(1440, 900);
    const percent = (value) => `${(value * 100).toFixed(3)}%`;
    const drawnAt = (sample) => {
      const input = transition.plateTransitionInput(
        sample,
        'forward',
        null,
        'desktop',
        window,
        'desktop',
      );
      // A hold rests on its plate; Arrival's is the approved Atrium itself.
      if (!input)
        return sample.activeState === 'arrival'
          ? []
          : [
              [
                sample.activeState,
                'under',
                transition.plateRest(sample.activeState, window, 'desktop'),
              ],
            ];
      const frame = transition.selectPlateTransition(reduced)(input);
      const visible = [
        ['from', input.from],
        ['to', input.to],
      ].filter(([key]) => frame[key].opacity > 0);
      return visible.map(([key, id]) => [
        id,
        visible.length > 1 && key === frame.over ? 'over' : 'under',
        frame[key],
      ]);
    };
    // Scene 2 → reveal → Arrival: before the orbit there is no editorial
    // UI and no copy shade, at any point of the approved journey.
    for (const base of [0, 0.3, 0.64, 0.72, 0.81, 0.865, 0.915, 0.99, 1]) {
      const s = snapshot(0, base);
      same(
        [s.presence, s.room, s.release, s.hidden, s.inert],
        ['0.0000', null, null, [true, true], [true, true, true]],
        `architecture only at base ${base}`,
      );
      same(s.frame, { gateway: 0, gatewayInteractive: false, baseline: 1 });
      // The doors: none before the Atrium's plate is asked for; then the
      // wide Atrium's own, lying where its plate would (the photograph
      // itself is the picture), each leaf as far up as the story has it.
      // Reduced motion has no fall: its doors are shut.
      const risen = doorways.doorsRisen(base, ROOMS, reduced);
      same(s.plates, [], `no plate over the photograph at base ${base}`);
      same(
        s.doors,
        base >= HOME_PRODUCTION.scenePreload &&
          ROOMS.some((room) => risen[room] < 1)
          ? [
              {
                id: 'arrival',
                role: 'under',
                opacity: '1.0000',
                transform: `translate(${percent(-manifest.plateWindowStart('arrival', window, 'desktop'))}, ${percent(0)}) scale(1.00000)`,
                mask: 'none',
                webkitMask: 'none',
                clip: doorways.doorsClip('arrival', risen, window.height),
                own: ['clip-path'],
              },
            ]
          : [],
        `doors at base ${base}`,
      );
      h.atriumIntact();
    }
    const forward = positions.map((p) => snapshot(p));
    const reverse = [...positions]
      .reverse()
      .map((p) => snapshot(p))
      .reverse();
    same(forward, reverse, 'the harness rebuilds every frame in reverse');
    h.atriumIntact();
    forward.forEach((s, i) => {
      const p = positions[i];
      const sample = sampleOrbit(p, t, timing);
      const expected = progress.atriumEditorial(
        sample,
        sample.activeState,
        timing,
      );
      const gateway = atriumGateway(sample, sample.activeState, timing);
      const out = atriumRelease(sample, timing);
      // One state drives everything; the release adds none.
      const room = sample.activeState === 'arrival' ? null : sample.activeState;
      assert.equal(s.room, room, `room at ${p}`);
      assert.equal(
        s.presence,
        expected.presence.toFixed(4),
        `presence at ${p}`,
      );
      same(s.hidden, [!room, !room]);
      same(s.inert, Array(3).fill(!expected.interactive), `focus at ${p}`);
      same(s.frame, {
        gateway: gateway.reveal,
        gatewayInteractive: gateway.interactive,
        baseline: out.editorial,
      });
      assert.equal(s.yield, gateway.indicator.toFixed(4));
      assert.equal(
        s.release,
        sample.phase !== 'release' ? null : out.quiet ? 'quiet' : 'leaving',
      );
      // PASS 6B.0: the controller poses exactly the plates of the pure
      // frame, on the plate's own box (percentages), with the soft edge as
      // a mask; the layer on top is the frame's, whatever the direction.
      const lying = drawnAt(sample).map(([id, role, layer]) => {
        // A soft edge either way round, and the push's ellipse; two mask
        // images add up, so the plate shows through either.
        const parts = [];
        if (layer.edge)
          parts.push(
            layer.edge[0] <= layer.edge[1]
              ? `linear-gradient(90deg, transparent ${percent(layer.edge[0])}, #000 ${percent(layer.edge[1])})`
              : `linear-gradient(270deg, transparent ${percent(1 - layer.edge[0])}, #000 ${percent(1 - layer.edge[1])})`,
          );
        if (layer.iris) {
          const { x, y, rx, ry, whole, alpha } = layer.iris;
          parts.push(
            `radial-gradient(${percent(rx)} ${percent(ry)} at ${percent(x)} ${percent(y)}, ${alpha >= 1 ? '#000' : `rgba(0, 0, 0, ${alpha.toFixed(4)})`} ${percent(whole)}, transparent 100%)`,
          );
        }
        const mask = parts.length ? parts.join(', ') : 'none';
        const down = layer.scaleY ?? layer.scale;
        return {
          id,
          role,
          opacity: layer.opacity.toFixed(4),
          transform:
            layer.x === 0 && layer.y === 0 && layer.scale === 1 && down === 1
              ? 'none'
              : `translate(${percent(layer.x)}, ${percent(layer.y)}) scale(${
                  down.toFixed(5) === layer.scale.toFixed(5)
                    ? layer.scale.toFixed(5)
                    : `${layer.scale.toFixed(5)}, ${down.toFixed(5)}`
                })`,
          mask,
          webkitMask: mask,
        };
      });
      same(s.plates, lying, `plates at ${p}`);
      // The doors lie on their plates: the same pose, the same join, the
      // same place in the stack, and shut. Where the wide Atrium rests with
      // no plate over the photograph, its doors are drawn all the same.
      same(
        s.doors,
        (lying.length
          ? lying
          : sample.activeState === 'arrival'
            ? [
                {
                  id: 'arrival',
                  role: 'under',
                  opacity: '1.0000',
                  transform: `translate(${percent(-manifest.plateWindowStart('arrival', window, 'desktop'))}, ${percent(0)}) scale(1.00000)`,
                  mask: 'none',
                  webkitMask: 'none',
                },
              ]
            : []
        ).map((plate) => ({
          ...plate,
          clip: doorways.doorsClip(
            plate.id,
            doorways.doorsRisen(1, ROOMS, reduced),
            window.height,
          ),
          // Nothing else is written on the doors: the box carries the rest.
          own: ['clip-path'],
        })),
        `doors at ${p}`,
      );
      if (room) {
        const { phrase, counter, label } =
          model.atriumOrbitState(room).editorial;
        assert.equal(s.title, `Enter ${phrase}`);
        assert.equal(s.indicator, `${counter} ${label}`);
      } else same([s.title, s.indicator], ['Enter', '']);
    });
    // The rooms in order, once each; the release keeps Kitchen.
    same([...new Set(forward.map((s) => s.room))], [null, ...ROOMS]);
    // PASS 6B.0: every view is drawn in turn; with motion, the camera
    // travels (two plates, one over the other, the incoming one joined by a
    // soft edge), and without it plates only change.
    same(
      [...new Set(forward.flatMap((s) => s.plates.map((plate) => plate.id)))],
      reduced ? ROOMS : STATES,
    );
    const travelling = forward.filter((s) => s.plates.length === 2);
    if (reduced) assert.equal(travelling.length, 0, 'reduced: no camera move');
    else {
      assert.ok(travelling.length > 250, 'the camera travels between views');
      assert.ok(
        travelling.every(
          (s) => s.plates.filter((plate) => plate.role === 'over').length === 1,
        ),
      );
      assert.ok(
        travelling.some((s) =>
          /^linear-gradient\(90deg, transparent [\d.]+%, #000 [\d.]+%\)$/.test(
            s.plates.at(-1).mask,
          ),
        ),
        'a pan joins the incoming plate by a soft edge',
      );
      // The push: the wide plate grows more across than down (it turns to
      // face a doorway seen at an angle), and the next view opens out of the
      // doorway through a soft ellipse, alone or with the join beside it.
      assert.ok(
        travelling.some((s) =>
          /scale\(2\.\d+, 1\.\d+\)/.test(s.plates[0].transform),
        ),
        'the push grows the wide plate, wider than tall',
      );
      const opening = travelling.filter((s) =>
        /radial-gradient\([\d.]+% [\d.]+% at [\d.]+% [\d.]+%, (#000|rgba\(0, 0, 0, [\d.]+\)) [\d.]+%, transparent 100%\)$/.test(
          s.plates.at(-1).mask,
        ),
      );
      assert.ok(opening.length > 20, 'the next view opens out of the doorway');
      assert.ok(
        opening.every(
          (s) =>
            s.plates.at(-1).id === 'living' && s.plates[0].id === 'arrival',
        ),
        'only into Living, from the wide Atrium',
      );
      assert.ok(
        opening.every((s) => s.plates.at(-1).role === 'over'),
        'the next view lies on top',
      );
    }
    assert.ok(
      forward.every((s) => s.plates.length <= 2),
      'never more than the two plates of a move',
    );
    assert.ok(
      forward
        .filter((_, i) => positions[i] >= release.start)
        .every((s) => s.room === 'kitchen' && s.title === 'Enter the kitchen.'),
    );
    // (B) Before the sticky stage leaves: nothing visible, nothing focusable.
    const end = forward.at(-1);
    same(
      [end.presence, end.release, end.inert, end.frame],
      [
        '0.0000',
        'quiet',
        [true, true, true],
        { gateway: 0, gatewayInteractive: false, baseline: 0 },
      ],
      'the stage reaches the Footer as a quiet architectural frame',
    );
    const quiet = forward.filter((s) => s.release === 'quiet');
    assert.ok(quiet.length >= 10, 'the quiet frame is held');
    assert.ok(
      quiet.every((s) => s.presence === '0.0000' && s.frame.gateway === 0),
    );
    const leaving = forward.filter((s) => s.release === 'leaving');
    assert.ok(leaving.length >= 20);
    assert.ok(
      leaving.every(
        (s, i) => !i || Number(s.presence) <= Number(leaving[i - 1].presence),
      ),
    );
    // Whole through the rooms: the copy shade is back with the copy.
    assert.ok(
      forward.some((s) => s.room === 'living' && s.presence === '1.0000') &&
        forward.some((s) => s.room === 'kitchen' && s.presence === '1.0000'),
    );
    // Destroyed: every trace is gone and the labels take focus again.
    h.at(1, 1, reduced);
    assert.ok(h.rooms.inert);
    h.controller.destroy();
    assert.equal(
      tree(h.worlds).filter((node) => /hc-room-orbit-/.test(node.className))
        .length,
      0,
    );
    same(
      [...h.worlds.attrs.keys()].filter((name) =>
        name.startsWith('data-atrium-'),
      ),
      [],
    );
    assert.equal(h.worlds.style.getPropertyValue('--atrium-editorial'), '');
    assert.equal(h.rooms.inert, false);
    same(h.controller.update({}), {
      gateway: 0,
      gatewayInteractive: false,
      baseline: 1,
    });
  }
}

// ---------------------------------------------------------------------------
// 10. PASS 6A.9: the studio delivery intake. Synthetic deliveries (flat grey
// images and random rigs, in the OS temp folder, removed afterwards) prove
// that incomplete or inconsistent packages are rejected early, that
// tolerances are warnings, and that nothing is ever auto-approved.
// ---------------------------------------------------------------------------
{
  const scratch = mkdtempSync(path.join(tmpdir(), 'tp3d-atrium-intake-'));
  const SIZES = {
    preview: { desktop: [1600, 900], portrait: [720, 1560] },
    master: { desktop: [3344, 1882], portrait: [1290, 2796] },
  };
  const grey = (
    file,
    [width, height],
    { profile = true, jpeg = false } = {},
  ) => {
    let image = sharp({
      create: { width, height, channels: 3, background: '#8a8a8a' },
    });
    if (profile) image = image.withIccProfile('srgb');
    return (jpeg ? image.jpeg() : image.png()).toFile(file);
  };
  /** A complete, consistent delivery for one phase. */
  const deliver = async (name, phase, { data = rig() } = {}) => {
    const dir = path.join(scratch, name, PHASES[phase].folder);
    mkdirSync(dir, { recursive: true });
    const kind = PHASES[phase].kind;
    for (const plate of expectedPlates()) {
      const size = SIZES[kind][plate.orientation];
      data.cameras[plate.camera].resolution = size;
      data.cameras[plate.camera].aspect = size[0] / size[1];
      await grey(path.join(dir, `${plate.name}.png`), size);
    }
    if (PHASES[phase].rig)
      await grey(path.join(dir, `${RIG_NAME}.png`), [800, 800]);
    writeFileSync(
      path.join(dir, 'world-atrium-cameras.json'),
      JSON.stringify(data, null, 1),
    );
    return { dir, data };
  };
  const rewrite = (dir, mutate) => {
    const file = path.join(dir, 'world-atrium-cameras.json');
    const data = JSON.parse(readFileSync(file, 'utf8'));
    mutate(data);
    writeFileSync(file, JSON.stringify(data));
  };
  const has = (list, pattern) => list.some((message) => pattern.test(message));
  try {
    // The manual command never needs a delivery: NOT READY, exit 0; the
    // PASS 6B.1 entry gate (--strict) fails instead.
    const cli = (...args) =>
      spawnSync(
        process.execPath,
        [
          fileURLToPath(
            new URL('./check-atrium-orbit-assets.mjs', import.meta.url),
          ),
          ...args,
        ],
        { encoding: 'utf8' },
      );
    const empty = path.join(scratch, 'nothing');
    {
      const run = cli('--root', empty);
      assert.equal(run.status, 0, run.stderr);
      assert.match(run.stdout, /STATUS: NOT READY — no studio delivery found/);
      assert.equal(cli('--root', empty, '--strict').status, 1);
      assert.equal(cli('--root', empty, '--phase', '1', '--strict').status, 1);
      assert.equal(DELIVERY_ROOT, 'work/atrium-orbit/studio');
      const report = await inspectDelivery({ dir: empty, phase: 1 });
      assert.equal(statusOf(report), 'NOT READY');
    }
    same(
      expectedPlates().map((plate) => plate.name),
      STATES.flatMap((id) => [
        `world-atrium-${id}`,
        `world-atrium-${id}-portrait`,
      ]),
      'ten plates, named by the manifest',
    );

    // A complete, consistent Phase 1 package: no errors, no warnings, yet
    // still "human review required", never "approved".
    const good = await deliver('good', 1);
    {
      const report = await inspectDelivery({ dir: good.dir, phase: 1 });
      same(report.errors, [], 'a complete Phase 1 package');
      same(report.warnings, []);
      assert.equal(statusOf(report), 'NO BLOCKING ERRORS');
      assert.ok(report.human.length >= 5, 'human review is always listed');
      const text = formatReport(report);
      assert.match(text, /HUMAN REVIEW/);
      assert.match(
        text,
        /human review still required \(nothing is approved by this script\)/,
      );
      assert.doesNotMatch(text, /APPROVED|PASSED|ACCEPTED/);
      const run = cli('--dir', good.dir, '--phase', '1', '--strict');
      assert.equal(run.status, 0, run.stdout + run.stderr);
    }

    // ERROR: blocks intake.
    const blocked = async (name, phase, damage, pattern) => {
      const { dir } = await deliver(name, phase);
      await damage(dir);
      const report = await inspectDelivery({ dir, phase });
      assert.ok(has(report.errors, pattern), `${pattern}: ${json(report)}`);
      assert.equal(statusOf(report), 'BLOCKED');
      assert.equal(cli('--dir', dir, '--phase', String(phase)).status, 1);
    };
    await blocked(
      'no-plate',
      1,
      (dir) => rmSync(path.join(dir, 'world-atrium-bathroom.png')),
      /missing plate: world-atrium-bathroom \(desktop\)/,
    );
    await blocked(
      'no-portrait',
      1,
      (dir) => rmSync(path.join(dir, 'world-atrium-kitchen-portrait.png')),
      /missing plate: world-atrium-kitchen-portrait \(portrait\)/,
    );
    await blocked(
      'no-rig',
      1,
      (dir) => rmSync(path.join(dir, `${RIG_NAME}.png`)),
      /missing top-down camera rig/,
    );
    await blocked(
      'no-json',
      1,
      (dir) => rmSync(path.join(dir, 'world-atrium-cameras.json')),
      /missing camera data/,
    );
    await blocked(
      'bad-json',
      1,
      (dir) =>
        writeFileSync(
          path.join(dir, 'world-atrium-cameras.json'),
          '{ "scene": ',
        ),
      /malformed JSON/,
    );
    await blocked(
      'no-camera',
      1,
      (dir) => rewrite(dir, (d) => delete d.cameras.bedroom),
      /camera "bedroom" is missing/,
    );
    await blocked(
      'wrong-order',
      1,
      (dir) => rewrite(dir, (d) => d.steps.reverse()),
      /step 1 must be arrival → living/,
    );
    await blocked(
      'zero-step',
      1,
      (dir) => rewrite(dir, (d) => (d.steps[1].deltaAngleDeg = 0)),
      /non-zero deltaAngleDeg/,
    );
    await blocked(
      'mixed-signs',
      1,
      (dir) => rewrite(dir, (d) => (d.steps[2].deltaAngleDeg *= -1)),
      /change sign/,
    );
    await blocked(
      'focal-mismatch',
      1,
      (dir) => rewrite(dir, (d) => (d.cameras.bathroom.focalLengthMm = 35)),
      /room cameras must share one focal length/,
    );
    await blocked(
      'jpeg-master',
      3,
      async (dir) => {
        rmSync(path.join(dir, 'world-atrium-living.png'));
        await grey(
          path.join(dir, 'world-atrium-living.jpg'),
          SIZES.master.desktop,
          { jpeg: true },
        );
      },
      /world-atrium-living \(desktop\): a final master must be lossless PNG or TIFF/,
    );
    await blocked(
      'small-master',
      3,
      (dir) => grey(path.join(dir, 'world-atrium-kitchen.png'), [1672, 941]),
      /1672×941, the desktop master is exactly 3344×1882/,
    );
    await blocked(
      'small-portrait',
      3,
      (dir) =>
        grey(path.join(dir, 'world-atrium-arrival-portrait.png'), [1080, 2340]),
      /the portrait master is 1290×2796 or larger/,
    );
    await blocked(
      'fake-png',
      3,
      (dir) =>
        grey(path.join(dir, 'world-atrium-bedroom.png'), SIZES.master.desktop, {
          jpeg: true,
        }),
      /a final master must be PNG or TIFF data/,
    );

    // WARNING: a person decides; intake is not blocked.
    const warned = async (name, phase, damage, pattern) => {
      const { dir } = await deliver(name, phase);
      await damage(dir);
      const report = await inspectDelivery({ dir, phase });
      same(report.errors, [], `${name}: ${json(report.errors)}`);
      assert.ok(
        has(report.warnings, pattern),
        `${pattern}: ${json(report.warnings)}`,
      );
      assert.equal(statusOf(report), 'NO BLOCKING ERRORS');
    };
    await warned(
      'arrival-lens',
      1,
      (dir) =>
        rewrite(
          dir,
          (d) =>
            (d.cameras.arrival.focalLengthMm = d.cameras[
              'arrival-portrait'
            ].focalLengthMm = 28),
        ),
      /Arrival uses 28 mm/,
    );
    await warned(
      'eye-height',
      1,
      (dir) => rewrite(dir, (d) => (d.cameras.living.eyeHeight = 1.75)),
      /eye height/,
    );
    await warned(
      'roll',
      1,
      (dir) => rewrite(dir, (d) => (d.cameras.kitchen.rollDeg = 0.4)),
      /roll/,
    );
    await warned(
      'colour',
      1,
      (dir) => rewrite(dir, (d) => (d.colourPipeline.output = 'Display P3')),
      /sRGB/,
    );
    await warned(
      'no-portrait-camera',
      1,
      (dir) => rewrite(dir, (d) => delete d.cameras['living-portrait']),
      /portrait camera "living-portrait" is missing/,
    );
    await warned(
      'wide-lens',
      1,
      (dir) =>
        rewrite(dir, (d) => {
          for (const key of Object.keys(d.cameras))
            d.cameras[key].focalLengthMm = 24;
        }),
      /the spec locks 32 mm/,
    );
    await warned(
      'big-preview',
      1,
      (dir) => grey(path.join(dir, 'world-atrium-living.png'), [3200, 1800]),
      /previews are about 1280–1600 px wide/,
    );
    await warned(
      'odd-aspect',
      1,
      (dir) => grey(path.join(dir, 'world-atrium-bedroom.png'), [1600, 1200]),
      /aspect 1\.3333, expected 1\.7768/,
    );
    await warned(
      'stray-file',
      1,
      (dir) => writeFileSync(path.join(dir, 'render_v7_FINAL.exr'), 'x'),
      /unrecognised file: render_v7_FINAL\.exr/,
    );
    await warned(
      'no-profile',
      3,
      (dir) =>
        grey(path.join(dir, 'world-atrium-living.png'), SIZES.master.desktop, {
          profile: false,
        }),
      /no embedded colour profile/,
    );

    // A complete final delivery; a larger portrait at the same aspect is
    // allowed (spec §13.1) and delivery notes are not "unrecognised".
    {
      const { dir, data } = await deliver('final-good', 3);
      await grey(
        path.join(dir, 'world-atrium-living-portrait.png'),
        [2580, 5592],
      );
      data.cameras['living-portrait'].resolution = [2580, 5592];
      writeFileSync(
        path.join(dir, 'world-atrium-cameras.json'),
        JSON.stringify(data),
      );
      writeFileSync(path.join(dir, 'delivery-notes.txt'), 'notes');
      const report = await inspectDelivery({ dir, phase: 3 });
      same(report.errors, []);
      same(report.warnings, []);
      assert.ok(
        has(report.info, /2580×5592 \(larger than required, same aspect\)/),
      );
      assert.ok(has(report.info, /notes: delivery-notes\.txt/));
    }

    // Cameras stay as approved in Phase 1: a later change is flagged.
    {
      const root = path.join(scratch, 'phases');
      const first = await deliver('phases', 1);
      const moved = clone(first.data);
      moved.cameras.bedroom.position[0] += 0.4;
      moved.cameras['bedroom-portrait'].position[0] += 0.4;
      await deliver('phases', 2, { data: moved });
      const reports = await inspectRoot({ root });
      same(
        reports.map((r) => [r.phase, r.present]),
        [
          [1, true],
          [2, true],
          [3, false],
        ],
      );
      same(reports[0].warnings, []);
      assert.ok(
        has(
          reports[1].warnings,
          /camera "bedroom" changed since the earlier phase \(position\)/,
        ),
      );
      same(reports[1].errors, []);
      const run = cli('--root', root);
      assert.equal(run.status, 0);
      assert.match(run.stdout, /Phase 1 —[\s\S]*Phase 2 —/);
      assert.equal(cli('--root', root, '--phase', '3', '--strict').status, 1);
    }

    // Never wired into the build or another check.
    const scripts = JSON.parse(read('package.json')).scripts;
    assert.equal(
      scripts['check:atrium-orbit-assets'],
      'node scripts/check-atrium-orbit-assets.mjs',
    );
    for (const [name, command] of Object.entries(scripts))
      if (name !== 'check:atrium-orbit-assets')
        assert.doesNotMatch(command, /check-atrium-orbit-assets/, name);
    const intake = read('scripts/check-atrium-orbit-assets.mjs');
    assert.match(
      intake,
      /validateAtriumOrbitCameras/,
      'the shared camera rules',
    );
    assert.doesNotMatch(
      intake,
      /deltaAngleDeg|Math\.sign|focalLengthMm !==/,
      'no second copy of the camera rules',
    );
    assert.doesNotMatch(
      intake,
      /writeFile|mkdir|copyFile|rename\(/,
      'intake only reads',
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// 11. PASS 6A.9: the studio handoff and the delivery checklist agree with
// the locked spec and with what the intake validator expects.
// ---------------------------------------------------------------------------
{
  const handoff = read('docs/TANPHONG_ATRIUM_STUDIO_HANDOFF.md');
  const checklist = read('docs/TANPHONG_ATRIUM_DELIVERY_CHECKLIST.md');
  const contract = read('docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md');
  const spec = read('docs/TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md');
  // The numbers the studio works to, as the spec states them.
  for (const [fact, inSpec] of [
    [/32 mm full-frame-equivalent/, /32 mm full-frame equivalent/],
    [/3344 × 1882/, /3344 × 1882/],
    [/1290 × 2796/, /1290 × 2796/],
    [/1280–1600 px/, /1280–1600 px/],
    [/645–800 px/, /645–800 px/],
    [/1\.60 m/, /1\.60 m/],
    [/48% ±2%/, /48% ±2%/],
    [/36–40%/, /36–40%/],
    [/x 50% ±2%/, /x 50% ±2%/],
    [/Lossless PNG or TIFF/, /Lossless PNG or TIFF/],
  ]) {
    assert.match(handoff, fact, `handoff states ${fact}`);
    assert.match(spec, inSpec, `spec states ${inSpec}`);
  }
  assert.match(handoff, /ONE saved 3D scene/);
  assert.match(handoff, /No AI plates/);
  assert.match(handoff, /the specification wins/);
  assert.match(
    handoff,
    /Sky → Oculus → Arrival → Living → Bedroom → Bathroom → Kitchen/,
  );
  assert.match(handoff, /All four must have the\s+same sign/);
  assert.ok(
    (handoff.match(/STOP\./g) ?? []).length >= 2,
    'stop after Phase 1 and 2',
  );
  assert.match(handoff, /Do not rely on far-wall piers/);
  // Written for the studio: no internal implementation detail.
  assert.doesNotMatch(
    handoff,
    /PASS 6|components\/|scripts\/|yarn |\.tsx?\b|feature flag|aa9ae55|atriumOrbit|work\/atrium|AVIF/i,
    'the handoff carries no internal detail',
  );
  // Every delivery name the validator expects is in both documents.
  for (const plate of expectedPlates()) {
    assert.ok(
      handoff.includes(`${plate.name}.png`),
      `handoff names ${plate.name}`,
    );
  }
  for (const doc of [handoff, checklist]) {
    assert.ok(doc.includes(RIG_NAME));
    assert.ok(doc.includes('world-atrium-cameras.json'));
  }
  for (const phase of Object.values(PHASES)) {
    assert.ok(handoff.includes(`${phase.folder}/`), `handoff: ${phase.folder}`);
    assert.ok(
      checklist.includes(`${DELIVERY_ROOT}/${phase.folder}/`),
      `checklist: ${phase.folder}`,
    );
  }
  assert.ok(contract.includes(`${DELIVERY_ROOT}/{phase-1,phase-2,final}/`));
  // The checklist: three phases, four camera pairs, three classes.
  for (const heading of [
    '## 3. Phase 1',
    '## 4. Phase 2',
    '## 5. Phase 3',
    '**Arrival → Living**',
    '**Living → Bedroom**',
    '**Bedroom → Bathroom**',
    '**Bathroom → Kitchen**',
    '**ERROR**',
    '**WARNING**',
    '**HUMAN REVIEW**',
  ])
    assert.ok(checklist.includes(heading), `checklist has ${heading}`);
  assert.match(checklist, /Nothing is approved by a script/);
  // PASS 6B.1 entry criteria are recorded, and nothing starts before them.
  assert.match(contract, /## 17\. PASS 6B\.1 entry criteria/);
  assert.match(contract, /yarn check:atrium-orbit-assets --phase 1 --strict/);
  assert.match(contract, /Final material plates are \*\*not\*\* required/);
  assert.match(contract, /FINAL VISUAL ORBIT NOT YET\s+IMPLEMENTED/);
}

// ---------------------------------------------------------------------------
// 12. PASS 6A.95: master storage policy. Studio deliveries and lossless
// masters stay out of Git and out of the runtime bundle; no Git LFS; the
// documents say so consistently.
// ---------------------------------------------------------------------------
{
  const repo = fileURLToPath(new URL('..', import.meta.url));
  assert.ok(
    read('.gitignore').split(/\r?\n/).includes('/work/'),
    'work/ (and so work/atrium-orbit/) is git-ignored',
  );
  // Git agrees, where git is available.
  for (const file of [
    `${DELIVERY_ROOT}/phase-1/world-atrium-living.jpg`,
    `${DELIVERY_ROOT}/final/world-atrium-living.tif`,
    'work/atrium-orbit/review/notes.md',
  ]) {
    const run = spawnSync('git', ['check-ignore', '-q', file], { cwd: repo });
    if (run.error) break;
    assert.equal(run.status, 0, `${file} is ignored by git`);
  }
  // Git LFS is not used.
  assert.ok(
    !exists('.gitattributes') || !/filter=lfs/.test(read('.gitattributes')),
    'no Git LFS rule',
  );
  // No lossless master, renderer project file or sequence sits in a tracked
  // or served tree. Runtime plates are WebP.
  const MASTER = /world-atrium-.*\.(png|tiff?|exr|psd|hdr)$/i;
  const SOURCE = /\.(tiff?|exr|blend|max|c4d|ma|mb|hip|3dm)$/i;
  const heavy = [];
  const look = (dir) => {
    if (!exists(dir)) return;
    for (const entry of readdirSync(new URL(`../${dir}`, import.meta.url), {
      withFileTypes: true,
    })) {
      const file = `${dir}${entry.name}`;
      if (entry.isDirectory()) look(`${file}/`);
      else if (MASTER.test(entry.name) || SOURCE.test(entry.name))
        heavy.push(file);
    }
  };
  for (const dir of ['public/', 'assets/', 'data/', 'components/', 'app/'])
    look(dir);
  same(heavy, [], 'no master or renderer file in a tracked or served tree');
  const tracked = spawnSync('git', ['ls-files'], {
    cwd: repo,
    encoding: 'utf8',
  });
  if (!tracked.error && tracked.status === 0)
    same(
      tracked.stdout
        .split('\n')
        .filter(
          (file) =>
            MASTER.test(file) || SOURCE.test(file) || file.startsWith('work/'),
        ),
      [],
      'nothing heavy is tracked',
    );
  // The documents state one policy.
  const handoff = read('docs/TANPHONG_ATRIUM_STUDIO_HANDOFF.md');
  const checklist = read('docs/TANPHONG_ATRIUM_DELIVERY_CHECKLIST.md');
  const contract = read('docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md');
  const spec = read('docs/TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md');
  for (const doc of [handoff, checklist, contract, spec])
    assert.doesNotMatch(
      doc,
      /assets\/home-chapters\/atrium-orbit/,
      'no document keeps masters in a tracked asset folder',
    );
  for (const line of [
    'Lossless masters archived.',
    'Lossless masters **not** added to normal Git',
    'Camera JSON copied to the accepted data path only after approval',
    'Runtime WebP generated from the accepted masters',
    'Runtime WebP dimensions verified',
    'Studio originals retained separately',
    'Git LFS is not used.',
  ])
    assert.ok(checklist.includes(line), `checklist: ${line}`);
  for (const step of [
    'STUDIO MASTER',
    'external / git-ignored source archive',
    'approved master',
    'WebP optimisation pipeline',
    'runtime WebP assets',
  ])
    assert.ok(contract.includes(step), `contract: ${step}`);
  assert.match(contract, /Git LFS is not used/);
  assert.match(
    contract,
    /committed at `data\/world-atrium-cameras\.json` once Phase 1 is approved/,
  );
  assert.match(
    checklist,
    /`data\/world-atrium-cameras\.json`\) \*\*only after this approval\*\*/,
  );
  // The approved handoff decisions stand.
  assert.match(handoff, /phase-1\/[\s\S]*phase-2\/[\s\S]*final\//);
  assert.ok(handoff.includes(`${RIG_NAME}.png`));
  assert.match(handoff, /high-quality JPEG is acceptable for previews only/);
  assert.match(handoff, /\*\*Lossless PNG or TIFF\*\*/);
  assert.match(handoff, /handled by Tân Phong/);
  assert.doesNotMatch(
    handoff,
    /\bgit\b|LFS|\.gitignore/i,
    'no repo detail for the studio',
  );
}

console.log(
  'Atrium orbit foundation passed: Arrival → Living → Bedroom → Bathroom → ' +
    'Kitchen (Arrival without public UI, Living the first public room, ' +
    'four rooms), WebP-only runtime plates, separate base / room orbit ' +
    'progress domains, gated orbit-mode UI (Arrival hides the room labels; ' +
    'the one WorldGatewayLink returns in late Kitchen; no orbiting room ' +
    'portals; the approved Atrium itself never moved), the orbit on comp ' +
    'plates (push in from the wide Atrium, then pans: one picture ' +
    'travelling, its two plates the same pixels on the doorways they share ' +
    'and joined on the pier between; the stage covered at every position on ' +
    'nine screens; exact in reverse; plain changes under reduced motion), ' +
    'the closed doors lying on every plate with its pose and its join ' +
    '(falling as the Atrium arrives, shut through the orbit, the wide ' +
    "Atrium's drawn on the photograph at rest) and the controller standing " +
    'still while a room is entered, the Atrium in view for the ' +
    'whole harness (copy shade = approved shade, shown only with the ' +
    'editorial UI), a scroll-driven release to a quiet frame before the ' +
    'sticky stage leaves (exact in reverse), the readout only on explicit ' +
    'request, camera JSON contract with ' +
    'validation that never throws (random rigs, every error and warning), ' +
    'signed-angle weights ∝ |Δ| with a floor and order kept, holds weighted ' +
    'apart from moves, a stateless sampler identical forward / reverse / ' +
    'mid-orbit, preload Arrival → Living → direction of travel (never all), ' +
    'one manifest (comp plates named like the approved Atrium, no studio ' +
    'plate yet, nothing else in public/), and no listener, RAF, timer or second image ' +
    'pipeline; gated out of production; the studio intake rejects ' +
    'incomplete or inconsistent deliveries and never auto-approves; ' +
    'lossless masters stay out of Git and out of the runtime bundle.',
);
