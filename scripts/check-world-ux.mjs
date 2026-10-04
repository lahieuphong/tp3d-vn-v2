/** TP3D PASS 09 — World navigation and viewing-chamber UX. The World map's
 * Escape island is exercised against a minimal event model (window capture
 * → target → window bubble, stopPropagation, preventDefault, async toggle)
 * together with the real detail key logic, so the whole Escape hierarchy is
 * checked: map → viewer → context. Detail geometry is derived from the
 * shipped CSS values; focus contrast from the shipped tokens. Browser QA
 * (the PASS 09 record) measures the same things in Chrome. Numbers refer to
 * the PASS 09 brief; 41–48 are the existing commands. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  load,
  read,
  linkModule,
  render,
} from './lib/render-server-component.mjs';

const require = createRequire(import.meta.url);
const react = require('react');
const json = (path) => JSON.parse(read(path));
const digest = (path) =>
  createHash('sha256')
    .update(read(path).replace(/\r\n/g, '\n'))
    .digest('hex')
    .slice(0, 16);

const escapeModule = load('components/world/world-map-escape.ts');
const disclosureModule = load('components/world/world-map-disclosure.tsx', {
  react,
  './world-map-escape': escapeModule,
});
const building = load('data/world-building.ts');
const worldRooms = [...building.worldRooms];
const chromeModule = load('components/world/world-chrome.tsx', {
  'next/link': linkModule,
  '@/data/world-building': building,
  './world-map-disclosure': disclosureModule,
});
const viewer = load('components/worlds/world-viewer-state.ts');
const context = load('lib/world-detail-context.ts');
const worldsModule = load('data/worlds.ts');
const galleryModule = load('data/world-gallery.ts', {
  './worlds': worldsModule,
});
const worlds = [...worldsModule.worlds];
const galleryExhibits = [...galleryModule.galleryExhibits];
const gallery = context.resolveWorldDetailContext({
  from: 'gallery',
  slug: 'modern-kitchen',
  curatedSlugs: galleryExhibits.map(({ slug }) => slug),
  galleryRoom: worldRooms.find(({ id }) => id === 'gallery'),
});
const catalogue = context.CATALOGUE_CONTEXT;

// 1–3, 10–11. The map is still the native disclosure, server-rendered, with
// a narrow client island around it.
{
  const source = read('components/world/world-chrome.tsx');
  assert.match(source, /<WorldMapDisclosure>\s*<summary>/, '1');
  assert.doesNotMatch(
    source,
    /^['"]use client['"]/m,
    'WorldChrome stays a server component',
  );
  for (const { label, props } of [
    { label: 'Lobby', props: {} },
    { label: 'Gallery', props: { currentRoom: 'gallery' } },
  ]) {
    const html = render(chromeModule.WorldChrome, props);
    assert.match(
      html,
      /<nav class="wl-map" aria-label="World map"><details><summary><span><span class="wl-wide">World <\/span>map<\/span><\/summary><ol class="wl-map-list">/,
      `1–2. ${label}: native details and a real summary`,
    );
    assert.doesNotMatch(html, /<dialog|role="dialog"|aria-modal|<details open/);
    for (const room of worldRooms.filter(({ href }) => !href)) {
      const item = html.match(
        new RegExp(`data-world-room="${room.id}"[^>]*>([\\s\\S]*?)</li>`),
      )[1];
      assert.match(item, /^<div class="wl-map-entry">/, `10. ${room.id}`);
    }
    assert.equal(
      (html.match(/aria-current="page"/g) ?? []).length,
      label === 'Gallery' ? 1 : 0,
      `11. ${label}`,
    );
  }
  const island = read('components/world/world-map-disclosure.tsx');
  const escape = read('components/world/world-map-escape.ts');
  assert.match(island, /^'use client';/);
  assert.deepEqual(
    [...island.matchAll(/^import .* from '([^']+)';$/gm)].map(
      ([, from]) => from,
    ),
    ['react', './world-map-escape'],
    '3. the island imports nothing but React and its Escape',
  );
  assert.doesNotMatch(
    escape,
    /^import /m,
    '3. the Escape module imports nothing',
  );
  assert.match(island, /return <details ref=\{ref\}>\{children\}<\/details>;/);
  assert.doesNotMatch(
    island + escape,
    /MutationObserver|ResizeObserver|IntersectionObserver|requestAnimationFrame|setInterval|setTimeout|useState/,
    '3. no observer, timer, frame loop or state',
  );
  assert.ok(island.length + escape.length < 2600, '3. small');
}

// A minimal event model: window → document → … → target, capture then
// bubble, stopPropagation and preventDefault, toggle dispatched later (as a
// browser queues it). The detail page's handler is modelled exactly as
// WorldDetail registers it (asserted below), on the real detailKeyAction.
function page({ ctx, viewerState = 'poster', openBeforeHydration = false }) {
  const listeners = [];
  const node = (name, parent = null) => ({
    name,
    parent,
    addEventListener(type, fn, capture = false) {
      listeners.push({ node: this, type, fn, capture: capture === true });
    },
    removeEventListener(type, fn, capture = false) {
      const at = listeners.findIndex(
        (l) =>
          l.node === this &&
          l.type === type &&
          l.fn === fn &&
          l.capture === (capture === true),
      );
      if (at >= 0) listeners.splice(at, 1);
    },
  });
  const win = node('window');
  const doc = node('document', win);
  const body = node('body', doc);
  doc.defaultView = win;
  doc.body = body;
  doc.activeElement = body;
  const nav = node('nav.wl-map', body);
  const details = node('details', nav);
  details.ownerDocument = doc;
  const queue = [];
  let open = openBeforeHydration;
  Object.defineProperty(details, 'open', {
    get: () => open,
    set(value) {
      if (value === open) return;
      open = value;
      queue.push(() =>
        listeners
          .filter((l) => l.node === details && l.type === 'toggle')
          .forEach((l) => l.fn({ type: 'toggle' })),
      );
    },
  });
  const summary = node('summary', details);
  const roomLink = node('a.wl-map-entry', details);
  const toggle = node('button.world-detail-explore', body);
  for (const el of [summary, roomLink, toggle])
    el.focus = (options) => {
      doc.activeElement = el;
      el.focusOptions = options;
    };
  details.contains = (el) => {
    for (let n = el; n; n = n.parent) if (n === details) return true;
    return false;
  };
  details.querySelector = (selector) =>
    selector === 'summary' ? summary : null;

  const state = {
    viewer: viewerState,
    url: context.worldDetailHref('modern-kitchen', ctx),
    scrolled: false,
  };
  // WorldDetail: window, bubble phase, `handled: event.defaultPrevented`.
  win.addEventListener('keydown', (event) => {
    const action = viewer.detailKeyAction({
      key: event.key,
      viewer: state.viewer,
      modified: false,
      editable: false,
      handled: event.defaultPrevented,
    });
    if (action === 'close-viewer') {
      event.preventDefault();
      state.viewer = viewer.nextViewerState(state.viewer, 'close');
    } else if (action === 'return')
      state.url = context.worldReturnHref('modern-kitchen', ctx);
    else if (action) state.url = `${state.url} (${action})`;
  });
  const dispose =
    ctx.kind === 'gallery'
      ? escapeModule.bindWorldMapEscape(details)
      : () => {};

  const key = (k) => {
    const event = {
      type: 'keydown',
      key: k,
      defaultPrevented: false,
      stopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.stopped = true;
      },
    };
    const path = [];
    for (let n = doc.activeElement; n; n = n.parent) path.unshift(n);
    const run = (n, capture) => {
      for (const l of listeners.filter(
        (x) => x.node === n && x.type === 'keydown' && x.capture === capture,
      ))
        l.fn(event);
    };
    for (const n of path.slice(0, -1)) {
      run(n, true);
      if (event.stopped) return event;
    }
    run(path.at(-1), true);
    run(path.at(-1), false);
    for (const n of path.slice(0, -1).reverse()) {
      if (event.stopped) return event;
      run(n, false);
    }
    return event;
  };
  const flush = () => {
    while (queue.length) queue.shift()();
  };
  const openMap = () => {
    summary.focus();
    details.open = true;
    flush();
  };
  const escapeListeners = () =>
    listeners.filter((l) => l.node === win && l.type === 'keydown' && l.capture)
      .length;
  return {
    state,
    details,
    summary,
    roomLink,
    toggle,
    doc,
    key,
    flush,
    openMap,
    escapeListeners,
    dispose,
  };
}

const returnTo = (ctx) => context.worldReturnHref('modern-kitchen', ctx);
const here = (ctx) => context.worldDetailHref('modern-kitchen', ctx);
{
  // 4. Closed, the map takes no keys: no listener at all, and Escape on the
  // poster still returns to the Gallery (PASS 07).
  const p = page({ ctx: gallery });
  assert.equal(p.escapeListeners(), 0, '4. no listener while closed');
  p.key('Escape');
  assert.equal(p.state.url, returnTo(gallery), '4');
}
{
  // 5–9. Open: Escape closes it, goes no further, and focus returns to the
  // summary without scrolling.
  const p = page({ ctx: gallery });
  p.openMap();
  assert.equal(p.escapeListeners(), 1, 'listening only while open');
  p.roomLink.focus();
  const event = p.key('Escape');
  assert.equal(p.details.open, false, '5');
  assert.equal(event.defaultPrevented, true, '6');
  assert.equal(event.stopped, true, '6');
  assert.equal(p.doc.activeElement, p.summary, '7');
  assert.deepEqual(
    { ...p.summary.focusOptions },
    { preventScroll: true },
    '7. no scroll',
  );
  assert.equal(p.state.url, here(gallery), '8');
  assert.equal(p.state.viewer, 'poster', '9');
  p.flush();
  assert.equal(p.escapeListeners(), 0, 'the listener leaves with the map');
  // The next Escape belongs to the page again.
  p.key('Escape');
  assert.equal(p.state.url, returnTo(gallery));
}
{
  // 7. Focus on the summary (a click, or nowhere): back on the summary.
  for (const start of ['summary', 'body']) {
    const p = page({ ctx: gallery });
    p.openMap();
    if (start === 'body') p.doc.activeElement = p.doc.body;
    p.key('Escape');
    assert.equal(p.doc.activeElement, p.summary, `7. from ${start}`);
  }
  // Focus elsewhere on the page (Tab moved on, the map left open): the map
  // closes and focus stays where the visitor is.
  const p = page({ ctx: gallery, viewerState: 'live' });
  p.openMap();
  p.toggle.focus();
  p.key('Escape');
  assert.equal(p.details.open, false);
  assert.equal(p.doc.activeElement, p.toggle, 'focus stays outside the map');
  assert.equal(p.state.viewer, 'live', '9');
}
for (const viewerState of ['live', 'loading']) {
  // 12–17. Map open over a live or loading viewer: Escape ×3 closes the map,
  // then the viewer, then returns to the Gallery.
  const p = page({ ctx: gallery, viewerState });
  p.openMap();
  p.key('Escape');
  p.flush();
  assert.equal(
    p.details.open,
    false,
    `${viewerState}: Escape 1 closes the map`,
  );
  assert.equal(p.state.viewer, viewerState, `${viewerState}: viewer untouched`);
  assert.equal(p.state.url, here(gallery));
  p.key('Escape');
  assert.equal(
    p.state.viewer,
    'poster',
    `${viewerState}: Escape 2 closes the viewer`,
  );
  assert.equal(p.state.url, here(gallery));
  p.key('Escape');
  assert.equal(
    p.state.url,
    returnTo(gallery),
    `${viewerState}: Escape 3 returns`,
  );
}
for (const viewerState of ['live', 'loading']) {
  // 18. The catalogue has no World map: PASS 07 layering.
  const p = page({ ctx: catalogue, viewerState });
  p.key('Escape');
  assert.equal(p.state.viewer, 'poster');
  assert.equal(p.state.url, here(catalogue));
  p.key('Escape');
  assert.equal(p.state.url, returnTo(catalogue), '18');
}
{
  // Opened before hydration: bound at once. Other keys are never taken.
  const p = page({ ctx: gallery, openBeforeHydration: true });
  assert.equal(p.escapeListeners(), 1);
  p.summary.focus();
  const arrow = p.key('ArrowRight');
  assert.equal(arrow.stopped, false, 'only Escape');
  assert.equal(p.details.open, true);
  p.dispose();
  assert.equal(p.escapeListeners(), 0, 'cleanup removes the listener');
}
{
  // The model matches WorldDetail's real registration, and only the map
  // listens on the Lobby and the Gallery.
  const detail = read('components/worlds/world-detail.tsx');
  assert.match(detail, /handled: event\.defaultPrevented,/);
  assert.match(detail, /window\.addEventListener\('keydown', keydown\);/);
  assert.match(
    detail,
    /action === 'close-viewer'\) \{[\s\S]*?send\('close'\);/,
  );
  for (const file of [
    'components/world/world-lobby.tsx',
    'components/world/world-gallery.tsx',
    'components/world/gallery-depth.tsx',
    'components/world/gallery-reveal.tsx',
    'components/world/world-chrome.tsx',
    'components/world/world-detail-shell.tsx',
  ])
    assert.doesNotMatch(
      read(file).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ''),
      /keydown|onKeyDown|'Escape'/,
      `${file}: no page-level Escape`,
    );
}

// CSS, parsed with its media context.
const cssRules = (css) => {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const walk = (text, media) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open < 0) break;
      const prelude = text.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (depth && j < text.length) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      const body = text.slice(open + 1, j - 1);
      if (prelude.startsWith('@media'))
        walk(body, prelude.replace(/\s+/g, ' '));
      else if (!prelude.startsWith('@'))
        out.push({
          media,
          selectors: prelude.split(/,\s*/).map((s) => s.replace(/\s+/g, ' ')),
          body,
        });
      i = j;
    }
  };
  walk(src, null);
  return out;
};
const worldsCss = read('components/worlds/worlds.css');
const shellCss = read('components/world/world-detail-shell.css');
const worldsRules = cssRules(worldsCss);
const shellRules = cssRules(shellCss);
const SHORT =
  '(max-width: 1199px) and (max-height: 540px) and (orientation: landscape)';
