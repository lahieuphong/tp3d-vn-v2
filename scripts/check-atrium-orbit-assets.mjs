/** TP3D PASS 6A.9 — studio delivery intake for the Atrium orbit (manual).
 *
 *   yarn check:atrium-orbit-assets                  every phase found
 *   yarn check:atrium-orbit-assets --phase 1        one phase
 *   yarn check:atrium-orbit-assets --phase 1 --strict
 *                                                   the PASS 6B.1 entry gate:
 *                                                   a missing delivery fails
 *   --root <folder>   another delivery root (default work/atrium-orbit/studio)
 *   --dir <folder>    one phase folder anywhere (needs --phase)
 *
 * It is never part of the production build or of another check. With no
 * delivery it reports NOT READY and exits 0. It never approves anything:
 *   ERROR         blocks intake (a missing or malformed item);
 *   WARNING       a person decides (a documented exception, a tolerance);
 *   HUMAN REVIEW  what no script can judge (composition, continuity, light).
 * Camera rules are the app's own (`atrium-orbit-cameras.ts`); names and
 * master sizes come from its manifest. Nothing here invents camera data.
 * Contract: docs/TANPHONG_ATRIUM_DELIVERY_CHECKLIST.md. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadStoryMath } from './load-story-math.mjs';

const { ATRIUM_ORBIT_STATES } = loadStoryMath('atrium-orbit-model');
const { validateAtriumOrbitCameras } = loadStoryMath('atrium-orbit-cameras');
const { ATRIUM_ORBIT_ASSETS, atriumOrbitRecord } = loadStoryMath(
  'atrium-orbit-manifest',
);

export const DELIVERY_ROOT = 'work/atrium-orbit/studio';
export const RIG_NAME = 'world-atrium-rig-top';
export const CHECKLIST = 'docs/TANPHONG_ATRIUM_DELIVERY_CHECKLIST.md';
const CAMERA_FILE = ATRIUM_ORBIT_ASSETS.cameras;

/** Spec §10 and §13.1. Previews are "about" these widths (a warning when
 * outside); masters are exact (an error). */
export const PHASES = {
  1: {
    folder: 'phase-1',
    label: 'Phase 1 — geometry / camera blockout (clay)',
    kind: 'preview',
    rig: true,
  },
  2: {
    folder: 'phase-2',
    label: 'Phase 2 — material / lighting preview',
    kind: 'preview',
    rig: false,
  },
  3: {
    folder: 'final',
    label: 'Phase 3 — final lossless masters',
    kind: 'master',
    rig: false,
  },
};
const PREVIEW_WIDTH = { desktop: [1280, 1600], portrait: [645, 800] };
const PREVIEW_FORMATS = ['png', 'jpg', 'jpeg', 'tif', 'tiff', 'webp'];
const MASTER_FORMATS = ['png', 'tif', 'tiff'];
const RIG_FORMATS = [...PREVIEW_FORMATS, 'pdf'];
const NOTE_FORMATS = ['txt', 'md', 'pdf', 'rtf', 'docx'];
const ASPECT_TOLERANCE = { preview: 0.01, master: 0.005 };
const CAMERA_FIELDS = [
  'angleDeg',
  'radius',
  'position',
  'target',
  'eyeHeight',
  'focalLengthMm',
  'sensor',
  'lensShift',
  'rollDeg',
];

const HUMAN_REVIEW = {
  1: [
    'Atrium geometry reads as one circular space (plan, ceiling ring, oculus, piers, fascias)',
    'Room order and neighbours; clockwise travel on the top-down rig; angular spacing plausible',
    'Arrival: oculus framing, Living already toward the next move',
    'Room framing: focal opening in the focal window; Bathroom framed from geometry',
    'Portrait framing of all five views',
    'Tree, planter and stone continuity between adjacent views',
    'Each camera pair: shared foreground object, its screen displacement, physical plausibility',
    'No baked UI, labels, logo or text in any image',
  ],
  2: [
    'Materials, lighting, exposure and white balance identical across all ten views',
    'Time of day; Arrival sky close to the oculus palette',
    'Room readability; UI safe areas and their lightness targets',
    'Cameras unchanged from the approved Phase 1 (see any warning above)',
    'No baked UI, post effects or people',
  ],
  3: [
    'Spec §15, per view: same scene, light and colour, camera, composition, clean pixels',
    'Spec §15, per transition pair: occluders, right-to-left shift, no impossible differences',
    'Sharp at 100%; no fireflies, smearing or banding; check clean pixels at 200%',
    'Whether the five views plausibly form one continuous clockwise camera journey',
  ],
};

const extension = (file) => path.extname(file).slice(1).toLowerCase();
const stem = (file) => path.basename(file, path.extname(file));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** The plates a delivery consists of: ten names, from the app's manifest. */
export function expectedPlates() {
  return ATRIUM_ORBIT_STATES.flatMap((id) => {
    const { plate } = atriumOrbitRecord(id);
    return [
      { id, orientation: 'desktop', name: plate.desktop, camera: id },
      {
        id,
        orientation: 'portrait',
        name: plate.portrait,
        camera: `${id}-portrait`,
      },
    ];
  });
}

