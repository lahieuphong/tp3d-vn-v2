import { ATRIUM_ORBIT_COMP } from './atrium-orbit-manifest';

/** The oculus's living sky (owner request, 2026-10-10): the clouds over the
 * wide Atrium move, always, and have depth.
 *
 * The sky of the wide plate is a painted one: a still. It is drawn over by a
 * small canvas that lies in the plate's own box (oculus-sky.ts: Three.js, a
 * single shader, no texture), and over that canvas lies the plate's own
 * foreground again, cut out: the branches that cross the sky, the dome's
 * ribs and rail, the rim. So the clouds pass behind the leaves.
 *
 * This module is the still part: where the sky is on the plate, what the
 * foreground picture is cut from
 * (`work/atrium-orbit/comp-plates/oculus.mjs`, outside Git, reads it), and
 * the few numbers of the sky's look and clock. Nothing here knows the DOM,
 * WebGL or the time of day. Px of the plate (1672 × 941), measured on the approved Atrium and
 * PROVISIONAL like the comp plates. */

export type AtriumSkyPoint = readonly [number, number];

const [WIDTH, HEIGHT] = ATRIUM_ORBIT_COMP.intrinsic;

export const ATRIUM_ORBIT_OCULUS = {
  /** The canvas's box on the plate: x, y, width, height. The opening, and a
   * few px more on every side, where the foreground picture is whole. */
  box: [454, 5, 760, 228],
  /** How far past that box the foreground picture is whole (`keep`), and
   * over how many px more it fades to nothing (`fade`): two encodings of one
   * plate differ by a shade, and a hard end would show as a line. */
  keep: 6,
  fade: 10,
  /** The opening the sky shows through, clockwise from its left corner: the
   * ring's inner edge above; below, the dome's rail on the left (the glass
   * under it shows no sky there) and the top of the drum's wall on the
   * right (the glass under the rail shows sky). The cut-out keys the sky by
   * colour inside this outline only. */
  opening: [
    [458, 106],
    [476, 86],
    [498, 71],
    [528, 56],
    [558, 44],
    [598, 32],
    [648, 22],
    [700, 16],
    [760, 11],
    [820, 9],
    [880, 9],
    [940, 11],
    [1000, 16],
    [1060, 24],
    [1102, 33],
    [1143, 48],
    [1174, 66],
    [1195, 85],
    [1209, 104],
    [1200, 116],
    [1164, 156],
    [1122, 181],
    [1082, 196],
    [1040, 207],
    [1000, 216],
    [960, 222],
    [900, 228],
    [860, 229],
    [800, 228],
    [758, 224],
    [740, 205],
    [680, 197],
    [620, 183],
    [560, 160],
    [505, 133],
    [468, 114],
  ],
} as const satisfies {
  box: readonly [number, number, number, number];
  keep: number;
  fade: number;
  opening: readonly AtriumSkyPoint[];
};

/** The foreground picture's box on the plate (x, y, width, height): the
 * canvas's box and the margin the picture is whole and then fades over, cut
 * where the plate ends. The picture is only this large, not the plate's
 * size: a browser draws what lies over a canvas apart from the rest of the
 * page, and whatever that touched would be drawn apart with it. */
export function oculusFrontBox(): readonly [number, number, number, number] {
  const { box, keep, fade } = ATRIUM_ORBIT_OCULUS;
  const out = keep + fade;
  const left = Math.max(0, box[0] - out);
  const top = Math.max(0, box[1] - out);
  return [
    left,
    top,
    Math.min(WIDTH, box[0] + box[2] + out) - left,
    Math.min(HEIGHT, box[1] + box[3] + out) - top,
  ];
}

/** Where a box of the plate lies in the plate's box on the stage, as CSS
 * declarations. Everything is a share of that box's WIDTH (a percentage
 * margin is one too), so it is the same place on the picture whether the
 * box is as tall as the picture or, on a stage wider than the plate,
 * shorter. */
export function oculusPlace(
  box: readonly [number, number, number, number],
): readonly (readonly [string, string])[] {
  const [x, y, width, height] = box;
  const share = (value: number) => `${((value / WIDTH) * 100).toFixed(4)}%`;
  return [
    ['left', share(x)],
    ['margin-top', share(y)],
    ['width', share(width)],
    ['aspect-ratio', `${width} / ${height}`],
  ];
}

