import type * as Three from 'three';
import {
  advanceAmbient,
  ambientStep,
  atmosphericSkyFrame,
  createAmbient,
  SKY_BRIDGE,
  SKY_TIERS,
  skyPixelRatio,
  skyTier,
  type AmbientState,
  type AtmosphericSkyFrame,
  type SkyTier,
} from './atmospheric-sky-frame';
import {
  skyVertexShader,
  skyFragmentShader,
  cloudFragmentShader,
} from './atmospheric-sky-shaders';

export type AtmosphericSkyInput = {
  progress: number;
  width: number;
  height: number;
  reduced: boolean;
  fine: boolean;
  visible: boolean;
  sceneReady: boolean;
  saveData: boolean;
  /** The master's frame timestamp. Only ambient micro motion consumes it. */
  now: number;
};

type SkyState =
  | 'idle'
  | 'loading'
  | 'warming'
  | 'ready'
  | 'active'
  | 'fallback';
type Uniforms = Record<string, { value: number | Three.Color | Three.Vector2 }>;
type Library = Pick<
  typeof Three,
  | 'WebGLRenderer'
  | 'Scene'
  | 'PerspectiveCamera'
  | 'PlaneGeometry'
  | 'ShaderMaterial'
  | 'Mesh'
  | 'Color'
  | 'Vector2'
  | 'SRGBColorSpace'
  | 'NoToneMapping'
>;
type Cloud = {
  mesh: Three.Mesh<Three.PlaneGeometry, Three.ShaderMaterial>;
  material: Three.ShaderMaterial;
  z: number;
  velocity: number;
  entry: number;
};
type Resources = {
  renderer: Three.WebGLRenderer;
  scene: Three.Scene;
  camera: Three.PerspectiveCamera;
  geometry: Three.PlaneGeometry;
  sky: Three.Mesh<Three.PlaneGeometry, Three.ShaderMaterial>;
  clouds: Cloud[];
  canvas: HTMLCanvasElement;
};

