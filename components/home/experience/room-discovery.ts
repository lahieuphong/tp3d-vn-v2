import { complexityTier, HOME_PRODUCTION } from './home-production';
import { prepareSceneImage } from './scene-image';

type DiscoveryState = {
  progress: number;
  width: number;
  reduced: boolean;
  visible: boolean;
};

/** Local, event-driven discovery. It never moves the architecture, intercepts
 * navigation, schedules RAF or writes React state. The story owns activation. */
export function createRoomDiscovery(worlds: HTMLElement) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const links = [...worlds.querySelectorAll<HTMLAnchorElement>('[data-room]')];
  const previews = [
    ...worlds.querySelectorAll<HTMLImageElement>('[data-room-preview]'),
  ];
  const defaultPreview = worlds.querySelector<HTMLImageElement>(
    '.hc-atrium-preview > img:not([data-room-preview])',
  );
  const saved = [worlds, ...links, ...previews].map((node) => ({
    node,
    attributes: [
      'data-world-interactive',
      'data-world-tier',
      'data-active-room',
      'data-room-active',
      'data-preview-active',
    ].map((name) => [name, node.getAttribute(name)] as const),
  }));
  let disposed = false;
  let enabled = false;
  let hover: HTMLAnchorElement | null = null;
  let focus: HTMLAnchorElement | null = null;
  let state: DiscoveryState = {
    progress: 0,
    width: 0,
    reduced: false,
    visible: false,
  };
  const decoded = new Set<HTMLImageElement>();
  const attr = (node: Element, name: string, value: string | null) => {
    if (node.getAttribute(name) === value) return;
    if (value === null) node.removeAttribute(name);
    else node.setAttribute(name, value);
  };
  const paint = () => {
    const active = enabled ? (focus ?? hover) : null;
    const id = active?.dataset.room ?? null;
    attr(worlds, 'data-active-room', id);
    for (const link of links)
      attr(link, 'data-room-active', link === active ? '' : null);
    for (const preview of previews)
      attr(
        preview,
        'data-preview-active',
        state.width >= 768 &&
          preview.dataset.roomPreview === id &&
          decoded.has(preview)
          ? ''
          : null,
      );
  };
  const preparations = previews.map((preview) =>
    prepareSceneImage(
      preview,
      {
        ready() {
          if (!disposed) {
            decoded.add(preview);
            paint();
          }
        },
        failed() {
          if (!disposed) {
            decoded.delete(preview);
            paint();
          }
        },
      },
      'low',
    ),
  );
  const defaultPreparation = defaultPreview
    ? prepareSceneImage(
        defaultPreview,
        {
          ready() {},
          failed() {}, // A missing decorative preview cannot disable the CTA.
        },
        'low',
      )
    : null;
  const mayPreview = () => state.width >= 768;
  const warmRooms = () => {
    for (const preparation of preparations) preparation.start();
  };
  const room = (target: EventTarget | null) => {
    const link =
      target instanceof Element
        ? target.closest<HTMLAnchorElement>('[data-room]')
        : null;
    return link && links.includes(link) ? link : null;
  };
  const over = (event: PointerEvent) => {
    if (!enabled || !fine.matches || event.pointerType === 'touch') return;
    hover = room(event.target);
    if (hover && mayPreview()) warmRooms();
    paint();
  };
  const out = (event: PointerEvent) => {
    if (!enabled || !fine.matches || event.pointerType === 'touch') return;
    if (room(event.target) === room(event.relatedTarget)) return;
    hover = room(event.relatedTarget);
    paint();
  };
  const focusIn = (event: FocusEvent) => {
    const link = room(event.target);
    focus = enabled && link?.matches(':focus-visible') ? link : null;
    if (focus && mayPreview()) warmRooms();
    paint();
  };
  const focusOut = () => {
    focus = null;
    paint();
  };
  const update = (next: DiscoveryState) => {
    if (disposed) return;
    state = next;
    const tier = complexityTier(state.width, fine.matches, state.reduced);
    attr(worlds, 'data-world-tier', tier);
    if (state.visible && state.progress >= HOME_PRODUCTION.thumbnailPreload) {
      defaultPreparation?.start();
      if (fine.matches && mayPreview()) warmRooms();
    }
    const active =
      state.visible && state.progress >= HOME_PRODUCTION.discoveryStart;
    const changed = enabled !== active;
    enabled = active;
    attr(worlds, 'data-world-interactive', enabled ? '' : null);
    if (!enabled) hover = focus = null;
    else if (changed) {
      focus = links.find((link) => link.matches(':focus-visible')) ?? null;
      hover = fine.matches
        ? (links.find((link) => link.matches(':hover')) ?? null)
        : null;
    }
    // Touch stays on the single default thumbnail. Keyboard still has visible
    // link feedback; tablet/laptop keyboards also receive decoded previews.
    paint();
  };
  const capability = () => {
    hover = focus = null;
    update(state);
  };
  worlds.addEventListener('pointerover', over);
  worlds.addEventListener('pointerout', out);
  worlds.addEventListener('focusin', focusIn);
  worlds.addEventListener('focusout', focusOut);
  fine.addEventListener('change', capability);

  return {
    update,
    suspend() {
      update({ ...state, visible: false });
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      worlds.removeEventListener('pointerover', over);
      worlds.removeEventListener('pointerout', out);
      worlds.removeEventListener('focusin', focusIn);
      worlds.removeEventListener('focusout', focusOut);
      fine.removeEventListener('change', capability);
      defaultPreparation?.destroy();
      for (const preparation of preparations) preparation.destroy();
      decoded.clear();
      hover = focus = null;
      for (const { node, attributes } of saved)
        for (const [name, value] of attributes) attr(node, name, value);
    },
  };
}