/** The sky's look and clock. Colours are the plate's own, measured in the
 * opening (oculus.mjs prints them): clear sky high and low, a cloud's lit
 * side and its shade (a little deeper than measured, so a cloud has a
 * body). */
export const ATRIUM_ORBIT_SKY = {
  zenith: '#a6bce0',
  horizon: '#c8d8ee',
  light: '#f8f8f5',
  shade: '#bfcbe0',
  /** The look through the opening: a camera pitched up by `pitch` degrees,
   * the box's height `span` of its view (the tangent of the angle). */
  pitch: 40,
  span: 0.3,
  /** How much of the low sheet is clear: more is a clearer sky. */
  cover: 0.53,
  /** Sky seconds per second: the one number for how fast the air moves. */
  speed: 1,
  /** Story progress from which the sky is made ready: the reading hold,
   * where nothing on the stage moves. Its Three.js is the atmosphere's. */
  prepareAt: 0.42,
  /** One frame of sky at most this often (the air moves slowly), the
   * drawing buffer's density within these, and the shader's octaves. */
  tiers: {
    full: { frameMs: 1000 / 30, pixelRatio: 2, detail: 5 },
    light: { frameMs: 1000 / 24, pixelRatio: 1.5, detail: 4 },
  },
  pixelBudget: 1_000_000,
  /** A stalled frame advances one step at most; a longer gap (a hidden tab,
   * a long task, the oculus off stage) resumes without a jump. */
  maxStepMs: 42,
  resumeGapMs: 250,
  /** A sky that is ready only after the Atrium is in view comes in softly
   * (ms); one that was ready before is simply there. */
  fadeMs: 900,
} as const;

export type OculusSkyTier = 'off' | keyof typeof ATRIUM_ORBIT_SKY.tiers;

/** Who gets a living sky. Reduced motion and Save-Data keep the plate's
 * painted one; a narrow or a coarse-pointer screen gets a lighter one. */
export function oculusSkyTier(
  width: number,
  fine: boolean,
  reduced: boolean,
  saveData: boolean,
): OculusSkyTier {
  if (reduced || saveData) return 'off';
  return width >= 1200 && fine ? 'full' : 'light';
}

/** Sky seconds for a wall-clock gap. */
export function oculusSkyStep(elapsedMs: number) {
  return elapsedMs > 0 && elapsedMs <= ATRIUM_ORBIT_SKY.resumeGapMs
    ? (Math.min(elapsedMs, ATRIUM_ORBIT_SKY.maxStepMs) / 1000) *
        ATRIUM_ORBIT_SKY.speed
    : 0;
}

/** The canvas's displayed width (CSS px) on a stage: its share of the plate
 * box, which covers the stage. */
export function oculusSkyWidth(stageWidth: number, stageHeight: number) {
  const [plateWidth, plateHeight] = ATRIUM_ORBIT_COMP.intrinsic;
  const boxWidth = Math.max(
    stageWidth,
    (stageHeight * plateWidth) / plateHeight,
  );
  return (boxWidth * ATRIUM_ORBIT_OCULUS.box[2]) / plateWidth;
}

/** The canvas's drawing buffer for a displayed width (CSS px). */
export function oculusSkyBuffer(
  cssWidth: number,
  deviceRatio: number,
  tier: Exclude<OculusSkyTier, 'off'>,
): readonly [number, number] {
  const [, , width, height] = ATRIUM_ORBIT_OCULUS.box;
  const cssHeight = (cssWidth * height) / width;
  const ratio = Math.min(
    ATRIUM_ORBIT_SKY.tiers[tier].pixelRatio,
    Math.max(1, deviceRatio),
    Math.sqrt(ATRIUM_ORBIT_SKY.pixelBudget / Math.max(1, cssWidth * cssHeight)),
  );
  return [
    Math.max(2, Math.round(cssWidth * ratio)),
    Math.max(2, Math.round(cssHeight * ratio)),
  ];
}
