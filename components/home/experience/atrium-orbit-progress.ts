import {
  ATRIUM_ORBIT_STATES,
  ATRIUM_ORBIT_TRANSITIONS,
  atriumOrbitNeighbours,
  atriumOrbitState,
  type AtriumOrbitStateId,
} from './atrium-orbit-model';
import { HOME_PRODUCTION } from './home-production';
import { editorial, span } from './home-motion';

/** TP3D PASS 6A — Tier B room orbit progress. Pure and stateless: every
 * value derives from the scroll position alone, so reverse scrolling,
 * restoration and landing mid-orbit need no history.
 *
 * Two separate normalised domains, never one value that runs past 1:
 *   baseStoryProgress  0 → 1 over the approved journey's own span
 *                      (--story-base-height); clamped, it stays 1 after.
 *   roomOrbitProgress  0 → 1 over the appended orbit span
 *                      (--story-orbit-height, a PROVISIONAL 160svh); it is
 *                      0 until baseStoryProgress has reached 1.
 * Both come from the one master timeline (home-story-timeline.ts).
 *
 * Holds (readable rests) and moves (camera transitions) are weighted
 * separately; moves are weighted by the real camera angles once the studio's
 * camera data exists. The span ends with a short release (PASS 6A.96) that
 * clears the editorial UI before the sticky stage leaves for the Footer.
 * Holds, moves, the release and the span length are retuned in 6B. */

/** Relative weights (not percentages): the span is mapped onto their sum.
 * PROVISIONAL until the camera data and plates exist (PASS 6B tunes them). */
export type AtriumOrbitTiming = {
  holds: {
    /** Arrival is transitional: a short rest after the Atrium reveal. */
    arrival: number;
    /** Living, Bedroom, Bathroom. */
    room: number;
    /** The final room's longer rest before the Footer. */
    kitchen: number;
  };
  /** Total weight shared by the four moves. */
  movement: number;
  /** Each move keeps at least this share of the movement total. */
  minMoveShare: number;
  /** Share of a move after which the UI shows the incoming room. */
  uiSwitchAt: number;
  /** PASS 6A.75: the existing World gateway (ENTER THE WORLD) returns only
   * in the later part of the final Kitchen hold, after Kitchen has been
   * readable alone. `revealFrom` / `revealTo` are shares of that hold; in
   * that window the room indicator first leaves zone I, then the gateway
   * enters it (`handoff`: the share of the window where one ends and the
   * other begins), so the two never sit on top of each other. The gateway
   * is interactive from `interactiveAt` of its own opacity. */
  gateway: {
    revealFrom: number;
    revealTo: number;
    handoff: number;
    interactiveAt: number;
  };
  /** PASS 6A.96: the final release, after the useful Kitchen and gateway
   * state and before the sticky stage leaves for the Footer. `weight` is
   * relative, like the holds (0 = no release). The windows are shares of the
   * release itself: the room editorial UI leaves over `editorialOut`, the
   * World gateway settles out over `gatewayOut`, and what is left of the
   * release after both is the quiet architectural frame the stage carries
   * into the Footer. Kitchen stays the active room throughout. */
  release: {
    weight: number;
    editorialOut: readonly [number, number];
    gatewayOut: readonly [number, number];
  };
  /** The room editorial UI takes focus and clicks from this share of its own
   * opacity (as it enters with Living and until it leaves in the release). */
  editorialInteractiveAt: number;
};

export const ATRIUM_ORBIT_TIMING: AtriumOrbitTiming = {
  holds: { arrival: 0.35, room: 1, kitchen: 1.5 },
  // PASS 6B.0: a move is real camera travel now, so each one outlasts a
  // room hold (1.5 each while equal). The preview gives the orbit a longer
  // span to play them over (atrium-orbit-preview.css).
  movement: 6,
  minMoveShare: 0.1,
  uiSwitchAt: 0.5,
  gateway: {
    revealFrom: 0.5,
    revealTo: 0.85,
    handoff: 0.5,
    interactiveAt: 0.5,
  },
  release: { weight: 0.8, editorialOut: [0, 0.5], gatewayOut: [0.3, 0.75] },
  editorialInteractiveAt: 0.5,
};

/** Reduced motion: readable holds and plain plate changes; no camera move
 * is played (zero movement weight), so no orbit illusion. */
export const ATRIUM_ORBIT_TIMING_REDUCED: AtriumOrbitTiming = {
  ...ATRIUM_ORBIT_TIMING,
  movement: 0,
};

/** Normalised move weights from signed camera angles: |Δ| / Σ|Δ|, each kept
 * at or above `minShare` and renormalised. Equal weights when nothing is
 * measurable. Never invents angles. */
