import {
  ATRIUM_ORBIT_STATES,
  ATRIUM_ORBIT_TRANSITIONS,
  type AtriumOrbitStateId,
} from './atrium-orbit-model';

/** TP3D PASS 6A — the typed contract for the studio's
 * `world-atrium-cameras.json` (docs/TANPHONG_ATRIUM_ORBIT_ASSET_SPEC.md §6)
 * and its development-time validation. Field names follow the spec exactly.
 * No camera values exist yet; nothing here invents any. Validation never
 * throws: a missing or invalid file only keeps the approved Scene 3. */

export type Vec3 = [number, number, number];
export type AtriumOrbitPortraitCameraId = `${AtriumOrbitStateId}-portrait`;
export type AtriumOrbitCameraId =
  | AtriumOrbitStateId
  | AtriumOrbitPortraitCameraId;

export type AtriumOrbitCamera = {
  /** Equals its key in `cameras`. */
  id: AtriumOrbitCameraId;
  /** Orbit angle of the camera position about the orbit centre. */
  angleDeg: number;
  /** Horizontal distance from the orbit centre. */
  radius: number;
  position: Vec3;
  target: Vec3;
  eyeHeight: number;
  focalLengthMm: number;
  sensor: { widthMm: number; heightMm: number; fit: string };
  hFovDeg: number;
  vFovDeg: number;
  lensShift: { x: number; y: number };
  rollDeg: number;
  resolution: [number, number];
  aspect: number;
};

export type AtriumOrbitStep = {
  from: AtriumOrbitStateId;
  to: AtriumOrbitStateId;
  /** Signed: every step must carry the same sign (one rotation direction). */
  deltaAngleDeg: number;
};

export type AtriumOrbitCameraData = {
  scene: {
    file: string;
    revision: string;
    renderer: string;
    rendererVersion: string;
  };
  conventions: {
    units: string;
    upAxis: string;
    handedness: string;
    angleZero: string;
    angleDirection: string;
  };
  orbitCentre: Vec3;
  colourPipeline: {
    workingSpace: string;
    viewTransform: string;
    look: string;
    output: string;
  };
  cameras: Record<AtriumOrbitStateId, AtriumOrbitCamera> &
    Partial<Record<AtriumOrbitPortraitCameraId, AtriumOrbitCamera>>;
  steps: AtriumOrbitStep[];
};

export type AtriumOrbitCameraValidation =
  | { status: 'missing' }
  | { status: 'invalid'; errors: string[]; warnings: string[] }
  | {
      status: 'valid';
      data: AtriumOrbitCameraData;
      warnings: string[];
      /** Signed step angles in transition order (Arrival → Living first). */
      stepAngles: number[];
    };

/** Tolerances from the spec: eye height 1.60 m ±0.05, roll 0, steps that
 * agree with the cameras' own angles; one 32 mm full-frame-equivalent lens
 * (§4, a 36 mm long side); room cameras on one orbit radius (§2.2); a
 * portrait camera at its desktop camera's position, target and lens (§6).
 * These are spec rules for checking a delivery, not camera values. */
export const ATRIUM_ORBIT_CAMERA_RULES = {
  eyeHeight: [1.55, 1.65],
  rollToleranceDeg: 0.01,
  stepToleranceDeg: 1,
  lensMm: 32,
  lensToleranceMm: 0.5,
  radiusTolerance: 0.01,
  portraitTolerance: 1e-4,
} as const;

type Record_ = Record<string, unknown>;
const isObject = (v: unknown): v is Record_ =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);
const isString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;
const isVec3 = (v: unknown): v is Vec3 =>
  Array.isArray(v) && v.length === 3 && v.every(isNumber);

/** Smallest signed difference b − a, in (−180, 180]. */
export function angleDifference(a: number, b: number) {
  const d = (((b - a) % 360) + 540) % 360;
  return d - 180 === -180 ? 180 : d - 180;
}