async function imageReader() {
  try {
    const { default: sharp } = await import('sharp');
    return async (file) => {
      const m = await sharp(file).metadata();
      return {
        width: m.width,
        height: m.height,
        format: m.format,
        profile: Boolean(m.icc),
      };
    };
  } catch {
    return null;
  }
}

/** Inspect one phase folder. `previous` is an earlier phase's validated
 * camera data: cameras must not change once Phase 1 is approved. */
export async function inspectDelivery({ dir, phase, previous = null }) {
  const spec = PHASES[phase];
  const report = {
    phase,
    dir,
    label: spec.label,
    present: false,
    errors: [],
    warnings: [],
    info: [],
    human: HUMAN_REVIEW[phase],
    cameras: null,
  };
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return report;
  const files = readdirSync(dir).filter(
    (file) => !file.startsWith('.') && statSync(path.join(dir, file)).isFile(),
  );
  if (!files.length) return report;
  report.present = true;
  const { errors, warnings, info } = report;
  const claimed = new Set();
  const named = (name) =>
    files.filter((file) => stem(file).toLowerCase() === name.toLowerCase());
  const allowed = spec.kind === 'master' ? MASTER_FORMATS : PREVIEW_FORMATS;

  // Camera data first: it travels with every phase.
  const cameraFile = files.find(
    (file) => file.toLowerCase() === CAMERA_FILE.toLowerCase(),
  );
  let data = null;
  if (!cameraFile) errors.push(`missing camera data: ${CAMERA_FILE}`);
  else {
    claimed.add(cameraFile);
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(path.join(dir, cameraFile), 'utf8'));
    } catch (error) {
      errors.push(`malformed JSON in ${CAMERA_FILE}: ${error.message}`);
    }
    if (parsed !== undefined) {
      const result = validateAtriumOrbitCameras(parsed);
      report.cameras = result;
      if (result.status === 'missing')
        errors.push(`${CAMERA_FILE} is empty (null)`);
      else {
        for (const message of result.errors ?? [])
          errors.push(`camera data: ${message}`);
        for (const message of result.warnings)
          warnings.push(`camera data: ${message}`);
        if (result.status === 'valid') {
          data = result.data;
          info.push(
            `scene ${data.scene.file} · revision ${data.scene.revision} · steps ${result.stepAngles.map((d) => `${d}°`).join(', ')}`,
          );
        }
      }
    }
  }
  if (data && previous)
    for (const id of Object.keys(previous.cameras)) {
      const before = previous.cameras[id],
        now = data.cameras[id];
      if (!now) continue;
      const changed = CAMERA_FIELDS.filter(
        (field) => JSON.stringify(before[field]) !== JSON.stringify(now[field]),
      );
      if (changed.length)
        warnings.push(
          `camera "${id}" changed since the earlier phase (${changed.join(', ')}): cameras stay as approved in Phase 1`,
        );
    }

  // Plates: ten names, one file each.
  const read = await imageReader();
  if (!read)
    warnings.push('image dimensions not inspected (sharp is not available)');
  for (const plate of expectedPlates()) {
    const found = named(plate.name);
    for (const file of found) claimed.add(file);
    const usable = found.filter((file) => allowed.includes(extension(file)));
    const what = `${plate.name} (${plate.orientation})`;
    if (!usable.length) {
      errors.push(
        found.length
          ? `${what}: ${spec.kind === 'master' ? 'a final master must be lossless PNG or TIFF' : 'unsupported image format'} (found ${found.join(', ')})`
          : `missing plate: ${what}`,
      );
      continue;
    }
    if (usable.length > 1)
      warnings.push(`${what}: several files (${usable.join(', ')})`);
    if (!read) continue;
    const file = usable[0];
    let image;
    try {
      image = await read(path.join(dir, file));
    } catch (error) {
      errors.push(`${file}: unreadable image (${error.message})`);
      continue;
    }
    const [masterWidth, masterHeight] =
      ATRIUM_ORBIT_ASSETS.intrinsic[plate.orientation];
    const aspect = image.width / image.height;
    const wanted = masterWidth / masterHeight;
    const off = Math.abs(aspect / wanted - 1);
    const size = `${image.width}×${image.height}`;
    if (spec.kind === 'master') {
      if (!['png', 'tiff'].includes(image.format))
        errors.push(`${file}: a final master must be PNG or TIFF data`);
      if (plate.orientation === 'desktop') {
        if (image.width !== masterWidth || image.height !== masterHeight)
          errors.push(
            `${file}: ${size}, the desktop master is exactly ${masterWidth}×${masterHeight}`,
          );
      } else if (
        image.width < masterWidth ||
        image.height < masterHeight ||
        off > ASPECT_TOLERANCE.master
      )
        errors.push(
          `${file}: ${size}, the portrait master is ${masterWidth}×${masterHeight} or larger at the same aspect`,
        );
      else if (image.width > masterWidth)
        info.push(`${file}: ${size} (larger than required, same aspect)`);
      if (!image.profile)
        warnings.push(`${file}: no embedded colour profile (sRGB expected)`);
    } else {
      const [low, high] = PREVIEW_WIDTH[plate.orientation];
      if (image.width < low || image.width > high)
        warnings.push(
          `${file}: ${size}, previews are about ${low}–${high} px wide`,
        );
      if (off > ASPECT_TOLERANCE.preview)
        warnings.push(
          `${file}: aspect ${aspect.toFixed(4)}, expected ${wanted.toFixed(4)} (${masterWidth}×${masterHeight})`,
        );
    }
    const camera = data?.cameras[plate.camera];
    if (camera) {
      const [cw, ch] = camera.resolution;
      if (Math.abs(cw / ch / aspect - 1) > ASPECT_TOLERANCE.preview)
        warnings.push(
          `${file}: image aspect ${aspect.toFixed(4)} differs from camera "${plate.camera}" resolution ${cw}×${ch}`,
        );
      else if (
        spec.kind === 'master' &&
        (cw !== image.width || ch !== image.height)
      )
        warnings.push(
          `${file}: ${size} but camera "${plate.camera}" records ${cw}×${ch}`,
        );
    }
  }

  // The top-down camera rig (Phase 1).
  const rig = named(RIG_NAME);
  for (const file of rig) claimed.add(file);
  if (spec.rig && !rig.some((file) => RIG_FORMATS.includes(extension(file))))
    errors.push(`missing top-down camera rig image: ${RIG_NAME}.*`);

  for (const file of files) {
    if (claimed.has(file)) continue;
    if (NOTE_FORMATS.includes(extension(file))) info.push(`notes: ${file}`);
    else warnings.push(`unrecognised file: ${file}`);
  }
  return report;
}