export function angleWeights(
  deltas: readonly number[],
  minShare = 0,
): number[] {
  if (!deltas.length) return [];
  const magnitudes = deltas.map((d) => (Number.isFinite(d) ? Math.abs(d) : 0));
  const total = magnitudes.reduce((a, b) => a + b, 0);
  const raw =
    total > 0
      ? magnitudes.map((m) => m / total)
      : magnitudes.map(() => 1 / deltas.length);
  const floor = Math.min(Math.max(0, minShare), 1 / deltas.length);
  if (floor === 0) return raw;
  // Lift small shares to the floor and take the difference from the rest,
  // in proportion, so the order of sizes is preserved.
  const lifted = raw.map((w) => Math.max(w, floor));
  const excess = lifted.reduce((a, b) => a + b, 0) - 1;
  const room = lifted.reduce((a, w) => a + (w > floor ? w - floor : 0), 0);
  return lifted.map((w) =>
    w > floor && room > 0 ? w - (excess * (w - floor)) / room : w,
  );
}

export type AtriumOrbitSegment =
  | { kind: 'hold'; state: AtriumOrbitStateId; start: number; end: number }
  | {
      kind: 'move';
      transition: number;
      from: AtriumOrbitStateId;
      to: AtriumOrbitStateId;
      start: number;
      end: number;
    }
  /** The final release: no new state, the last room stays active. */
  | { kind: 'release'; state: AtriumOrbitStateId; start: number; end: number };

export type AtriumOrbitTimeline = {
  segments: AtriumOrbitSegment[];
  /** 'camera-angles' once real step angles drive the moves. */
  weighting: 'camera-angles' | 'provisional-equal';
};

/** Hold, move, hold … hold: Arrival, then each room, Kitchen last; then the
 * release that hands the stage to the Footer. */
export function buildOrbitTimeline(
  timing: AtriumOrbitTiming,
  stepAngles: readonly number[] | null,
): AtriumOrbitTimeline {
  const real =
    stepAngles !== null &&
    stepAngles.length === ATRIUM_ORBIT_TRANSITIONS.length;
  const moves = angleWeights(
    real ? stepAngles : ATRIUM_ORBIT_TRANSITIONS.map(() => 1),
    timing.minMoveShare,
  ).map((w) => w * timing.movement);
  const holdFor = (state: AtriumOrbitStateId) =>
    state === 'arrival'
      ? timing.holds.arrival
      : state === 'kitchen'
        ? timing.holds.kitchen
        : timing.holds.room;
  const segments: AtriumOrbitSegment[] = [];
  const weights: number[] = [];
  ATRIUM_ORBIT_STATES.forEach((state, i) => {
    segments.push({ kind: 'hold', state, start: 0, end: 0 });
    weights.push(holdFor(state));
    const transition = ATRIUM_ORBIT_TRANSITIONS[i];
    if (!transition) return;
    segments.push({
      kind: 'move',
      transition: i,
      from: transition.from,
      to: transition.to,
      start: 0,
      end: 0,
    });
    weights.push(moves[i]);
  });
  if (timing.release.weight > 0) {
    segments.push({
      kind: 'release',
      state: ATRIUM_ORBIT_STATES[ATRIUM_ORBIT_STATES.length - 1],
      start: 0,
      end: 0,
    });
    weights.push(timing.release.weight);
  }
  const total = weights.reduce((a, b) => a + b, 0);
  let cursor = 0;
  segments.forEach((segment, i) => {
    segment.start = cursor / total;
    cursor += weights[i];
    segment.end = i === segments.length - 1 ? 1 : cursor / total;
  });
  return {
    segments,
    weighting: real ? 'camera-angles' : 'provisional-equal',
  };
}

