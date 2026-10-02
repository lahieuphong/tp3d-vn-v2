type SceneImageCallbacks = {
  ready: () => void;
  failed: () => void;
};

export type SceneImagePreparation = {
  start: () => void;
  destroy: () => void;
};

/** Intent starts the request on the existing DOM image, before it is visible.
 * No Image clones, observer per thumbnail, timers or animation clocks. */
export function prepareSceneImage(
  image: HTMLImageElement,
  callbacks: SceneImageCallbacks,
  priority: 'auto' | 'low' = 'auto',
): SceneImagePreparation {
  let target: HTMLImageElement | null = image;
  let sources = [
    ...(image.parentElement?.querySelectorAll<HTMLSourceElement>(
      'source[data-srcset]',
    ) ?? []),
  ];
  let saved = [image, ...sources].map((node) => ({
    node,
    attributes: ['loading', 'fetchpriority', 'src', 'srcset'].map(
      (name) => [name, node.getAttribute(name)] as const,
    ),
  }));
  let ready: (() => void) | null = callbacks.ready;
  let failed: (() => void) | null = callbacks.failed;
  let started = false;
  let revision = 0;
  let decodingSource: string | null = null;
  let readySource: string | null = null;

  const source = () => target?.currentSrc || target?.src || '';
  const load = () => {
    if (!started || !target || !target.complete || target.naturalWidth === 0)
      return;
    const candidate = source();
    if (decodingSource === candidate || readySource === candidate) return;
    const request = ++revision;
    decodingSource = candidate;
    const finish = (decoded: boolean) => {
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
    if (!started || !target) return;
    revision++;
    decodingSource = readySource = null;
    failed?.();
  };
  target.addEventListener('load', load);
  target.addEventListener('error', error);

  return {
    start() {
      if (!target || started) return;
      started = true;
      target.loading = 'eager';
      target.fetchPriority = priority;
      // Install picture choices first, avoiding an unnecessary fallback request.
      for (const node of sources) node.srcset = node.dataset.srcset ?? '';
      if (target.dataset.srcset) target.srcset = target.dataset.srcset;
      if (target.dataset.src) target.src = target.dataset.src;
      if (target.complete && target.naturalWidth > 0) load();
    },
    destroy() {
      if (!target) return;
      revision++;
      target.removeEventListener('load', load);
      target.removeEventListener('error', error);
      for (const { node, attributes } of saved)
        for (const [name, value] of attributes) {
          if (value === null) node.removeAttribute(name);
          else node.setAttribute(name, value);
        }
      saved = [];
      sources = [];
      target = null;
      ready = failed = null;
    },
  };
}
