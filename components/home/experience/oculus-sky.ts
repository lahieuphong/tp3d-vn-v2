import type * as Three from 'three';
import {
  ATRIUM_ORBIT_OCULUS,
  ATRIUM_ORBIT_SKY,
  oculusSkyBuffer,
  oculusSkyStep,
  type OculusSkyTier,
} from './atrium-orbit-sky';
import {
  oculusSkyFragmentShader,
  oculusSkyVertexShader,
} from './oculus-sky-shaders';

/** The oculus's living sky (owner request, 2026-10-10): a small Three.js
 * canvas that lies on the wide Atrium's plate, where its painted sky is, and
 * under the plate's own foreground (atrium-orbit-sky.ts). One shader on one
 * quad; no texture, model, light or render target.
 *
 * Like the atmosphere (atmospheric-sky-renderer.ts) it has no clock, timer,
 * observer or animation frame of its own: the story's one frame owner calls
 * `tick` while `wantsTime()` says the sky is on stage, and its time is
 * integrated from those timestamps, so a hidden tab or an oculus off stage
 * simply pauses it. It is an enhancement: until it is ready, and for good if
 * anything fails, the plate's painted sky is what shows.
 *
 * It shares the atmosphere's lazily loaded Three.js and holds one WebGL
 * context of its own, released when Home unmounts. */

type Library = Pick<
  typeof Three,
  | 'WebGLRenderer'
  | 'Scene'
  | 'Camera'
  | 'PlaneGeometry'
  | 'ShaderMaterial'
  | 'Mesh'
  | 'Color'
  | 'SRGBColorSpace'
  | 'NoToneMapping'
>;
type Resources = {
  renderer: Three.WebGLRenderer;
  scene: Three.Scene;
  camera: Three.Camera;
  geometry: Three.PlaneGeometry;
  material: Three.ShaderMaterial;
  canvas: HTMLCanvasElement;
};
export type OculusSkyState = 'idle' | 'loading' | 'ready' | 'failed';

/** `host` is the element the canvas fills (the controller places it on the
 * plate). `wake` asks the story for a frame, once, when the sky becomes
 * ready. `load` is the Three.js import, injectable for the checks. */