function checkCamera(id: string, c: unknown, errors: string[]) {
  if (!isObject(c)) {
    errors.push(`camera "${id}" is missing`);
    return false;
  }
  const bad = (field: string) =>
    errors.push(`camera "${id}": "${field}" is missing or invalid`);
  if (c.id !== id) bad('id');
  for (const field of [
    'angleDeg',
    'radius',
    'eyeHeight',
    'focalLengthMm',
    'hFovDeg',
    'vFovDeg',
    'rollDeg',
    'aspect',
  ])
    if (!isNumber(c[field])) bad(field);
  for (const field of ['position', 'target']) if (!isVec3(c[field])) bad(field);
  const sensor = c.sensor;
  if (
    !isObject(sensor) ||
    !isNumber(sensor.widthMm) ||
    !isNumber(sensor.heightMm) ||
    !isString(sensor.fit)
  )
    bad('sensor');
  const shift = c.lensShift;
  if (!isObject(shift) || !isNumber(shift.x) || !isNumber(shift.y))
    bad('lensShift');
  const r = c.resolution;
  if (!Array.isArray(r) || r.length !== 2 || !r.every(isNumber))
    bad('resolution');
  return true;
}

/** Validate the delivered camera file. `null` / `undefined` = not delivered. */
export function validateAtriumOrbitCameras(
  input: unknown,
): AtriumOrbitCameraValidation {
  if (input === null || input === undefined) return { status: 'missing' };
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isObject(input))
    return { status: 'invalid', errors: ['not a JSON object'], warnings };

  const scene = input.scene;
  if (
    !isObject(scene) ||
    !['file', 'revision', 'renderer', 'rendererVersion'].every((k) =>
      isString(scene[k]),
    )
  )
    errors.push('"scene" needs file, revision, renderer and rendererVersion');
  const conventions = input.conventions;
  if (
    !isObject(conventions) ||
    !['units', 'upAxis', 'handedness', 'angleZero', 'angleDirection'].every(
      (k) => isString(conventions[k]),
    )
  )
    errors.push(
      '"conventions" needs units, upAxis, handedness, angleZero and angleDirection',
    );
  if (!isVec3(input.orbitCentre))
    errors.push('"orbitCentre" must be [x, y, z]');
  const colour = input.colourPipeline;
  if (
    !isObject(colour) ||
    !['workingSpace', 'viewTransform', 'look', 'output'].every((k) =>
      isString(colour[k]),
    )
  )
    errors.push(
      '"colourPipeline" needs workingSpace, viewTransform, look and output',
    );
  else if (String(colour.output).toLowerCase() !== 'srgb')
    warnings.push(
      `colour output is "${String(colour.output)}", the spec asks for sRGB`,
    );

  const cameras = input.cameras;
  if (!isObject(cameras)) errors.push('"cameras" is missing');
  else {
    for (const id of ATRIUM_ORBIT_STATES) checkCamera(id, cameras[id], errors);
    for (const id of ATRIUM_ORBIT_STATES) {
      const portrait = `${id}-portrait`;
      if (cameras[portrait] === undefined)
        warnings.push(`portrait camera "${portrait}" is missing`);
      else checkCamera(portrait, cameras[portrait], errors);
    }
  }

  const steps = input.steps;
  const stepAngles: number[] = [];
  if (!Array.isArray(steps) || steps.length !== ATRIUM_ORBIT_TRANSITIONS.length)
    errors.push(
      `"steps" must list the ${ATRIUM_ORBIT_TRANSITIONS.length} transitions in order`,
    );
  else
    ATRIUM_ORBIT_TRANSITIONS.forEach(({ from, to }, i) => {
      const step = steps[i];
      if (!isObject(step) || step.from !== from || step.to !== to) {
        errors.push(`step ${i + 1} must be ${from} → ${to}`);
        return;
      }
      if (!isNumber(step.deltaAngleDeg) || step.deltaAngleDeg === 0) {
        errors.push(`step ${from} → ${to} needs a non-zero deltaAngleDeg`);
        return;
      }
      stepAngles.push(step.deltaAngleDeg);
    });
  if (
    stepAngles.length === ATRIUM_ORBIT_TRANSITIONS.length &&
    !stepAngles.every((d) => Math.sign(d) === Math.sign(stepAngles[0]))
  )
    errors.push('step angles change sign: the orbit must rotate one way');

  if (errors.length) return { status: 'invalid', errors, warnings };
  const data = input as unknown as AtriumOrbitCameraData;

  // Consistency the studio must hold (warnings: humans decide).
  ATRIUM_ORBIT_TRANSITIONS.forEach(({ from, to }, i) => {
    const measured = angleDifference(
      data.cameras[from].angleDeg,
      data.cameras[to].angleDeg,
    );
    if (
      Math.abs(Math.abs(measured) - Math.abs(stepAngles[i])) >
      ATRIUM_ORBIT_CAMERA_RULES.stepToleranceDeg
    )
      warnings.push(
        `step ${from} → ${to} (${stepAngles[i]}°) disagrees with the cameras' angles (${measured.toFixed(2)}°)`,
      );
  });
  const rooms = ATRIUM_ORBIT_STATES.filter((id) => id !== 'arrival');
  const lens = data.cameras[rooms[0]].focalLengthMm;
  for (const id of rooms)
    if (data.cameras[id].focalLengthMm !== lens)
      return {
        status: 'invalid',
        errors: [
          `room cameras must share one focal length (${rooms[0]} ${lens} mm, ${id} ${data.cameras[id].focalLengthMm} mm)`,
        ],
        warnings,
      };
  if (data.cameras.arrival.focalLengthMm !== lens)
    warnings.push(
      `Arrival uses ${data.cameras.arrival.focalLengthMm} mm (rooms ${lens} mm): only valid as a documented, approved exception`,
    );
  for (const id of ATRIUM_ORBIT_STATES) {
    const camera = data.cameras[id];
    const [low, high] = ATRIUM_ORBIT_CAMERA_RULES.eyeHeight;
    if (camera.eyeHeight < low || camera.eyeHeight > high)
      warnings.push(
        `${id} eye height ${camera.eyeHeight} is outside ${low}–${high}`,
      );
    if (Math.abs(camera.rollDeg) > ATRIUM_ORBIT_CAMERA_RULES.rollToleranceDeg)
      warnings.push(`${id} roll is ${camera.rollDeg}°, expected 0`);
  }
  // Room cameras share one orbit radius (Arrival may stand further back).
  const radii = rooms.map((id) => data.cameras[id].radius);
  const widest = Math.max(...radii),
    narrowest = Math.min(...radii);
  if (widest - narrowest > ATRIUM_ORBIT_CAMERA_RULES.radiusTolerance * widest)
    warnings.push(
      `room cameras do not share one orbit radius (${rooms.map((id) => `${id} ${data.cameras[id].radius}`).join(', ')})`,
    );
  // One 32 mm full-frame-equivalent lens. An Arrival exception already has
  // its own warning above.
  const arrivalException = data.cameras.arrival.focalLengthMm !== lens;
  for (const id of ATRIUM_ORBIT_STATES)
    for (const key of [id, `${id}-portrait`] as const) {
      const camera = data.cameras[key];
      if (!camera || (id === 'arrival' && arrivalException)) continue;
      const equivalent =
        (camera.focalLengthMm * 36) /
        Math.max(camera.sensor.widthMm, camera.sensor.heightMm);
      if (
        Math.abs(equivalent - ATRIUM_ORBIT_CAMERA_RULES.lensMm) >
        ATRIUM_ORBIT_CAMERA_RULES.lensToleranceMm
      )
        warnings.push(
          `${key} is ≈ ${equivalent.toFixed(1)} mm full-frame equivalent (${camera.focalLengthMm} mm on ${camera.sensor.widthMm} × ${camera.sensor.heightMm} mm); the spec locks ${ATRIUM_ORBIT_CAMERA_RULES.lensMm} mm`,
        );
    }
  // A portrait camera normally stands where its desktop camera stands.
  for (const id of ATRIUM_ORBIT_STATES) {
    const portrait = data.cameras[`${id}-portrait`];
    if (!portrait) continue;
    const desktop = data.cameras[id];
    const far = (a: Vec3, b: Vec3) =>
      a.some(
        (v, i) =>
          Math.abs(v - b[i]) > ATRIUM_ORBIT_CAMERA_RULES.portraitTolerance,
      );
    const differs = [
      far(portrait.position, desktop.position) ? 'position' : '',
      far(portrait.target, desktop.target) ? 'target' : '',
      portrait.focalLengthMm !== desktop.focalLengthMm ? 'focalLengthMm' : '',
    ].filter(Boolean);
    if (differs.length)
      warnings.push(
        `${id}-portrait differs from ${id} in ${differs.join(', ')}: it must be explained in the delivery notes`,
      );
  }
  return { status: 'valid', data, warnings, stepAngles };
}
