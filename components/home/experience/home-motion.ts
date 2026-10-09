/** One tunable vocabulary for native-scroll camera motion. Spatial layers
 * share its impulses; every layer, text and interaction included, samples the
 * one displayed story progress (see `follow`). */
export const MOTION = {
  breakpoints: { mobile: 768, desktop: 1200 },
  // TP3D STEP 1 — the pinned stage shows a position that trails the hand and
  // comes to rest on it. Scroll arrives in steps (wheel notches, uneven
  // frames) and a stage that samples it raw repeats every step in every
  // layer. Native scroll is never intercepted, delayed or corrected (the
  // one exception is `carry` below, after the hand has let go): the page
  // and the sticky stage move natively, and only what the stage draws
  // eases. `tau` is the trailing time in ms (0 = raw); touch stays closer to
  // the finger. The tail closes at `floor` px per ms instead of fading for
  // ever, a stalled frame advances as one `maxFrameMs` frame (slower, never
  // a jump), and the first frame after rest is one `frameMs` frame.
  follow: {
    tau: { fine: 150, coarse: 70 },
    floor: 0.09,
    epsilon: 0.5,
    maxFrameMs: 34,
    frameMs: 1000 / 60,
    // While the room orbit's camera travels from one room to the next (a
    // pan) the whole picture crosses the stage, about two px of it for each
    // px of scroll. Trailing the hand as closely as elsewhere, one wheel
    // notch threw it half a room in a few frames, and the closing tail
    // (`floor`) was a visible creep that then stopped dead. There the stage
    // trails by more, like a camera with mass, and its tail closes slowly
    // enough, and near enough (`epsilon`), to end unseen.
    travel: { tau: { fine: 420, coarse: 260 }, floor: 0.008, epsilon: 0.1 },
  },
  // A room change is carried through (owner decision, 2026-10-09). A hand
  // that stops between two rooms of the room orbit left the camera halfway,
  // on a frame that belongs to neither room. Once it has rested there for
  // `rest` ms the page itself scrolls on to the room it was heading for (to
  // the middle of that room's stretch), setting off at once and easing to
  // rest in `least` ms plus `perPx` for each px to go (at most `most`), and
  // the stage follows as it follows any scroll. Within `edge` px of a room
  // the page is only put back on its edge. This is the one case where the
  // page's scroll position is written: the hand's own scrolling is never
  // intercepted, delayed or corrected, and the moment it moves the page
  // again, or a finger rests on the glass, the carry is over.
  carry: {
    rest: 110,
    edge: 12,
    duration: { least: 520, perPx: 1.5, most: 1300 },
  },
  // TP3D STEP 2 — pacing: how much of the scroll distance each stretch of
  // the story is given. [story progress the stretch ends at, weight]; weight
  // 1 is an even share. Every timing below stays in story progress and is
  // untouched: this only decides how far the hand travels through it.
  // Measured before (picture change per step of scroll, 1440×900): two thirds
  // of all change fell in a tenth of the journey (the pull-back out of the
  // oculus) while the opening approach, the reading hold and the final hold
  // barely moved for 0.6–0.7 of a viewport of scrolling each.
  // Reduced motion is not paced.
  pace: [
    // The opening approach: under 1% of dolly until Scene 1 starts leaving.
    [0.14, 0.5],
    // Scene 1 leaves, the TP travels, the aperture opens, Scene 2 enters.
    [0.4, 1],
    // The reading hold: nothing moves; the reader stops by themselves.
    [0.5, 0.7],
    // Departure and the cloth's approach to the lens.
    [0.64, 1],
    // The clouds form, part and open on the sky.
    [0.695, 1.25],
    // The pull-back out of the oculus, the densest move of the journey: the
    // sky and the rim first, then the whole room opening out.
    [0.76, 1.6],
    [0.86, 2.4],
    // The Atrium settles; rooms, title and copy arrive.
    [0.915, 1],
    // The final hold before the room orbit.
    [1, 0.6],
  ],
  bridge: {
    exitStart: 0.48,
    breezeStart: 0.52,
    occlusionStart: 0.6,
    swap: 0.64,
    breezeEnd: 0.84,
    // TP3D PASS 04: interface waits for the settling architecture. The rail
    // and the worlds chapter return with the first room label; the four room
    // links are interactive once all are revealed; the hold starts with the
    // last reveal.
    revealStart: 0.845,
    interactive: 0.895,
    settled: 0.915,
  },
  departure: {
    anticipation: [0.494, 0.556],
    depth: [0.534, 0.64],
    architecture: [0.55, 0.64],
    // Copy leaves by role before the cloud banks form over its columns: labels
    // as the cloth starts yielding (breeze.takeover[0]), body mid-handoff, and
    // the heading last, gone exactly when context loss begins (occlusionStart).
    labels: [0.484, 0.556],
    body: [0.506, 0.58],
    heading: [0.526, 0.6],
    tpScale: [0.04, 0.155],
    tpY: [4, 22],
    tpOpacity: [0.09, 0.42],
    architectureScale: 0.035,
    architectureY: -8,
    architectureFade: 0.58,
    textY: { labels: 6, body: 9, heading: 12 },
  },
  depthRatios: { architecture: 0.9, artifact: 1, breeze: 1.22 },
  breeze: {
    peak: 0.632,
    crossingEnd: 0.646,
    crossing: [0.612, 0.672],
    suspension: 0.66,
    density: [0.558, 0.626],
    transfer: [0.525, 0.595],
    // With a painting WebGL atmosphere the cloth yields here, after the far
    // (0.517) and mid (0.544) banks have begun and while the near mass forms,
    // before its magnified folds can read as graphic stripes.
    takeover: [0.556, 0.606],
    foreground: 0.54,
    // The first sign of air: this share of the approach starts with Scene 2's
    // departure (bridge.exitStart) as a restrained swell of the resting cloth.
    stir: 0.03,
    peakCoverage: 1.8,
    focus: [0.52, 0.48],
    crossingX: 0.045,
    crossingY: -0.055,
    exitX: 0.9,
    exitY: -1.65,
    rotation: [-4, -2, -12],
  },
  camera: {
    source: { width: 1672, height: 941, skyX: 836, skyY: 110 },
    cropHeight: { desktop: 160, tablet: 168, portrait: 176 },
    // TP3D PASS 04: the sky first, then the oculus rim, the opening and the
    // Atrium. The pull-back ends early because its old last fifth moved the
    // plate by under 1%; portrait crops, which sit closer to the rim, end a
    // little sooner still.
    // TP3D STEP 2: the pull-back starts while the last cloud is still
    // clearing, so the picture is already receding when it is revealed. It
    // used to start at 0.72 / 0.715, after the opening: for about 2% of the
    // journey nothing on screen moved, and the flight through the clouds and
    // the pull-back read as two moves. The canvas is fully transparent from
    // 0.703 and the oculus rim enters after that on every layout
    // (check:home), so no cloud is ever drawn over architecture.
    start: { desktop: 0.695, tablet: 0.695, mobile: 0.695 },
    end: { desktop: 0.88, tablet: 0.875, mobile: 0.87 },
    // Visual milestones: the frame reads as architecture (oculus, columns,
    // openings, tree) from `recognizable`; plate motion is under a fifth of
    // its peak rate (log scale) from `settleStart`.
    recognizable: 0.81,
    settleStart: 0.85,
  },
  // Exposure adapts as architecture replaces sky and is complete before the
  // title; the header ink follows the darkened band behind it.
  light: [0.785, 0.865],
  header: [0.82, 0.855],
  // Rooms (0–3) begin as the camera settles, then 3D WORLDS, Enter, the
  // worlds., body, signoff and the CTA, all complete by `bridge.settled`.
  ui: [
    [0.845, 0.875],
    [0.851, 0.881],
    [0.857, 0.887],
    [0.863, 0.893],
    [0.867, 0.893],
    [0.872, 0.899],
    [0.878, 0.905],
    [0.885, 0.909],
    [0.89, 0.913],
    [0.895, 0.915],
  ],
  // Reduced motion never blends two plates: the world swap and the framing
  // cut are each a cut inside a halfDip-wide exposure dip to the floor. After
  // the cut the static Atrium shows rooms, title and content in order.
  reduced: {
    cut: 0.745,
    halfDip: 0.015,
    floor: 0.65,
    ui: { start: 0.775, step: 0.006, length: 0.02 },
  },
  mass: {
    desktop: { tau: 44, pixels: 2.4, scale: 0.0025 },
    tablet: { tau: 36, pixels: 1.6, scale: 0.0018 },
    mobile: { tau: 0, pixels: 0, scale: 0 },
    epsilonPixels: 0.04,
    maxFrameMs: 64,
  },
} as const;

