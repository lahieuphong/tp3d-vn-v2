type ChapterName = 'worlds' | 'spaces' | 'materials';
type ChapterPhase = 'far' | 'entering' | 'active' | 'leaving';
type Depth = 'background' | 'foreground' | 'breeze' | 'copy';
const materialDepthOffsets = {
  rear: 2,
  mid: 3,
  stone: 6,
  ceramic: 4,
  textile: 3,
  metal: 5,
} as const;
type MaterialDepth = keyof typeof materialDepthOffsets;
type ChapterGeometry = { top: number; height: number };
type Frame = {
  entry: number;
  exit: number;
  progress: number;
  phase: ChapterPhase;
};
type Chapter = {
  node: HTMLElement;
  name: ChapterName;
  geometry: ChapterGeometry;
  layers: {
    node: HTMLElement;
    depth: Depth;
    materialDepth?: MaterialDepth;
    order: number;
  }[];
  reveals: HTMLElement[];
  callouts: { node: HTMLElement; index: number }[];
  targets: HTMLElement[];
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const bounded = clamp(value);
  return bounded * bounded * (3 - 2 * bounded);
};

/** Pure document-space geometry: scroll never reads layout after a style write. */
export function chapterFrame(
  geometry: ChapterGeometry,
  scrollY: number,
  viewportHeight: number,
  headerHeight: number,
): Frame {
  const top = geometry.top - scrollY;
  const bottom = top + geometry.height;
  const viewport = Math.max(1, viewportHeight);
  const entry = clamp((viewport - top) / (viewport * 0.35));
  const exit = clamp((viewport - bottom) / (viewport * 0.55));
  const progress = clamp((viewport - top) / (viewport + geometry.height));
  const phase: ChapterPhase =
    bottom <= 0 || top >= viewport
      ? 'far'
      : top > headerHeight
        ? 'entering'
        : bottom < viewport * 0.65
          ? 'leaving'
          : 'active';
  return { entry, exit, progress, phase };
}

export function chapterHeaderTheme(
  chapters: { name: ChapterName; geometry: ChapterGeometry }[],
  scrollY: number,
  headerHeight: number,
  viewportHeight = 0,
): 'dark' | 'light' | null {
  const samplingPoint = scrollY + headerHeight;
  // The top eight viewport percent belongs to the incoming chapter's blended
  // edge. Prefer the later chapter once its readable background has arrived.
  const current = [...chapters]
    .reverse()
    .find(
      ({ geometry }) =>
        samplingPoint >= geometry.top + viewportHeight * 0.08 &&
        samplingPoint < geometry.top + geometry.height,
    );
  return current ? (current.name === 'worlds' ? 'dark' : 'light') : null;
}

/** Native scroll chapters: one event-batched frame, no autoplay or idle loop.
 * Far sections keep their readable server-rendered composition and release
 * their transforms. All geometry is collected before the render pass writes. */