/** Inspect a delivery root: every requested phase that is present. */
export async function inspectRoot({ root = DELIVERY_ROOT, phases } = {}) {
  const reports = [];
  let approved = null;
  for (const phase of [1, 2, 3]) {
    const report = await inspectDelivery({
      dir: path.join(root, PHASES[phase].folder),
      phase,
      previous: approved,
    });
    if (report.present && report.cameras?.status === 'valid' && !approved)
      approved = report.cameras.data;
    if (!phases || phases.includes(phase)) reports.push(report);
  }
  return reports;
}

export function statusOf(report) {
  if (!report.present) return 'NOT READY';
  return report.errors.length ? 'BLOCKED' : 'NO BLOCKING ERRORS';
}

export function formatReport(report) {
  const lines = [`${report.label}`, `  ${report.dir}`];
  if (!report.present) {
    lines.push('  STATUS: NOT READY — no delivery in this folder');
    return lines.join('\n');
  }
  for (const message of report.errors) lines.push(`  ERROR    ${message}`);
  for (const message of report.warnings) lines.push(`  WARNING  ${message}`);
  for (const message of report.info) lines.push(`  info     ${message}`);
  lines.push(`  HUMAN REVIEW (${CHECKLIST}):`);
  for (const item of report.human) lines.push(`    - ${item}`);
  lines.push(
    report.errors.length
      ? `  STATUS: BLOCKED — ${plural(report.errors.length, 'error')}, ${plural(report.warnings.length, 'warning')}`
      : `  STATUS: NO BLOCKING ERRORS — ${plural(report.warnings.length, 'warning')}; human review still required (nothing is approved by this script)`,
  );
  return lines.join('\n');
}

async function main(argv) {
  const option = (name) => {
    const index = argv.indexOf(name);
    return index < 0 ? null : (argv[index + 1] ?? '');
  };
  const strict = argv.includes('--strict');
  const phaseArgument = option('--phase');
  const phase = phaseArgument === null ? null : Number(phaseArgument);
  if (phase !== null && !PHASES[phase]) {
    console.error('--phase must be 1, 2 or 3');
    return 2;
  }
  const dir = option('--dir');
  if (dir !== null && phase === null) {
    console.error('--dir needs --phase');
    return 2;
  }
  const root = option('--root') ?? DELIVERY_ROOT;
  const reports =
    dir !== null
      ? [await inspectDelivery({ dir, phase })]
      : await inspectRoot({ root, phases: phase === null ? null : [phase] });
  console.log('Atrium orbit — studio delivery intake');
  const present = reports.filter((report) => report.present);
  if (!present.length) {
    console.log(
      `\nSTATUS: NOT READY — no studio delivery found in ${dir ?? root}` +
        `\nExpected ${Object.values(PHASES)
          .map((p) => `${p.folder}/`)
          .join(', ')} with the files listed in ${CHECKLIST}.`,
    );
    return strict ? 1 : 0;
  }
  for (const report of phase === null ? present : reports)
    console.log(`\n${formatReport(report)}`);
  const blocked = present.some((report) => report.errors.length);
  const missing = reports.some((report) => !report.present);
  return blocked || (strict && missing) ? 1 : 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  process.exitCode = await main(process.argv.slice(2));