const STACKED = `@media (max-width: 820px), ${SHORT}`;
const rule = (rules, selector, media = null) => {
  const found = rules.filter(
    (r) => r.selectors.includes(selector) && r.media === media,
  );
  assert(found.length, `${selector} @ ${media}`);
  return found.map((r) => r.body).join(';');
};
const decl = (body, property) =>
  body.match(new RegExp(`(?:^|[;{\\s])${property}:\\s*([^;]+);`))?.[1]?.trim();
const px = (value) => Number(value.match(/^(-?\d+(?:\.\d+)?)px$/)[1]);

{
  // 19–21. Desktop: a definite viewport-derived height; the information
  // column scrolls instead of growing the row.
  const layout = rule(worldsRules, '.world-detail-layout');
  assert.equal(decl(layout, '--detail-top'), '166px');
  assert.equal(
    decl(layout, 'height'),
    'clamp(400px, calc(100svh - var(--detail-top)), 740px)',
  );
  assert.equal(decl(layout, 'grid-template-rows'), 'minmax(0, 1fr)');
  assert.doesNotMatch(layout, /min-height/, 'the growth cause is gone');
  assert.equal(
    decl(rule(worldsRules, '.world-detail-info'), 'overflow-y'),
    'auto',
  );
  // The reserve is the page above the layout: padding + context row.
  const top =
    px(decl(rule(worldsRules, '.world-detail'), 'padding-top')) +
    px(decl(rule(worldsRules, '.world-detail-context'), 'min-height'));
  assert.equal(top, 166, 'catalogue reserve = 102px clearance + 64px context');
  assert.equal(
    decl(
      rule(shellRules, '.world-chamber .world-detail-layout'),
      '--detail-top',
    ),
    'calc(var(--wc-chrome) + 64px)',
  );
  assert.equal(
    decl(rule(shellRules, '.world-chamber .world-detail'), 'padding-top'),
    'var(--wc-chrome)',
  );
  const explore = rule(worldsRules, '.world-detail-explore');
  const enterBottom = px(decl(explore, 'bottom'));
  const enterHeight = px(decl(explore, 'min-height'));
  const chrome = (vh) => Math.min(108, Math.max(78, vh * 0.092));
  const enter = (vh, reserve) => {
    const height = Math.min(740, Math.max(400, vh - reserve));
    const bottom = reserve + height - 1 - enterBottom;
    return { height, top: bottom - enterHeight, bottom };
  };
  for (const [w, vh] of [
    [1440, 900],
    [1366, 768],
    [1280, 720],
    [1180, 820],
  ]) {
    for (const [label, reserve] of [
      ['catalogue', 166],
      ['gallery', chrome(vh) + 64],
    ]) {
      const e = enter(vh, reserve);
      assert(
        e.top >= 0 && e.bottom <= vh,
        `19–20. ${label} ${w}×${vh}: ENTER ${e.top}–${e.bottom}`,
      );
    }
  }
  // 21. 1440×900 loses nothing: the catalogue keeps its 734px, the chamber grows.
  assert.equal(enter(900, 166).height, 734, '21');
  assert(enter(900, chrome(900) + 64).height >= 734, '21');
}
{
  // 22–29. Short landscape: stacked, compact, everything on screen.
  for (const sel of [
    '.world-detail-layout',
    '.world-detail-stage',
    '.world-thumbnail-rail',
    '.world-detail-info',
  ])
    rule(worldsRules, sel, STACKED);
  assert.match(
    rule(shellRules, '.world-chamber .world-detail-info', STACKED),
    /border-left: 0;/,
    'the chamber follows the stack',
  );
  const media = `@media ${SHORT}`;
  const context = px(
    decl(rule(worldsRules, '.world-detail-context', media), 'min-height'),
  );
  assert.equal(context, 44, 'compact context row, still a 44px target row');
  assert.equal(
    decl(rule(worldsRules, '.world-detail-layout', media), '--detail-top'),
    '146px',
  );
  assert.equal(
    decl(
      rule(shellRules, '.world-chamber .world-detail-layout', media),
      '--detail-top',
    ),
    'calc(var(--wc-chrome) + 44px)',
  );
  assert.equal(
    decl(rule(shellRules, '.world-chamber', media), '--wc-chrome'),
    '68px',
  );
  const stage = rule(worldsRules, '.world-detail-stage', media);
  assert.equal(decl(stage, 'height'), 'calc(100svh - var(--detail-top) - 1px)');
  const band = px(decl(stage, '--viewer-band'));
  const floor = px(decl(stage, 'min-height'));
  assert.equal(
    decl(rule(worldsRules, '.world-detail-stage-notes', media), 'display'),
    'none',
  );
  const offset = px(
    decl(rule(worldsRules, '.world-detail-explore', media), 'bottom'),
  );
  assert.equal(
    px(decl(rule(worldsRules, '.world-detail-fullscreen', media), 'bottom')),
    offset,
  );
  const enterHeight = px(
    decl(rule(worldsRules, '.world-detail-explore'), 'min-height'),
  );
  const introBottom = 31 + 2 * 8 * 2.2;
  for (const [w, vh, catalogueTop] of [
    [844, 390, 146],
    [740, 360, 146],
    [667, 375, 146],
  ]) {
    for (const [label, top] of [
      ['catalogue', catalogueTop],
      ['gallery', 68 + 44],
    ]) {
      const height = Math.max(floor, vh - top - 1);
      assert.equal(
        height,
        vh - top - 1,
        `${label} ${w}×${vh}: the floor never pushes the stage past the screen`,
      );
      const stageTop = top + 1;
      const enterBottom = stageTop + height - offset;
      assert(
        enterBottom <= vh && enterBottom - enterHeight >= stageTop,
        `22–23. ${label} ${w}×${vh}`,
      );
      assert(
        height - offset - enterHeight > introBottom,
        `24. ${label} ${w}×${vh}: ENTER clears the intro`,
      );
      assert(
        height - band >= 150,
        `27. ${label} ${w}×${vh}: live area ${height - band}px`,
      );
    }
  }
  // 25–26. Every control keeps a 44px target.
  assert.match(
    worldsCss,
    /\.world-detail-fullscreen \{[^}]*width: 44px; height: 44px;/,
    '25',
  );
  assert.equal(enterHeight, 52, '26. ENTER');
  const live = rule(
    worldsRules,
    ".world-detail-stage[data-viewer='live'] .world-detail-explore",
  );
  assert.equal(decl(live, 'min-height'), '44px', '26. EXIT 3D VIEW');
  assert.equal(decl(live, 'top'), 'calc((var(--viewer-band) - 44px) / 2)');
  // Part 6. Going live brings EXIT 3D VIEW into view only when it is not:
  // the page's scroll-padding plus the toggle's margin is PASS 07's 112px
  // clearance, no longer 212px, so a visible EXIT never scrolls the page.
  const clearance =
    px(read('app/globals.css').match(/scroll-padding-top: (\d+px);/)[1]) +
    px(decl(live, 'scroll-margin-top'));
  assert.equal(clearance, 112, 'one 112px clearance, not two');
  assert(
    146 + 1 + (band - 44) / 2 >= clearance,
    'catalogue short landscape: a visible EXIT needs no scroll',
  );
  // The chamber has no fixed header: no page scroll-padding, only the
  // toggle's own margin.
  assert.equal(
    decl(
      rule(shellRules, ":root:has([data-world-detail-shell='gallery'])"),
      'scroll-padding-top',
    ),
    '0',
  );
  assert(band >= 44 + 8, 'the live band still holds a 44px control');
  const switcher = rule(worldsRules, '.world-detail-switcher button');
  assert.deepEqual(
    [
      decl(switcher, 'width'),
      decl(switcher, 'height'),
      decl(switcher, 'margin'),
    ],
    ['44px', '44px', '-3px -7px'],
    'catalogue previous/next: 44px targets in the 30 × 38 footprint',
  );
  assert.equal(
    decl(
      rule(shellRules, '.world-chamber .world-detail-switcher button'),
      'margin',
    ),
    '0',
  );
  // 29. Only decorative, aria-hidden notes give way; information stays.
  assert.match(
    read('components/worlds/world-detail-stage.tsx'),
    /<p className="world-detail-stage-notes eyebrow" aria-hidden="true">/,
  );
  for (const { selectors, body } of [...worldsRules, ...shellRules])
    if (/display:\s*none/.test(body))
      for (const s of selectors)
        assert.doesNotMatch(
          s,
          /world-detail-(info|row|actions|cta|description)|world-thumbnail|h1/,
          s,
        );
}