export type AtriumOrbitSample = {
  /** The sampled position, clamped to 0 → 1. */
  roomOrbitProgress: number;
  phase: 'hold' | 'move' | 'release';
  /** The one source of truth for title, counter, thumbnail, CTA, labels. */
  activeState: AtriumOrbitStateId;
  previousState: AtriumOrbitStateId | null;
  nextState: AtriumOrbitStateId | null;
  transitionFrom: AtriumOrbitStateId | null;
  transitionTo: AtriumOrbitStateId | null;
  transitionIndex: number | null;
  /** 0 → 1 across the current move (0 otherwise). */
  localTransitionProgress: number;
  /** 0 → 1 across the current hold (0 otherwise). */
  holdProgress: number;
  /** 0 → 1 across the final release (0 before it). */
  releaseProgress: number;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function sampleOrbit(
  roomOrbitProgress: number,
  timeline: AtriumOrbitTimeline,
  timing: AtriumOrbitTiming = ATRIUM_ORBIT_TIMING,
): AtriumOrbitSample {
  const p = clamp01(Number.isFinite(roomOrbitProgress) ? roomOrbitProgress : 0);
  const segment =
    timeline.segments.find((s) => p < s.end) ??
    timeline.segments[timeline.segments.length - 1];
  const local =
    segment.end > segment.start
      ? clamp01((p - segment.start) / (segment.end - segment.start))
      : 1;
  const activeState =
    segment.kind !== 'move'
      ? segment.state
      : local < timing.uiSwitchAt
        ? segment.from
        : segment.to;
  const { previous, next } = atriumOrbitNeighbours(activeState);
  return {
    roomOrbitProgress: p,
    phase: segment.kind,
    activeState,
    previousState: previous,
    nextState: next,
    transitionFrom: segment.kind === 'move' ? segment.from : null,
    transitionTo: segment.kind === 'move' ? segment.to : null,
    transitionIndex: segment.kind === 'move' ? segment.transition : null,
    localTransitionProgress: segment.kind === 'move' ? local : 0,
    holdProgress: segment.kind === 'hold' ? local : 0,
    releaseProgress: segment.kind === 'release' ? local : 0,
  };
}

/** Travel direction, from the last two sampled positions. It decides which
 * plate is outgoing and what is warmed next, never the picture drawn at a
 * given position (that is a pure function of the scroll position). */
export type AtriumOrbitDirection = 'forward' | 'reverse';

/** Which plates must be decoded now, and which to warm next.
 * Before the Atrium: Arrival first (from the existing Scene 3 preload
 * point), then Living. In the orbit: the visible plate(s), then the next
 * one in the direction of travel, then the other neighbour. Never all. */
export function planPlates(input: {
  baseStoryProgress: number;
  sample: AtriumOrbitSample;
  direction: AtriumOrbitDirection;
}): { required: AtriumOrbitStateId[]; warm: AtriumOrbitStateId[] } {
  const { baseStoryProgress, sample, direction } = input;
  if (baseStoryProgress < HOME_PRODUCTION.scenePreload)
    return { required: [], warm: [] };
  if (baseStoryProgress < 1)
    return {
      required: ['arrival'],
      warm:
        baseStoryProgress >= HOME_PRODUCTION.thumbnailPreload ? ['living'] : [],
    };
  const required: AtriumOrbitStateId[] =
    sample.phase === 'move'
      ? [sample.transitionFrom!, sample.transitionTo!]
      : [sample.activeState];
  const ahead =
    direction === 'forward' ? sample.nextState : sample.previousState;
  const behind =
    direction === 'forward' ? sample.previousState : sample.nextState;
  const warm = [ahead, behind].filter(
    (id): id is AtriumOrbitStateId => id !== null && !required.includes(id),
  );
  return { required, warm };
}

/** PASS 6A.96 — the final release, a pure function of the sampled position:
 * what is left (1 → 0) of the room editorial UI and of the World gateway
 * while the stage is still sticky. `quiet` is the architectural frame with
 * neither, which is all the stage carries under the header into the Footer.
 * No timer; reverse scrolling rebuilds Gateway, then Kitchen. */
export function atriumRelease(
  sample: AtriumOrbitSample,
  timing: AtriumOrbitTiming = ATRIUM_ORBIT_TIMING,
): { editorial: number; gateway: number; quiet: boolean } {
  const r = sample.phase === 'release' ? sample.releaseProgress : 0;
  const { editorialOut, gatewayOut } = timing.release;
  const left = (window: readonly [number, number]) =>
    1 - editorial(span(r, window[0], window[1]));
  const state = { editorial: left(editorialOut), gateway: left(gatewayOut) };
  return { ...state, quiet: state.editorial === 0 && state.gateway === 0 };
}

/** PASS 6A.96 — how present the room editorial UI is (copy, CTA, room
 * labels, indicator, and the exposure shade that backs the copy), from the
 * sampled position and the state the UI shows. Arrival has none. It enters
 * with the first public room, over the rest of the move after the UI
 * switch, stays whole through the rooms and leaves in the release. */
export function atriumEditorial(
  sample: AtriumOrbitSample,
  shownState: AtriumOrbitStateId,
  timing: AtriumOrbitTiming = ATRIUM_ORBIT_TIMING,
): { presence: number; interactive: boolean } {
  const entering =
    sample.phase === 'move' &&
    sample.transitionFrom !== null &&
    !atriumOrbitState(sample.transitionFrom).editorial;
  const presence = !atriumOrbitState(shownState).editorial
    ? 0
    : (entering
        ? editorial(span(sample.localTransitionProgress, timing.uiSwitchAt, 1))
        : 1) * atriumRelease(sample, timing).editorial;
  return { presence, interactive: presence >= timing.editorialInteractiveAt };
}

/** PASS 6A.75 — the existing WorldGatewayLink's return, a pure function of
 * the sampled position and the state the UI shows (the one active-room
 * authority): 0 everywhere except the later part of the Kitchen hold, where
 * it eases to 1; it then settles out in the release (PASS 6A.96). No timer;
 * reverse scrolling hides it again. */
export function atriumGateway(
  sample: AtriumOrbitSample,
  shownState: AtriumOrbitStateId,
  timing: AtriumOrbitTiming = ATRIUM_ORBIT_TIMING,
): { reveal: number; indicator: number; interactive: boolean } {
  const { revealFrom, revealTo, handoff, interactiveAt } = timing.gateway;
  const kitchen = shownState === 'kitchen' && sample.activeState === 'kitchen';
  const t = !kitchen
    ? 0
    : sample.phase === 'release'
      ? 1
      : sample.phase === 'hold'
        ? span(sample.holdProgress, revealFrom, revealTo)
        : 0;
  const reveal =
    editorial(span(t, handoff, 1)) * atriumRelease(sample, timing).gateway;
  return {
    reveal,
    indicator: 1 - editorial(span(t, 0, handoff)),
    interactive: reveal >= interactiveAt,
  };
}