export const unit = (n: number) => Math.min(1, Math.max(0, n));
export const span = (p: number, start: number, end: number) =>
  unit((p - start) / (end - start));
export const editorial = (t: number) => t * t * (3 - 2 * t);
// Mirrored, asymmetric integrated velocity curves. Both stop with zero velocity.
export const accelerate = (t: number) => t ** 4 * (5 - 4 * t);
export const arrive = (t: number) => 1 - (1 - t) ** 4 * (1 + 4 * t);

export function motionProfile(width: number) {
  const family =
    width < MOTION.breakpoints.mobile
      ? 'mobile'
      : width < MOTION.breakpoints.desktop
        ? 'tablet'
        : 'desktop';
  return {
    family,
    depth: family === 'mobile' ? 0.5 : family === 'tablet' ? 0.75 : 1,
    breezeDepth: family === 'mobile' ? 0.58 : family === 'tablet' ? 0.75 : 1,
    cameraStart: MOTION.camera.start[family],
    cameraEnd: MOTION.camera.end[family],
    mass: MOTION.mass[family],
  };
}

export function cameraImpulse(progress: number, width: number) {
  const profile = motionProfile(width);
  return {
    anticipation: editorial(span(progress, ...MOTION.departure.anticipation)),
    departure: accelerate(span(progress, ...MOTION.departure.depth)),
    approach:
      (1 - MOTION.breeze.stir) *
        accelerate(
          span(progress, MOTION.bridge.breezeStart, MOTION.breeze.peak),
        ) +
      MOTION.breeze.stir *
        editorial(span(progress, MOTION.bridge.exitStart, MOTION.breeze.peak)),
    through: arrive(
      unit(
        span(progress, MOTION.breeze.crossingEnd, MOTION.bridge.breezeEnd) *
          MOTION.depthRatios.breeze,
      ),
    ),
    arrival: arrive(span(progress, profile.cameraStart, profile.cameraEnd)),
    phase:
      progress < MOTION.bridge.exitStart
        ? 'REST'
        : progress < MOTION.departure.depth[0]
          ? 'ANTICIPATION'
          : progress < MOTION.breeze.peak
            ? 'ACCELERATION'
            : progress < MOTION.breeze.suspension
              ? 'LENS_CROSSING'
              : progress < profile.cameraStart
                ? 'SUSPENSION'
                : progress < MOTION.camera.recognizable
                  ? 'DISCOVERY'
                  : progress < MOTION.camera.settleStart
                    ? 'DECELERATION'
                    : progress < MOTION.bridge.settled
                      ? 'SETTLE'
                      : 'STILLNESS',
  };
}

