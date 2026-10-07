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
import sharp from 'sharp';
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
    t.segments.map((s) => (s.kind === 'hold' ? s.state : `${s.from}>${s.to}`));
  const expected = STATES.flatMap((id, i) =>
    i < 4 ? [id, `${id}>${STATES[i + 1]}`] : [id],
  );
  const contiguous = (t) => {
    assert.equal(t.segments[0].start, 0);
    assert.equal(t.segments.at(-1).end, 1);
    t.segments.forEach((s, i) => {
      assert.ok(s.end >= s.start);
      if (i) assert.equal(s.start, t.segments[i - 1].end);
    });
  };
  const provisional = buildOrbitTimeline(TIMING, null);
  same(kinds(provisional), expected, 'hold, move, … , Kitchen hold');
  assert.equal(provisional.weighting, 'provisional-equal');
  contiguous(provisional);
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
      if (s.kind === 'hold') {
        assert.equal(mid.activeState, s.state);
        assert.equal(mid.transitionFrom, null);
        near(mid.holdProgress, 0.5, 'hold progress', 1e-9);
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
    const kitchen = t.segments.at(-1);
    assert.equal(kitchen.kind, 'hold');
    assert.equal(kitchen.state, 'kitchen');
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
      if (local >= G.revealTo) assert.equal(f.reveal, 1);
      assert.equal(f.interactive, f.reveal >= G.interactiveAt);
    }
    assert.ok(
      frames.every((f, i) => !i || f.reveal >= frames[i - 1].reveal),
      'the reveal only grows forward (and shrinks in reverse)',
    );
    const end = frames.at(-1);
    same(
      [end.reveal, end.indicator, end.interactive],
      [1, 0, true],
      'the final frame: the gateway owns zone I',
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
    assert.equal(atriumGateway(sampleOrbit(1, t), 'bathroom').reveal, 0);
    assert.equal(atriumGateway(sampleOrbit(1, t), 'kitchen').reveal, 1);
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
      if (s.kind === 'hold') {
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
// 7. The manifest: one naming source, nothing delivered, nothing invented.
// ---------------------------------------------------------------------------
{
  const {
    ATRIUM_ORBIT_ASSETS: ASSETS,
    ATRIUM_ORBIT_PLATES,
    ATRIUM_ORBIT_CAMERA_DATA,
    ATRIUM_ORBIT_THUMBNAILS,
    ATRIUM_ORBIT_FASCIA,
    plateFile,
    plateFiles,
    plateSources,
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
  same(
    STATES.map((id) => ATRIUM_ORBIT_PLATES[id]),
    STATES.map(() => ({ desktop: 'missing', portrait: 'missing' })),
    'PASS 6A: no approved plate exists yet',
  );
  assert.equal(ATRIUM_ORBIT_CAMERA_DATA, null, 'no camera data yet');
  assert.equal(
    cameras.validateAtriumOrbitCameras(ATRIUM_ORBIT_CAMERA_DATA).status,
    'missing',
  );
  for (const id of STATES)
    assert.equal(plateSources(id), null, 'not requested');
  const readiness = atriumOrbitReadiness();
  assert.equal(readiness.missing.length, 10);
  assert.equal(readiness.desktopComplete, false);
  // No stand-in plates were created anywhere in the public tree.
  assert.deepEqual(
    readdirSync(
      new URL('../public/images/home-chapters/', import.meta.url),
    ).filter((name) => name.startsWith(`${ASSETS.stem}-`)),
    [],
    'no world-atrium-* stand-ins',
  );
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
  // Thumbnails: the existing optimised 192px previews, never a plate.
  for (const room of ROOMS) {
    const thumb = ATRIUM_ORBIT_THUMBNAILS[room];
    same(thumb, {
      src: `/images/home-chapters/room-preview-${room}.webp`,
      width: 192,
      height: 192,
    });
    assert.ok(exists(`public${thumb.src}`), `${thumb.src} exists`);
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
// 8. The transition extension point: explicit direction, reversible frames,
// a provisional cut only (no movement, no final timing).
// ---------------------------------------------------------------------------
{
  const { buildOrbitTimeline, sampleOrbit } = progress;
  const {
    plateTransitionInput,
    provisionalCut,
    reducedTransition,
    selectPlateTransition,
    ATRIUM_ORBIT_OCCLUDERS,
  } = transition;
  const angles = cameras.validateAtriumOrbitCameras(rig()).stepAngles;
  const t = buildOrbitTimeline(TIMING, angles);
  assert.equal(ATRIUM_ORBIT_OCCLUDERS.length, 4);
  assert.ok(ATRIUM_ORBIT_OCCLUDERS.every((o) => o.regions === null));
  same(
    ATRIUM_ORBIT_OCCLUDERS.map((o) => o.alphaPassPriority),
    [1, 2, 1, 2],
    'spec §9 priorities',
  );
  for (const s of t.segments) {
    const p = (s.start + s.end) / 2;
    const sample = sampleOrbit(p, t);
    if (s.kind === 'hold') {
      assert.equal(
        plateTransitionInput(sample, 'forward', angles, 'desktop'),
        null,
      );
      continue;
    }
    for (const local of Array.from({ length: 21 }, (_, i) => i / 20)) {
      const q = Math.min(s.end - 1e-12, s.start + local * (s.end - s.start));
      const at = sampleOrbit(q, t);
      const forward = plateTransitionInput(at, 'forward', angles, 'desktop');
      const reverse = plateTransitionInput(at, 'reverse', angles, 'desktop');
      assert.equal(forward.from, s.from);
      assert.equal(forward.to, s.to);
      same([forward.outgoing, forward.incoming], [s.from, s.to]);
      same([reverse.outgoing, reverse.incoming], [s.to, s.from]);
      assert.equal(forward.deltaAngleDeg, angles[s.transition]);
      assert.equal(forward.occluder, ATRIUM_ORBIT_OCCLUDERS[s.transition]);
      for (const adapter of [provisionalCut, reducedTransition]) {
        const a = adapter(forward),
          b = adapter(reverse);
        same(a, b, 'the same position draws the same frame both ways');
        near(a.from.opacity + a.to.opacity, 1, 'one plate at a time');
        for (const layer of [a.from, a.to])
          same([layer.x, layer.y, layer.scale], [0, 0, 1], 'no movement yet');
        assert.equal(
          a.to.opacity,
          at.localTransitionProgress >= TIMING.uiSwitchAt ? 1 : 0,
          'the plate and the UI switch together',
        );
      }
    }
  }
  assert.equal(
    plateTransitionInput(
      sampleOrbit(t.segments[1].start + 1e-6, t),
      'forward',
      null,
      'portrait',
    ).deltaAngleDeg,
    null,
    'no invented angle',
  );
  assert.equal(selectPlateTransition(true), reducedTransition);
  assert.equal(selectPlateTransition(false), provisionalCut);
}

// ---------------------------------------------------------------------------
// 9. Source rules. Tier B is dormant: one scroll owner, no new loop, no
// invented asset, no other image pipeline, gated out of production.
// ---------------------------------------------------------------------------
{
  const names = readdirSync(new URL(`../${EXPERIENCE}`, import.meta.url))
    .filter((name) => name.startsWith('atrium-orbit-'))
    .sort();
  same(names, [
    'atrium-orbit-cameras.ts',
    'atrium-orbit-controller.ts',
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
    [
      /scrollTo|scrollBy|scrollIntoView|preventDefault|wheel/,
      'no scroll control',
    ],
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
  // The gate: development or a preview build, and ?atriumOrbit=1.
  const timeline = read(`${EXPERIENCE}home-story-timeline.ts`);
  assert.match(
    timeline,
    /if \(\s*\(import\.meta\.env\.DEV \|\|\s*import\.meta\.env\.VITE_ATRIUM_ORBIT_PREVIEW === '1'\) &&\s*new URLSearchParams\(window\.location\.search\)\.get\('atriumOrbit'\) === '1'\s*\)\s*void import\('\.\/atrium-orbit-controller'\)/,
  );
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
  assert.match(
    timeline,
    /const p = clamp\(\(scroll - geometry\.top\) \/ geometry\.span\);/,
    'baseStoryProgress: the approved journey span, clamped',
  );
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
    /\.hc-room-orbit-indicator \{\s*opacity: var\(--atrium-indicator, 1\);/,
    'the indicator yields zone I to the returning gateway',
  );
  // The Atrium photograph is a static backdrop in this harness: Tier B never
  // transforms it, the camera or the backdrop (only its own plate layers,
  // which do not exist yet).
  assert.doesNotMatch(
    controller,
    /scene3-camera|data-scene3|hc-atrium-camera|backdrop\??\.style|hc-room-focus/,
    'no pan / zoom / rotation of the Atrium photograph',
  );
  assert.equal(
    (controller.match(/'transform'/g) ?? []).length,
    1,
    'only the (absent) plate layers take a transform',
  );
  // Every provisional number lives in the one timing config.
  for (const name of [
    'atrium-orbit-controller.ts',
    'atrium-orbit-transition.ts',
    'atrium-orbit-manifest.ts',
  ])
    assert.doesNotMatch(
      sources[name],
      /revealFrom:|revealTo:|interactiveAt:|holds:|movement:|uiSwitchAt:/,
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
  same(importers, [`${EXPERIENCE}home-story-timeline.ts`]);
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
    'portals, no camera pan / zoom), camera JSON contract with ' +
    'validation that never throws (random rigs, every error and warning), ' +
    'signed-angle weights ∝ |Δ| with a floor and order kept, holds weighted ' +
    'apart from moves, a stateless sampler identical forward / reverse / ' +
    'mid-orbit, preload Arrival → Living → direction of travel (never all), ' +
    'one manifest with every plate MISSING and no stand-ins, reversible ' +
    'provisional transitions, and no listener, RAF, timer or second image ' +
    'pipeline; gated out of production; the studio intake rejects ' +
    'incomplete or inconsistent deliveries and never auto-approves; ' +
    'lossless masters stay out of Git and out of the runtime bundle.',
);