export function createOculusSky(
  host: HTMLElement,
  wake: () => void,
  load: () => Promise<Library> = () => import('three'),
) {
  let resources: Resources | null = null;
  let pending: Partial<Resources> = {};
  let state: OculusSkyState = 'idle';
  let disposed = false;
  let generation = 0;
  let shaderFailed = false;
  let tier: Exclude<OculusSkyTier, 'off'> = 'light';
  // On stage: the plate it lies on is shown and the Atrium is in view.
  let shown = false;
  let cssWidth = 0;
  let sizeSignature = '';
  // Sky time, integrated from the frame owner's timestamps.
  let time = 0;
  let lastNow: number | null = null;
  let lastDraw = -Infinity;
  // How present the canvas is over the painted sky (0 → 1).
  let presence = 0;
  let everShown = false;
  let draws = 0;

  const opacity = (value: number) => {
    const text = value >= 1 ? '1' : value <= 0 ? '0' : value.toFixed(3);
    if (host.style.opacity !== text) host.style.opacity = text;
  };
  const release = () => {
    pending.material?.dispose();
    pending.geometry?.dispose();
    if (pending.renderer) {
      pending.renderer.dispose();
      pending.renderer.forceContextLoss();
    }
    pending = {};
    const held = resources;
    resources = null;
    if (!held) return;
    held.canvas.removeEventListener('webglcontextlost', contextLost);
    held.canvas.removeEventListener('webglcontextrestored', contextLost);
    held.geometry.dispose();
    held.material.dispose();
    held.scene.clear();
    held.renderer.renderLists.dispose();
    held.renderer.dispose();
    held.renderer.forceContextLoss();
    held.canvas.remove();
  };
  /** For good, for this mount: the painted sky shows again. */
  const fail = () => {
    generation++;
    state = 'failed';
    lastNow = null;
    opacity(0);
    release();
    if (!disposed) wake();
  };
  function contextLost(event: Event) {
    event.preventDefault();
    if (!disposed) fail();
  }

  function resize() {
    if (!resources) return;
    const [width, height] = oculusSkyBuffer(
      cssWidth,
      window.devicePixelRatio || 1,
      tier,
    );
    const signature = `${width}/${height}/${tier}`;
    if (signature === sizeSignature) return;
    sizeSignature = signature;
    // The canvas's displayed size is the host's (CSS); only its buffer here.
    resources.renderer.setDrawingBufferSize(width, height, 1);
    resources.material.uniforms.uDetail.value =
      ATRIUM_ORBIT_SKY.tiers[tier].detail;
    lastDraw = -Infinity;
  }

  function draw(now: number) {
    const held = resources;
    if (!held) return false;
    held.material.uniforms.uTime.value = time;
    try {
      held.renderer.render(held.scene, held.camera);
    } catch {
      fail();
      return false;
    }
    if (disposed || resources !== held) return false;
    // Three reports a shader that does not link on first use, without
    // throwing: it is acted on here, outside its render.
    if (shaderFailed) {
      fail();
      return false;
    }
    lastDraw = now;
    draws++;
    return true;
  }

  async function prepare() {
    if (disposed || state !== 'idle') return;
    state = 'loading';
    const ticket = ++generation;
    try {
      // Named members only, so the bundler can drop the rest of Three.
      const {
        WebGLRenderer,
        Scene,
        Camera,
        PlaneGeometry,
        ShaderMaterial,
        Mesh,
        Color,
        SRGBColorSpace,
        NoToneMapping,
      } = await load();
      if (disposed || ticket !== generation) return;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText =
        'display:block;width:100%;height:100%;pointer-events:none;';
      const renderer = new WebGLRenderer({
        canvas,
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power',
        // A software context would draw this sky on the processor: there
        // the painted sky is the better one.
        failIfMajorPerformanceCaveat: true,
      });
      pending.renderer = renderer;
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = NoToneMapping;
      renderer.debug.onShaderError = () => {
        shaderFailed = true;
      };
      const [, , width, height] = ATRIUM_ORBIT_OCULUS.box;
      const geometry = new PlaneGeometry(2, 2);
      pending.geometry = geometry;
      const material = new ShaderMaterial({
        vertexShader: oculusSkyVertexShader,
        fragmentShader: oculusSkyFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uDetail: { value: ATRIUM_ORBIT_SKY.tiers[tier].detail },
          uAspect: { value: width / height },
          uSpan: { value: ATRIUM_ORBIT_SKY.span },
          uPitch: { value: (ATRIUM_ORBIT_SKY.pitch * Math.PI) / 180 },
          uCover: { value: ATRIUM_ORBIT_SKY.cover },
          // Declared in sRGB; Three converts a Color to linear and the
          // shader's colorspace chunk converts once on the way out.
          uZenith: { value: new Color(ATRIUM_ORBIT_SKY.zenith) },
          uHorizon: { value: new Color(ATRIUM_ORBIT_SKY.horizon) },
          uLight: { value: new Color(ATRIUM_ORBIT_SKY.light) },
          uShade: { value: new Color(ATRIUM_ORBIT_SKY.shade) },
        },
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      pending.material = material;
      const scene = new Scene();
      const mesh = new Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);
      // The quad is drawn in clip space: the camera is never looked through.
      const camera = new Camera();
      resources = { renderer, scene, camera, geometry, material, canvas };
      pending = {};
      canvas.addEventListener('webglcontextlost', contextLost);
      canvas.addEventListener('webglcontextrestored', contextLost);
      opacity(0);
      host.appendChild(canvas);
      resize();
      await renderer.compileAsync(scene, camera);
      if (disposed || ticket !== generation || !resources) return;
      // One frame before it is ever seen, so the first shown one is whole.
      if (!draw(-Infinity)) return;
      state = 'ready';
      // Ready before the Atrium came into view: simply there. Ready after:
      // it comes in softly over the painted sky (tick).
      if (!everShown) presence = 1;
      opacity(shown ? presence : 0);
      wake();
    } catch {
      if (!disposed && ticket === generation) fail();
    }
  }

  return {
    state: () => state,
    /** Start getting ready (idempotent). `quality` is the screen's tier. */
    prepare(quality: Exclude<OculusSkyTier, 'off'>) {
      tier = quality;
      void prepare();
    },
    /** Each story frame: is the sky on stage, and how wide is it drawn
     * (CSS px)? Off stage its clock stops. */
    place(on: boolean, width: number, quality: Exclude<OculusSkyTier, 'off'>) {
      if (disposed) return;
      tier = quality;
      cssWidth = Math.max(1, width);
      if (on) everShown = true;
      if (on === shown) {
        if (on) resize();
        return;
      }
      shown = on;
      lastNow = null;
      if (state !== 'ready') return;
      if (on) resize();
      opacity(on ? presence : 0);
    },
    /** A frame from the story's frame owner. */
    tick(now: number) {
      if (disposed || state !== 'ready' || !shown) {
        lastNow = null;
        return;
      }
      const elapsed = lastNow === null ? 0 : now - lastNow;
      lastNow = now;
      time += oculusSkyStep(elapsed);
      if (presence < 1) {
        presence = Math.min(
          1,
          presence +
            Math.min(elapsed, ATRIUM_ORBIT_SKY.maxStepMs) /
              ATRIUM_ORBIT_SKY.fadeMs,
        );
        opacity(presence);
      }
      // The air moves slowly: a frame of sky only every so often.
      if (now - lastDraw >= ATRIUM_ORBIT_SKY.tiers[tier].frameMs - 1) draw(now);
    },
    /** True only while the drawn sky is on stage. */
    wantsTime: () => !disposed && state === 'ready' && shown,
    /** Hidden tab: the clock stops; nothing is released. */
    suspend() {
      lastNow = null;
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      generation++;
      release();
      host.style.removeProperty('opacity');
    },
    debug: () =>
      `oculus sky ${state}/${tier} ${shown ? 'on' : 'off'} · ${time.toFixed(1)}s · draws ${draws} · presence ${presence.toFixed(2)}`,
  };
}
