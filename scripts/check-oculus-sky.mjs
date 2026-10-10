/** The oculus's living sky (owner request, 2026-10-10): the still part
 * (atrium-orbit-sky.ts), the foreground picture cut from the plate
 * (work/atrium-orbit/comp-plates/oculus.mjs, outside Git, writes the files
 * checked here), the shader's source, and the real oculus-sky.ts against a
 * stand-in for Three.js and a small owned double of the page.
 *
 * How the controller places and drives it is checked with the controller in
 * check:atrium-orbit-foundation, and how the story's frame owner feeds it in
 * check:atrium-orbit. Nothing here draws a pixel: how the sky looks, and
 * what it costs, were judged on a production-equivalent build
 * (docs/TANPHONG_ATRIUM_ORBIT_IMPLEMENTATION.md §15.11). */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import sharp from 'sharp';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';

const EXPERIENCE = 'components/home/experience/';
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const file = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const json = (value) =>
  JSON.stringify(value, (_, v) =>
    typeof v === 'number' ? Number(v.toFixed(9)) : v,
  );
const same = (a, b, message) => assert.equal(json(a), json(b), message);
const near = (a, b, message, epsilon = 1e-9) =>
  assert.ok(Math.abs(a - b) <= epsilon, `${message}: ${a} vs ${b}`);
const strip = (text) => text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

const sky = loadStoryMath('atrium-orbit-sky');
const manifest = loadStoryMath('atrium-orbit-manifest');
const shaders = loadStoryMath('oculus-sky-shaders');
const {
  ATRIUM_ORBIT_OCULUS: OCULUS,
  ATRIUM_ORBIT_SKY: SKY,
  oculusFrontBox,
  oculusPlace,
  oculusSkyBuffer,
  oculusSkyStep,
  oculusSkyTier,
  oculusSkyWidth,
} = sky;
const [W, H] = manifest.ATRIUM_ORBIT_COMP.intrinsic;
const [BX, BY, BW, BH] = OCULUS.box;
/** How far the two foreground files are from their plates (of 255). */
const apart = [];

// ---------------------------------------------------------------------------
// 1. Where the sky is on the plate. The canvas's box lies inside the plate,
// at its top; the opening is one outline inside that box, most of it; the
// foreground picture's box is the canvas's and the margin it fades over, cut
// where the plate ends.
// ---------------------------------------------------------------------------
{
  assert.ok(BX > 0 && BY >= 0 && BX + BW < W && BY + BH < H / 3);
  for (const [x, y] of OCULUS.opening) {
    assert.ok(
      x >= BX + 2 && x <= BX + BW - 2,
      `opening inside the box: x ${x}`,
    );
    assert.ok(
      y >= BY + 2 && y <= BY + BH - 2,
      `opening inside the box: y ${y}`,
    );
  }
  const area = Math.abs(
    OCULUS.opening.reduce((sum, [x, y], i) => {
      const [nx, ny] = OCULUS.opening[(i + 1) % OCULUS.opening.length];
      return sum + (x * ny - nx * y) / 2;
    }, 0),
  );
  assert.ok(area > BW * BH * 0.55 && area < BW * BH * 0.8, `opening ${area}`);
  // The approved camera's own sky centre (836, 110) is in the opening: the
  // sky hold of the base journey looks at this canvas.
  const { MOTION } = loadStoryMath('home-motion');
  const { skyX, skyY } = MOTION.camera.source;
  assert.ok(skyX > BX + 100 && skyX < BX + BW - 100);
  assert.ok(skyY > BY + 40 && skyY < BY + BH - 40);
  assert.ok(OCULUS.keep >= 4 && OCULUS.fade >= 6);
  const out = OCULUS.keep + OCULUS.fade;
  same(oculusFrontBox(), [BX - out, 0, BW + 2 * out, BY + BH + out]);
  assert.equal(BY - out < 0, true, "cut at the plate's top edge");
  // Placed by shares of the plate box's WIDTH, margin and all, so it is the
  // same place on the picture on every stage.
  for (const box of [OCULUS.box, oculusFrontBox()]) {
    const place = Object.fromEntries(oculusPlace(box));
    same(Object.keys(place), ['left', 'margin-top', 'width', 'aspect-ratio']);
    near(Number.parseFloat(place.left), (box[0] / W) * 100, 'left', 1e-4);
    near(
      Number.parseFloat(place['margin-top']),
      (box[1] / W) * 100,
      'top',
      1e-4,
    );
    near(Number.parseFloat(place.width), (box[2] / W) * 100, 'width', 1e-4);
    assert.equal(place['aspect-ratio'], `${box[2]} / ${box[3]}`);
    for (const name of ['left', 'margin-top', 'width'])
      assert.match(place[name], /^\d+\.\d{4}%$/);
  }
  // As wide as the plate box makes it: the box covers the stage.
  near(oculusSkyWidth(1672, 941), BW, 'the plate at its own size');
  near(oculusSkyWidth(1440, 900), ((900 * W) / H / W) * BW, 'a taller stage');
  near(oculusSkyWidth(2560, 1080), (2560 / W) * BW, 'a wider stage');
  near(oculusSkyWidth(390, 844), ((844 * W) / H / W) * BW, 'a phone');
}

