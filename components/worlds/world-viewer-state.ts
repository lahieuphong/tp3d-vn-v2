/** TP3D PASS 07: the live viewer's lifecycle on a world detail page, as plain
 * functions so the page, the stage and the checks agree.
 *
 *   poster ──enter──▶ loading ──ready──▶ live
 *     ▲                  │                 │
 *     └──── close / switch (cancel, exit, Escape, another world) ◀┘
 *
 * The Sketchfab iframe exists only in `loading` and `live`; every way back to
 * `poster` unmounts it. */
export type ViewerState = 'poster' | 'loading' | 'live';
export type ViewerEvent = 'enter' | 'ready' | 'close' | 'switch';

export function nextViewerState(
  state: ViewerState,
  event: ViewerEvent,
): ViewerState {
  if (event === 'enter') return state === 'poster' ? 'loading' : state;
  // A late load from an iframe that was already closed changes nothing.
  if (event === 'ready') return state === 'loading' ? 'live' : state;
  return 'poster';
}

export const viewerMounted = (state: ViewerState) => state !== 'poster';

/** What a key press means on the detail page. Escape closes the viewer
 * before it ever leaves the page; while the viewer is open, the arrows belong
 * to it, never to world switching. Keys typed into a field, or with a
 * modifier, or already handled, are left alone. */
export type DetailKeyAction =
  | 'close-viewer'
  | 'return'
  | 'next'
  | 'previous'
  | null;

export function detailKeyAction({
  key,
  viewer,
  modified,
  editable,
  handled,
}: {
  key: string;
  viewer: ViewerState;
  modified: boolean;
  editable: boolean;
  handled: boolean;
}): DetailKeyAction {
  if (handled || modified || editable) return null;
  if (key === 'Escape') return viewer === 'poster' ? 'return' : 'close-viewer';
  if (viewer !== 'poster') return null;
  if (key === 'ArrowDown' || key === 'ArrowRight') return 'next';
  if (key === 'ArrowUp' || key === 'ArrowLeft') return 'previous';
  return null;
}

/** Copy for the one toggle and the status line, per state. */
export const viewerCopy: Record<
  ViewerState,
  { toggle: string; status: string }
> = {
  poster: { toggle: 'ENTER 3D WORLD', status: '' },
  loading: { toggle: 'CANCEL OPENING', status: 'Opening 3D space' },
  live: { toggle: 'EXIT 3D VIEW', status: '3D view ready' },
};
