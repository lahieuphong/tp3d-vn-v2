type BridgeImageCallbacks = {
  ready: () => void;
  failed: () => void;
};

/** Prepare the existing responsive plate before the bridge reaches the camera.
 * Source selection stays with <picture>; no duplicate Image/texture is created. */
export function prepareBridgeImage(
  owner: HTMLElement,
  image: HTMLImageElement,
  callbacks: BridgeImageCallbacks,
): () => void {
  const saved = ['loading', 'fetchpriority'].map(
    (name) => [name, image.getAttribute(name)] as const,
  );
  let target: HTMLImageElement | null = image;
  let ready: (() => void) | null = callbacks.ready;
  let failed: (() => void) | null = callbacks.failed;
  let observer: IntersectionObserver | null = null;
  let started = false;
  let revision = 0;
  let decodingSource: string | null = null;
  let readySource: string | null = null;

  const source = () => target?.currentSrc || target?.src || '';
  const load = () => {
    if (!target || !target.complete || target.naturalWidth === 0) return;
    const candidate = source();
    if (decodingSource === candidate || readySource === candidate) return;
    const request = ++revision;
    decodingSource = candidate;
    const finish = (decoded: boolean) => {
      // A responsive source change, error or unmount invalidates older decodes.
      if (!target || request !== revision) return;
      decodingSource = null;
      if (source() !== candidate) {
        load();
        return;
      }
      if (decoded && target.complete && target.naturalWidth > 0) {
        readySource = candidate;
        ready?.();
      } else failed?.();
    };
    if (typeof target.decode !== 'function') {
      finish(true);
      return;
    }
    try {
      void target.decode().then(
        () => finish(true),
        () => finish(false),
      );
    } catch {
      finish(false);
    }
  };
  const error = () => {
    if (!target) return;
    revision++;
    decodingSource = null;
    readySource = null;
    failed?.();
  };
  const start = () => {
    if (!target || started) return;
    started = true;
    observer?.disconnect();
    observer = null;
    target.loading = 'eager';
    target.fetchPriority = 'auto';
    // Listeners are already attached, covering cached completion and load races.
    if (target.complete) {
      if (target.naturalWidth > 0) load();
      else error();
    }
  };
  target.addEventListener('load', load);
  target.addEventListener('error', error);
  if (typeof IntersectionObserver === 'function') {
    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) start();
        },
        { rootMargin: '120% 0px', threshold: 0 },
      );
      observer.observe(owner);
    } catch {
      start();
    }
  } else start();

  return () => {
    if (!target) return;
    revision++;
    observer?.disconnect();
    observer = null;
    target.removeEventListener('load', load);
    target.removeEventListener('error', error);
    for (const [name, value] of saved) {
      if (value === null) target.removeAttribute(name);
      else target.setAttribute(name, value);
    }
    target = null;
    ready = null;
    failed = null;
  };
}
