/** Observe the already-rendered first view; never create a second Image or
 * fetch a later chapter on behalf of the intro. Progress is asset completion,
 * not transferred bytes. The inline TP is ready with its SVG/solid fallback;
 * its optional mineral texture does not need to block entering the space. */
export type CriticalAssetProgress = {
  completed: number;
  total: number;
  failed: number;
  progress: number;
};

export type CriticalAssetResult = CriticalAssetProgress & {
  timedOut: boolean;
  cancelled: boolean;
};

export type CriticalAssetOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: (progress: CriticalAssetProgress) => void;
};

type AssetTask = {
  label: string;
  promise: Promise<boolean | null>;
  cancel: () => void;
};

// Accept only the read surface we use. In this app browser + worker type
// declarations also augment HTMLElement with server-only mutation methods.
type CriticalAssetRoot = Pick<ParentNode, 'querySelectorAll'> & {
  ownerDocument?: Pick<Document, 'fonts'> | null;
  fonts?: FontFaceSet;
};

const criticalImages =
  '[data-hero-layer="architecture-a"] img, .sh-monogram img, .sh-ribbon-cloth, .sh-portals img';

/** These text samples select only the first-view faces/subsets. Waiting for
 * document.fonts.ready would also wait for content in later chapters. */
const criticalFonts = [
  {
    font: '400 32px "Cormorant Spatial"',
    text: 'tân phong A new breeze Một làn gió mới cho không gian sống.',
  },
  { font: 'italic 400 32px "Cormorant Spatial"', text: 'for living.' },
  {
    font: '400 12px "Manrope Spatial"',
    text: 'INTERIORS & OBJECTS LOADING THE SPACE NỘI THẤT KIẾN TẠO CUỘC SỐNG',
  },
] as const;

function observeImage(images: HTMLImageElement[]): AssetTask {
  // Clear every reference even if the browser's decode promise never settles.
  let nodes: HTMLImageElement[] | null = images;
  let node: HTMLImageElement | null = images[0];
  const label = node.getAttribute('src') || node.currentSrc || 'Scene 1 image';
  let done = false;
  let decoding = false;
  let resolve: ((ready: boolean | null) => void) | null = null;
  const promise = new Promise<boolean | null>((settle) => {
    resolve = settle;
  });
  const unlisten = () => {
    node?.removeEventListener('load', loaded);
    node?.removeEventListener('error', failed);
  };
  const finish = (ready: boolean | null) => {
    if (done) return;
    done = true;
    if (ready === false) {
      for (const image of nodes ?? []) {
        image.dataset.criticalState = 'failed';
      }
    }
    unlisten();
    node = null;
    nodes = null;
    resolve?.(ready);
    resolve = null;
  };
  const failed = () => finish(false);
  const loaded = () => {
    if (done || decoding || !node) return;
    if (node.naturalWidth === 0) {
      finish(false);
      return;
    }
    decoding = true;
    unlisten();
    if (typeof node.decode !== 'function') {
      finish(true);
      return;
    }
    try {
      const decoded = node.decode();
      // Listeners are detached during decode. Timeout/cancel also releases
      // the shared-atlas fallback targets if this promise never settles.
      node = null;
      void decoded.then(() => finish(true), failed);
    } catch {
      finish(false);
    }
  };
  node.addEventListener('load', loaded);
  node.addEventListener('error', failed);
  // Attach before checking complete to cover load/cache races.
  if (node.complete) loaded();
  return { label, promise, cancel: () => finish(null) };
}

function observeFont(
  fonts: FontFaceSet,
  font: string,
  text: string,
): AssetTask {
  let resolve: ((ready: boolean | null) => void) | null = null;
  const promise = new Promise<boolean | null>((settle) => {
    resolve = settle;
  });
  const finish = (ready: boolean | null) => {
    resolve?.(ready);
    resolve = null;
  };
  try {
    // FontFaceSet.load itself cannot be aborted; cancelling detaches our
    // observation immediately and leaves no DOM/image reference behind.
    void fonts.load(font, text).then(
      (faces) => finish(faces.length > 0),
      () => finish(false),
    );
  } catch {
    finish(false);
  }
  return { label: font, promise, cancel: () => finish(null) };
}

