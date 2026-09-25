/* Paste once into Chrome DevTools on a LOCAL homepage after a hard reload.
 * Starts the requested ~21-minute bounded run. This is QA-only code, never
 * imported by the website. window.__spatialQA.stop() cancels all owned work.
 * Results: JSON.stringify(window.__spatialQA.result(), null, 2)
 * Saved checkpoint: sessionStorage['tanphong-spatial-qa-v1'].
 * FPS below is requestAnimationFrame cadence, not a GPU/render FPS claim.
 * DOM canvas inspection cannot detect WebGL contexts created off-DOM.
 */
(() => {
  if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
    throw new Error('Spatial QA is restricted to localhost.');
  }
  window.__spatialQA?.stop();
  const STORAGE_KEY = 'tanphong-spatial-qa-v1';
  const timers = new Map();
  const frames = new Set();
  const samples = [];
  const warnings = [];
  const errors = [];
  let running = false;
  let runInFlight = false;
  let canceled = false;
  let completed = false;
  let startedAt = 0;
  let stage = 'idle';
  let observer = null;
  let longTasks = [];
  let cadence = null;
  let expectedPath = '/';
  let options = null;

  const save = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result()));
    } catch {
      /* The result remains available in memory if storage is unavailable. */
    }
  };
  const wait = (ms) =>
    new Promise((resolve) => {
      if (canceled) {
        resolve(false);
        return;
      }
      const id = setTimeout(() => {
        timers.delete(id);
        resolve(!canceled);
      }, ms);
      timers.set(id, resolve);
    });
  const note = (message) => {
    warnings.push({
      at: Math.round(performance.now() - startedAt),
      stage,
      message,
    });
    console.warn('[Spatial QA]', message);
  };
  const hero = () => document.querySelector('.spatial-hero');
  const sample = (label) => {
    const element = hero();
    let animations = [];
    try {
      animations = element?.getAnimations({ subtree: true }) ?? [];
    } catch {
      animations = document
        .getAnimations()
        .filter((animation) => element?.contains(animation.effect?.target));
    }
    const memory = performance.memory;
    const item = {
      label,
      atMs: Math.round(performance.now() - startedAt),
      path: location.pathname,
      documentHidden: document.hidden,
      heroPresent: Boolean(element),
      motion: element?.dataset.motion ?? null,
      scene: element?.dataset.scene ?? null,
      heroAnimationCount: animations.length,
      runningHeroAnimations: animations.filter(
        (animation) => animation.playState === 'running',
      ).length,
      pausedHeroAnimations: animations.filter(
        (animation) => animation.playState === 'paused',
      ).length,
      firstAnimationTimeMs:
        typeof animations[0]?.currentTime === 'number'
          ? Math.round(animations[0].currentTime)
          : null,
      domCanvasCount: document.querySelectorAll('canvas').length,
      heroCanvasCount: element?.querySelectorAll('canvas').length ?? 0,
      heroImageCount: element?.querySelectorAll('img').length ?? 0,
      documentNodeCount: document.getElementsByTagName('*').length,
      decodedHeroImages: [...(element?.querySelectorAll('img') ?? [])].filter(
        (image) => image.complete && image.naturalWidth > 0,
      ).length,
      jsHeapUsedBytes: memory?.usedJSHeapSize ?? null,
      jsHeapTotalBytes: memory?.totalJSHeapSize ?? null,
      jsHeapLimitBytes: memory?.jsHeapSizeLimit ?? null,
    };
    samples.push(item);
    save();
    console.log('[Spatial QA sample]', JSON.stringify(item));
    return item;
  };
  const visibility = () => {
    if (running && document.hidden)
      note(
        'Document hidden during QA; cadence and live scene timing in this interval are not comparable.',
      );
  };
  const onError = (event) =>
    errors.push({
      stage,
      atMs: Math.round(performance.now() - startedAt),
      message: String(event.message ?? event.reason ?? 'Unknown browser error'),
    });
  const attach = () => {
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Keep bounded aggregate detail, even if unrelated page work is noisy.
          if (longTasks.length < 2000)
            longTasks.push({
              at: Math.round(entry.startTime),
              duration: Math.round(entry.duration),
              stage,
            });
        }
      });
      observer.observe({ type: 'longtask', buffered: false });
    } catch {
      note('Long Task API is unavailable in this browser.');
    }
  };
  const detach = () => {
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onError);
    observer?.disconnect();
    observer = null;
    for (const [id, resolve] of timers) {
      clearTimeout(id);
      resolve(false);
    }
    timers.clear();
    for (const id of frames) cancelAnimationFrame(id);
    frames.clear();
  };
  const measureCadence = (duration) => {
    const start = performance.now();
    let previous = null;
    const intervals = [];
    const finish = () => {
      const sorted = [...intervals].sort((a, b) => a - b);
      const total = intervals.reduce((sum, value) => sum + value, 0);
      cadence = {
        method:
          'Bounded requestAnimationFrame callback cadence; not GPU or presented-frame FPS.',
        durationMs: Math.round(performance.now() - start),
        frames: intervals.length,
        meanCallbacksPerSecond: total
          ? Number(((1000 * intervals.length) / total).toFixed(2))
          : null,
        p95IntervalMs: sorted.length
          ? Number(sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(2))
          : null,
        maxIntervalMs: sorted.length ? Number(sorted.at(-1).toFixed(2)) : null,
        intervalsOver50ms: intervals.filter((value) => value > 50).length,
        includesHiddenInterval: warnings.some((item) =>
          item.message.startsWith('Document hidden'),
        ),
      };
      save();
    };
    const step = (now) => {
      frames.delete(id);
      if (canceled) return;
      if (previous !== null) intervals.push(now - previous);
      previous = now;
      if (now - start >= duration) {
        finish();
        return;
      }
      id = requestAnimationFrame(step);
      frames.add(id);
    };
    let id = requestAnimationFrame(step);
    frames.add(id);
    // Hidden documents may suspend RAF; wall-clock completion cancels it.
    void wait(duration + 100).then((active) => {
      if (!active || cadence) return;
      cancelAnimationFrame(id);
      frames.delete(id);
      finish();
    });
  };
  const assertHome = () => {
    if (location.pathname !== '/' || !hero())
      throw new Error(`Homepage hero not mounted at ${location.pathname}.`);
  };
  const toTop = () => {
    assertHome();
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body)
      active.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const belowHero = () => {
    const element = hero();
    if (!element)
      throw new Error('Homepage hero disappeared during scroll QA.');
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().bottom + 80,
      behavior: 'instant',
    });
  };
  const navigate = async (path) => {
    if (!['/', '/worlds'].includes(path))
      throw new Error('QA navigation is limited to Home and Worlds.');
    if (location.pathname !== expectedPath)
      throw new Error(
        `Unexpected external navigation: ${location.pathname}; stopping QA.`,
      );
    const links = [...document.querySelectorAll('a[href]')];
    const link = links.find((anchor) => {
      const url = new URL(anchor.href, location.href);
      return (
        url.origin === location.origin &&
        url.pathname === path &&
        !anchor.target &&
        !anchor.hasAttribute('download')
      );
    });
    if (!link)
      throw new Error(
        `No existing same-tab link to ${path}; no synthetic route was created.`,
      );
    expectedPath = path;
    link.click();
    const limit = performance.now() + 15_000;
    while (!canceled && performance.now() < limit) {
      if (
        location.pathname === path &&
        (path !== '/' || hero()) &&
        (path !== '/worlds' ||
          document.querySelector('.worlds-catalog, .worlds-hero'))
      ) {
        await wait(options.routeSettleMs);
        return;
      }
      if (!(await wait(100))) return;
    }
    if (!canceled)
      throw new Error(
        `Client navigation to ${path} did not settle; stopped before any hard reload.`,
      );
  };
  const trend = (filter) => {
    const comparable = samples
      .filter(filter)
      .filter((item) => item.jsHeapUsedBytes !== null);
    if (!comparable.length) return { measurements: 0, available: false };
    const values = comparable.map((item) => item.jsHeapUsedBytes);
    return {
      measurements: values.length,
      available: true,
      firstBytes: values[0],
      lastBytes: values.at(-1),
      minBytes: Math.min(...values),
      maxBytes: Math.max(...values),
      deltaBytes: values.at(-1) - values[0],
      strictlyIncreasing:
        values.length > 2 &&
        values.every((value, index) => !index || value > values[index - 1]),
      caveat:
        'Chrome performance.memory is JS heap only, may be coarse, and is not tab RAM, native image memory, or GPU/VRAM. Garbage collection is not forced.',
    };
  };
  function result() {
    return {
      version: 1,
      running,
      canceled,
      completed,
      stage,
      startedAtISO: startedAt
        ? new Date(performance.timeOrigin + startedAt).toISOString()
        : null,
      elapsedMs: startedAt ? Math.round(performance.now() - startedAt) : 0,
      options,
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight },
      samples: [...samples],
      warnings: [...warnings],
      errors: [...errors],
      cadence,
      longTaskCount: longTasks.length,
      longTaskTotalMs: longTasks.reduce((sum, item) => sum + item.duration, 0),
      longTaskMaxMs: longTasks.length
        ? Math.max(...longTasks.map((item) => item.duration))
        : 0,
      longTasks: [...longTasks],
      returnToHeroHeap: trend((item) => item.label.endsWith(':visible-end')),
      routeReturnHeap: trend((item) => /^route:\d+:home$/.test(item.label)),
      idleHeap: trend((item) => item.label.startsWith('idle:')),
      maximumObservedDOMCanvases: samples.length
        ? Math.max(...samples.map((item) => item.domCanvasCount))
        : 0,
      maximumObservedHeroCanvases: samples.length
        ? Math.max(...samples.map((item) => item.heroCanvasCount))
        : 0,
      ownedQAResources: {
        timers: timers.size,
        rafs: frames.size,
        performanceObserver: Boolean(observer),
      },
      limits: [
        'No exact RAM/GPU/VRAM measurement: use Chrome Task Manager/Performance tooling separately.',
        'Zero observed DOM canvases does not prove no detached WebGL context; inspect product imports/source too.',
        'RAF cadence is not a full rendering FPS measurement.',
        'This QA never calls canvas.getContext, forces GC, or creates an image/rendering context.',
      ],
    };
  }
  const stop = () => {
    if (running) {
      canceled = true;
      stage = 'stopped';
    }
    running = false;
    detach();
    save();
    return result();
  };
  const start = async (customOptions = {}) => {
    if (runInFlight)
      throw new Error(
        'QA is running or finishing cleanup. Stop it, then wait one event turn before starting again.',
      );
    assertHome();
    canceled = false;
    completed = false;
    running = true;
    runInFlight = true;
    samples.length = 0;
    warnings.length = 0;
    errors.length = 0;
    longTasks = [];
    cadence = null;
    startedAt = performance.now();
    expectedPath = '/';
    options = {
      scrollCycles: 10,
      visibleMs: 60_000,
      hiddenMs: 30_000,
      routeCycles: 10,
      routeSettleMs: 1500,
      idleMs: 300_000,
      cadenceMs: 60_000,
      ...customOptions,
    };
    attach();
    try {
      stage = 'warm-up';
      toTop();
      sample('start');
      measureCadence(options.cadenceMs);
      for (let cycle = 1; cycle <= options.scrollCycles; cycle++) {
        stage = `scroll:${cycle}:visible`;
        toTop();
        if (!(await wait(options.visibleMs))) return;
        const visible = sample(`scroll:${cycle}:visible-end`);
        if (
          visible.motion !== 'playing' &&
          !matchMedia('(prefers-reduced-motion: reduce)').matches
        )
          note(
            'Hero is not playing while visible; move the pointer away from hero/header links and clear manual pause.',
          );
        stage = `scroll:${cycle}:offscreen`;
        belowHero();
        if (!(await wait(250))) return;
        const before = sample(`scroll:${cycle}:offscreen-start`);
        if (!(await wait(options.hiddenMs))) return;
        const after = sample(`scroll:${cycle}:offscreen-end`);
        if (after.runningHeroAnimations > 0)
          note('A hero animation is still running offscreen.');
        if (before.firstAnimationTimeMs !== after.firstAnimationTimeMs)
          note('Hero animation time advanced while offscreen.');
      }
      toTop();
      for (let cycle = 1; cycle <= options.routeCycles; cycle++) {
        stage = `route:${cycle}:worlds`;
        await navigate('/worlds');
        if (canceled) return;
        sample(`route:${cycle}:worlds`);
        stage = `route:${cycle}:home`;
        await navigate('/');
        if (canceled) return;
        toTop();
        sample(`route:${cycle}:home`);
      }
      stage = 'idle:five-minutes';
      const end = performance.now() + options.idleMs;
      sample('idle:start');
      while (!canceled && performance.now() < end) {
        if (!(await wait(Math.min(30_000, end - performance.now())))) return;
        sample('idle:sample');
      }
      completed = true;
      stage = 'complete';
      sample('complete');
      console.log('[Spatial QA complete]', JSON.stringify(result()));
    } catch (error) {
      errors.push({ stage, message: String(error) });
      stage = 'failed';
      console.error('[Spatial QA failed]', error);
    } finally {
      running = false;
      runInFlight = false;
      detach();
      save();
    }
    return result();
  };
  window.__spatialQA = { start, stop, result, sample, storageKey: STORAGE_KEY };
  void start();
})();