const unit = (value: number) => Math.max(0, Math.min(1, value));
const smoothRange = (value: number, start: number, end: number) => {
  const t = unit((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

/** Decorative enhancement with no independent RAF, timer, clock, resize
 * observer or document listener. The HomeStory owner supplies every render,
 * timestamp and lifecycle signal. Failed/late preparation keeps the complete
 * existing DOM bridge. */
export function createAtmosphericSkyBridge(
  host: HTMLElement,
  requestPaint: () => void,
) {
  let latest: AtmosphericSkyInput = {
    progress: 0,
    width: 1,
    height: 1,
    reduced: false,
    fine: false,
    visible: false,
    sceneReady: false,
    saveData: false,
    now: 0,
  };
  let resources: Resources | null = null;
  let pendingRenderer: Three.WebGLRenderer | null = null;
  let pendingGeometry: Three.PlaneGeometry | null = null;
  let pendingMaterials: Three.ShaderMaterial[] = [];
  let library: Library | null = null;
  let state: SkyState = 'idle';
  let tier: SkyTier = 'fallback';
  let disposed = false;
  let failed = false;
  let loading = false;
  let ready = false;
  let armed = false;
  let generation = 0;
  let sizeSignature = '';
  let frameSignature = '';
  let renderCount = 0;
  let reason = '';
  // Ambient life: advanced only while the atmosphere is on screen, from the
  // master's timestamps. Narrative position never depends on it.
  let ambient: AmbientState = createAmbient();
  let lastNow: number | null = null;
  let lastDraw = -Infinity;
  let ambientPending = false;
  const originalState = host.getAttribute('data-sky-state');
  const originalTier = host.getAttribute('data-sky-tier');

  const setState = (next: SkyState) => {
    state = next;
    if (host.dataset.skyState !== next) host.dataset.skyState = next;
  };
  const hide = (next: SkyState) => {
    if (resources) resources.canvas.style.visibility = 'hidden';
    frameSignature = '';
    setState(next);
  };
  const release = () => {
    // Dispose partial construction too, if setup fails after context creation.
    for (const material of pendingMaterials) material.dispose();
    pendingMaterials = [];
    pendingGeometry?.dispose();
    pendingGeometry = null;
    if (pendingRenderer) {
      pendingRenderer.dispose();
      pendingRenderer.forceContextLoss();
      pendingRenderer = null;
    }
    const held = resources;
    resources = null;
    if (!held) return;
    held.canvas.removeEventListener('webglcontextlost', contextLost);
    held.canvas.removeEventListener('webglcontextrestored', contextRestored);
    held.geometry.dispose();
    held.sky.material.dispose();
    for (const cloud of held.clouds) cloud.material.dispose();
    held.scene.clear();
    held.renderer.renderLists.dispose();
    held.renderer.dispose();
    held.renderer.forceContextLoss();
    held.canvas.remove();
  };
  const fallback = (why: string) => {
    failed = true;
    loading = false;
    ready = false;
    armed = false;
    lastNow = null;
    reason = why;
    generation++;
    hide('fallback');
    release();
    if (!disposed) requestPaint();
  };
  function contextLost(event: Event) {
    event.preventDefault();
    // Do not create another context or expose a stale transparent/black frame.
    // The master restores DOM Breeze on its next scheduled paint.
    fallback('context-lost');
  }
  function contextRestored() {
    // Loss opts into the stable DOM fallback for this mounted story.
    // A later Home mount may try a fresh single context.
    if (!disposed) fallback('context-restored-fallback');
  }
  const profile = () => (tier === 'fallback' ? null : SKY_TIERS[tier]);

  function resize() {
    const quality = profile();
    if (!resources || !quality || tier === 'fallback') return;
    const { width, height } = latest;
    const pixelRatio = skyPixelRatio(
      width,
      height,
      window.devicePixelRatio || 1,
      tier,
    );
    const signature = `${width}/${height}/${pixelRatio.toFixed(3)}/${tier}`;
    if (signature === sizeSignature) return;
    sizeSignature = signature;
    const { renderer, camera, sky, clouds } = resources;
    renderer.setDrawingBufferSize(width, height, pixelRatio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // Fixed world dimensions for each viewport. During scroll only camera Z
    // changes, so cloud banks actually enlarge with perspective travel.
    const tangent = Math.tan((camera.fov * Math.PI) / 360);
    for (const cloud of clouds) {
      const planeHeight =
        2 * tangent * (SKY_BRIDGE.cameraStart - cloud.z) * 1.38;
      const planeWidth = planeHeight * camera.aspect;
      cloud.mesh.scale.set(planeWidth, planeHeight, 1);
      const u = cloud.material.uniforms;
      (u.uPlaneSize.value as Three.Vector2).set(planeWidth, planeHeight);
      u.uOctaves.value = quality.octaves;
      u.uMorph.value = quality.morph;
      (u.uResolution.value as Three.Vector2).set(
        Math.floor(width * pixelRatio),
        Math.floor(height * pixelRatio),
      );
    }
    const skyHeight = 2 * tangent * (SKY_BRIDGE.cameraStart + 36) * 1.12;
    sky.scale.set(skyHeight * camera.aspect, skyHeight, 1);
    sky.material.uniforms.uAspect.value = camera.aspect;
    sky.material.uniforms.uOctaves.value = quality.octaves;
    (sky.material.uniforms.uResolution.value as Three.Vector2).set(
      Math.floor(width * pixelRatio),
      Math.floor(height * pixelRatio),
    );
    frameSignature = '';
  }

  function uniforms(seed = 0): Uniforms {
    const { Color, Vector2 } = library!;
    return {
      uDensity: { value: 0 },
      uInside: { value: 0 },
      uSkyMix: { value: 0 },
      uSkyCover: { value: 0 },
      uPatches: { value: 0 },
      uOpening: { value: 0 },
      uDrift: { value: 0 },
      uOpacity: { value: 0 },
      uNear: { value: 0 },
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uBreath: { value: 0 },
      uOctaves: { value: 2 },
      uSeed: { value: seed },
      uAspect: { value: 1 },
      uFlow: { value: new Vector2(0, 0) },
      uSkyFlow: { value: new Vector2(0, 0) },
      uPlaneSize: { value: new Vector2(1, 1) },
      uResolution: { value: new Vector2(1, 1) },
      // Colours are declared in sRGB and Three converts Color to linear. The
      // shader's colorspace chunk performs exactly one output conversion.
      // Sky values were measured in the Atrium plate's actual oculus crop
      // (blue sky #b0c3e0 overhead → #c4d5ea at the rim, clouds #eef0f3,
      // cloud shade #cdd6e4); ivory belongs to the departing Scene 2.
      uSkyUpper: { value: new Color('#b0c3e0') },
      uSkyLower: { value: new Color('#c2d3e9') },
      uIvory: { value: new Color('#eee8dc') },
      uDaylight: { value: new Color('#eef0f3') },
      uShadow: { value: new Color('#cdd6e4') },
    };
  }

  function draw(held: Resources) {
    held.renderer.render(held.scene, held.camera);
    if (disposed || failed || resources !== held) return false;
    // Three can report a shader link failure on first use without throwing.
    // Dispose only after render() returns, before exposing or accepting it.
    if (reason === 'shader-failed') {
      fallback(reason);
      return false;
    }
    renderCount++;
    return true;
  }

  /** Whether this narrative frame may be drawn at all. */
  function drawable(frame: AtmosphericSkyFrame) {
    return (
      !!resources &&
      ready &&
      armed &&
      tier !== 'fallback' &&
      latest.visible &&
      latest.sceneReady &&
      !latest.reduced &&
      frame.active
    );
  }

  /** Integrate ambient time from the master's timestamp. Outside the living
   * atmosphere the clock simply pauses; re-entry resumes without a jump. */
  function advance(now: number, frame: AtmosphericSkyFrame) {
    const quality = profile();
    if (!quality || !drawable(frame) || frame.life <= 0) {
      lastNow = null;
      return;
    }
    const seconds = lastNow === null ? 0 : ambientStep(now - lastNow);
    lastNow = now;
    if (!seconds || !resources) return;
    const { camera, clouds } = resources;
    const tangent = Math.tan((camera.fov * Math.PI) / 360);
    // Each bank drifts at an apparent screen speed: its visible height in its
    // own noise domain shrinks as the lens approaches it.
    const spans = clouds.map(
      (cloud) =>
        2 *
        tangent *
        Math.max(0.45, camera.position.z - cloud.mesh.position.z) *
        0.22,
    );
    ambient = advanceAmbient(
      ambient,
      seconds,
      frame.life * quality.life,
      spans,
    );
    ambientPending = true;
  }

  function paint(now: number) {
    if (disposed) return;
    const frame = atmosphericSkyFrame(latest.progress);
    // A shader that finishes compiling inside a visible crossing must not
    // suddenly cover the DOM bridge. It may arm while every plane is still
    // transparent (before cloud formation) or outside the active range.
    if (ready && (!frame.active || frame.progress < SKY_BRIDGE.armBefore))
      armed = true;
    if (!drawable(frame)) {
      hide(
        failed || tier === 'fallback' ? 'fallback' : ready ? 'ready' : state,
      );
      return;
    }
    resize();
    const quality = profile()!;
    const signature = `${latest.progress.toFixed(6)}/${sizeSignature}`;
    // Scroll/resize changes draw at once. Ambient-only frames are throttled:
    // the air moves slowly enough that ~24–30 fps is indistinguishable.
    const narrative = signature !== frameSignature;
    if (
      !narrative &&
      !(ambientPending && now - lastDraw >= quality.ambientFrameMs - 1)
    )
      return;
    frameSignature = signature;
    const held = resources!;
    const { camera, sky, clouds, canvas } = held;
    // Camera position is scroll-owned. Time never moves the lens.
    camera.position.set(frame.cameraX, frame.cameraY, frame.cameraZ);
    camera.updateMatrixWorld();
    const setFrame = (material: Three.ShaderMaterial) => {
      const u = material.uniforms;
      u.uDensity.value = frame.density;
      u.uInside.value = frame.inside;
      u.uSkyMix.value = frame.skyMix;
      u.uSkyCover.value = frame.skyCover;
      u.uPatches.value = frame.patches;
      u.uOpening.value = frame.opening;
      u.uDrift.value = frame.drift;
      u.uTime.value = ambient.time;
      u.uBreath.value = frame.life * quality.life;
      (u.uSkyFlow.value as Three.Vector2).set(...ambient.sky);
    };
    setFrame(sky.material);
    (sky.material.uniforms.uFlow.value as Three.Vector2).set(...ambient.sky);
    for (const [index, cloud] of clouds.entries()) {
      setFrame(cloud.material);
      (cloud.material.uniforms.uFlow.value as Three.Vector2).set(
        ...ambient.planes[index],
      );
      // Modest spatial separation increases depth differential without weather
      // drifting across the screen. Planes fade as the lens passes their Z.
      cloud.mesh.position.z = cloud.z + frame.progress * cloud.velocity;
      const distance = camera.position.z - cloud.mesh.position.z;
      const entry = smoothRange(
        frame.progress,
        cloud.entry,
        cloud.entry + 0.17,
      );
      cloud.material.uniforms.uOpacity.value =
        entry * smoothRange(distance, 0.45, 2.7) * 0.82;
      cloud.material.uniforms.uNear.value = 1 - smoothRange(distance, 2.5, 8);
      cloud.mesh.visible =
        distance > 0.45 &&
        (quality.clouds as readonly number[]).includes(index);
    }
    try {
      if (!draw(held)) return;
      lastDraw = now;
      ambientPending = false;
      canvas.style.visibility = 'visible';
      setState('active');
    } catch {
      fallback('render-failed');
    }
  }

  async function prepare() {
    if (disposed || failed || loading || resources || tier === 'fallback')
      return;
    loading = true;
    setState('loading');
    const ticket = ++generation;
    try {
      // Named members only, so the bundler can drop the rest of Three.
      const {
        WebGLRenderer,
        Scene,
        PerspectiveCamera,
        PlaneGeometry,
        ShaderMaterial,
        Mesh,
        Color,
        Vector2,
        SRGBColorSpace,
        NoToneMapping,
      } = await import('three');
      if (disposed || failed || ticket !== generation) return;
      loading = false;
      // A resize/reduced-motion switch during import must not create WebGL.
      if (
        skyTier(latest.width, latest.fine, latest.reduced, latest.saveData) ===
          'fallback' ||
        !latest.visible
      ) {
        setState('idle');
        return;
      }
      library = {
        WebGLRenderer,
        Scene,
        PerspectiveCamera,
        PlaneGeometry,
        ShaderMaterial,
        Mesh,
        Color,
        Vector2,
        SRGBColorSpace,
        NoToneMapping,
      };
      const canvas = document.createElement('canvas');
      canvas.className = 'atmospheric-sky-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText =
        'display:block;width:100%;height:100%;pointer-events:none;visibility:hidden;';
      const renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: true,
      });
      pendingRenderer = renderer;
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = NoToneMapping;
      renderer.setClearColor(0x000000, 0);
      renderer.debug.onShaderError = () => {
        // Record the failure; draw() handles disposal outside Three's render.
        reason = 'shader-failed';
      };
      const scene = new Scene();
      const camera = new PerspectiveCamera(48, 1, 0.08, 80);
      camera.position.z = SKY_BRIDGE.cameraStart;
      const geometry = new PlaneGeometry(1, 1);
      pendingGeometry = geometry;
      const makeMaterial = (fragmentShader: string, seed = 0) => {
        const material = new ShaderMaterial({
          vertexShader: skyVertexShader,
          fragmentShader,
          uniforms: uniforms(seed),
          transparent: true,
          premultipliedAlpha: true,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
        });
        pendingMaterials.push(material);
        return material;
      };
      const sky = new Mesh(geometry, makeMaterial(skyFragmentShader));
      sky.position.z = -36;
      sky.renderOrder = 0;
      sky.frustumCulled = false;
      scene.add(sky);
      // Far, mid and near banks. Allocation is fixed; tiers only hide meshes.
      const clouds = [
        { z: -1.25, velocity: 0.12, entry: 0.07 },
        { z: 1.15, velocity: 0.2, entry: 0.18 },
        { z: 3.2, velocity: 0.3, entry: 0.27 },
      ].map((specification, index) => {
        const material = makeMaterial(cloudFragmentShader, index + 0.7);
        const mesh = new Mesh(geometry, material);
        mesh.position.z = specification.z;
        mesh.renderOrder = index + 1;
        mesh.frustumCulled = false;
        mesh.visible = (
          (profile()?.clouds ?? []) as readonly number[]
        ).includes(index);
        scene.add(mesh);
        return { ...specification, mesh, material };
      });
      resources = { renderer, scene, camera, geometry, sky, clouds, canvas };
      pendingRenderer = null;
      pendingGeometry = null;
      pendingMaterials = [];
      canvas.addEventListener('webglcontextlost', contextLost);
      canvas.addEventListener('webglcontextrestored', contextRestored);
      host.appendChild(canvas);
      resize();
      setState('warming');
      // One prewarm before the visible range. No render target, texture or
      // repeated shader creation is needed on reverse scroll.
      await renderer.compileAsync(scene, camera);
      if (disposed || failed || ticket !== generation || !resources) return;
      if (reason === 'shader-failed') {
        fallback(reason);
        return;
      }
      if (
        latest.visible &&
        skyTier(latest.width, latest.fine, latest.reduced, latest.saveData) !==
          'fallback'
      ) {
        if (!draw(resources)) return;
        renderer.clear();
      }
      ready = true;
      const frame = atmosphericSkyFrame(latest.progress);
      armed = !frame.active || frame.progress < SKY_BRIDGE.armBefore;
      setState('ready');
      requestPaint();
    } catch {
      if (!disposed && ticket === generation) fallback('initialization-failed');
    }
  }

  return {
    update(input: AtmosphericSkyInput) {
      if (disposed) return;
      latest = {
        ...input,
        width: Math.max(1, input.width),
        height: Math.max(1, input.height),
      };
      tier = skyTier(
        latest.width,
        latest.fine,
        latest.reduced,
        latest.saveData,
      );
      if (host.dataset.skyTier !== tier) host.dataset.skyTier = tier;
      if (
        !failed &&
        tier !== 'fallback' &&
        latest.visible &&
        input.progress >= SKY_BRIDGE.preload
      )
        void prepare();
      advance(latest.now, atmosphericSkyFrame(latest.progress));
      paint(latest.now);
    },
    /** Ambient-only frame: time advances, the narrative frame does not. */
    tick(now: number) {
      if (disposed) return;
      latest = { ...latest, now };
      advance(now, atmosphericSkyFrame(latest.progress));
      paint(now);
    },
    /** True only while the drawn atmosphere is alive on screen. */
    wantsTime() {
      if (disposed || !profile()) return false;
      const frame = atmosphericSkyFrame(latest.progress);
      return drawable(frame) && frame.life > 0;
    },
    suspend() {
      latest.visible = false;
      lastNow = null;
      hide(
        failed || tier === 'fallback' ? 'fallback' : ready ? 'ready' : state,
      );
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      generation++;
      ready = false;
      armed = false;
      lastNow = null;
      release();
      library = null;
      if (originalState === null) host.removeAttribute('data-sky-state');
      else host.setAttribute('data-sky-state', originalState);
      if (originalTier === null) host.removeAttribute('data-sky-tier');
      else host.setAttribute('data-sky-tier', originalTier);
    },
    debug() {
      const frame = atmosphericSkyFrame(latest.progress);
      const info = resources?.renderer.info;
      const alive = drawable(frame) && frame.life > 0;
      return `sky ${frame.progress.toFixed(3)} ${state}/${tier} z ${frame.cameraZ.toFixed(2)} density ${frame.density.toFixed(2)} mix ${frame.skyMix.toFixed(2)} open ${frame.opening.toFixed(2)} · uTime ${alive ? 'on' : 'off'} ${ambient.time.toFixed(1)}s life ${frame.life.toFixed(2)} · canvas ${state === 'active' ? 1 : 0} planes ${state === 'active' ? (info?.render.calls ?? 0) : 0} renders ${renderCount} geometry ${info?.memory.geometries ?? 0} textures ${info?.memory.textures ?? 0}${reason ? ` ${reason}` : ''}${ready && !armed ? ' crossing-fallback' : ''}`;
    },
  };
}