// ---------------------------------------------------------------------------
// 2. Who gets a living sky, its clock and its drawing buffer.
// ---------------------------------------------------------------------------
{
  for (const width of [320, 390, 768, 1199, 1200, 1440, 2560])
    for (const fine of [true, false]) {
      assert.equal(oculusSkyTier(width, fine, true, false), 'off', 'reduced');
      assert.equal(oculusSkyTier(width, fine, false, true), 'off', 'Save-Data');
      assert.equal(
        oculusSkyTier(width, fine, false, false),
        width >= 1200 && fine ? 'full' : 'light',
      );
    }
  same(Object.keys(SKY.tiers), ['full', 'light']);
  assert.ok(SKY.tiers.light.frameMs > SKY.tiers.full.frameMs);
  assert.ok(SKY.tiers.light.pixelRatio < SKY.tiers.full.pixelRatio);
  assert.ok(SKY.tiers.light.detail < SKY.tiers.full.detail);
  // The shader's loops allow six octaves; its finest field uses detail - 2.
  for (const tier of Object.values(SKY.tiers))
    assert.ok(tier.detail - 2 >= 1 && tier.detail <= 6);
  // Never more than 30 frames of sky a second.
  assert.ok(SKY.tiers.full.frameMs >= 1000 / 30 - 1e-9);
  // The clock: sky seconds from the frame owner's gaps. A stalled frame
  // advances one step at most; a longer gap resumes without a jump.
  assert.equal(oculusSkyStep(0), 0);
  assert.equal(oculusSkyStep(-5), 0);
  near(oculusSkyStep(1000 / 60), (1000 / 60 / 1000) * SKY.speed, 'a frame');
  near(oculusSkyStep(SKY.maxStepMs), (SKY.maxStepMs / 1000) * SKY.speed, 'cap');
  near(oculusSkyStep(120), (SKY.maxStepMs / 1000) * SKY.speed, 'stalled');
  assert.equal(oculusSkyStep(SKY.resumeGapMs + 1), 0, 'a long gap');
  assert.equal(oculusSkyStep(60_000), 0);
  assert.ok(SKY.speed > 0 && SKY.speed <= 4);
  // The buffer: the canvas's shape, the screen's density within the tier's
  // limit, and never more pixels than the budget.
  for (const [stageW, stageH] of [
    [1680, 887],
    [1440, 900],
    [2560, 1080],
    [3840, 2160],
    [820, 1180],
    [390, 844],
  ])
    for (const tier of ['full', 'light'])
      for (const density of [1, 1.5, 2, 3]) {
        const css = oculusSkyWidth(stageW, stageH);
        const [w, h] = oculusSkyBuffer(css, density, tier);
        const ratio = w / css;
        assert.ok(Number.isInteger(w) && Number.isInteger(h));
        assert.ok(w * h <= SKY.pixelBudget * 1.01, `${w} × ${h}`);
        assert.ok(
          ratio <= Math.min(SKY.tiers[tier].pixelRatio, density) + 0.01,
        );
        near(w / h, BW / BH, "the canvas's shape", 0.02);
      }
  same(oculusSkyBuffer(oculusSkyWidth(1680, 887), 2, 'full'), [1527, 458]);
  // A sky is made ready in the reading hold, where nothing on stage moves,
  // and after the atmosphere has asked for the shared Three.js.
  const { SKY_BRIDGE } = loadStoryMath('atmospheric-sky-frame');
  const { MOTION } = loadStoryMath('home-motion');
  assert.ok(SKY.prepareAt > SKY_BRIDGE.preload);
  assert.ok(
    SKY.prepareAt >= 0.42 && SKY.prepareAt < MOTION.bridge.exitStart,
    'in the reading hold',
  );
  for (const colour of [SKY.zenith, SKY.horizon, SKY.light, SKY.shade])
    assert.match(colour, /^#[0-9a-f]{6}$/);
}

// ---------------------------------------------------------------------------
// 3. The foreground picture: what crosses the sky on the plate, cut out. Two
// files (the two the approved backdrop chooses between), each the box's size
// at its plate's scale; clear where the sky was, whole on the ring, the rail
// and the leaves, fading to nothing at its ends; and what is whole is the
// plate itself.
// ---------------------------------------------------------------------------
{
  const {
    compPlateFile,
    plateOculusSources,
    ATRIUM_ORBIT_COMP: COMP,
  } = manifest;
  const [FX, FY, FW, FH] = oculusFrontBox();
  const sources = plateOculusSources('arrival', [FW, FH]);
  same(sources, {
    sources: [
      {
        media: COMP.arrivalNarrow,
        type: 'image/webp',
        srcset: '/images/home-chapters/worlds-atrium-oculus-1280.webp',
        sizes: '100vw',
      },
    ],
    fallback: {
      src: '/images/home-chapters/worlds-atrium-oculus.webp',
      width: FW,
      height: FH,
      sizes: '100vw',
    },
  });
  for (const room of ['living', 'bedroom', 'bathroom', 'kitchen'])
    assert.equal(
      plateOculusSources(room, [FW, FH]),
      null,
      'the wide view only',
    );
  same(
    readdirSync(new URL('../public/images/home-chapters/', import.meta.url))
      .filter((name) => name.includes('oculus'))
      .sort(),
    ['worlds-atrium-oculus-1280.webp', 'worlds-atrium-oculus.webp'],
  );
  const pixels = async (name, alpha) => {
    const image = sharp(file(`public${name}`));
    const { data, info } = await (
      alpha ? image.ensureAlpha() : image.removeAlpha()
    )
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, w: info.width, h: info.height, c: info.channels };
  };
  for (const width of COMP.widths.slice(0, 2)) {
    const scale = width / W;
    const name = compPlateFile('arrival', width, '-oculus');
    assert.ok(existsSync(file(`public${name}`)), `${name} exists`);
    const meta = await sharp(file(`public${name}`)).metadata();
    same(
      [meta.format, meta.hasAlpha, meta.width, meta.height],
      ['webp', true, Math.round(FW * scale), Math.round(FH * scale)],
      `${name}: the box at its plate's scale`,
    );
    const front = await pixels(name, true);
    const plate = await pixels(compPlateFile('arrival', width), false);
    // A place on the plate (px of the 1672 plate), in this file.
    const at = (x, y) => [
      Math.min(front.w - 1, Math.round((x - FX) * scale)),
      Math.min(front.h - 1, Math.round((y - FY) * scale)),
    ];
    const alpha = (x, y) => {
      const [fx, fy] = at(x, y);
      return front.data[(fy * front.w + fx) * 4 + 3];
    };
    // Clear where the sky was (open sky and cloud alike).
    for (const [x, y] of [
      [836, 110],
      [900, 60],
      [1000, 100],
      [780, 170],
      [1080, 60],
    ])
      assert.ok(
        alpha(x, y) <= 4,
        `${name}: sky at ${x}, ${y} (${alpha(x, y)})`,
      );
    // Whole on what is in front: the ring, the drum's wall under the
    // opening, a rib, the two crowns of leaves.
    for (const [x, y] of [
      [470, 40],
      [1200, 30],
      [500, 190],
      [1180, 200],
      [836, 234],
      [522, 96],
      [1140, 110],
      [560, 120],
      [1000, 170],
    ])
      // (A rib is a few px wide: in the narrower file its edge takes a
      // little of the sky beside it.)
      assert.ok(
        alpha(x, y) >= 240,
        `${name}: front at ${x}, ${y} (${alpha(x, y)})`,
      );
    // It ends in nothing on the three sides that are not the plate's edge,
    // and is whole along the plate's top edge.
    for (let i = 0; i < front.w; i += 7)
      assert.ok(
        front.data[((front.h - 1) * front.w + i) * 4 + 3] <= 6,
        'bottom',
      );
    for (let j = 0; j < front.h; j += 5) {
      assert.ok(front.data[j * front.w * 4 + 3] <= 6, 'left');
      assert.ok(front.data[(j * front.w + front.w - 1) * 4 + 3] <= 6, 'right');
    }
    assert.ok(alpha(470, 1) >= 250 && alpha(1200, 1) >= 250, 'the top edge');
    // Share of the canvas's box that is sky.
    let clear = 0;
    let total = 0;
    for (let y = BY; y < BY + BH; y += 2)
      for (let x = BX; x < BX + BW; x += 2) {
        total++;
        if (alpha(x, y) < 128) clear++;
      }
    assert.ok(
      clear / total > 0.36 && clear / total < 0.5,
      `${name}: sky share ${(clear / total).toFixed(3)}`,
    );
    // What is whole is the plate: the same picture where it lies (the
    // encoders' noise apart). The picture is placed by its box, so a place
    // in it is a place between the plate's pixels: the plate is read there
    // as a browser would draw it.
    const platePixel = (x, y, c) => {
      const x0 = Math.min(plate.w - 2, Math.max(0, Math.floor(x)));
      const y0 = Math.min(plate.h - 2, Math.max(0, Math.floor(y)));
      const tx = Math.min(1, Math.max(0, x - x0));
      const ty = Math.min(1, Math.max(0, y - y0));
      const read = (px, py) => plate.data[(py * plate.w + px) * 3 + c];
      return (
        (read(x0, y0) * (1 - tx) + read(x0 + 1, y0) * tx) * (1 - ty) +
        (read(x0, y0 + 1) * (1 - tx) + read(x0 + 1, y0 + 1) * tx) * ty
      );
    };
    let sum = 0;
    let count = 0;
    for (let fy = 1; fy < front.h - 1; fy += 2)
      for (let fx = 1; fx < front.w - 1; fx += 2) {
        if (front.data[(fy * front.w + fx) * 4 + 3] < 255) continue;
        // The middle of this pixel, on the plate file's own grid.
        const px = (FX + ((fx + 0.5) * FW) / front.w) * scale - 0.5;
        const py = (FY + ((fy + 0.5) * FH) / front.h) * scale - 0.5;
        for (let c = 0; c < 3; c++)
          sum += Math.abs(
            front.data[(fy * front.w + fx) * 4 + c] - platePixel(px, py, c),
          );
        count += 3;
      }
    assert.ok(count > 20000, `${name}: compared`);
    // The full file's colours are the served plate's own. The narrower one
    // is that cut-out made smaller, beside a plate made smaller on its own:
    // two resamplings of fine leaves, which differ more (measured: 1.4 and
    // 4.6 of 255).
    apart.push((sum / count).toFixed(2));
    assert.ok(
      sum / count < (width === W ? 2.5 : 6),
      `${name}: the plate's own picture (${(sum / count).toFixed(2)})`,
    );
  }
}