// 30–34. Focus: explicit colours with a mat, so the ring reads on any poster.
const hex = (value) => {
  const m = value.match(/^#([0-9a-f]{6})$/i)[1];
  return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16));
};
const luminance = (rgb) =>
  rgb
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
{
  const globals = read('app/globals.css');
  const token = (name, source = globals) =>
    hex(source.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1]);
  const ivory = token('--wl-ivory', read('components/world/world-chrome.css'));
  const ground = token('--world-ground');
  const ink = token('--foreground');
  const paper = token('--background');
  const targets = [
    '.world-detail-explore',
    '.world-detail-fullscreen',
    '.world-thumbnail',
  ];
  const world = rule(
    shellRules,
    '.world-chamber .world-detail-explore:focus-visible',
  );
  for (const t of targets)
    assert.equal(
      rule(shellRules, `.world-chamber ${t}:focus-visible`),
      world,
      `33–34. ${t}`,
    );
  assert.equal(decl(world, 'outline'), '2px solid var(--wl-ivory)', '30');
  assert.equal(
    decl(world, 'box-shadow'),
    '0 0 0 4px var(--world-ground)',
    '30',
  );
  assert.equal(decl(world, 'outline-offset'), '4px');
  assert(
    contrast(ivory, ground) >= 3,
    `30. ivory on the mat ${contrast(ivory, ground).toFixed(2)}`,
  );
  const editorial = rule(worldsRules, '.world-detail-explore:focus-visible');
  for (const t of targets)
    assert.equal(
      rule(worldsRules, `${t}:focus-visible`),
      editorial,
      `33–34. ${t}`,
    );
  assert.equal(decl(editorial, 'outline'), '2px solid var(--foreground)', '31');
  assert.equal(
    decl(editorial, 'box-shadow'),
    '0 0 0 4px var(--background)',
    '31',
  );
  assert(
    contrast(ink, paper) >= 3,
    `31. ink on the paper mat ${contrast(ink, paper).toFixed(2)}`,
  );
  // One very dark and one very light layer: over any grey a poster can
  // show, black to white, the ring or the mat contrasts by 3:1 or more.
  // (Walnut on paper leaves a mid-grey gap, which browser QA measured.)
  for (const { label, ring, mat } of [
    { label: 'World', ring: ivory, mat: ground },
    { label: 'editorial', ring: ink, mat: paper },
  ])
    for (let g = 0; g <= 255; g++)
      assert(
        Math.max(contrast(ring, [g, g, g]), contrast(mat, [g, g, g])) >= 3,
        `30–31. ${label} focus over grey ${g}`,
      );
  assert(
    [...Array(256).keys()].some(
      (g) =>
        Math.max(
          contrast(token('--walnut'), [g, g, g]),
          contrast(paper, [g, g, g]),
        ) < 3,
    ),
    'the walnut ring would not be enough',
  );
  for (const t of [...worldsRules, ...shellRules])
    if (
      t.selectors.some((s) => /:focus-visible/.test(s)) &&
      /box-shadow/.test(t.body)
    )
      assert.doesNotMatch(
        t.body,
        /currentColor|blur|\d+px \d+px \d+px \d+px [^0]/,
        'no currentColor, no glow',
      );
  // 32. The World map's ring: ivory on the ground.
  assert.match(
    read('components/world/world-chrome.css'),
    /\.wl-chrome :focus-visible,[\s\S]*?outline: 1px solid currentColor;/,
  );
  assert(contrast(ivory, ground) >= 3, '32');
}

