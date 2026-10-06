/** Behaviour, capability changes and cleanup; no invented browser metrics. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';
const source = readFileSync(
  new URL('../components/home/experience/room-discovery.ts', import.meta.url),
  'utf8',
);
const output = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
function fixture({ finePointer = true } = {}) {
  const all = [],
    preparations = [];
  class Element {
    attrs = new Map();
    listeners = new Map();
    dataset = {};
    focus = false;
    hover = false;
    constructor() {
      all.push(this);
    }
    getAttribute(n) {
      return this.attrs.get(n) ?? null;
    }
    setAttribute(n, v) {
      this.attrs.set(n, v);
    }
    removeAttribute(n) {
      this.attrs.delete(n);
    }
    addEventListener(n, f) {
      if (!this.listeners.has(n)) this.listeners.set(n, new Set());
      this.listeners.get(n).add(f);
    }
    removeEventListener(n, f) {
      this.listeners.get(n)?.delete(f);
    }
    emit(n, e = {}) {
      for (const f of this.listeners.get(n) ?? []) f(e);
    }
    closest() {
      return this.link ?? (this.dataset.room ? this : null);
    }
    matches(q) {
      return q === ':focus-visible' ? this.focus : this.hover;
    }
  }
  const worlds = new Element(),
    links = ['living', 'bedroom', 'bathroom', 'kitchen'].map((id) =>
      Object.assign(new Element(), { dataset: { room: id } }),
    );
  const previews = links.map((l) =>
      Object.assign(new Element(), {
        dataset: { roomPreview: l.dataset.room },
      }),
    ),
    defaultImage = new Element();
  // TP3D PASS — Atrium room orbit: the rooms' own apertures are separate
  // images from the gateway's room previews.
  const portals = links.map((l) =>
    Object.assign(new Element(), {
      dataset: { roomPortal: l.dataset.room },
    }),
  );
  const fine = Object.assign(new Element(), { matches: finePointer });
  worlds.querySelectorAll = (q) =>
    q === '[data-room]'
      ? links
      : q === 'img[data-room-portal]'
        ? portals
        : previews;
  worlds.querySelector = () => defaultImage;
  const loaded = { exports: {} };
  runInNewContext(output, {
    module: loaded,
    exports: loaded.exports,
    Element,
    window: { matchMedia: () => fine },
    require(spec) {
      if (spec === './home-production') return loadStoryMath('home-production');
      assert.equal(spec, './scene-image');
      return {
        prepareSceneImage(image, callbacks) {
          const item = {
            image,
            callbacks,
            starts: 0,
            destroyed: false,
            started: false,
            start() {
              if (!this.started) {
                this.starts++;
                this.started = true;
              }
            },
            destroy() {
              this.destroyed = true;
            },
          };
          preparations.push(item);
          return item;
        },
      };
    },
  });
  const controller = loaded.exports.createRoomDiscovery(worlds);
  const update = (
    p = 0.95,
    width = 1440,
    reduced = false,
    visible = true,
    orbit = false,
  ) => controller.update({ progress: p, width, reduced, visible, orbit });
  const hover = (i) =>
    worlds.emit('pointerover', { target: links[i], pointerType: 'mouse' });
  const focus = (i) => {
    links.forEach((l, n) => (l.focus = n === i));
    worlds.emit('focusin', { target: links[i] });
  };
  return {
    worlds,
    links,
    previews,
    portals,
    defaultImage,
    fine,
    preparations,
    controller,
    update,
    hover,
    focus,
    Element,
    count: () =>
      all.reduce(
        (n, e) => n + [...e.listeners.values()].reduce((n, s) => n + s.size, 0),
        0,
      ),
  };
}
for (let cycle = 0; cycle < 30; cycle++) {
  const f = fixture();
  f.update(0.1);
  assert.equal(
    f.preparations.every((p) => p.starts === 0),
    true,
  );
  f.update(0.3);
  assert(f.preparations.every((p) => p.starts === 1));
  f.hover(0);
  assert.equal(
    f.worlds.getAttribute('data-active-room'),
    null,
    'no discovery during cinematic travel',
  );
  // TP3D PASS 04: discovery opens with the final hold, not before.
  const { discoveryStart } = loadStoryMath('home-production').HOME_PRODUCTION;
  assert.equal(
    discoveryStart,
    loadStoryMath('home-motion').MOTION.bridge.settled,
    'room discovery starts exactly when the Atrium is settled',
  );
  f.update(discoveryStart - 0.001);
  f.hover(0);
  assert.equal(f.worlds.getAttribute('data-world-interactive'), null);
  f.update(discoveryStart);
  f.hover(0);
  assert.equal(f.worlds.getAttribute('data-active-room'), 'living');
  assert.equal(
    f.previews[0].getAttribute('data-preview-active'),
    null,
    'undecoded preview never covers default',
  );
  f.preparations[0].callbacks.ready();
  assert.equal(f.previews[0].getAttribute('data-preview-active'), '');
  f.hover(1);
  assert.equal(f.previews[0].getAttribute('data-preview-active'), null);
  f.preparations[1].callbacks.failed();
  assert.equal(
    f.previews[1].getAttribute('data-preview-active'),
    null,
    'failed thumbnail retains default',
  );
  f.focus(2);
  assert.equal(f.worlds.getAttribute('data-active-room'), 'bathroom');
  f.preparations[2].callbacks.ready();
  assert.equal(f.previews[2].getAttribute('data-preview-active'), '');
  f.worlds.emit('focusout');
  assert.equal(f.worlds.getAttribute('data-active-room'), 'bedroom');
  f.worlds.emit('pointerout', { target: f.links[1], relatedTarget: null });
  assert.equal(f.worlds.getAttribute('data-active-room'), null);
  f.hover(0);
  f.update(0.7);
  assert.equal(
    f.worlds.getAttribute('data-active-room'),
    null,
    'reverse disables feedback immediately',
  );
  f.update();
  f.hover(0);
  f.controller.suspend();
  assert.equal(f.worlds.getAttribute('data-world-interactive'), null);
  f.update(0.95, 1440, false, false);
  assert.equal(
    f.worlds.getAttribute('data-active-room'),
    null,
    'Footer disables discovery',
  );
  f.update(0.95, 390);
  f.focus(0);
  assert.equal(
    f.previews[0].getAttribute('data-preview-active'),
    null,
    'resizing to mobile resets the thumbnail',
  );
  f.update(0.95, 820);
  assert.equal(f.worlds.getAttribute('data-world-tier'), 'medium');
  f.fine.matches = false;
  f.fine.emit('change');
  assert.equal(f.worlds.getAttribute('data-world-tier'), 'light');
  f.hover(1);
  assert.equal(f.worlds.getAttribute('data-active-room'), null);
  f.focus(3);
  assert.equal(
    f.worlds.getAttribute('data-active-room'),
    'kitchen',
    'keyboard works with a coarse primary pointer',
  );
  f.update(0.95, 820, true);
  assert.equal(f.worlds.getAttribute('data-world-tier'), 'minimal');
  f.controller.destroy();
  f.controller.destroy();
  assert.equal(f.count(), 0);
  assert(f.preparations.every((p) => p.destroyed));
  f.preparations[0].callbacks.ready();
  assert.equal(
    f.previews[0].getAttribute('data-preview-active'),
    null,
    'late decode after unmount does not mutate',
  );
  assert.equal(f.worlds.getAttribute('data-world-tier'), null);
}
const touch = fixture({ finePointer: false });
touch.update(0.95, 390);
const gatewayImages = new Set([touch.defaultImage, ...touch.previews]);
assert.equal(
  touch.preparations.filter((p) => p.starts && gatewayImages.has(p.image))
    .length,
  1,
  'touch requests only default thumbnail',
);
// The orbit's four apertures are the rooms' own images: phones show them.
assert.deepEqual(
  touch.preparations
    .filter((p) => p.starts && !gatewayImages.has(p.image))
    .map((p) => p.image.dataset.roomPortal),
  ['living', 'bedroom', 'bathroom', 'kitchen'],
  'touch requests the four room apertures',
);
touch.worlds.emit('pointerover', {
  target: touch.links[0],
  pointerType: 'touch',
});
assert.equal(touch.worlds.getAttribute('data-active-room'), null);
touch.worlds.emit('pointerout', {
  target: touch.links[0],
  relatedTarget: touch.links[1],
  pointerType: 'touch',
});
assert.equal(touch.worlds.getAttribute('data-active-room'), null);
touch.controller.destroy();
{
  // Reduced motion never shows the orbit, so never fetches its apertures.
  const still = fixture();
  still.update(0.95, 1440, true);
  const portals = new Set(still.portals);
  assert.equal(
    still.preparations.filter((p) => p.starts && portals.has(p.image)).length,
    0,
    'reduced motion requests no room apertures',
  );
  // Nothing is requested before the existing thumbnail threshold.
  const early = fixture();
  early.update(0.1);
  assert(early.preparations.every((p) => p.starts === 0));
  // While the rooms orbit, the World gateway keeps showing the World: no
  // hover or focus swaps a room preview into it; links stay untouched.
  const orbit = fixture();
  orbit.update(0.95);
  orbit.hover(1);
  assert.equal(orbit.worlds.getAttribute('data-active-room'), 'bedroom');
  orbit.update(1, 1440, false, true, true);
  assert.equal(orbit.worlds.getAttribute('data-world-interactive'), null);
  assert.equal(orbit.worlds.getAttribute('data-active-room'), null);
  assert(orbit.previews.every((i) => !i.getAttribute('data-preview-active')));
  orbit.hover(2);
  orbit.focus(3);
  assert.equal(orbit.worlds.getAttribute('data-active-room'), null);
  assert(orbit.previews.every((i) => !i.getAttribute('data-preview-active')));
  for (const node of [orbit.worlds, ...orbit.links])
    for (const name of ['inert', 'tabindex', 'aria-hidden'])
      assert.equal(node.getAttribute(name), null, 'links stay reachable');
  orbit.controller.destroy();
  assert(orbit.preparations.every((p) => p.destroyed));
}
assert.doesNotMatch(
  source,
  /requestAnimationFrame|setInterval|setTimeout|preventDefault|pointermove|new\s+Image\s*\(/,
);
console.log(
  'Room discovery passed: settled gate, decoded/failure previews, keyboard parity, direct touch, resize/reverse/hidden/idle reset and 30 cleanups.',
);
