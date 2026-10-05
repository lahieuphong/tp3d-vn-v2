import { createAtmosphericSkyBridge } from '@/components/home/experience/atmospheric-sky-renderer';
import {
  atmosphericSkyFrame,
  SKY_BRIDGE,
} from '@/components/home/experience/atmospheric-sky-frame';
import { bridgeTiming } from '@/components/home/experience/atmospheric-bridge-frame';

/** TP3D PASS 14 — the Lab's Atmosphere study, loaded only after LOAD LIVE
 * STUDY. It adds no renderer, shader or timeline of its own: it hands the
 * production atmosphere (`createAtmosphericSkyBridge`) to the study and maps
 * the study's range into the production progress domain. Everything here is
 * a pure function of the range position, so any path to a position — slow,
 * fast, forwards or back — samples the same narrative frame. */
export { createAtmosphericSkyBridge };

/** Keeps the range strictly inside the renderer's active window, where it
 * draws (`activeStart < progress < activeEnd`). */
const INSET = 0.001;

/** The range (0–1) → master story progress. The low end sits before cloud
 * formation, below `SKY_BRIDGE.armBefore`, so a renderer that finishes
 * warming there may take over invisibly (the production arming rule); the
 * high end is the open sky, just before the window closes. */
export function labAtmosphereProgress(value: number) {
  const t = Math.max(0, Math.min(1, value));
  const local =
    SKY_BRIDGE.activeStart +
    INSET +
    (SKY_BRIDGE.activeEnd - SKY_BRIDGE.activeStart - 2 * INSET) * t;
  return SKY_BRIDGE.start + (SKY_BRIDGE.end - SKY_BRIDGE.start) * local;
}

/** What lies under the canvas. On the homepage the DOM bridge changes worlds
 * at `bridgeTiming.swap`, while the atmosphere covers every pixel; the study
 * changes its own ground at the same position: the air before, the open sky
 * after (the sky the atmosphere's opening reveals). */
export const labAtmosphereGround = (progress: number) =>
  progress >= bridgeTiming.swap ? 'sky' : 'air';

export type LabAtmosphereBand = 'Air' | 'Cloud' | 'Open sky';

/** A plain-language name for the frame at this position, read from the
 * production frame itself: the opening, cloud density and sky coverage. */
export function labAtmosphereBand(progress: number): LabAtmosphereBand {
  const frame = atmosphericSkyFrame(progress);
  if (frame.opening >= 0.5) return 'Open sky';
  return frame.density >= 0.25 || frame.skyCover >= 0.5 ? 'Cloud' : 'Air';
}