export function preloadHomeCriticalAssets(
  root: CriticalAssetRoot,
  options: CriticalAssetOptions = {},
): { promise: Promise<CriticalAssetResult>; cancel: () => void } {
  let completed = 0;
  let failed = 0;
  let total = 0;
  let closed = false;
  let callback = options.onProgress;
  let signal = options.signal;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolve: ((result: CriticalAssetResult) => void) | null = null;
  const tasks: AssetTask[] = [];
  const failedResources: string[] = [];
  const pendingResources = new Set<string>();
  const promise = new Promise<CriticalAssetResult>((settle) => {
    resolve = settle;
  });
  const snapshot = (): CriticalAssetProgress => ({
    completed,
    total,
    failed,
    progress: total ? completed / total : 1,
  });
  const finish = (timedOut: boolean, cancelled: boolean) => {
    if (closed) return;
    closed = true;
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    signal?.removeEventListener('abort', cancel);
    signal = undefined;
    if (
      process.env.NODE_ENV === 'development' &&
      !cancelled &&
      (failed > 0 || timedOut)
    ) {
      console.warn('[Tân Phong intro] Continuing with first-view fallbacks.', {
        completed,
        total,
        failedResources: [...failedResources],
        pendingResources: timedOut ? [...pendingResources] : [],
        timedOut,
      });
    }
    for (const task of tasks) task.cancel();
    tasks.length = 0;
    failedResources.length = 0;
    pendingResources.clear();
    callback = undefined;
    resolve?.({ ...snapshot(), timedOut, cancelled });
    resolve = null;
  };
  const cancel = () => finish(false, true);

  if (signal?.aborted) {
    cancel();
    return { promise, cancel };
  }
  signal?.addEventListener('abort', cancel, { once: true });

  // All four portal nodes use one atlas. Count/decode that asset once, and
  // preserve the browser's existing responsive-source selection and request.
  const sources = new Map<string, HTMLImageElement[]>();
  for (const image of root.querySelectorAll<HTMLImageElement>(criticalImages)) {
    // The markup key is stable even when one atlas node has currentSrc and
    // another has not selected its responsive candidate yet.
    const source = image.getAttribute('src') || image.currentSrc;
    if (!source) continue;
    const key = [
      source,
      image.getAttribute('srcset') ?? '',
      image.getAttribute('sizes') ?? '',
    ].join('|');
    const group = sources.get(key);
    if (group) group.push(image);
    else sources.set(key, [image]);
  }
  for (const images of sources.values()) {
    tasks.push(observeImage(images));
  }
  const fonts = root.ownerDocument?.fonts ?? root.fonts;
  if (typeof fonts?.load === 'function') {
    for (const { font, text } of criticalFonts) {
      tasks.push(observeFont(fonts, font, text));
    }
  }
  total = tasks.length;
  for (const { label } of tasks) pendingResources.add(label);
  callback?.(snapshot());
  // An owner may abort in response to the initial notification.
  if (closed) return { promise, cancel };
  const settled = tasks.map(({ promise: asset, label }) =>
    asset.then((ready) => {
      if (closed || ready === null) return;
      completed++;
      pendingResources.delete(label);
      if (!ready) {
        failed++;
        failedResources.push(label);
      }
      callback?.(snapshot());
    }),
  );
  // A hanging decode/font must not hold the overlay indefinitely. The visual
  // controller still owns minimum display time and the reveal transition.
  const wait = options.timeoutMs ?? 4000;
  timer = setTimeout(
    () => finish(true, false),
    Number.isFinite(wait) ? Math.max(0, wait) : 4000,
  );
  void Promise.allSettled(settled).then(() => finish(false, false));
  return { promise, cancel };
}
