import {
  ATRIUM_ORBIT_STATES,
  ATRIUM_ORBIT_TITLE_LEAD,
  ATRIUM_ROOMS,
  type AtriumOrbitStateId,
  type AtriumRoomId,
} from './atrium-orbit-model';
import { validateAtriumOrbitCameras } from './atrium-orbit-cameras';
import {
  ATRIUM_ORBIT_CAMERA_DATA,
  ATRIUM_ORBIT_PLATES,
  atriumOrbitLayout,
  atriumOrbitReadiness,
  atriumOrbitRecord,
  plateOrientation,
  plateSources,
  plateWindow,
  type AtriumOrbitRecord,
} from './atrium-orbit-manifest';
import {
  ATRIUM_ORBIT_TIMING,
  ATRIUM_ORBIT_TIMING_REDUCED,
  atriumEditorial,
  atriumGateway,
  ATRIUM_ORBIT_CARRY_IDLE,
  atriumRelease,
  buildOrbitTimeline,
  carryOrbit,
  planPlates,
  sampleOrbit,
  type AtriumOrbitCarryTiming,
  type AtriumOrbitDirection,
  type AtriumOrbitSample,
} from './atrium-orbit-progress';
import {
  ATRIUM_ORBIT_SHOTS,
  plateRest,
  plateTransitionInput,
  selectPlateTransition,
  type PlateLayer,
} from './atrium-orbit-transition';
import { prepareSceneImage, type SceneImagePreparation } from './scene-image';
import './atrium-orbit-preview.css';

/** TP3D PASS 6A — the Tier B room orbit shell. The homepage's orbit since
 * STEP 2B (a development / preview harness until then).
 *
 * Loaded by home-story-timeline.ts through a dynamic import, as its own
 * chunk; if it fails the portal orbit remains. It owns no scroll,
 * wheel or resize listener, no timer and no animation frame: the master
 * timeline calls `update` from its one render, and decoded plates call
 * `wake` (the timeline's schedule) once.
 *
 * Structure (imperative, like the rest of Scene 3's runtime):
 *   OrbitPlateStage   inside the approved Atrium backdrop, so the bridge's
 *                     exposure, camera and reveal apply to every plate;
 *   RoomEditorial     the approved copy block's classes: "Enter" + phrase,
 *                     body copy once, "EXPLORE THIS ROOM";
 *   RoomIndicator     round thumbnail + "01 / 04 LIVING" (spec §8 zone I);
 *   Diagnostic        an engineering readout naming the position and what
 *                     is missing; only on explicit request (`diagnostics`,
 *                     ?atriumOrbitDebug=1), never on the review URL.
 * Every element derives from ONE state per frame (`show`).
 *
 * Orbit-mode UI model (PASS 6A.5, owner decisions of PASS 6A.75). While this
 * controller is loaded (`.hc-worlds[data-atrium-orbit-preview]`) the
 * approved "Enter the worlds." copy never shows:
 *   Arrival   architecture only: no room labels, no editorial copy, no
 *             counter, thumbnail, CTA or indicator, no ENTER THE WORLD;
 *   Living    the first public room: 3D WORLDS, "Enter the living room.",
 *             body, EXPLORE THIS ROOM →, the indicator 01 / 04 LIVING, and
 *             the room labels (active full, the others quiet);
 *   Bedroom, Bathroom  the same model, 02–03 / 04;
 *   Kitchen   04 / 04, readable alone first; in the later part of its hold
 *             the existing WorldGatewayLink returns (`atriumGateway`) and
 *             the indicator yields its zone to it;
 *   Release   (PASS 6A.96) still Kitchen: the copy, CTA, labels, indicator
 *             and baseline leave, then the gateway, so the sticky stage
 *             carries a quiet architectural frame into the Footer.
 * The gateway and the baseline are still written only by the timeline
 * (opacity and inert); this controller only supplies their values. Without
 * the controller, Scene 3 is the production fallback.
 *
 * PASS 6A.96 keeps the Atrium in view for the whole harness: the exposure
 * shade that backs the copy follows the editorial UI (`--atrium-editorial`),
 * so Arrival and the release show the architecture, never an empty shaded
 * field.
 *
 * PASS 6B.0 draws the orbit on comp plates (atrium-orbit-manifest.ts). Each
 * room is its own view of the Atrium, and the camera travels between them
 * (atrium-orbit-transition.ts): this controller only poses the two plates a
 * frame asks for. The approved Atrium itself is never moved: Arrival at
 * rest IS that photograph, and the plate that pushes in from it is a second
 * drawing of the same file, shown only while it travels. */

