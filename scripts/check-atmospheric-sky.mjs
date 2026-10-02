/** Real bridge controller with a deterministic WebGL boundary. These checks
 * prove lifecycle/math contracts, not browser frame rate or shader appearance. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { loadStoryMath } from './load-story-math.mjs';

const source = readFileSync(
  new URL(
    '../components/home/experience/atmospheric-sky-renderer.ts',
    import.meta.url,
  ),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
});
const math = loadStoryMath('atmospheric-sky-frame');
const { atmosphericSkyFrame, SKY_BRIDGE, skyTier, skyPixelRatio } = math;
const master = (local) =>
  SKY_BRIDGE.start + local * (SKY_BRIDGE.end - SKY_BRIDGE.start);
const samples = Array.from({ length: 501 }, (_, i) =>
  atmosphericSkyFrame(i / 500),
);
assert.deepEqual(
  samples,
  Array.from({ length: 501 }, (_, i) =>
    atmosphericSkyFrame((500 - i) / 500),
  ).reverse(),
  'camera, density and drift are exactly reversible without a wall clock',
);
let previousZ = Infinity;
for (const frame of samples) {
  for (const [key, value] of Object.entries(frame)) {
    if (typeof value !== 'number') continue;
    assert(Number.isFinite(value), `${key} remains finite`);
    if (!key.startsWith('camera'))
      assert(value >= 0 && value <= 1, `${key} is bounded`);
  }
  assert(
    frame.cameraZ <= previousZ,
    'forward travel moves through depth monotonically',
  );
  previousZ = frame.cameraZ;
}
assert.equal(atmosphericSkyFrame(-1).progress, 0);
assert.equal(atmosphericSkyFrame(2).progress, 1);
assert.equal(atmosphericSkyFrame(master(0)).cameraZ, SKY_BRIDGE.cameraStart);
assert(
  Math.abs(atmosphericSkyFrame(master(1)).cameraZ - SKY_BRIDGE.cameraEnd) <
    1e-12,
);
assert.equal(
  atmosphericSkyFrame(0.64).skyCover,
  1,
  'the DOM swap falls inside complete sky coverage intent',
);
assert(
  atmosphericSkyFrame(0.64).inside > 0.9,
  'the swap happens inside the atmosphere',
);
assert.equal(
  atmosphericSkyFrame(0.95).active,
  false,
  'final Atrium has no atmosphere',
);
for (const width of [320, 390, 767])
  assert.equal(skyTier(width, true, false), 'fallback');
assert.equal(skyTier(1440, true, true), 'fallback');
assert.equal(skyTier(820, true, false), 'tablet');
assert.equal(skyTier(1440, false, false), 'tablet');
assert.equal(skyTier(1440, true, false), 'desktop');
for (const tier of ['desktop', 'tablet']) {
  for (const [width, height] of [
    [768, 1024],
    [820, 1180],
    [1440, 900],
    [2560, 1440],
    [3840, 2160],
  ]) {
    for (const ratio of [1, 2, 3]) {
      const dpr = skyPixelRatio(width, height, ratio, tier);
      const budget =
        tier === 'desktop'
          ? SKY_BRIDGE.pixelBudget
          : SKY_BRIDGE.tabletPixelBudget;
      assert(dpr > 0 && dpr <= (tier === 'desktop' ? 1.5 : 1.25));
      assert(
        width * height * dpr * dpr <= budget + 1e-6,
        'drawing buffer obeys its pixel budget',
      );
    }
  }
}

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const settle = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

function harness({
  delayImport = false,
  delayCompile = false,
  initFails = false,
  setupFails = false,
} = {}) {
  const imported = deferred();
  const compiled = deferred();
  const stats = {
    imports: 0,
    contexts: 0,
    wakes: 0,
    renders: [],
    sizes: [],
    renderers: [],
    geometries: [],
    materials: [],
    canvases: [],
  };
  class Node {
    attrs = new Map();
    dataset = {};
    style = {};
    children = [];
    listeners = new Map();
    getAttribute(name) {
      return this.attrs.get(name) ?? null;
    }
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    }
    removeAttribute(name) {
      this.attrs.delete(name);
      if (name === 'data-sky-state') delete this.dataset.skyState;
      if (name === 'data-sky-tier') delete this.dataset.skyTier;
    }
    appendChild(node) {
      node.parent = this;
      this.children.push(node);
    }
    remove() {
      if (this.parent)
        this.parent.children = this.parent.children.filter(
          (node) => node !== this,
        );
    }
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, new Set());
      this.listeners.get(name).add(fn);
    }
    removeEventListener(name, fn) {
      this.listeners.get(name)?.delete(fn);
    }
    emit(name, event) {
      for (const fn of this.listeners.get(name) ?? []) fn(event);
    }
  }
  class Vector3 {
    constructor() {
      this.set(0, 0, 0);
    }
    set(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  }
  class Vector2 {
    constructor(x, y) {
      this.set(x, y);
    }
    set(x, y) {
      this.x = x;
      this.y = y;
    }
  }
  class Color {
    constructor(value) {
      this.value = value;
    }
  }
  class Scene {
    children = [];
    add(mesh) {
      this.children.push(mesh);
    }
    clear() {
      this.children = [];
    }
  }
  class PerspectiveCamera {
    position = new Vector3();
    constructor(fov, aspect, near, far) {
      Object.assign(this, { fov, aspect, near, far });
    }
    updateProjectionMatrix() {}
    updateMatrixWorld() {}
  }
  class PlaneGeometry {
    disposed = 0;
    constructor() {
      stats.geometries.push(this);
    }
    dispose() {
      this.disposed++;
    }
  }
  class ShaderMaterial {
    disposed = 0;
    constructor(options) {
      if (setupFails && stats.materials.length === 1)
        throw Error('Material setup failure');
      Object.assign(this, options);
      stats.materials.push(this);
    }
    dispose() {
      this.disposed++;
    }
  }
  class Mesh {
    position = new Vector3();
    scale = new Vector3();
    visible = true;
    constructor(geometry, material) {
      Object.assign(this, { geometry, material });
    }
  }
  class WebGLRenderer {
    debug = {};
    info = { render: { calls: 0 }, memory: { geometries: 1, textures: 0 } };
    renderLists = {
      disposed: 0,
      dispose() {
        this.disposed++;
      },
    };
    disposed = 0;
    losses = 0;
    clears = 0;
    failRender = false;
    shaderErrorOnRender = false;
    rendering = false;
    constructor(options) {
      if (initFails) throw Error('No supported WebGL context');
      this.options = options;
      stats.renderers.push(this);
      stats.contexts++;
    }
    setClearColor(colour, alpha) {
      this.clearColour = [colour, alpha];
    }
    setDrawingBufferSize(width, height, dpr) {
      stats.sizes.push([width, height, dpr]);
    }
    compileAsync(scene, camera) {
      this.scene = scene;
      this.camera = camera;
      return delayCompile ? compiled.promise : Promise.resolve();
    }
    render(scene, camera) {
      if (this.failRender) throw Error('Lost GPU draw');
      this.rendering = true;
      // Three reports link errors on first program use, which can occur during
      // render() rather than compileAsync(), without throwing an exception.
      if (this.shaderErrorOnRender) this.debug.onShaderError();
      this.info.render.calls = scene.children.filter(
        (mesh) => mesh.visible,
      ).length;
      stats.renders.push({
        camera: { ...camera.position },
        meshes: scene.children.map((mesh) => ({
          position: { ...mesh.position },
          scale: { ...mesh.scale },
          visible: mesh.visible,
          uniforms: Object.fromEntries(
            Object.entries(mesh.material.uniforms)
              .filter(([, uniform]) => typeof uniform.value === 'number')
              .map(([key, uniform]) => [key, uniform.value]),
          ),
        })),
      });
      this.rendering = false;
    }
    clear() {
      this.clears++;
    }
    dispose() {
      assert.equal(this.rendering, false, 'dispose only after render returns');
      this.disposed++;
    }
    forceContextLoss() {
      this.losses++;
      stats.contexts--;
    }
  }
  const three = {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    PlaneGeometry,
    ShaderMaterial,
    Mesh,
    Color,
    Vector2,
    SRGBColorSpace: 'srgb',
    NoToneMapping: 'none',
  };
  const loaded = { exports: {} };
  runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    require(specifier) {
      if (specifier === 'three') {
        stats.imports++;
        return delayImport ? imported.promise : three;
      }
      if (specifier === './atmospheric-sky-frame') return math;
      if (specifier === './atmospheric-sky-shaders')
        return loadStoryMath('atmospheric-sky-shaders');
      assert.fail(`Unexpected renderer dependency: ${specifier}`);
    },
    window: { devicePixelRatio: 2 },
    document: {
      createElement(tag) {
        assert.equal(
          tag,
          'canvas',
          'no offscreen texture/image helper is created',
        );
        const canvas = new Node();
        stats.canvases.push(canvas);
        return canvas;
      },
    },
    requestAnimationFrame() {
      assert.fail('renderer must use the existing master RAF');
    },
    setTimeout() {
      assert.fail('renderer must not create independent clocks');
    },
  });
  const host = new Node();
  const controller = loaded.exports.createAtmosphericSkyBridge(
    host,
    () => stats.wakes++,
  );
  let input = {
    progress: 0,
    width: 1440,
    height: 900,
    reduced: false,
    fine: true,
    visible: true,
    sceneReady: true,
  };
  const update = (changes = {}) => {
    input = { ...input, ...changes };
    controller.update(input);
  };
  const destroy = () => {
    controller.destroy();
    controller.destroy();
    assert.equal(stats.contexts, 0, 'owned context released exactly once');
    assert.equal(host.children.length, 0, 'no canvas retained after unmount');
    for (const resource of [...stats.geometries, ...stats.materials])
      assert.equal(resource.disposed, 1);
    for (const renderer of stats.renderers) {
      assert.equal(renderer.disposed, 1);
      assert.equal(renderer.losses, 1);
      if (renderer.scene) {
        assert.equal(renderer.renderLists.disposed, 1);
        assert.equal(renderer.scene.children.length, 0);
      }
    }
    for (const canvas of stats.canvases)
      assert.equal(
        [...canvas.listeners.values()].reduce(
          (n, listeners) => n + listeners.size,
          0,
        ),
        0,
      );
  };
  return {
    ...controller,
    host,
    stats,
    update,
    destroy,
    imported,
    compiled,
    three,
  };
}

{
  const b = harness();
  b.update({ progress: SKY_BRIDGE.preload - 0.01 });
  await settle();
  assert.equal(b.stats.imports, 0, 'no Three download before intent');
  b.update({ progress: SKY_BRIDGE.preload });
  b.update();
  await settle();
  assert.equal(b.stats.imports, 1);
  assert.equal(b.stats.contexts, 1);
  assert.equal(b.stats.renders.length, 1, 'one hidden shader warm-up');
  assert.equal(b.stats.renderers[0].clears, 1);
  assert.equal(b.host.dataset.skyState, 'ready');
  assert.equal(b.stats.geometries.length, 1, 'all planes share one geometry');
  assert.equal(
    b.stats.materials.length,
    4,
    'one sky and three cloud materials only',
  );
  assert.equal(b.stats.renderers[0].outputColorSpace, 'srgb');
  assert.equal(b.stats.renderers[0].options.premultipliedAlpha, true);
  for (const material of b.stats.materials)
    assert.equal(material.premultipliedAlpha, true);
  const positions = [0.53, 0.56, 0.59, 0.62, 0.64, 0.67, 0.69, 0.71];
  const snapshot = (progress) => {
    b.update({ progress });
    assert.equal(b.host.dataset.skyState, 'active');
    const rendered = b.stats.renders.at(-1);
    assert.equal(rendered.camera.z, atmosphericSkyFrame(progress).cameraZ);
    return rendered;
  };
  const forward = positions.map(snapshot);
  assert.deepEqual(
    positions.toReversed().map(snapshot).reverse(),
    forward,
    'reverse reuses identical camera/uniform poses',
  );
  const paused = b.stats.renders.length;
  for (let i = 0; i < 100; i++) b.update();
  assert.equal(
    b.stats.renders.length,
    paused,
    'stopping inside clouds does not spin or repeat draws',
  );
  b.suspend();
  assert.notEqual(b.host.dataset.skyState, 'active');
  assert.equal(b.host.children[0].style.visibility, 'hidden');
  b.update({ progress: 0.64, visible: false });
  assert.equal(
    b.stats.renders.length,
    paused,
    'hidden/out-of-story updates cannot render',
  );
  b.update({ visible: true, sceneReady: false });
  assert.equal(
    b.stats.renders.length,
    paused,
    'an undecoded DOM destination cannot start WebGL',
  );
  b.update({ sceneReady: true });
  assert.equal(b.host.dataset.skyState, 'active');
  const worldDraws = b.stats.renders.length;
  for (const progress of [0.745, 0.9, 1]) b.update({ progress });
  assert.equal(
    b.stats.renders.length,
    worldDraws,
    'WebGL stops before the Atrium reading state',
  );
  b.update({ progress: 0.62 });
  assert.equal(
    b.host.dataset.skyState,
    'active',
    'reverse reactivates the warmed context',
  );
  const renderCount = b.stats.renderers.length;
  for (const [width, height] of [
    [1440, 810],
    [1440, 900],
    [1024, 768],
    [820, 1180],
    [1180, 820],
    [768, 1024],
    [2560, 1440],
  ]) {
    b.update({ width, height, progress: 0.54 });
    const renderer = b.stats.renderers[0];
    const planes = renderer.scene.children;
    assert.equal(renderer.camera.aspect, width / height);
    for (let local = 0.07; local < 0.91; local += 0.03) {
      b.update({ progress: master(local) });
      const { camera } = renderer;
      const tangent = Math.tan((camera.fov * Math.PI) / 360);
      for (const plane of planes.filter((mesh) => mesh.visible)) {
        const distance = camera.position.z - plane.position.z;
        assert(
          distance > 0,
          'visible atmospheric planes remain in front of the lens',
        );
        const halfHeight = tangent * distance;
        assert(
          plane.scale.y / 2 >= halfHeight + Math.abs(camera.position.y),
          'no top/bottom rectangular edge is exposed',
        );
        assert(
          plane.scale.x / 2 >=
            halfHeight * camera.aspect + Math.abs(camera.position.x),
          'no side edge is exposed in portrait or landscape',
        );
      }
    }
    if (width < 1200) {
      assert.equal(
        planes[3].visible,
        false,
        'tablet renders at most two clouds plus sky',
      );
      for (const material of b.stats.materials)
        assert.equal(material.uniforms.uOctaves.value, 2);
    }
  }
  assert.equal(
    b.stats.renderers.length,
    renderCount,
    'resize/orientation reuse the context',
  );
  for (let cycle = 0; cycle < 20; cycle++) {
    for (const progress of [
      ...positions,
      0.95,
      ...positions.toReversed(),
      0.47,
    ])
      b.update({ progress });
    assert.equal(b.stats.contexts, 1);
    assert.equal(b.stats.geometries.length, 1);
    assert.equal(b.stats.materials.length, 4);
    assert.equal(b.host.children.length, 1);
  }
  const beforeReduced = b.stats.renders.length;
  b.update({ reduced: true, progress: 0.64 });
  assert.equal(b.host.dataset.skyState, 'fallback');
  assert.equal(b.stats.renders.length, beforeReduced);
  b.destroy();
}

for (const changes of [{ reduced: true }, { width: 390 }, { visible: false }]) {
  const b = harness();
  b.update({ progress: 0.62, ...changes });
  await settle();
  assert.equal(b.stats.imports, 0, 'ineligible stories do not import Three');
  assert.equal(b.stats.contexts, 0);
  b.destroy();
}

for (const changes of [
  { reduced: true },
  { width: 390 },
  { visible: false },
  null,
]) {
  const b = harness({ delayImport: true });
  b.update({ progress: 0.3 });
  await settle();
  if (changes) b.update(changes);
  else b.destroy();
  b.imported.resolve(b.three);
  await settle();
  assert.equal(
    b.stats.contexts,
    0,
    'late import cannot allocate after fallback, hidden state or unmount',
  );
  assert.equal(b.stats.wakes, 0);
  b.destroy();
}

for (const action of [
  'destroy',
  'suspend',
  'mobile',
  'late-crossing',
  'reject',
  'shader-error',
]) {
  const b = harness({ delayCompile: true });
  b.update({ progress: 0.3 });
  await settle();
  assert.equal(b.stats.contexts, 1);
  assert.equal(b.stats.renders.length, 0);
  if (action === 'destroy') b.destroy();
  if (action === 'suspend') b.suspend();
  if (action === 'mobile') b.update({ width: 390 });
  if (action === 'late-crossing') b.update({ progress: 0.64 });
  if (action === 'shader-error') b.stats.renderers[0].debug.onShaderError();
  if (action === 'reject') b.compiled.reject(Error('Compile failure'));
  else b.compiled.resolve();
  await settle();
  if (['destroy', 'suspend', 'mobile'].includes(action))
    assert.equal(
      b.stats.renders.length,
      0,
      `${action} prevents asynchronous warm-up draws`,
    );
  if (action === 'destroy')
    assert.equal(
      b.stats.wakes,
      0,
      'late compilation cannot wake an unmounted story',
    );
  if (['reject', 'shader-error'].includes(action)) {
    assert.equal(b.stats.contexts, 0);
    assert.equal(b.host.dataset.skyState, 'fallback');
  }
  if (action === 'late-crossing') {
    const count = b.stats.renders.length;
    b.update({ progress: 0.66 });
    assert.equal(
      b.stats.renders.length,
      count,
      'late compile cannot abruptly cover an in-flight DOM bridge',
    );
    assert.notEqual(b.host.dataset.skyState, 'active');
    b.update({ progress: 0.9 });
    b.update({ progress: 0.64 });
    assert.equal(
      b.host.dataset.skyState,
      'active',
      'the next crossing uses warm resources',
    );
  }
  b.destroy();
}

for (const phase of ['warmup', 'first-visible', 'after-warmup', 'active']) {
  const b = harness({ delayCompile: true });
  b.update({ progress: 0.3 });
  await settle();
  const renderer = b.stats.renderers[0];
  const canvas = b.host.children[0];
  let wakes = b.stats.wakes;
  if (phase === 'warmup') renderer.shaderErrorOnRender = true;
  if (phase === 'first-visible') b.suspend();
  b.compiled.resolve();
  await settle();
  if (phase !== 'warmup') {
    assert.equal(b.host.dataset.skyState, 'ready');
    assert.equal(b.stats.renders.length, phase === 'first-visible' ? 0 : 1);
    if (phase === 'active') {
      b.update({ progress: 0.6 });
      assert.equal(b.host.dataset.skyState, 'active');
    }
    wakes = b.stats.wakes;
    renderer.shaderErrorOnRender = true;
    b.update({ progress: 0.64, visible: true });
  }
  assert.equal(
    b.host.dataset.skyState,
    'fallback',
    `${phase}: a non-throwing shader error must never mark the frame ready/active`,
  );
  assert.match(b.debug(), /shader-failed/);
  assert.equal(
    b.stats.contexts,
    0,
    'shader failure releases the owned context',
  );
  assert.equal(b.host.children.length, 0, 'failed canvas is removed');
  assert.equal(canvas.style.visibility, 'hidden');
  assert.equal(
    b.stats.wakes,
    wakes + 1,
    'wake the master to restore DOM Breeze',
  );
  if (phase === 'warmup')
    assert.equal(
      renderer.clears,
      0,
      'failed warmup cannot clear a disposed renderer',
    );
  const renders = b.stats.renders.length;
  const imports = b.stats.imports;
  for (const progress of [0.4, 0.64, 0.95, 0.64]) b.update({ progress });
  await settle();
  assert.equal(
    b.stats.renders.length,
    renders,
    'shader failure stops future draws',
  );
  assert.equal(
    b.stats.imports,
    imports,
    'shader failure cannot trigger retries',
  );
  assert.equal(b.host.dataset.skyState, 'fallback');
  b.destroy();
}

for (const failure of ['initialization', 'setup', 'context', 'render']) {
  const b = harness({
    initFails: failure === 'initialization',
    setupFails: failure === 'setup',
  });
  b.update({ progress: 0.3 });
  await settle();
  if (failure === 'context') {
    let prevented = false;
    b.host.children[0].emit('webglcontextlost', {
      preventDefault() {
        prevented = true;
      },
    });
    assert.equal(prevented, true);
  }
  if (failure === 'render') {
    b.stats.renderers[0].failRender = true;
    b.update({ progress: 0.64 });
  }
  assert.equal(b.host.dataset.skyState, 'fallback');
  assert.equal(b.stats.contexts, 0);
  const imports = b.stats.imports;
  for (const progress of [0.4, 0.64, 0.95, 0.64]) b.update({ progress });
  await settle();
  assert.equal(
    b.stats.imports,
    imports,
    'failure cannot create a retry/context storm',
  );
  b.destroy();
}

{
  const b = harness({ delayImport: true });
  b.update({ progress: 0.3 });
  await settle();
  b.imported.reject(Error('Chunk unavailable'));
  await settle();
  assert.equal(
    b.host.dataset.skyState,
    'fallback',
    'failed lazy import preserves DOM fallback',
  );
  assert.equal(b.stats.contexts, 0);
  b.destroy();
}

{
  const b = harness({ delayCompile: true });
  b.update({ progress: 0.3 });
  await settle();
  b.host.children[0].emit('webglcontextlost', { preventDefault() {} });
  const wakes = b.stats.wakes;
  b.compiled.resolve();
  await settle();
  assert.equal(b.stats.contexts, 0);
  assert.equal(
    b.stats.renders.length,
    0,
    'late compilation cannot draw into a lost context',
  );
  assert.equal(
    b.stats.wakes,
    wakes,
    'context-loss generation invalidates compilation',
  );
  b.destroy();
}

for (let mount = 0; mount < 10; mount++) {
  const b = harness();
  b.update({ progress: 0.3 });
  await settle();
  b.update({ progress: 0.64 });
  b.destroy();
  const renders = b.stats.renders.length;
  b.update({ progress: 0.66 });
  assert.equal(
    b.stats.renders.length,
    renders,
    'destroyed route cannot paint again',
  );
}
assert.doesNotMatch(
  source,
  /requestAnimationFrame\s*\(|setInterval\s*\(|setTimeout\s*\(|Date\.now\s*\(|performance\.now\s*\(/,
);
console.log(
  'Atmospheric sky passed: deterministic depth, viewport coverage, one context, bounded warm-up, native-master rendering, dormant/reverse reuse, 20 crossings, late async/failure fallback and 10 complete route cleanups. Browser visual/performance QA remains separate.',
);
