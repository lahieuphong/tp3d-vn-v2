'use client';

import { useState } from 'react';

/** Deliberately mounted only after an explicit request to explore the model. */
export function SketchfabViewer({ uid, title }: { uid: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="world-sketchfab-viewer">
      {!loaded && <p className="world-viewer-loading eyebrow">LOADING 3D VIEW</p>}
      <iframe
        src={`https://sketchfab.com/models/${uid}/embed?autostart=1&ui_infos=0&ui_stop=0`}
        title={`${title} — interactive 3D view`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