export type AtriumOrbitInput = {
  /** 0 → 1 over the approved journey's own span (the timeline's p). */
  baseStoryProgress: number;
  /** 0 → 1 over the appended orbit span; 0 until baseStoryProgress = 1. */
  roomOrbitProgress: number;
  width: number;
  height: number;
  reduced: boolean;
};

/** What the timeline needs back: the World gateway's reveal (0 → 1) and what
 * the release leaves of the approved baseline (1 → 0). */
export type AtriumOrbitFrame = {
  gateway: number;
  gatewayInteractive: boolean;
  baseline: number;
};

export type AtriumOrbitOptions = {
  /** The engineering readout. Off unless explicitly requested. */
  diagnostics?: boolean;
};

export type AtriumOrbitController = ReturnType<
  typeof createAtriumOrbitController
>;

type PlateState = 'loading' | 'ready' | 'failed';
type Plate = {
  picture: HTMLPictureElement;
  preparation: SceneImagePreparation;
  state: PlateState;
};
type Thumb = {
  image: HTMLImageElement;
  preparation: SceneImagePreparation;
  ready: boolean;
};

export function createAtriumOrbitController(
  worlds: HTMLElement,
  wake: () => void,
  { diagnostics = false }: AtriumOrbitOptions = {},
) {
  const backdrop = worlds.querySelector<HTMLElement>('.hc-atrium-backdrop');
  const copy = worlds.querySelector<HTMLElement>('.hc-atrium-copy');
  const gateway = worlds.querySelector<HTMLElement>('.hc-atrium-cta');
  const roomLabels = worlds.querySelector<HTMLElement>('.hc-atrium-rooms');
  const roomLabelsInert = roomLabels?.hasAttribute('inert') ?? false;
  const links = [
    ...worlds.querySelectorAll<HTMLAnchorElement>(
      '.hc-atrium-rooms a[data-room]',
    ),
  ];
  // Routes are the rendered room links' own hrefs (worldsChapterOptions).
  const routes: Partial<Record<AtriumRoomId, string>> = {};
  for (const link of links) {
    const room = ATRIUM_ROOMS.find((id) => id === link.dataset.room);
    const href = link.getAttribute('href');
    if (room && href) routes[room] = href;
  }
  const records = Object.fromEntries(
    ATRIUM_ORBIT_STATES.map((id) => [id, atriumOrbitRecord(id, routes)]),
  ) as Record<AtriumOrbitStateId, AtriumOrbitRecord>;
  const cameras = validateAtriumOrbitCameras(ATRIUM_ORBIT_CAMERA_DATA);
  const stepAngles = cameras.status === 'valid' ? cameras.stepAngles : null;
  const readiness = atriumOrbitReadiness();
  if (cameras.status === 'invalid')
    console.warn('[Tier B] camera data rejected', cameras.errors);
  if (cameras.status !== 'missing' && cameras.warnings.length)
    console.warn('[Tier B] camera data warnings', cameras.warnings);

  const element = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = '',
    text = '',
  ) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const attr = (node: Element, name: string, value: string | null) => {
    if (node.getAttribute(name) === value) return;
    if (value === null) node.removeAttribute(name);
    else node.setAttribute(name, value);
  };
  const property = (node: HTMLElement, name: string, value: string) => {
    if (node.style.getPropertyValue(name) !== value)
      node.style.setProperty(name, value);
  };
  const add = (parent: Node, ...children: Node[]) => {
    for (const child of children) parent.appendChild(child);
  };
  const insertAfter = (reference: Node, node: Node) =>
    reference.parentNode?.insertBefore(node, reference.nextSibling);
  const text = (node: Element | null | undefined) =>
    (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

  // OrbitPlateStage. Decorative (the backdrop is aria-hidden); at most the
  // current and the incoming plate are displayed, the rest stay unrendered.
  const stage = element('div', 'hc-room-orbit-stage');
  if (backdrop) add(backdrop, stage);

  // RoomEditorial. One title: the stable lead and the changing phrase.
  const editorial = element('div', 'hc-atrium-copy hc-room-orbit-copy');
  const phrase = element('em');
  const title = element('h2', 'hc-room-orbit-title');
  add(
    title,
    element('span', '', ATRIUM_ORBIT_TITLE_LEAD),
    element('br'),
    phrase,
  );
  const cta = element('a', 'hc-link hc-room-orbit-cta', 'EXPLORE THIS ROOM');
  const ctaRoom = element('span', 'hc-room-orbit-sr');
  const arrow = element('span', '', '⟶');
  arrow.setAttribute('aria-hidden', 'true');
  add(cta, ctaRoom, arrow);
  add(
    editorial,
    element(
      'p',
      'hc-eyebrow',
      text(copy?.querySelector('.hc-eyebrow:not(.hc-signoff)')),
    ),
    title,
    // The body copy is the same for every room: rendered once.
    element('p', 'hc-body', text(copy?.querySelector('.hc-body'))),
    cta,
  );
  editorial.hidden = true;
  if (copy) insertAfter(copy, editorial);

  // RoomIndicator + RoomThumbnail.
  const indicator = element('div', 'hc-room-orbit-indicator');
  const thumbFrame = element('span', 'hc-atrium-preview hc-room-orbit-thumb');
  thumbFrame.setAttribute('aria-hidden', 'true');
  const counter = element('span', 'hc-room-orbit-counter');
  const label = element('span', 'hc-room-orbit-label');
  add(indicator, thumbFrame, counter, label);
  indicator.hidden = true;
  // Before the gateway: on phones (one column) the counter sits above the
  // gateway's slot; elsewhere both share zone I and cross-fade.
  if (gateway?.parentNode) gateway.parentNode.insertBefore(indicator, gateway);
  else insertAfter(editorial, indicator);

  // The readout exists only on explicit request: the review URL shows the
  // design, with no technical text over it.
  const diagnostic = diagnostics
    ? element('p', 'hc-room-orbit-diagnostic')
    : null;
  if (diagnostic) {
    diagnostic.setAttribute('aria-hidden', 'true');
    add(worlds, diagnostic);
  }

  // Camera data only weights the moves: the plates alone decide the mode.
  const mode = readiness.desktopComplete ? 'plates' : 'diagnostic';
  attr(worlds, 'data-atrium-orbit-preview', mode);

  const plates = new Map<AtriumOrbitStateId, Plate>();
  const thumbs = new Map<AtriumRoomId, Thumb>();
  let destroyed = false;
  let reduced: boolean | null = null;
  let timing = ATRIUM_ORBIT_TIMING;
  let timeline = buildOrbitTimeline(timing, stepAngles);
  let transition = selectPlateTransition(false);
  let direction: AtriumOrbitDirection = 'forward';
  let lastRoomOrbitProgress: number | null = null;
  let carried = ATRIUM_ORBIT_CARRY_IDLE;
  let sample: AtriumOrbitSample = sampleOrbit(0, timeline, timing);
  let held: AtriumOrbitStateId | null = null;
  let shown: AtriumOrbitStateId | null = null;
  let moving = false;
  let lastDiagnostic = '';
  let presence = 0;
  const rest: AtriumOrbitFrame = {
    gateway: 0,
    gatewayInteractive: false,
    baseline: 1,
  };
  let frame = rest;
  const viewport = { width: 1, height: 1 };

  /** Create and start one plate on demand; never for a missing plate. */
  const plate = (id: AtriumOrbitStateId, priority: 'auto' | 'low') => {
    const existing = plates.get(id);
    if (existing) return existing;
    const sources = plateSources(id);
    if (!sources) return null;
    const picture = element('picture', 'hc-room-orbit-plate');
    picture.dataset.plate = id;
    picture.hidden = true;
    for (const choice of sources.sources) {
      const source = element('source');
      if (choice.media) source.media = choice.media;
      source.type = choice.type;
      source.sizes = choice.sizes;
      source.dataset.srcset = choice.srcset;
      add(picture, source);
    }
    const image = element('img');
    image.alt = '';
    image.width = sources.fallback.width;
    image.height = sources.fallback.height;
    image.sizes = sources.fallback.sizes;
    image.decoding = 'async';
    image.loading = 'lazy';
    image.dataset.src = sources.fallback.src;
    add(picture, image);
    add(stage, picture);
    const entry: Plate = {
      picture,
      state: 'loading',
      preparation: prepareSceneImage(
        image,
        {
          ready() {
            entry.state = 'ready';
            if (!destroyed) wake();
          },
          failed() {
            // No broken image: a failed plate is simply never displayed.
            entry.state = 'failed';
            if (!destroyed) wake();
          },
        },
        priority,
      ),
    };
    plates.set(id, entry);
    entry.preparation.start();
    return entry;
  };
  const ready = (id: AtriumOrbitStateId) => plates.get(id)?.state === 'ready';
  type Layer = [AtriumOrbitStateId, PlateLayer];
  const percent = (value: number) => `${(value * 100).toFixed(3)}%`;
  /** A plate's 2D scale: one number, or across and down where they differ. */
  const scaleOf = ({ scale, scaleY = scale }: PlateLayer) =>
    scaleY.toFixed(5) === scale.toFixed(5)
      ? scale.toFixed(5)
      : `${scale.toFixed(5)}, ${scaleY.toFixed(5)}`;
  /** What a plate shows of itself, as a mask over its own box: a soft
   * vertical edge (clear at edge[0], whole at edge[1], in either order) and
   * a soft ellipse. Two mask images add up, so the plate shows through
   * either. */
  const maskOf = ({ edge, iris }: PlateLayer) => {
    const parts: string[] = [];
    if (edge)
      parts.push(
        edge[0] <= edge[1]
          ? `linear-gradient(90deg, transparent ${percent(edge[0])}, #000 ${percent(edge[1])})`
          : `linear-gradient(270deg, transparent ${percent(1 - edge[0])}, #000 ${percent(1 - edge[1])})`,
      );
    if (iris) {
      const solid =
        iris.alpha >= 1 ? '#000' : `rgba(0, 0, 0, ${iris.alpha.toFixed(4)})`;
      // Two radii make the gradient's shape; no keyword is needed.
      parts.push(
        `radial-gradient(${percent(iris.rx)} ${percent(iris.ry)} at ${percent(iris.x)} ${percent(iris.y)}, ${solid} ${percent(iris.whole)}, transparent 100%)`,
      );
    }
    return parts.length ? parts.join(', ') : 'none';
  };

  const thumb = (room: AtriumRoomId) => {
    const existing = thumbs.get(room);
    if (existing) return existing;
    const source = records[room].thumbnail;
    if (!source) return null;
    const image = element('img');
    image.alt = '';
    image.width = source.width;
    image.height = source.height;
    image.decoding = 'async';
    image.loading = 'lazy';
    image.dataset.src = source.src;
    image.hidden = true;
    add(thumbFrame, image);
    const entry: Thumb = {
      image,
      ready: false,
      preparation: prepareSceneImage(
        image,
        {
          ready() {
            entry.ready = true;
            if (!destroyed) paintThumbs();
          },
          failed() {
            entry.ready = false;
            if (!destroyed) paintThumbs();
          },
        },
        'low',
      ),
    };
    thumbs.set(room, entry);
    entry.preparation.start();
    return entry;
  };
  const paintThumbs = () => {
    const room = shown ? records[shown].room : null;
    for (const [id, entry] of thumbs)
      entry.image.hidden = !(id === room && entry.ready);
  };

  /** Decode before display. Every plate the transition wants must be
   * decoded, or the last fully drawn plate holds at rest. Arrival at rest
   * is the approved Atrium already under the stage, so it is not drawn a
   * second time: its plate shows only while the camera leaves it. */
  const paintPlates = () => {
    const window = plateWindow(viewport.width, viewport.height);
    const layout = atriumOrbitLayout(viewport.width);
    const rest = (id: AtriumOrbitStateId) => plateRest(id, window, layout);
    const input = plateTransitionInput(
      sample,
      direction,
      stepAngles,
      plateOrientation(viewport.width, viewport.height),
      window,
      layout,
    );
    const pose = input ? transition(input) : null;
    const wanted: Layer[] =
      input && pose
        ? [
            [input.from, pose.from],
            [input.to, pose.to],
          ]
        : [[sample.activeState, rest(sample.activeState)]];
    const visible = wanted.filter(([, layer]) => layer.opacity > 0);
    // The view the frame shows, which the UI follows.
    const lead =
      input && pose && visible.length > 1
        ? pose.lead === 'from'
          ? input.from
          : input.to
        : (visible[0]?.[0] ?? null);
    let layers = visible;
    let drawn: AtriumOrbitStateId | null = lead;
    if (!lead) layers = [];
    else if (visible.every(([id]) => ready(id))) held = lead;
    else {
      drawn = held && ready(held) && lead !== 'arrival' ? held : null;
      layers = drawn ? [[drawn, rest(drawn)]] : [];
    }
    if (layers.length === 1 && layers[0][0] === 'arrival' && !input)
      layers = [];
    const over = input && pose ? input[pose.over] : null;
    moving = layers.length > 1;
    for (const [id, entry] of plates) {
      const layer = layers.find(([state]) => state === id)?.[1] ?? null;
      if (entry.picture.hidden !== !layer) entry.picture.hidden = !layer;
      if (!layer) continue;
      attr(
        entry.picture,
        'data-plate-role',
        moving && id === over ? 'over' : 'under',
      );
      property(entry.picture, 'opacity', layer.opacity.toFixed(4));
      property(
        entry.picture,
        'transform',
        layer.x === 0 &&
          layer.y === 0 &&
          layer.scale === 1 &&
          (layer.scaleY ?? 1) === 1
          ? 'none'
          : `translate(${percent(layer.x)}, ${percent(layer.y)}) scale(${scaleOf(layer)})`,
      );
      const mask = maskOf(layer);
      property(entry.picture, '-webkit-mask-image', mask);
      property(entry.picture, 'mask-image', mask);
      // PASS 6B.1: a plate is never promoted (no will-change), moving or
      // not. A promoted plate is drawn from a texture and resampled, which
      // is softer than the same plate at rest: the picture would snap as
      // each move begins and ends. Its 2D pose is drawn directly instead.
    }
    // The UI follows the drawn plate. Without a complete delivery the UI
    // follows the scroll sample (preview of the sync, with the diagnostic).
    return (
      drawn ?? (readiness.desktopComplete ? 'arrival' : sample.activeState)
    );
  };

  /** The one source of truth for title, counter, label, thumbnail, CTA and
   * room-label emphasis. Writes only when the state changes; no live
   * region, so screen readers are never flooded while scrolling. */
  const show = (id: AtriumOrbitStateId) => {
    if (id === shown) return;
    shown = id;
    const record = records[id];
    const room = record.editorial;
    attr(worlds, 'data-atrium-room', record.room);
    editorial.hidden = indicator.hidden = !room;
    for (const link of links)
      attr(
        link,
        'data-atrium-current',
        record.room && link.dataset.room === record.room ? '' : null,
      );
    if (!room || !record.room) {
      // Arrival: no editorial UI. Cleared, so the DOM never depends on the
      // path that reached this position.
      phrase.textContent = counter.textContent = label.textContent = '';
      ctaRoom.textContent = '';
      cta.removeAttribute('href');
      paintThumbs();
      return;
    }
    phrase.textContent = room.phrase;
    counter.textContent = room.counter;
    label.textContent = room.label;
    ctaRoom.textContent = `, ${room.label}`;
    cta.hidden = !record.route;
    if (record.route) cta.href = record.route;
    thumb(record.room);
    const next = record.next ? records[record.next].room : null;
    if (next) thumb(next);
    paintThumbs();
  };

  const paintDiagnostic = () => {
    if (!diagnostic) return;
    const lines = [
      'DEVELOPMENT PREVIEW · Tier B interaction harness · not production',
    ];
    // State readout: position, segment boundaries, transition, gateway.
    // The sampler's own rule: the first segment not yet ended, else the last.
    const found = timeline.segments.findIndex(
      (segment) => sample.roomOrbitProgress < segment.end,
    );
    const index = found < 0 ? timeline.segments.length - 1 : found;
    const segment = timeline.segments[index];
    lines.push(
      `roomOrbitProgress ${sample.roomOrbitProgress.toFixed(4)} · segment ${index + 1}/${timeline.segments.length} [${segment.start.toFixed(3)}–${segment.end.toFixed(3)}]`,
      sample.phase === 'move'
        ? `move ${sample.transitionFrom} → ${sample.transitionTo} · local ${sample.localTransitionProgress.toFixed(3)} · UI ${shown}`
        : sample.phase === 'release'
          ? `release ${sample.activeState} · ${sample.releaseProgress.toFixed(3)} · UI ${shown}${frame.gateway === 0 && presence === 0 ? ' · quiet frame' : ''}`
          : `hold ${sample.activeState} · ${sample.holdProgress.toFixed(3)} · UI ${shown}`,
      `gateway reveal ${frame.gateway.toFixed(3)}${frame.gatewayInteractive ? ' · interactive' : ''} · editorial ${presence.toFixed(3)} · ${direction}`,
    );
    const wantedIds = new Set(
      sample.phase === 'move'
        ? [sample.transitionFrom!, sample.transitionTo!]
        : [sample.activeState],
    );
    for (const id of wantedIds) {
      const status = ATRIUM_ORBIT_PLATES[id].desktop;
      if (status !== 'available')
        lines.push(
          `${id === 'arrival' ? 'Arrival' : records[id].editorial!.label} production plate missing${id === 'arrival' ? ' (approved Atrium shown)' : status === 'comp' ? ' (comp plate shown)' : ''}`,
        );
      if (plates.get(id)?.state === 'failed')
        lines.push(`${id} plate failed to load (holding)`);
    }
    if (cameras.status !== 'valid')
      lines.push(
        `Camera data ${cameras.status}: ${timeline.weighting} weighting`,
      );
    const value = lines.join('\n');
    if (value === lastDiagnostic) return;
    lastDiagnostic = value;
    diagnostic.textContent = value;
  };

  return {
    update(input: AtriumOrbitInput): AtriumOrbitFrame {
      if (destroyed) return rest;
      if (input.reduced !== reduced) {
        reduced = input.reduced;
        timing = reduced ? ATRIUM_ORBIT_TIMING_REDUCED : ATRIUM_ORBIT_TIMING;
        timeline = buildOrbitTimeline(timing, stepAngles);
        transition = selectPlateTransition(reduced);
      }
      viewport.width = input.width;
      viewport.height = input.height;
      attr(worlds, 'data-atrium-layout', atriumOrbitLayout(input.width));
      const { baseStoryProgress, roomOrbitProgress } = input;
      if (
        lastRoomOrbitProgress !== null &&
        roomOrbitProgress !== lastRoomOrbitProgress
      )
        direction =
          roomOrbitProgress > lastRoomOrbitProgress ? 'forward' : 'reverse';
      lastRoomOrbitProgress = roomOrbitProgress;
      sample = sampleOrbit(roomOrbitProgress, timeline, timing);
      // Nothing is requested before Scene 3 approaches; never all plates.
      const plan = planPlates({
        baseStoryProgress,
        sample,
        direction,
      });
      for (const id of plan.required) plate(id, 'auto');
      for (const id of plan.warm) plate(id, 'low');
      show(paintPlates());
      // The World gateway follows the same shown state (one authority).
      const state = shown ?? sample.activeState;
      const next = atriumGateway(sample, state, timing);
      const release = atriumRelease(sample, timing);
      const ui = atriumEditorial(sample, state, timing);
      presence = ui.presence;
      frame = {
        gateway: next.reveal,
        gatewayInteractive: next.interactive,
        baseline: release.editorial,
      };
      property(indicator, '--atrium-indicator', next.indicator.toFixed(4));
      // One value fades the copy, CTA, room labels, indicator and the
      // exposure shade behind the copy: none of them without the others.
      property(worlds, '--atrium-editorial', presence.toFixed(4));
      for (const node of [editorial, indicator, roomLabels])
        if (node && node.inert !== !ui.interactive)
          node.inert = !ui.interactive;
      attr(
        worlds,
        'data-atrium-release',
        sample.phase !== 'release' ? null : release.quiet ? 'quiet' : 'leaving',
      );
      paintDiagnostic();
      return frame;
    },
    /** Is the camera travelling between two rooms at this place of the
     * orbit span (a pan)? The timeline lets the stage trail the hand by more
     * there (MOTION.follow.travel). */
    travelling(roomOrbitProgress: number) {
      if (destroyed || reduced) return false;
      const at = sampleOrbit(roomOrbitProgress, timeline, timing);
      return (
        at.phase === 'move' &&
        at.transitionIndex !== null &&
        ATRIUM_ORBIT_SHOTS[at.transitionIndex]?.kind === 'pan'
      );
    },
    /** A room change is carried through (carryOrbit): once the hand has
     * rested between two rooms, the page is scrolled on to the room it was
     * heading for, and the camera follows it there. `hand` is where the page
     * is now and whether a finger holds it; null gives the page back at
     * once (the intro, reduced motion, a picture not ready). Returns whether
     * another frame is wanted. This is the one place the homepage writes the
     * scroll position; the hand's own scrolling is never touched. */
    carry(
      hand: { scroll: number; now: number; touching: boolean } | null,
      where?: { top: number; length: number },
      timing?: AtriumOrbitCarryTiming,
    ) {
      if (destroyed || reduced || !hand || !where || !timing) {
        carried = ATRIUM_ORBIT_CARRY_IDLE;
        return false;
      }
      const next = carryOrbit(
        carried,
        hand,
        where,
        timeline,
        (index) => ATRIUM_ORBIT_SHOTS[index]?.kind === 'pan',
        timing,
      );
      carried = next.carry;
      if (next.write !== null)
        window.scrollTo({ top: next.write, behavior: 'instant' });
      return next.active;
    },
    /** Hidden tab: nothing is promoted, so there is nothing to drop. A
     * carry under way is dropped: the page stays where it is. */
    suspend() {
      moving = false;
      carried = ATRIUM_ORBIT_CARRY_IDLE;
    },
    debug() {
      const s = sample;
      const step =
        s.phase === 'move'
          ? `${s.transitionFrom}→${s.transitionTo} ${s.localTransitionProgress.toFixed(3)}`
          : s.phase === 'release'
            ? `release ${s.releaseProgress.toFixed(3)}`
            : `hold ${s.holdProgress.toFixed(3)}`;
      const assets = ATRIUM_ORBIT_STATES.map(
        (id) =>
          `${id.slice(0, 3)}:${ATRIUM_ORBIT_PLATES[id].desktop === 'missing' ? 'missing' : (plates.get(id)?.state ?? 'idle')}`,
      ).join(' ');
      return `Tier B ${mode} · roomOrbit ${s.roomOrbitProgress.toFixed(4)} · ${s.activeState} (${step}) · ${direction} · UI ${shown} · plates ${assets} · cameras ${cameras.status} · ${timeline.weighting} · gateway ${frame.gateway.toFixed(3)} · editorial ${presence.toFixed(3)}${moving ? ' · blending' : ''}`;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const entry of plates.values()) entry.preparation.destroy();
      for (const entry of thumbs.values()) entry.preparation.destroy();
      plates.clear();
      thumbs.clear();
      for (const node of [stage, editorial, indicator, diagnostic])
        node?.remove();
      for (const name of [
        'data-atrium-orbit-preview',
        'data-atrium-room',
        'data-atrium-layout',
        'data-atrium-release',
      ])
        worlds.removeAttribute(name);
      worlds.style.removeProperty('--atrium-editorial');
      if (roomLabels && roomLabels.inert !== roomLabelsInert)
        roomLabels.inert = roomLabelsInert;
      for (const link of links) link.removeAttribute('data-atrium-current');
    },
  };
}
