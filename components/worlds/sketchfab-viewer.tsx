'use client';

/** Deliberately mounted only after an explicit request to explore the model.
 * It sits beneath the poster and stays inert (no pointer, no focus) until the
 * stage hands over; `onReady` reports the iframe's load. */
export function SketchfabViewer({
  uid,
  title,
  interactive,
  onReady,
}: {
  uid: string;
  title: string;
  interactive: boolean;
  onReady: () => void;
}) {
  return (
    <div className="world-sketchfab-viewer" inert={!interactive}>
      <iframe
        src={`https://sketchfab.com/models/${uid}/embed?autostart=1&ui_infos=0&ui_stop=0`}
        title={`${title} — interactive 3D view`}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        onLoad={onReady}
      />
    </div>
  );
}