export type Pace = readonly (readonly [number, number])[];
/** Scroll distance ↔ story progress for a pace table (null: one to one).
 * `story` takes the share of the scroll distance travelled (0–1) and gives
 * story progress; `share` is its inverse. The table's cumulative distance is
 * joined by a monotone cubic (Fritsch–Carlson), so the story never runs
 * backwards and its speed changes without a step between two stretches. */
export function storyPacing(table: Pace | null) {
  if (!table) return { story: unit, share: unit };
  const total = table.reduce(
    (sum, [end, weight], i) => sum + (end - (i ? table[i - 1][0] : 0)) * weight,
    0,
  );
  // Knots: x is the share of distance, y is story progress.
  const xs = [0],
    ys = [0];
  table.forEach(([end, weight], i) => {
    xs.push(xs[i] + ((end - ys[i]) * weight) / total);
    ys.push(end);
  });
  xs[xs.length - 1] = 1;
  const last = xs.length - 1;
  const secant = xs.slice(1).map((x, i) => (ys[i + 1] - ys[i]) / (x - xs[i]));
  const slope = xs.map((_, i) => {
    if (i === 0) return secant[0];
    if (i === last) return secant[last - 1];
    const before = xs[i] - xs[i - 1];
    const after = xs[i + 1] - xs[i];
    const a = 2 * after + before;
    const b = after + 2 * before;
    return (a + b) / (a / secant[i - 1] + b / secant[i]);
  });
  const story = (share: number) => {
    const x = unit(share);
    let i = 0;
    while (i < last - 1 && x > xs[i + 1]) i++;
    const width = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / width;
    return (
      ys[i] * (1 + 2 * t) * (1 - t) ** 2 +
      slope[i] * width * t * (1 - t) ** 2 +
      ys[i + 1] * t * t * (3 - 2 * t) +
      slope[i + 1] * width * t * t * (t - 1)
    );
  };
  const share = (progress: number) => {
    const y = unit(progress);
    if (y <= 0 || y >= 1) return y;
    let low = 0,
      high = 1;
    for (let i = 0; i < 48; i++) {
      const middle = (low + high) / 2;
      if (story(middle) < y) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  };
  return { story, share };
}

/** The displayed scroll position: a first-order follow of the native one.
 * It stores no velocity, so it cannot overshoot or oscillate; it approaches
 * from one side only and rests exactly on the native position. `limit` is
 * where the pinned stage starts to leave: the follow is never further behind
 * than the room left before it, so the journey is complete when the stage
 * moves. `shown: null` (first paint, restore, intro) and `tau: 0` (reduced
 * motion) take the native position as it is. `floor` is the slowest the tail
 * closes, in px per ms, and `epsilon` how near (px) it ends on the target. */
export function followScroll(
  shown: number | null,
  native: number,
  elapsed: number,
  tau: number,
  limit = Infinity,
  floor: number = MOTION.follow.floor,
  epsilon: number = MOTION.follow.epsilon,
) {
  const target = Math.min(native, limit);
  if (shown === null || !tau) return { value: target, active: false };
  const { maxFrameMs, frameMs } = MOTION.follow;
  const frame = Math.min(elapsed > 0 ? elapsed : frameMs, maxFrameMs);
  const gap = target - shown;
  const distance = Math.abs(gap);
  const stride = Math.max(
    distance * (1 - Math.exp(-frame / tau)),
    floor * frame,
  );
  const value = Math.max(
    stride >= distance - epsilon ? target : shown + Math.sign(gap) * stride,
    Math.min(target, 2 * target - limit),
  );
  return { value, active: value !== target };
}

export type VisualPose = { x: number; y: number; scale: number };
/** Bounded response of a large plane, not a scroll smoother. No overshoot,
 * accumulated velocity or independent RAF. A stale frame resolves immediately.
 * The conservative edge budget includes scale displacement at the viewport. */
export function settleVisual(
  previous: VisualPose | null,
  target: VisualPose,
  elapsed: number,
  width: number,
  height: number,
  enabled: boolean,
) {
  const { mass } = motionProfile(width);
  if (
    !enabled ||
    !previous ||
    !mass.tau ||
    elapsed <= 0 ||
    elapsed > MOTION.mass.maxFrameMs
  )
    return { pose: target, active: false };
  const decay = Math.exp(-elapsed / mass.tau);
  let x = (previous.x - target.x) * decay;
  let y = (previous.y - target.y) * decay;
  let scale = (previous.scale - target.scale) * decay;
  const edge =
    Math.abs(x) + Math.abs(y) + Math.max(width, height) * Math.abs(scale);
  const budget = Math.min(
    1,
    mass.pixels / (edge || 1),
    scale ? mass.scale / Math.abs(scale) : 1,
  );
  x *= budget;
  y *= budget;
  scale *= budget;
  if (edge * budget <= MOTION.mass.epsilonPixels)
    return { pose: target, active: false };
  return {
    pose: { x: target.x + x, y: target.y + y, scale: target.scale + scale },
    active: true,
  };
}
