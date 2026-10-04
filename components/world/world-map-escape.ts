/** TP3D PASS 09 — the World map's own Escape. The topmost layer the visitor
 * opened owns Escape first: while the native disclosure is open, Escape
 * closes it and goes no further, so a detail page behind it neither closes
 * its viewer nor leaves. Focus returns to the summary when it was inside the
 * map (or nowhere), without scrolling. Closed, the map takes no keys at all.
 *
 * The listener exists only while the map is open, on the window in the
 * capture phase: ahead of every page-level handler, wherever focus is. */
export function bindWorldMapEscape(details: HTMLDetailsElement): () => void {
  const view = details.ownerDocument.defaultView;
  if (!view) return () => {};
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !details.open || event.defaultPrevented)
      return;
    event.preventDefault();
    event.stopPropagation();
    const { activeElement, body } = details.ownerDocument;
    const returnFocus =
      !activeElement ||
      activeElement === body ||
      details.contains(activeElement);
    details.open = false;
    if (returnFocus)
      details.querySelector('summary')?.focus({ preventScroll: true });
  };
  const sync = () => {
    if (details.open) view.addEventListener('keydown', keydown, true);
    else view.removeEventListener('keydown', keydown, true);
  };
  details.addEventListener('toggle', sync);
  sync();
  return () => {
    details.removeEventListener('toggle', sync);
    view.removeEventListener('keydown', keydown, true);
  };
}
