/** Scene modules belong behind these dynamic import functions. Never import Three.js here at module scope. */
export type SceneSelection = { kind: 'product' | 'material'; slug: string };
export interface SceneHandle {
  /** Must free geometry, materials, textures, render targets, renderer, controls and listeners. */
  dispose(): void;
  setPaused?(paused: boolean): void;
}
export interface SceneContext {
  host: HTMLElement;
  signal: AbortSignal;
  onSelect: (selection: SceneSelection) => void;
}
export type SceneFactory = (
  context: SceneContext,
) => SceneHandle | Promise<SceneHandle>;
export type SceneModule = { createScene: SceneFactory };
// Add future rooms as: 'walnut-living': () => import('./scenes/walnut-living').
// Three.js is intentionally not installed or loaded for the placeholder experience.
const registry: Record<string, () => Promise<SceneModule>> = {};
export async function loadSceneModule(
  roomId: string,
): Promise<SceneModule | null> {
  const load = registry[roomId];
  return load ? load() : null;
}
