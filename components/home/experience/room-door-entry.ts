import { DURATION, cssEase } from '@/lib/motion/tokens';
import {
  atriumDoors,
  doorAt,
  doorFrame,
  doorsClip,
} from './atrium-orbit-doors';
import { ATRIUM_ORBIT_PLATE_RATIO } from './atrium-orbit-manifest';
import type { AtriumOrbitStateId, AtriumRoomId } from './atrium-orbit-model';

/** Entering a room through its door (owner decision, 2026-10-09).
 *
 * The Atrium's doors are shut wherever it shows (atrium-orbit-doors.ts),
 * and this is the only thing that opens one. Choosing a door opens it: the leaf rises into its lintel, the camera pushes through the doorway,
 * the picture goes to light, and the room's page opens under that light.
 * EXPLORE THIS ROOM and the room labels enter the same way, through the door
 * of their room where one is on stage.
 *
 * Like the World gateway (components/world/world-portal.ts), this only
 * enhances a plain primary activation of what is already a link: modifier
 * and middle clicks, and a page without JavaScript, keep the link. The route
 * is the room link's own, and it is that link which is followed.
 *
 * This is the one part of the room orbit that knows time and that listens:
 * one click listener on the Atrium, and the Web Animations it starts. It
 * never touches the scroll position, the wheel or the approved photograph.
 * What it moves is the room orbit's own stage, which the controller holds
 * still for it (`hold`) and takes back if the room is not entered. */

export const ROOM_ENTRY = {
  /** The leaf rises into the lintel. */
  openMs: 900,
  /** The camera sets off a little after the leaf, and ends in the light. */
  pushDelayMs: 160,
  pushMs: DURATION.cinematic + 240,
  /** How far it closes in on the doorway at most: the plates are small
   * pictures, and the light takes over before they break up. */
  pushMax: 3.4,
  /** The light: the last part of the push. */
  lightMs: 460,
  /** The words and controls over the architecture leave at once. */
  clearMs: 320,
  /** Reduced motion: no door, no camera; a short flat cover. */
  reducedMs: DURATION.micro,
  /** The room's page comes out of the light. */
  releaseMs: 520,
  /** Above the header (40), below the intro (200): the gateway's level. */
  zIndex: 150,
  /** The page the room opens on, the site's own ground. */
  light: 'var(--background, #f7f5f0)',
  /** The room's page did not come: open the real link. And a cover that
   * was never taken off is taken off. */
  navigationWatchdogMs: 2600,
  releaseWatchdogMs: 6000,
} as const;

/** The camera's own ease into the doorway: it gathers speed and is at its
 * fastest as the light takes the picture. */
const PUSH_EASE = 'cubic-bezier(0.5, 0, 0.82, 0.42)';

export type RoomDoorEntryHost = {
  /** The Atrium section: clicks are heard here. */
  worlds: HTMLElement;
  /** The room orbit's stage: what the camera's push moves. */
  stage: HTMLElement;
  /** The rendered room links (their `data-room`, their own routes). */
  links: readonly HTMLAnchorElement[];
  /** The door pictures on stage now, each with the view it lies on. */
  doors: () => { view: AtriumOrbitStateId; picture: HTMLElement }[];
  /** Is that view's own plate on the stage, not only its doors? */
  whole: (view: AtriumOrbitStateId) => boolean;
  /** The plate window's height (a stage wider than the plate shows less
   * than the whole picture down). */
  tall: () => number;
  /** The room the editorial UI shows (EXPLORE THIS ROOM's room). */
  room: () => AtriumRoomId | null;
  reduced: () => boolean;
  /** Stand still (true), or take the picture back (false). */
  hold: (on: boolean) => void;
};

type Activation = Pick<
  MouseEvent,
  'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'defaultPrevented'
>;
/** Only a plain primary activation is taken; anything else stays the
 * link's (keyboard Enter on a link arrives as one). */
export const isPlainActivation = (event: Activation) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

/** Where the camera ends, as a 2D pose of the stage about its top left
 * corner: the doorway (its middle and size, px of the stage) brought to the
 * middle and grown to fill the stage, as far as `max` allows, and never so
 * far across that the stage's own edge comes into view. */
export function doorPush(
  door: { x: number; y: number; width: number; height: number },
  stage: { width: number; height: number },
  max: number = ROOM_ENTRY.pushMax,
) {
  const fill = Math.max(
    stage.width / Math.max(1, door.width),
    stage.height / Math.max(1, door.height),
  );
  const scale = Math.min(max, Math.max(1, fill));
  const within = (value: number, low: number) =>
    Math.min(0, Math.max(low, value));
  return {
    x: within(stage.width / 2 - scale * door.x, stage.width * (1 - scale)),
    y: within(stage.height / 2 - scale * door.y, stage.height * (1 - scale)),
    scale,
  };
}

// The cover outlives the Atrium that raised it: it is taken off on the
// room's page. One at a time, like the gateway's.
let cover: HTMLElement | null = null;
let coverTimers: ReturnType<typeof setTimeout>[] = [];
function dropCover() {
  for (const timer of coverTimers) clearTimeout(timer);
  coverTimers = [];
  cover?.remove();
  cover = null;
}
/** The room's page is there: reset it to its top under the cover, then let
 * it come out of the light. */
