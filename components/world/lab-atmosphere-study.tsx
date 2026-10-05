'use client';
import { useEffect, useRef, useState } from 'react';
import { useMotionCapability } from '@/hooks/use-motion-capability';
import {
  readMotionCapability,
  subscribeMotionCapability,
  type MotionCapability,
} from '@/lib/motion/capability';
import type { LabAtmosphereBand } from './lab-atmosphere-adapter';

type Adapter = typeof import('./lab-atmosphere-adapter');
type Bridge = ReturnType<Adapter['createAtmosphericSkyBridge']>;

/** Every state of the study is shown as text. */
type Phase =
  | 'static'
  | 'preparing'
  | 'live'
  | 'reduced'
  | 'save-data'
  | 'fallback';

const STATUS: Record<Phase, string> = {
  static: 'Static study',
  preparing: 'Preparing live study',
  live: 'Live study',
  reduced: 'Static study / Reduced motion',
  'save-data': 'Static study / Save-Data',
  fallback: 'Static fallback',
};

/** The study holds ambient time still: it never calls tick(), and every
 * update carries this one timestamp, so the renderer integrates no air
 * between frames and a range position always draws the same frame. */
const LAB_CLOCK = 0;

type Study = {
  adapter: Adapter;
  bridge: Bridge;
  host: HTMLElement;
  field: HTMLElement;
  capability: MotionCapability;
  /** The range position, 0–1. The only narrative state. */
  value: number;
  /** The one pending animation frame, or 0. */
  frame: number;
  detach: () => void;
};

/** TP3D PASS 14 — EX–01 Atmosphere. The static field is complete on its
 * own. Only LOAD LIVE STUDY loads the production atmosphere (its renderer,
 * then Three.js): never mount, scroll, viewport entry, hover, focus or a
 * timer. One live instance at most; STOP, leaving the page or a reduced
 * motion request destroys it (canvas, renderer resources, WebGL context).
 * Frames are painted on demand, one at a time, and nothing runs at rest. */