// 35–40. The viewer is PASS 07's.
{
  const PASS_07 = {
    'components/worlds/world-viewer-state.ts': 'e5d787ade1dd6ab2',
    'components/worlds/world-detail.tsx': 'b91f4b1cd4481de0',
    'components/worlds/world-detail-stage.tsx': 'f356d911214f6601',
    'components/worlds/sketchfab-viewer.tsx': '6db839abf80c3b6e',
  };
  for (const [path, hash] of Object.entries(PASS_07))
    assert.equal(digest(path), hash, `35–39. ${path} is PASS 07's`);
  assert.equal(viewer.nextViewerState('live', 'switch'), 'poster', '38');
  const images = load('data/images.ts', {
    './image-dimensions.json': json('data/image-dimensions.json'),
  });
  const stageModule = load('components/worlds/world-detail-stage.tsx', {
    react,
    '@/components/shared/editorial-image': load(
      'components/shared/editorial-image.tsx',
      { '@/data/images': images },
    ),
    './sketchfab-viewer': load('components/worlds/sketchfab-viewer.tsx', {
      react,
    }),
    './world-viewer-state': viewer,
  });
  for (const state of ['poster', 'loading', 'live']) {
    const html = render(stageModule.WorldDetailStage, {
      world: worlds[0],
      index: 1,
      total: 4,
      viewer: state,
      onEnter() {},
      onClose() {},
      onReady() {},
    });
    assert.equal(
      (html.match(/<iframe\b/g) ?? []).length,
      state === 'poster' ? 0 : 1,
      `36–37. ${state}`,
    );
    if (state === 'poster')
      assert.doesNotMatch(html, /sketchfab\.com\/models/, '36');
  }
  // 40. PASS 09 adds no motion: the new rules carry no transition or
  // animation, and the global reduced-motion switch is intact.
  const added = [
    rule(worldsRules, '.world-detail-explore:focus-visible'),
    rule(shellRules, '.world-chamber .world-detail-explore:focus-visible'),
    ...worldsRules
      .filter((r) => r.media === `@media ${SHORT}`)
      .map((r) => r.body),
    ...shellRules
      .filter((r) => r.media === `@media ${SHORT}`)
      .map((r) => r.body),
  ].join(';');
  assert.doesNotMatch(added, /transition|animation/, '40');
  assert.match(
    read('app/globals.css'),
    /prefers-reduced-motion: reduce[\s\S]*transition: none !important;/,
  );
}

