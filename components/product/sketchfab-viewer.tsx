'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { resolveSketchfabViewer } from '@/lib/product-assets';

type ViewerState = 'poster' | 'loading' | 'open' | 'slow' | 'error';

/** No iframe or third-party request exists until the visitor chooses to explore. */
export function SketchfabViewer({
  title,
  uid,
  poster,
}: {
  title: string;
  uid: string;
  poster: ReactNode;
}) {
  const [state, setState] = useState<ViewerState>('poster');
  const [attempt, setAttempt] = useState(0);
  const launch = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const active = state === 'loading' || state === 'open' || state === 'slow';
  const viewer = resolveSketchfabViewer({ provider: 'sketchfab', uid });

  useEffect(() => {
    if (state !== 'loading') return;
    const timer = window.setTimeout(() => setState('slow'), 15000);
    return () => window.clearTimeout(timer);
  }, [state, attempt]);

  function explore() {
    setAttempt((value) => value + 1);
    setState('loading');
  }
  function close() {
    setState('poster');
    // Keep keyboard focus at the stable control after removing the iframe.
    launch.current?.focus();
  }

  if (!viewer)
    return (
      <div className="asset-viewer-frame">
        <div className="asset-viewer-poster">{poster}</div>
      </div>
    );
  return (
    <div className="asset-viewer" data-viewer-state={state}>
      <div className="asset-viewer-frame" aria-busy={state === 'loading'}>
        {!active && <div className="asset-viewer-poster">{poster}</div>}
        {active && (
          <iframe
            key={attempt}
            ref={frame}
            className="asset-viewer-iframe"
            src={viewer.embedUrl}
            title={`${title} — interactive 3D model on Sketchfab`}
            allow="autoplay; fullscreen; xr-spatial-tracking"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setState('open')}
            onError={() => setState('error')}
          />
        )}
        {state === 'loading' && (
          <output className="asset-viewer-message">
            Opening the interactive view…
          </output>
        )}
        {state === 'error' && (
          <output className="asset-viewer-message">
            The interactive view could not be opened. Try again or view the
            model on Sketchfab below.
          </output>
        )}
      </div>
      <div className="asset-viewer-toolbar">
        <button
          ref={launch}
          className="text-link asset-viewer-button"
          type="button"
          onClick={active ? close : explore}
        >
          <span>
            {active
              ? 'Return to image'
              : state === 'error'
                ? 'Try the 3D view again'
                : 'Explore in 3D'}
          </span>
          <span aria-hidden="true">{active ? '×' : '→'}</span>
        </button>
        {state === 'open' && (
          <button
            type="button"
            className="asset-viewer-focus"
            onClick={() => frame.current?.focus()}
          >
            Focus interactive view
          </button>
        )}
        <p className="asset-viewer-caption">
          Interactive model hosted on Sketchfab.
        </p>
      </div>
      {state === 'slow' && (
        <output className="asset-viewer-feedback">
          This is taking longer than expected. You can return to the image or
          open the model on Sketchfab below.
        </output>
      )}
    </div>
  );
}