export function LabAtmosphereStudy() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLOutputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const studyRef = useRef<Study | null>(null);
  /** Each activation's ticket. Stopping or unmounting advances it, so a late
   * import or shader compile can never bring a study back. */
  const ticketRef = useRef(0);
  const phaseRef = useRef<Phase>('static');
  const bandRef = useRef<LabAtmosphereBand>('Air');
  // null during SSR and hydration: the static study renders first, and the
  // toggle appears only once the capability is known.
  const capability = useMotionCapability();
  const [phase, setPhaseState] = useState<Phase>('static');
  const [band, setBandState] = useState<LabAtmosphereBand>('Air');

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  /** Release everything one activation created. */
  const stop = () => {
    ticketRef.current++;
    const study = studyRef.current;
    studyRef.current = null;
    if (!study) return;
    cancelAnimationFrame(study.frame);
    study.detach();
    study.bridge.destroy();
    delete study.field.dataset.ground;
  };

  /** The static study again, without the control when none applies. */
  const settle = (next: Phase) => {
    const hadFocus = document.activeElement === buttonRef.current;
    setPhase(next);
    if (hadFocus && next !== 'static') statusRef.current?.focus();
  };

  /** One production update for the current range position and size. */
  const paint = (study: Study) => {
    const { adapter, bridge, host, field, capability } = study;
    const progress = adapter.labAtmosphereProgress(study.value);
    bridge.update({
      progress,
      width: host.clientWidth,
      height: host.clientHeight,
      reduced: capability.reduced,
      fine: capability.finePointer,
      visible: document.visibilityState === 'visible',
      // The study's ground is CSS: it is ready from the first paint.
      sceneReady: true,
      saveData: capability.saveData,
      now: LAB_CLOCK,
    });
    field.dataset.ground = adapter.labAtmosphereGround(progress);
    const next = adapter.labAtmosphereBand(progress);
    if (next !== bandRef.current) {
      bandRef.current = next;
      setBandState(next);
    }
    // The renderer reports its state on the host it was given. Its own
    // capability tiers decide: a fallback tier never creates WebGL (and
    // also reports the fallback state, so the tier is read first).
    const state = host.dataset.skyState;
    const tierFallback = host.dataset.skyTier === 'fallback';
    if (tierFallback || state === 'fallback') {
      stop();
      // A reduced-motion request shows as such from the capability itself.
      settle(
        !tierFallback
          ? 'fallback'
          : capability.reduced
            ? 'static'
            : 'save-data',
      );
    } else if (
      (state === 'ready' || state === 'active') &&
      phaseRef.current !== 'live'
    )
      setPhase('live');
  };

  /** At most one pending frame: it paints once and schedules nothing. */
  const schedule = (study: Study) => {
    if (study.frame || studyRef.current !== study) return;
    study.frame = requestAnimationFrame(() => {
      study.frame = 0;
      if (studyRef.current === study) paint(study);
    });
  };

  /** LOAD LIVE STUDY: the only path to the production atmosphere. */
  const activate = async () => {
    if (studyRef.current || phaseRef.current !== 'static') return;
    const capability = readMotionCapability();
    if (capability.reduced) return;
    const ticket = ++ticketRef.current;
    setPhase('preparing');
    let adapter: Adapter;
    try {
      adapter = await import('./lab-atmosphere-adapter');
    } catch {
      if (ticket === ticketRef.current) settle('fallback');
      return;
    }
    const host = hostRef.current;
    const field = fieldRef.current;
    if (ticket !== ticketRef.current || !host || !field) return;
    const study: Study = {
      adapter,
      host,
      field,
      capability,
      value: 0,
      frame: 0,
      detach: () => {},
      // The renderer asks for a paint only later, after its async warm-up.
      bridge: adapter.createAtmosphericSkyBridge(host, () => schedule(study)),
    };
    studyRef.current = study;
    const resize = () => schedule(study);
    const visibility = () =>
      document.hidden ? study.bridge.suspend() : schedule(study);
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    study.detach = () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
    };
    paint(study);
  };

  /** One toggle that keeps focus through load, cancel and stop. */
  const toggle = () => {
    if (phaseRef.current === 'static') void activate();
    else {
      stop();
      setPhase('static');
    }
  };

  useEffect(() => {
    // The preference is read live: a reduced-motion request ends a live study
    // at once and keeps the static field; other changes repaint it.
    const unsubscribe = subscribeMotionCapability(() => {
      const next = readMotionCapability();
      const study = studyRef.current;
      if (next.reduced) {
        stop();
        if (phaseRef.current !== 'fallback') setPhase('static');
      } else if (study) {
        study.capability = next;
        schedule(study);
      }
    });
    return () => {
      unsubscribe();
      stop();
    };
    // Mount and unmount only: every handler reads refs.
  }, []);

  const shown: Phase =
    capability?.reduced && phase !== 'fallback' ? 'reduced' : phase;
  const controllable =
    shown === 'static' || shown === 'preparing' || shown === 'live';
  return (
    <div className="wlab-study">
      <div
        ref={fieldRef}
        className="wlab-field"
        data-lab-atmosphere=""
        data-phase={shown}
      >
        {/* The static study: the three states of the crossing, in the
            colours the production atmosphere draws. */}
        <div className="wlab-palette" aria-hidden="true">
          <span className="wlab-tone" data-tone="air">
            <span>Air</span>
          </span>
          <span className="wlab-tone" data-tone="cloud">
            <span>Cloud</span>
          </span>
          <span className="wlab-tone" data-tone="sky">
            <span>Open sky</span>
          </span>
        </div>
        {/* The production renderer appends its one decorative canvas here. */}
        <div ref={hostRef} className="wlab-host" aria-hidden="true" />
      </div>
      <div className="wlab-controls">
        <output
          ref={statusRef}
          className="wlab-status"
          tabIndex={-1}
          data-lab-status={shown}
        >
          {STATUS[shown]}
        </output>
        {capability && controllable && (
          <button
            ref={buttonRef}
            type="button"
            className="wlab-toggle"
            onClick={toggle}
          >
            {shown === 'static' ? 'Load live study' : 'Stop live study'}
          </button>
        )}
        {shown === 'live' && (
          <div className="wlab-range">
            <p className="wlab-range-label">
              <label htmlFor="wlab-atmosphere-range">Threshold progress</label>
              <span className="wlab-band">{band}</span>
            </p>
            <input
              id="wlab-atmosphere-range"
              type="range"
              min={0}
              max={100}
              step={1}
              defaultValue={0}
              aria-valuetext={band}
              onChange={(event) => {
                const study = studyRef.current;
                if (!study) return;
                study.value = Number(event.currentTarget.value) / 100;
                schedule(study);
              }}
            />
            <span className="wlab-scale" aria-hidden="true">
              <span>Air</span>
              <span>Cloud</span>
              <span>Open sky</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