// 41–48 run as their own commands; the gate keeps them wired. No dependency,
// route or 3D technology is added.
{
  const {
    scripts,
    dependencies = {},
    devDependencies = {},
  } = json('package.json');
  assert.equal(scripts['check:world-ux'], 'node scripts/check-world-ux.mjs');
  for (const name of [
    'check:world',
    'check:gallery',
    'check:exhibit',
    'check:world-shell',
    'check:worlds',
    'check:home',
    'check:routes',
    'build',
  ])
    assert(scripts[name], name);
  const packages = Object.keys({ ...dependencies, ...devDependencies }).sort(
    (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  );
  assert.equal(
    createHash('sha256')
      .update(JSON.stringify(packages))
      .digest('hex')
      .slice(0, 16),
    'fe513ca9a824db7d',
    'no dependency added or removed',
  );
  for (const file of [
    'components/world/world-map-escape.ts',
    'components/world/world-map-disclosure.tsx',
  ])
    assert.doesNotMatch(
      read(file),
      /three|<canvas|getContext|webgl|gsap|lenis|framer|sketchfab|fetch\(/i,
      file,
    );
}

console.log(
  'World UX passed: the World map stays a native <details> with a server-rendered summary and rooms; its tiny island listens only while the map is open and closes it on Escape before any page handler (focus back on the summary, no scroll, URL and viewer untouched); map → viewer → context is deterministic over loading and live viewers, the catalogue keeps PASS 07 layering, and the Lobby and Gallery have no page Escape; detail heights are definite and viewport-derived so ENTER 3D WORLD fits at 1366×768, 1280×720 and 1180×820, short landscape stacks with every control on screen and 44px targets; focus over images is an explicit ring on a mat in both shells; the PASS 07 viewer files are unchanged; no dependency, motion or 3D technology was added.',
);