export function mountHomeChapters(root: HTMLElement): () => void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 767px)');
  const header = document.querySelector<HTMLElement>('.site-header');
  const chapters: Chapter[] = [
    ...root.querySelectorAll<HTMLElement>('[data-home-chapter]'),
  ]
    .filter((node) =>
      ['worlds', 'spaces', 'materials'].includes(
        node.dataset.homeChapter ?? '',
      ),
    )
    .map((node) => {
      const layers = [
        ...node.querySelectorAll<HTMLElement>('[data-chapter-depth]'),
      ]
        .filter((layer) =>
          ['background', 'foreground', 'breeze', 'copy'].includes(
            layer.dataset.chapterDepth ?? '',
          ),
        )
        .map((layer) => ({
          node: layer,
          depth: layer.dataset.chapterDepth as Depth,
          materialDepth: Object.hasOwn(
            materialDepthOffsets,
            layer.dataset.materialDepth ?? '',
          )
            ? (layer.dataset.materialDepth as MaterialDepth)
            : undefined,
          order: Math.max(
            0,
            Math.min(5, Number(layer.dataset.materialOrder) || 0),
          ),
        }));
      const reveals = [
        ...node.querySelectorAll<HTMLElement>('[data-chapter-reveal]'),
      ];
      const callouts = [
        ...node.querySelectorAll<HTMLElement>('[data-callout-index]'),
      ].map((callout) => ({
        node: callout,
        index: Math.max(
          0,
          Math.min(4, Number(callout.dataset.calloutIndex) || 0),
        ),
      }));
      return {
        node,
        name: node.dataset.homeChapter as ChapterName,
        geometry: { top: 0, height: 0 },
        layers,
        reveals,
        callouts,
        targets: [
          ...new Set([
            ...layers.map((layer) => layer.node),
            ...reveals,
            ...callouts.map((callout) => callout.node),
          ]),
        ],
      };
    });
  if (!chapters.length) return () => {};

  let disposed = false;
  let frame = 0;
  let needsMeasure = true;
  let viewportHeight = window.innerHeight;
  let headerHeight = 0;
  let staticApplied = false;
  let intersection: IntersectionObserver | null = null;
  let observerMargin = -1;
  const near = new Set<Chapter>();
  const toClear = new Set<Chapter>();
  const byNode = new Map(chapters.map((chapter) => [chapter.node, chapter]));
  const properties = ['transform', 'opacity', '--callout-reveal'];
  const sectionProperties = [
    '--chapter-entry',
    '--chapter-exit',
    '--chapter-progress',
  ];
  const originalStyles = new Map<
    HTMLElement,
    Map<string, { value: string; priority: string }>
  >();
  const originalAttributes = new Map<
    HTMLElement,
    { phase?: string; progress?: string }
  >();
  for (const chapter of chapters) {
    originalAttributes.set(chapter.node, {
      phase: chapter.node.dataset.phase,
      progress: chapter.node.dataset.progress,
    });
    for (const [node, owned] of [
      [chapter.node, sectionProperties],
      ...chapter.targets.map((target) => [target, properties]),
    ] as [HTMLElement, string[]][]) {
      const snapshot = originalStyles.get(node) ?? new Map();
      for (const property of owned)
        snapshot.set(property, {
          value: node.style.getPropertyValue(property),
          priority: node.style.getPropertyPriority(property),
        });
      originalStyles.set(node, snapshot);
    }
  }
  const restore = (node: HTMLElement, owned: string[]) => {
    const snapshot = originalStyles.get(node);
    for (const property of owned) {
      const previous = snapshot?.get(property);
      if (previous?.value)
        node.style.setProperty(property, previous.value, previous.priority);
      else node.style.removeProperty(property);
    }
  };
  const clearChapter = (chapter: Chapter, staticView = false) => {
    restore(chapter.node, sectionProperties);
    for (const target of chapter.targets) restore(target, properties);
    chapter.node.dataset.phase = 'far';
    if (staticView) delete chapter.node.dataset.progress;
  };
  const headerTheme = () => {
    if (!header) return;
    const theme = chapterHeaderTheme(
      chapters,
      window.scrollY,
      headerHeight,
      reduced.matches ? 0 : viewportHeight,
    );
    if (theme && header.dataset.chapterTheme !== theme)
      header.dataset.chapterTheme = theme;
    else if (!theme && header.dataset.chapterTheme !== undefined)
      delete header.dataset.chapterTheme;
  };
  const paintChapter = (chapter: Chapter, scrollY: number) => {
    const state = chapterFrame(
      chapter.geometry,
      scrollY,
      viewportHeight,
      headerHeight,
    );
    chapter.node.dataset.phase = state.phase;
    chapter.node.dataset.progress = state.progress.toFixed(4);
    chapter.node.style.setProperty('--chapter-entry', state.entry.toFixed(4));
    chapter.node.style.setProperty('--chapter-exit', state.exit.toFixed(4));
    chapter.node.style.setProperty(
      '--chapter-progress',
      state.progress.toFixed(4),
    );
    const entry = smooth(state.entry);
    const amplitude = compact.matches ? 0.4 : 1;
    const poses = new Map<
      HTMLElement,
      { y: number; scale: number; opacity?: number; callout?: number }
    >();
    for (const layer of chapter.layers) {
      const materialSettled = chapter.name === 'materials';
      const drift = (state.progress - 0.5) * amplitude;
      const pose: { y: number; scale: number; opacity?: number } = {
        y: 0,
        scale: 1,
      };
      if (layer.depth === 'background') {
        pose.y = materialSettled ? (1 - entry) * 12 * amplitude : drift * 24;
        pose.scale = 1.02 - entry * 0.02;
        pose.opacity = 0.7 + entry * 0.3;
      } else if (layer.depth === 'foreground') {
        if (materialSettled && layer.materialDepth) {
          // Six independent cut-outs share one scroll sample. Their entrances
          // finish before entry=1; only a bounded 2–6px depth offset remains.
          const reveal = smooth((state.entry - layer.order * 0.05) / 0.72);
          const depthOffset =
            -drift * 2 * materialDepthOffsets[layer.materialDepth];
          pose.y = (1 - reveal) * 40 * amplitude + depthOffset;
          pose.scale = 0.98 + reveal * 0.02;
          pose.opacity = reveal;
        } else {
          // Retain the single-tableau fallback for a scene without cut-outs.
          pose.y = materialSettled ? (1 - entry) * 40 * amplitude : -drift * 18;
          pose.scale = materialSettled
            ? 0.98 + entry * 0.02
            : 1 + state.exit * 0.014;
          if (materialSettled) pose.opacity = entry;
        }
      } else if (layer.depth === 'breeze') {
        pose.y = materialSettled
          ? drift * 42 + state.exit * 30 * amplitude
          : -drift * 42 - state.exit * 16 * amplitude;
      } else {
        pose.y = (1 - entry) * 12 * amplitude;
      }
      poses.set(layer.node, pose);
    }
    chapter.reveals.forEach((node, index) => {
      const reveal = smooth((state.entry - Math.min(index, 4) * 0.045) / 0.72);
      const pose = poses.get(node) ?? { y: 0, scale: 1, opacity: 1 };
      pose.opacity = Math.min(pose.opacity ?? 1, reveal);
      pose.y += (1 - reveal) * 18 * amplitude;
      poses.set(node, pose);
    });
    for (const { node, index } of chapter.callouts) {
      const reveal = smooth((state.entry - index * 0.065) / 0.66);
      const pose = poses.get(node) ?? { y: 0, scale: 1, opacity: 1 };
      pose.opacity = Math.min(pose.opacity ?? 1, reveal);
      pose.y += (1 - reveal) * 15 * amplitude;
      pose.callout = reveal;
      poses.set(node, pose);
    }
    for (const [node, pose] of poses) {
      node.style.transform = `translate3d(0, ${pose.y.toFixed(2)}px, 0) scale(${pose.scale.toFixed(4)})`;
      // Breeze/copy opacity belongs to art direction unless this exact node
      // participates in a reveal. Do not override authored translucency with 1.
      if (pose.opacity !== undefined)
        node.style.opacity = pose.opacity.toFixed(4);
      if (pose.callout !== undefined)
        node.style.setProperty('--callout-reveal', pose.callout.toFixed(4));
    }
  };
  const schedule = () => {
    if (disposed || document.hidden || frame) return;
    frame = requestAnimationFrame(render);
  };
  const observe = () => {
    if (typeof IntersectionObserver === 'undefined') return;
    const margin = Math.round(viewportHeight * 0.35);
    if (intersection && observerMargin === margin) return;
    intersection?.disconnect();
    observerMargin = margin;
    intersection = new IntersectionObserver(
      (entries) => {
        if (disposed) return;
        for (const entry of entries) {
          const chapter = byNode.get(entry.target as HTMLElement);
          if (!chapter) continue;
          if (entry.isIntersecting) {
            near.add(chapter);
            toClear.delete(chapter);
          } else {
            near.delete(chapter);
            toClear.add(chapter);
          }
        }
        schedule();
      },
      { rootMargin: `${margin}px 0px`, threshold: 0 },
    );
    for (const chapter of chapters) intersection.observe(chapter.node);
  };
  const measure = () => {
    const scrollY = window.scrollY;
    viewportHeight = Math.max(1, window.innerHeight);
    // Complete the read phase before touching any chapter/header styles.
    const headerRect = header?.getBoundingClientRect();
    const rectangles = chapters.map((chapter) =>
      chapter.node.getBoundingClientRect(),
    );
    headerHeight = headerRect?.height ?? 0;
    chapters.forEach((chapter, index) => {
      const rectangle = rectangles[index];
      chapter.geometry = {
        top: rectangle.top + scrollY,
        height: rectangle.height,
      };
    });
    const margin = viewportHeight * 0.35;
    near.clear();
    for (const chapter of chapters) {
      const top = chapter.geometry.top - scrollY;
      if (
        top < viewportHeight + margin &&
        top + chapter.geometry.height > -margin
      ) {
        near.add(chapter);
        toClear.delete(chapter);
      } else toClear.add(chapter);
    }
    needsMeasure = false;
    observe();
  };
  function render() {
    frame = 0;
    if (disposed) return;
    if (needsMeasure) measure();
    headerTheme();
    for (const chapter of toClear) clearChapter(chapter, reduced.matches);
    toClear.clear();
    if (reduced.matches) {
      if (!staticApplied) {
        for (const chapter of chapters) clearChapter(chapter, true);
        staticApplied = true;
      }
      return;
    }
    staticApplied = false;
    const scrollY = window.scrollY;
    for (const chapter of near) paintChapter(chapter, scrollY);
  }
  const scroll = () => {
    if (disposed || document.hidden) return;
    // IO is the normal gate; the cached bounds also cover instant keyboard or
    // fragment jumps before the browser delivers the next IO callback.
    const margin = viewportHeight * 0.35;
    let nearby = false;
    for (const chapter of chapters) {
      const top = chapter.geometry.top - window.scrollY;
      const intersects =
        top < viewportHeight + margin &&
        top + chapter.geometry.height > -margin;
      if (intersects) {
        near.add(chapter);
        toClear.delete(chapter);
        nearby = true;
      } else if (near.delete(chapter)) toClear.add(chapter);
    }
    if (nearby || toClear.size || header?.dataset.chapterTheme !== undefined)
      schedule();
  };
  const resize = () => {
    needsMeasure = true;
    schedule();
  };
  const motionPreference = () => {
    for (const chapter of chapters) clearChapter(chapter, true);
    staticApplied = reduced.matches;
    needsMeasure = true;
    schedule();
  };
  const visibility = () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else {
      needsMeasure = true;
      schedule();
    }
  };
  const sizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  sizeObserver?.observe(root);
  for (const chapter of chapters) sizeObserver?.observe(chapter.node);
  if (header) sizeObserver?.observe(header);
  window.addEventListener('scroll', scroll, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pageshow', resize);
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', motionPreference);
  compact.addEventListener('change', resize);
  // Do the first geometry/paint pass synchronously in the mount effect so a
  // deep-link landing cannot flash a hidden or incorrectly themed chapter.
  render();

  return () => {
    if (disposed) return;
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    intersection?.disconnect();
    sizeObserver?.disconnect();
    window.removeEventListener('scroll', scroll);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pageshow', resize);
    document.removeEventListener('visibilitychange', visibility);
    reduced.removeEventListener('change', motionPreference);
    compact.removeEventListener('change', resize);
    for (const chapter of chapters) {
      clearChapter(chapter, true);
      const previous = originalAttributes.get(chapter.node);
      if (previous?.phase === undefined) delete chapter.node.dataset.phase;
      else chapter.node.dataset.phase = previous.phase;
      if (previous?.progress === undefined)
        delete chapter.node.dataset.progress;
      else chapter.node.dataset.progress = previous.progress;
    }
    if (header) delete header.dataset.chapterTheme;
  };
}