function releaseCover() {
  const held = cover;
  if (!held) return;
  for (const timer of coverTimers) clearTimeout(timer);
  coverTimers = [];
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  if (typeof held.animate !== 'function') return dropCover();
  held
    .animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: ROOM_ENTRY.releaseMs,
      easing: cssEase('primary'),
      fill: 'forwards',
    })
    .finished.then(
      () => cover === held && dropCover(),
      () => cover === held && dropCover(),
    );
}

export function createRoomDoorEntry(host: RoomDoorEntryHost) {
  const { worlds, stage, links } = host;
  let state: 'idle' | 'entering' | 'leaving' = 'idle';
  let animations: Animation[] = [];
  let timers: ReturnType<typeof setTimeout>[] = [];
  let destroyed = false;
  // The room link's own activation, sent on by this module once the door
  // has been gone through: it must not be taken a second time.
  let following = false;
  let origin = '';

  const play = (
    node: HTMLElement,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options: KeyframeAnimationOptions,
  ) => {
    if (typeof node.animate !== 'function') return null;
    const animation = node.animate(keyframes, { fill: 'forwards', ...options });
    animations.push(animation);
    return animation;
  };
  const still = () => {
    for (const animation of animations) animation.cancel();
    animations = [];
    for (const timer of timers) clearTimeout(timer);
    timers = [];
    stage.style.removeProperty('transform-origin');
  };
  /** The room was not entered: everything as it was. */
  const abandon = () => {
    still();
    dropCover();
    if (state !== 'idle') host.hold(false);
    state = 'idle';
  };

  /** Through the door: the light is whole, follow the room's own link. */
  const leave = (link: HTMLAnchorElement) => {
    if (state !== 'entering' || !cover) return;
    state = 'leaving';
    cover.style.opacity = '1';
    const held = cover;
    const from = window.location.pathname;
    coverTimers.push(
      // The route never came: open the link as a document.
      setTimeout(() => {
        if (cover === held && window.location.pathname === from)
          window.location.assign(link.href);
      }, ROOM_ENTRY.navigationWatchdogMs),
      // A cover nobody took off is taken off.
      setTimeout(
        () => cover === held && releaseCover(),
        ROOM_ENTRY.releaseWatchdogMs,
      ),
    );
    following = true;
    try {
      link.click();
    } catch {
      window.location.assign(link.href);
    } finally {
      following = false;
    }
  };

  const enter = (room: AtriumRoomId, link: HTMLAnchorElement) => {
    state = 'entering';
    origin = window.location.pathname;
    host.hold(true);
    const layer = document.createElement('div');
    layer.dataset.roomEntry = room;
    layer.setAttribute('aria-hidden', 'true');
    Object.assign(layer.style, {
      position: 'fixed',
      inset: '0',
      zIndex: String(ROOM_ENTRY.zIndex),
      background: ROOM_ENTRY.light,
      opacity: '0',
      // Nothing under it is chosen twice.
      pointerEvents: 'auto',
      contain: 'strict',
    });
    dropCover();
    cover = layer;
    document.body.appendChild(layer);

    const through = () => leave(link);
    // The pictures that show this room's door, now that the controller
    // stands still (the wide Atrium's plate is on the stage with them).
    const leaves = host
      .doors()
      .filter(({ view }) => atriumDoors(view).some((d) => d.room === room));
    const light = (duration: number, delay: number) => {
      const fade = play(layer, [{ opacity: 0 }, { opacity: 1 }], {
        duration,
        delay,
        easing: 'linear',
      });
      // A stalled or cancelled animation never strands the entry.
      timers.push(setTimeout(through, delay + duration + 400));
      if (!fade) through();
      else fade.finished.then(through, () => {});
    };
    if (host.reduced() || !leaves.length) {
      light(ROOM_ENTRY.reducedMs, 0);
      return;
    }

    // The words and controls over the architecture leave, and with them
    // the shade that backed the words (the room orbit's own, drawn before
    // the backdrop's picture stage).
    const clear = { duration: ROOM_ENTRY.clearMs, easing: cssEase('primary') };
    for (const node of worlds.children)
      if (node instanceof HTMLElement && !node.contains(stage))
        play(node, { opacity: 0 }, clear);
    if (stage.parentElement) {
      const shade = play(
        stage.parentElement,
        { opacity: 0 },
        { ...clear, pseudoElement: '::before' },
      );
      // A browser that does not play a pseudo-element would fade the whole
      // backdrop instead: the shade then simply stays.
      if (
        shade &&
        (shade.effect as KeyframeEffect | null)?.pseudoElement !== '::before'
      )
        shade.cancel();
    }

    // The leaf rises, on every picture that shows it (two plates share a
    // doorway while the camera travels between rooms).
    const tall = host.tall();
    for (const { view, picture } of leaves)
      play(
        picture,
        [
          { clipPath: doorsClip(view, {}, tall) },
          { clipPath: doorsClip(view, { [room]: 1 }, tall) },
        ],
        { duration: ROOM_ENTRY.openMs, easing: cssEase('cinematic') },
      );

    // The camera goes through the doorway that is largest on the stage,
    // where that doorway's own plate is on the stage to be moved.
    const bounds = stage.getBoundingClientRect();
    const sx = stage.offsetWidth / Math.max(1, bounds.width);
    const sy = stage.offsetHeight / Math.max(1, bounds.height);
    let target: ReturnType<typeof doorPush> | null = null;
    let largest = 0;
    for (const { view, picture } of leaves) {
      const door = atriumDoors(view).find((d) => d.room === room);
      if (!door || !host.whole(view)) continue;
      const frame = doorFrame(door);
      const box = picture.getBoundingClientRect();
      // On a stage wider than the plate, the picture is taller than its box.
      const down =
        (box.height * picture.offsetWidth) /
        ATRIUM_ORBIT_PLATE_RATIO /
        Math.max(1, picture.offsetHeight);
      const width = frame.width * box.width * sx;
      const height = frame.height * down * sy;
      // What the stage shows of it decides (a doorway half off stage is
      // smaller than it is wide).
      const left =
        (box.left - bounds.left + (frame.x - frame.width / 2) * box.width) * sx;
      const seen =
        Math.max(
          0,
          Math.min(stage.offsetWidth, left + width) - Math.max(0, left),
        ) * height;
      if (seen <= largest) continue;
      largest = seen;
      target = doorPush(
        {
          x: (box.left - bounds.left + frame.x * box.width) * sx,
          y: (box.top - bounds.top + frame.y * down) * sy,
          width,
          height,
        },
        { width: stage.offsetWidth, height: stage.offsetHeight },
      );
    }
    if (target && target.scale > 1) {
      stage.style.setProperty('transform-origin', '0 0');
      play(
        stage,
        [
          { transform: 'translate(0px, 0px) scale(1)' },
          {
            transform: `translate(${target.x.toFixed(2)}px, ${target.y.toFixed(2)}px) scale(${target.scale.toFixed(4)})`,
          },
        ],
        {
          duration: ROOM_ENTRY.pushMs,
          delay: ROOM_ENTRY.pushDelayMs,
          easing: PUSH_EASE,
        },
      );
    }
    light(
      ROOM_ENTRY.lightMs,
      ROOM_ENTRY.pushDelayMs + ROOM_ENTRY.pushMs - ROOM_ENTRY.lightMs,
    );
  };

  const click = (event: MouseEvent) => {
    if (following || destroyed) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || !isPlainActivation(event)) return;
    const link = target.closest<HTMLAnchorElement>(
      '.hc-room-orbit-cta, .hc-atrium-rooms a[data-room]',
    );
    const leaves = link
      ? null
      : target.closest<HTMLElement>('.hc-room-orbit-doors');
    let room: AtriumRoomId | null = null;
    // A room label is its room's; EXPLORE THIS ROOM is the shown room's.
    if (link)
      room = (link.dataset.room as AtriumRoomId | undefined) ?? host.room();
    else if (leaves) {
      const view = leaves.dataset.doors as AtriumOrbitStateId | undefined;
      const box = leaves.getBoundingClientRect();
      const down =
        (box.height * leaves.offsetWidth) /
        ATRIUM_ORBIT_PLATE_RATIO /
        Math.max(1, leaves.offsetHeight);
      room =
        (view &&
          doorAt(
            view,
            (event.clientX - box.left) / Math.max(1, box.width),
            (event.clientY - box.top) / Math.max(1, down),
          )?.room) ||
        null;
    } else return;
    const route = room && links.find((item) => item.dataset.room === room);
    // A room without a rendered link has no route: nothing is invented.
    if (!route || !route.getAttribute('href')) return;
    event.preventDefault();
    event.stopPropagation();
    // An entry under way is not started again.
    if (state === 'idle' && room) enter(room, route);
  };
  // Leaving the document, or a page restored from the back-forward cache,
  // never keeps a cover or a held stage.
  const pagehide = () => abandon();
  const pageshow = (event: PageTransitionEvent) => {
    if (event.persisted) abandon();
  };
  // Back during the entry: the Atrium is the page again.
  const popstate = () => {
    if (state !== 'idle' && window.location.pathname === origin) abandon();
  };
  // Capture: the room links are router links, and the door comes first.
  worlds.addEventListener('click', click, true);
  window.addEventListener('pagehide', pagehide);
  window.addEventListener('pageshow', pageshow);
  window.addEventListener('popstate', popstate);

  return {
    /** Home is leaving. For a room being entered that is its arrival: the
     * room's page is under the light, which now lifts. */
    destroy() {
      if (destroyed) return;
      destroyed = true;
      worlds.removeEventListener('click', click, true);
      window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('pageshow', pageshow);
      window.removeEventListener('popstate', popstate);
      const arrived = state === 'leaving';
      still();
      state = 'idle';
      if (arrived) releaseCover();
      else dropCover();
    },
  };
}