// ---------------------------------------------------------------------------
// 4. The shader: one fragment program on one quad. No texture, no lookup,
// no light, nothing discarded; time enters as one uniform; its loops are
// bounded. The uniforms it declares are the ones the module supplies.
// ---------------------------------------------------------------------------
const UNIFORMS = [
  'uTime',
  'uDetail',
  'uAspect',
  'uSpan',
  'uPitch',
  'uCover',
  'uZenith',
  'uHorizon',
  'uLight',
  'uShade',
];
{
  same(Object.keys(shaders).sort(), [
    'oculusSkyFragmentShader',
    'oculusSkyVertexShader',
  ]);
  const fragment = strip(shaders.oculusSkyFragmentShader);
  const vertex = strip(shaders.oculusSkyVertexShader);
  same(
    [...fragment.matchAll(/uniform \w+ (\w+);/g)].map((m) => m[1]),
    UNIFORMS,
  );
  assert.doesNotMatch(
    fragment + vertex,
    /sampler|texture|discard|gl_FragDepth|dFdx|dFdy|fwidth/,
    'no texture, lookup, discard or derivative',
  );
  // Every loop has a constant bound.
  const loops = fragment.match(/for \([^)]*\)/g) ?? [];
  assert.ok(loops.length >= 1);
  for (const loop of loops)
    assert.match(loop, /^for \(int i = 0; i < 6; i\+\+\)$/);
  // Opaque, and converted once on the way out.
  assert.match(fragment, /gl_FragColor = vec4\(colour, 1\.0\);/);
  assert.equal(fragment.match(/#include <colorspace_fragment>/g).length, 1);
  // The quad is drawn in clip space: no camera matrix is used.
  assert.match(vertex, /gl_Position = vec4\(position\.xy, 0\.0, 1\.0\);/);
  assert.doesNotMatch(vertex, /projectionMatrix|modelViewMatrix/);
  // Two sheets at two speeds: that is the depth. The low one is the quicker.
  const drift = (name) => {
    const match = fragment.match(
      new RegExp(
        `vec2 ${name} = ground \\* ([\\d.]+) \\+ vec2\\(uTime \\* ([\\d.]+), uTime \\* ([\\d.]+)\\)`,
      ),
    );
    assert.ok(match, `${name} sheet`);
    return Math.hypot(Number(match[2]), Number(match[3])) / Number(match[1]);
  };
  assert.ok(
    drift('low') > drift('high') * 1.5,
    'the nearer sheet passes faster',
  );
}

// ---------------------------------------------------------------------------
// 5. The module's source: no clock, timer, observer or animation frame of
// its own; it listens only to its own canvas losing its context; it never
// measures or scrolls the page; one lazy import of Three.js, shared with
// the atmosphere.
// ---------------------------------------------------------------------------
const source = read(`${EXPERIENCE}oculus-sky.ts`);
{
  const code = strip(source);
  assert.doesNotMatch(
    code,
    /requestAnimationFrame|cancelAnimationFrame|setTimeout|setInterval|performance\.now|Date\.now|new Date|Observer|matchMedia|getBoundingClientRect|getComputedStyle|scroll|wheel|touch|pointer(?!-events)/,
  );
  same(
    [...code.matchAll(/addEventListener\('([a-z]+)'/g)].map((m) => m[1]),
    ['webglcontextlost', 'webglcontextrestored'],
  );
  same(
    [...code.matchAll(/removeEventListener\('([a-z]+)'/g)].map((m) => m[1]),
    ['webglcontextlost', 'webglcontextrestored'],
  );
  assert.equal(code.match(/import\('three'\)/g).length, 1, 'one lazy import');
  assert.match(source, /^import type \* as Three from 'three';$/m);
  assert.doesNotMatch(code, /^import (?!type)[^;]*from 'three'/m);
  assert.doesNotMatch(
    code,
    /Texture|RenderTarget|Loader\b|(Ambient|Directional|Point|Spot|Hemisphere)Light|OrbitControls/,
    'no texture, target, loader, light or controls',
  );
  assert.match(code, /failIfMajorPerformanceCaveat: true/);
  assert.match(code, /powerPreference: 'low-power'/);
  // The only window read is the screen's density.
  same(
    [...code.matchAll(/window\.(\w+)/g)].map((m) => m[1]),
    ['devicePixelRatio'],
  );
  // The only style it writes is its own element's opacity (and the canvas's
  // fixed fill).
  same(
    [...new Set([...code.matchAll(/\.style\.(\w+)/g)].map((m) => m[1]))].sort(
      (a, b) => a.localeCompare(b),
    ),
    ['cssText', 'opacity', 'removeProperty'],
  );
}

// The double: a stand-in for Three.js that records what is made, drawn and
// released; an element to fill; a page that fails if a timer or a frame is
// ever asked for.
function world({ density = 2 } = {}) {
  const log = {
    loads: 0,
    renderers: [],
    drawn: [],
    released: [],
    compiled: 0,
    // Set by a test to make a step fail.
    rejectLoad: false,
    throwOnConstruct: false,
    throwOnRender: false,
    shaderErrorOnRender: false,
    holdCompile: null,
  };
  class WebGLRenderer {
    constructor(options) {
      if (log.throwOnConstruct) throw new Error('no context');
      this.options = options;
      this.debug = {};
      this.renderLists = { dispose: () => log.released.push('lists') };
      this.sizes = [];
      log.renderers.push(this);
    }
    setDrawingBufferSize(width, height, ratio) {
      this.sizes.push([width, height, ratio]);
    }
    render(scene) {
      if (log.throwOnRender) throw new Error('lost');
      if (log.shaderErrorOnRender) this.debug.onShaderError();
      log.drawn.push(scene.mesh.material.uniforms.uTime.value);
    }
    compileAsync() {
      log.compiled++;
      return log.holdCompile ?? Promise.resolve();
    }
    dispose() {
      log.released.push('renderer');
    }
    forceContextLoss() {
      log.released.push('context');
    }
  }
  class Scene {
    add(mesh) {
      this.mesh = mesh;
    }
    clear() {
      log.released.push('scene');
    }
  }
  class Camera {}
  class PlaneGeometry {
    constructor(...size) {
      this.size = size;
    }
    dispose() {
      log.released.push('geometry');
    }
  }
  class ShaderMaterial {
    constructor(options) {
      Object.assign(this, options);
    }
    dispose() {
      log.released.push('material');
    }
  }
  class Mesh {
    constructor(geometry, material) {
      Object.assign(this, { geometry, material });
    }
  }
  class Color {
    constructor(value) {
      this.value = value;
    }
  }
  const library = {
    WebGLRenderer,
    Scene,
    Camera,
    PlaneGeometry,
    ShaderMaterial,
    Mesh,
    Color,
    SRGBColorSpace: 'srgb',
    NoToneMapping: 'none',
  };
  const canvases = [];
  const element = () => {
    const node = {
      attrs: {},
      listeners: new Map(),
      children: [],
      removed: false,
      style: {
        opacity: '',
        cssText: '',
        removeProperty(name) {
          node.style[name] = '';
          node.cleared = name;
        },
      },
      setAttribute: (name, value) => (node.attrs[name] = value),
      addEventListener: (type, run) => node.listeners.set(type, run),
      removeEventListener: (type, run) =>
        node.listeners.get(type) === run && node.listeners.delete(type),
      appendChild(child) {
        node.children.push(child);
        child.parent = node;
      },
      remove() {
        node.removed = true;
        const siblings = node.parent?.children;
        if (siblings) siblings.splice(siblings.indexOf(node), 1);
      },
    };
    return node;
  };
  const loaded = { exports: {} };
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
    {
      module: loaded,
      exports: loaded.exports,
      window: { devicePixelRatio: density },
      document: {
        createElement(tag) {
          assert.equal(tag, 'canvas');
          const canvas = element();
          canvases.push(canvas);
          return canvas;
        },
      },
      requestAnimationFrame: () => assert.fail('no frame of its own'),
      setTimeout: () => assert.fail('no timer'),
      setInterval: () => assert.fail('no interval'),
      performance: { now: () => assert.fail('no clock of its own') },
      require(specifier) {
        if (specifier === 'three') return assert.fail('never loaded eagerly');
        assert.match(specifier, /^\.\/(atrium-orbit-sky|oculus-sky-shaders)$/);
        return loadStoryMath(specifier.slice(2));
      },
    },
  );
  const host = element();
  let wakes = 0;
  const load = () => {
    log.loads++;
    return log.rejectLoad
      ? Promise.reject(new Error('offline'))
      : Promise.resolve(library);
  };
  const live = loaded.exports.createOculusSky(host, () => wakes++, load);
  const settle = async () => {
    for (let i = 0; i < 12; i++) await Promise.resolve();
  };
  return {
    live,
    log,
    host,
    canvases,
    wakes: () => wakes,
    settle,
    // The one renderer, once made.
    renderer: () => log.renderers.at(-1),
  };
}
const FRAME = 1000 / 60;
const WIDTH = oculusSkyWidth(1680, 887);

// Made ready, shown, and moving.
{
  const w = world();
  same([w.live.state(), w.live.wantsTime(), w.log.loads], ['idle', false, 0]);
  // Nothing before it is asked for: a frame or a place changes nothing.
  w.live.tick(0);
  w.live.place(false, WIDTH, 'full');
  same([w.log.loads, w.canvases.length, w.host.style.opacity], [0, 0, '']);
  w.live.prepare('full');
  w.live.prepare('full');
  same([w.live.state(), w.log.loads], ['loading', 1], 'asked for once');
  await w.settle();
  same([w.live.state(), w.wakes(), w.log.loads], ['ready', 1, 1]);
  // One context, modest and honest about software rendering; one canvas
  // that fills its element and takes no pointer.
  assert.equal(w.log.renderers.length, 1);
  const renderer = w.renderer();
  const [canvas] = w.canvases;
  same(
    {
      alpha: renderer.options.alpha,
      antialias: renderer.options.antialias,
      depth: renderer.options.depth,
      stencil: renderer.options.stencil,
      preserveDrawingBuffer: renderer.options.preserveDrawingBuffer,
      powerPreference: renderer.options.powerPreference,
      failIfMajorPerformanceCaveat:
        renderer.options.failIfMajorPerformanceCaveat,
    },
    {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true,
    },
  );
  assert.equal(renderer.options.canvas, canvas);
  same(
    [
      renderer.outputColorSpace,
      renderer.toneMapping,
      canvas.attrs['aria-hidden'],
    ],
    ['srgb', 'none', 'true'],
  );
  assert.match(
    canvas.style.cssText,
    /width:100%;height:100%;pointer-events:none;/,
  );
  assert.equal(canvas.parent, w.host);
  same(
    [...canvas.listeners.keys()],
    ['webglcontextlost', 'webglcontextrestored'],
  );
  // One quad, one material, the shader's uniforms and nothing else.
  assert.equal(w.log.compiled, 1);
  const drawnBefore = w.log.drawn.length;
  assert.equal(drawnBefore, 1, 'one frame before it is ever seen');
  // Not on stage yet: its element is clear and no frame is wanted.
  same([w.host.style.opacity, w.live.wantsTime()], ['0', false]);
  w.live.tick(100);
  assert.equal(w.log.drawn.length, 1, 'nothing is drawn off stage');
  // On stage. It was ready first, so it is simply there.
  w.live.place(true, WIDTH, 'full');
  same([w.host.style.opacity, w.live.wantsTime()], ['1', true]);
  same(renderer.sizes.at(-1), [...oculusSkyBuffer(WIDTH, 2, 'full'), 1]);
  const sized = renderer.sizes.length;
  // Frames from the story's owner: the first only starts the clock; then
  // sky time is the sum of the gaps, and a frame of sky is drawn at most
  // every frameMs.
  let now = 5000;
  w.live.tick(now);
  assert.equal(w.log.drawn.length, 2);
  assert.equal(w.log.drawn.at(-1), 0, 'the first frame starts the clock');
  for (let i = 0; i < 120; i++) {
    now += FRAME;
    w.live.tick(now);
  }
  near(
    w.log.drawn.at(-1),
    ((120 * FRAME) / 1000) * SKY.speed,
    'two seconds on',
    0.02,
  );
  const perSecond = (w.log.drawn.length - 2) / 2;
  assert.ok(
    perSecond >= 29 && perSecond <= 31,
    `${perSecond} frames of sky a second`,
  );
  for (let i = 3; i < w.log.drawn.length; i++)
    assert.ok(w.log.drawn[i] > w.log.drawn[i - 1], 'time only goes on');
  // The same place every frame: the buffer is sized once.
  for (let i = 0; i < 5; i++) w.live.place(true, WIDTH, 'full');
  assert.equal(renderer.sizes.length, sized);
  // A stalled frame advances one step; a long gap none.
  const before = w.log.drawn.at(-1);
  now += 120;
  w.live.tick(now);
  near(
    w.log.drawn.at(-1) - before,
    (SKY.maxStepMs / 1000) * SKY.speed,
    'stalled',
    1e-6,
  );
  const held = w.log.drawn.at(-1);
  now += 5000;
  w.live.tick(now);
  assert.equal(w.log.drawn.at(-1), held, 'a long gap resumes without a jump');
  // Off stage: clear, unwanted, and its clock stopped however long it is.
  w.live.place(false, WIDTH, 'full');
  same([w.host.style.opacity, w.live.wantsTime()], ['0', false]);
  const draws = w.log.drawn.length;
  for (let i = 0; i < 30; i++) w.live.tick((now += FRAME));
  assert.equal(w.log.drawn.length, draws);
  now += 60_000;
  w.live.place(true, WIDTH, 'full');
  assert.equal(w.host.style.opacity, '1');
  w.live.tick(now);
  assert.equal(w.log.drawn.at(-1), held, 'back on stage where it left off');
  // A hidden tab: the same. (One more frame first: its sky time counts
  // whether or not that frame was one of the drawn ones.)
  w.live.tick((now += FRAME));
  w.live.suspend();
  now += 30_000;
  w.live.tick(now);
  near(
    w.log.drawn.at(-1),
    held + (FRAME / 1000) * SKY.speed,
    'a hidden tab stops the clock',
    1e-9,
  );
  // Another size or another tier: the buffer and the detail follow.
  const narrow = oculusSkyWidth(390, 844);
  w.live.place(true, narrow, 'light');
  same(renderer.sizes.at(-1), [...oculusSkyBuffer(narrow, 2, 'light'), 1]);
  // Home leaves: everything is released, once; nothing after.
  assert.equal(w.log.released.length, 0);
  w.live.destroy();
  w.live.destroy();
  same(
    w.log.released.toSorted((a, b) => a.localeCompare(b)),
    ['context', 'geometry', 'lists', 'material', 'renderer', 'scene'],
  );
  same(
    [canvas.removed, canvas.listeners.size, w.host.cleared],
    [true, 0, 'opacity'],
  );
  const final = w.log.drawn.length;
  w.live.place(true, WIDTH, 'full');
  w.live.tick((now += FRAME));
  same([w.log.drawn.length, w.live.wantsTime()], [final, false]);
}

// The uniforms are the shader's, with the screen's detail.
for (const tier of ['full', 'light']) {
  const w = world();
  w.live.prepare(tier);
  await w.settle();
  w.live.place(true, WIDTH, tier);
  // Reach the material through a draw: the stand-in reads uTime from it.
  const material = (() => {
    let seen = null;
    const original = w.renderer().render;
    w.renderer().render = function (scene) {
      seen = scene.mesh.material;
      return original.call(this, scene);
    };
    w.live.tick(1);
    return seen;
  })();
  same(Object.keys(material.uniforms), UNIFORMS);
  same(
    [
      material.uniforms.uDetail.value,
      material.uniforms.uAspect.value,
      material.uniforms.uSpan.value,
      material.uniforms.uPitch.value,
      material.uniforms.uCover.value,
      material.uniforms.uZenith.value.value,
      material.uniforms.uHorizon.value.value,
      material.uniforms.uLight.value.value,
      material.uniforms.uShade.value.value,
    ],
    [
      SKY.tiers[tier].detail,
      BW / BH,
      SKY.span,
      (SKY.pitch * Math.PI) / 180,
      SKY.cover,
      SKY.zenith,
      SKY.horizon,
      SKY.light,
      SKY.shade,
    ],
  );
  same(
    [material.vertexShader, material.fragmentShader],
    [shaders.oculusSkyVertexShader, shaders.oculusSkyFragmentShader],
  );
  same(
    [
      material.depthTest,
      material.depthWrite,
      material.toneMapped,
      material.transparent,
    ],
    [false, false, false, undefined],
    'opaque, undepthed',
  );
  w.live.destroy();
}

// Ready only after the Atrium is in view: it comes in softly over the
// painted sky, by the frames it is given, and then stays whole.
{
  const w = world();
  let release;
  w.log.holdCompile = new Promise((resolve) => (release = resolve));
  w.live.prepare('full');
  await w.settle();
  assert.equal(w.live.state(), 'loading');
  w.live.place(true, WIDTH, 'full');
  same([w.live.wantsTime(), w.host.style.opacity], [false, '0']);
  release();
  await w.settle();
  same([w.live.state(), w.wakes(), w.live.wantsTime()], ['ready', 1, true]);
  assert.equal(w.host.style.opacity, '0', 'not there at once');
  let now = 0;
  const steps = [];
  w.live.tick(now);
  for (let i = 0; i < 80; i++) {
    w.live.tick((now += FRAME));
    steps.push(Number(w.host.style.opacity));
  }
  for (let i = 1; i < steps.length; i++)
    assert.ok(steps[i] >= steps[i - 1], 'it only comes in');
  assert.ok(
    steps[10] > 0.1 && steps[10] < 0.3,
    `a fifth of the way (${steps[10]})`,
  );
  near(steps[26], (27 * FRAME) / SKY.fadeMs, 'even', 0.02);
  assert.equal(w.host.style.opacity, '1', 'whole within its time');
  assert.ok(steps.indexOf(1) * FRAME <= SKY.fadeMs + 2 * FRAME);
  // Off stage and back: whole at once (it has come in already).
  w.live.place(false, WIDTH, 'full');
  w.live.place(true, WIDTH, 'full');
  assert.equal(w.host.style.opacity, '1');
  w.live.destroy();
}

// Anything that fails leaves the painted sky, for good, and says so once.
{
  // Three.js does not arrive.
  const offline = world();
  offline.log.rejectLoad = true;
  offline.live.prepare('full');
  await offline.settle();
  same(
    [
      offline.live.state(),
      offline.wakes(),
      offline.canvases.length,
      offline.host.style.opacity,
    ],
    ['failed', 1, 0, '0'],
  );
  offline.live.prepare('full');
  offline.live.place(true, WIDTH, 'full');
  offline.live.tick(1);
  same(
    [offline.log.loads, offline.live.wantsTime()],
    [1, false],
    'not tried again',
  );
  // No hardware context.
  const software = world();
  software.log.throwOnConstruct = true;
  software.live.prepare('full');
  await software.settle();
  same([software.live.state(), software.wakes()], ['failed', 1]);
  assert.equal(
    software.canvases[0].parent,
    undefined,
    'its canvas never shown',
  );
  // The shader does not link (Three reports it on first use).
  const broken = world();
  broken.log.shaderErrorOnRender = true;
  broken.live.prepare('full');
  await broken.settle();
  same([broken.live.state(), broken.wakes()], ['failed', 1]);
  assert.ok(broken.canvases[0].removed);
  assert.ok(broken.log.released.includes('context'));
  // A draw throws later on.
  const lost = world();
  lost.live.prepare('full');
  await lost.settle();
  lost.live.place(true, WIDTH, 'full');
  lost.log.throwOnRender = true;
  lost.live.tick(1);
  same(
    [
      lost.live.state(),
      lost.wakes(),
      lost.live.wantsTime(),
      lost.host.style.opacity,
    ],
    ['failed', 2, false, '0'],
  );
  assert.ok(lost.canvases[0].removed && lost.log.released.includes('renderer'));
  // The context is lost (another tab, a driver reset).
  const reset = world();
  reset.live.prepare('full');
  await reset.settle();
  reset.live.place(true, WIDTH, 'full');
  let prevented = false;
  reset.canvases[0].listeners.get('webglcontextlost')({
    preventDefault: () => (prevented = true),
  });
  same(
    [
      prevented,
      reset.live.state(),
      reset.live.wantsTime(),
      reset.canvases[0].removed,
    ],
    [true, 'failed', false, true],
  );
  assert.equal(reset.canvases[0].listeners.size, 0);
  // Home leaves while it is still getting ready: nothing is made after.
  const early = world();
  early.live.prepare('full');
  early.live.destroy();
  await early.settle();
  same(
    [early.canvases.length, early.wakes(), early.log.renderers.length],
    [0, 0, 0],
  );
  const midway = world();
  let release;
  midway.log.holdCompile = new Promise((resolve) => (release = resolve));
  midway.live.prepare('full');
  await midway.settle();
  midway.live.destroy();
  release();
  await midway.settle();
  same([midway.wakes(), midway.canvases[0].removed], [0, true]);
  assert.ok(midway.log.released.includes('context'));
}

console.log(
  `Oculus sky passed: a ${BW} × ${BH} box at the plate's top with one opening ` +
    `inside it; a living sky for all but reduced motion and Save-Data (full ` +
    `at 1200px and a fine pointer, lighter elsewhere), at most ` +
    `${Math.round(1000 / SKY.tiers.full.frameMs)} frames a second and ` +
    `${SKY.pixelBudget.toLocaleString('en')} px; the foreground picture in ` +
    `two files, clear where the sky was, whole on the ring, rail, ribs and ` +
    `leaves, fading out at its ends, and the plate's own picture where it is ` +
    `whole (${apart.join(' and ')} of 255 apart); one shader with no texture and bounded loops, two sheets at two ` +
    `speeds; a module with no clock, timer, observer or frame of its own, ` +
    `one lazy Three.js import and one modest context: time from the frames ` +
    `it is given, paused off stage and in a hidden tab, eased in when ready ` +
    `late, released once, and the painted sky for good on any failure.`,
);
