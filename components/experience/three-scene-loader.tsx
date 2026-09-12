'use client';
import { useEffect, useRef, useState } from 'react';
import { LoadingScreen } from './loading-screen';
import { SceneFallback } from './scene-fallback';
import type { SceneHandle, SceneSelection } from './scene-registry';
export default function ThreeSceneLoader({
  roomId,
  slug,
  onSelect,
}: {
  roomId: string;
  slug: string;
  onSelect: (selection: SceneSelection) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'preview' | 'error'
  >('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let handle: SceneHandle | undefined;
    const dispose = () => {
      handle?.dispose();
      handle = undefined;
    };
    const visibility = () => handle?.setPaused?.(document.hidden);
    const pageHide = () => {
      controller.abort();
      dispose();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      controller.abort();
      dispose();
      setStatus('error');
    };
    const restorePage = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setStatus('loading');
        setAttempt((v) => v + 1);
      }
    };
    const element = host.current;
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pageHide);
    window.addEventListener('pageshow', restorePage);
    element?.addEventListener('webglcontextlost', contextLost, true);
    void (async () => {
      try {
        const { loadSceneModule } = await import('./scene-registry');
        const sceneModule = await loadSceneModule(roomId);
        if (controller.signal.aborted) return;
        if (!sceneModule) {
          setStatus('preview');
          return;
        }
        if (!element) return;
        const created = await sceneModule.createScene({
          host: element,
          signal: controller.signal,
          onSelect,
        });
        if (controller.signal.aborted) {
          created.dispose();
          return;
        }
        handle = created;
        visibility();
        setStatus('ready');
      } catch {
        if (!controller.signal.aborted) {
          dispose();
          setStatus('error');
        }
      }
    })();
    return () => {
      controller.abort();
      dispose();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('pageshow', restorePage);
      element?.removeEventListener('webglcontextlost', contextLost, true);
      element?.replaceChildren();
    };
  }, [roomId, onSelect, attempt]);
  const retry = () => {
    setStatus('loading');
    setAttempt((v) => v + 1);
  };
  return (
    <>
      <div
        className="scene-host"
        ref={host}
        role="application"
        aria-label="Interior 3D viewer"
      />
      {status === 'loading' && <LoadingScreen />}
      {(status === 'preview' || status === 'error') && (
        <SceneFallback
          slug={slug}
          failed={status === 'error'}
          onRetry={retry}
        />
      )}
    </>
  );
}
