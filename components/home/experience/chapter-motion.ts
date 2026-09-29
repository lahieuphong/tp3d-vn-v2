import type { BreezeDriver } from './breeze-renderer';
import {
  clamp,
  range,
  skyContentReveal,
  skyPortalFrame,
} from './sky-portal-frame';

/** One native-scroll owner for the portal, Worlds reveal and shared cloth.
 * All bounds are cached outside scroll frames; no wheel handlers or idle RAF. */
export function mountHomeChapters(
  root: HTMLElement,
  breeze?: BreezeDriver,
): () => void {
  const track = root.querySelector<HTMLElement>('[data-sky-track]');
  const worlds = root.querySelector<HTMLElement>(
    '[data-home-chapter="worlds"]',
  );
  if (!track || !worlds) return () => {};
  const spanMarker = track.querySelector<HTMLElement>('[data-sky-range]');
  const header = document.querySelector<HTMLElement>('.site-header');
  const reveals = [
    ...worlds.querySelectorAll<HTMLElement>('[data-chapter-reveal]'),
  ];
  const storyLinks = [...root.querySelectorAll<HTMLElement>('.sh-read-story')];
  const image = worlds.querySelector<HTMLImageElement>(
    '.hc-atrium-backdrop img',
  );
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saved = [root, worlds, header, ...reveals, ...storyLinks]
    .filter((n): n is HTMLElement => !!n)
    .map((node) => ({
      node,
      attributes: [
        'style',
        'inert',
        'aria-hidden',
        'data-sky-ready',
        'data-sky-active',
        'data-sky-progress',
        'data-chapter-theme',
        'data-phase',
      ].map((name) => [name, node.getAttribute(name)] as const),
    }));
  let geometry = { top: 0, height: 1, stage: 1, span: 1, width: 1, header: 0 };
  let frame = 0,
    disposed = false,
    needsMeasure = true;
  let lastSignature = '';
  const schedule = () => {
    if (!disposed && !document.hidden && !frame)
      frame = requestAnimationFrame(render);
  };
  const measure = () => {
    const scroll = window.scrollY;
    const owner = root.getBoundingClientRect();
    const bounds = track!.getBoundingClientRect();
    const stage = worlds!.getBoundingClientRect();
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const span = spanMarker?.offsetHeight ?? window.innerHeight * 0.8;
    geometry = {
      top: bounds.top + scroll,
      height: bounds.height,
      stage: stage.height,
      span: Math.max(1, span),
      width: bounds.width,
      header: headerHeight,
    };
    breeze?.measure(owner, scroll, bounds, stage.height, span);
    needsMeasure = false;
  };
  function render() {
    frame = 0;
    if (disposed || document.hidden) return;
    if (needsMeasure) measure();
    const held = document.documentElement.hasAttribute('data-home-intro');
    const scroll = held ? 0 : window.scrollY;
    const still = reduced.matches;
    const p = clamp((scroll - geometry.top) / geometry.span);
    const state = skyPortalFrame(p, geometry.width, geometry.stage);
    const past = scroll + geometry.header >= geometry.top + geometry.height;
    const theme = still
      ? scroll + geometry.header >=
        geometry.top + geometry.height - geometry.stage
        ? past
          ? 'light'
          : 'dark'
        : null
      : past
        ? 'light'
        : state.headerIvory
          ? 'dark'
          : null;
    const signature = `${p.toFixed(6)}/${still}/${theme}/${geometry.width}/${geometry.stage}/${geometry.top}`;
    breeze?.paint(scroll, window.innerHeight, still, p);
    if (signature === lastSignature) return;
    lastSignature = signature;
    root.dataset.skyReady = '';
    root.dataset.skyProgress = p.toFixed(5);
    root.style.setProperty(
      '--sky-breeze-depth',
      p > 0.25 && !still ? '8' : '4',
    );
    if (!still && p > 0.2 && p < 1) root.dataset.skyActive = '';
    else delete root.dataset.skyActive;
    root.style.setProperty(
      '--sky-departure',
      still ? '0' : state.departure.toFixed(5),
    );
    root.style.setProperty(
      '--sky-tp',
      still ? '0' : state.tpDeparture.toFixed(5),
    );
    worlds!.dataset.phase = p === 0 ? 'far' : p < 1 ? 'entering' : 'active';
    const properties = {
      '--sky-rx': `${state.rx.toFixed(2)}px`,
      '--sky-ry': `${state.ry.toFixed(2)}px`,
      '--sky-x': `${state.centerX.toFixed(2)}px`,
      '--sky-y': `${state.centerY.toFixed(2)}px`,
      '--sky-image-y': `${state.imageY.toFixed(2)}px`,
      '--sky-image-scale': state.scale.toFixed(5),
      '--sky-exposure': still ? '1' : range(p, 0.58, 0.94).toFixed(5),
    };
    for (const [name, value] of Object.entries(properties))
      worlds!.style.setProperty(name, value);
    if (header) {
      if (theme) header.dataset.chapterTheme = theme;
      else delete header.dataset.chapterTheme;
    }
    // Hidden clipped links do not enter the keyboard sequence. A focused link
    // is never made inert; browser Back and keyboard navigation remain native.
    worlds!.inert =
      !still && p < 0.79 && !worlds!.contains(document.activeElement);
    worlds!.setAttribute('aria-hidden', String(worlds!.inert));
    for (const link of storyLinks)
      link.inert = !still && p > 0.6 && !link.contains(document.activeElement);
    reveals.forEach((node) => {
      const reveal = still
        ? 1
        : skyContentReveal(p, Number(node.dataset.chapterReveal) || 0);
      node.style.opacity = reveal.toFixed(5);
      node.style.transform = `translate3d(0, ${((1 - reveal) * (geometry.width < 768 ? 6 : 12)).toFixed(2)}px, 0)`;
    });
  }
  const resize = () => {
    needsMeasure = true;
    lastSignature = '';
    schedule();
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else resize();
  };
  const observer =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  for (const node of [root, track, worlds, header])
    if (node) observer?.observe(node);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', resize);
  document.addEventListener('visibilitychange', visibility);
  root.addEventListener('focusout', schedule);
  reduced.addEventListener('change', resize);
  image?.addEventListener('load', resize);
  render();
  return () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pageshow', resize);
    document.removeEventListener('visibilitychange', visibility);
    root.removeEventListener('focusout', schedule);
    reduced.removeEventListener('change', resize);
    image?.removeEventListener('load', resize);
    for (const { node, attributes } of saved)
      for (const [name, value] of attributes) {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      }
    breeze?.destroy();
  };
}
