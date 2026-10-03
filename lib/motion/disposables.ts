/** Anything a motion controller must release. Objects are matched by method,
 * so GSAP contexts/timelines/ScrollTriggers (`revert`/`kill`), Three.js
 * resources (`dispose`), observers (`disconnect`) and the home controllers'
 * `destroy()` handles all work without importing those libraries. */
export type Disposable =
  | (() => unknown)
  | { revert(): unknown }
  | { kill(): unknown }
  | { dispose(): unknown }
  | { disconnect(): unknown }
  | { destroy(): unknown };

function release(item: Disposable) {
  if (typeof item === 'function') item();
  // A GSAP context or timeline restores the styles it wrote when reverted.
  else if ('revert' in item) item.revert();
  else if ('kill' in item) item.kill();
  else if ('dispose' in item) item.dispose();
  else if ('disconnect' in item) item.disconnect();
  else item.destroy();
}

/** One owner for a controller's listeners, frames, timers and library handles.
 * `dispose()` releases them in reverse order, at most once, and keeps going if
 * one throws (the first error is rethrown afterwards). Items added after
 * disposal are released immediately, so late async results cannot leak. */
export function createDisposables() {
  const items: Disposable[] = [];
  const controller = new AbortController();
  let disposed = false;
  const add = <T extends Disposable>(item: T): T => {
    if (disposed) release(item);
    else items.push(item);
    return item;
  };
  return {
    /** Aborted on dispose: pass to fetch, dynamic imports or listeners. */
    signal: controller.signal,
    get disposed() {
      return disposed;
    },
    add,
    listen<E extends Event = Event>(
      target: EventTarget,
      type: string,
      listener: (event: E) => void,
      options?: AddEventListenerOptions,
    ) {
      const handler = listener as EventListener;
      target.addEventListener(type, handler, options);
      add(() => target.removeEventListener(type, handler, options));
    },
    /** A tracked requestAnimationFrame; returns its cancel function. */
    frame(callback: FrameRequestCallback) {
      let id = 0;
      const cancel = () => cancelAnimationFrame(id);
      id = requestAnimationFrame((now) => {
        const index = items.indexOf(cancel);
        if (index >= 0) items.splice(index, 1);
        callback(now);
      });
      add(cancel);
      return cancel;
    },
    /** A tracked setTimeout; returns its cancel function. */
    timeout(callback: () => void, ms: number) {
      let id: ReturnType<typeof setTimeout> | undefined = undefined;
      const cancel = () => clearTimeout(id);
      id = setTimeout(() => {
        const index = items.indexOf(cancel);
        if (index >= 0) items.splice(index, 1);
        callback();
      }, ms);
      add(cancel);
      return cancel;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      const failures: unknown[] = [];
      for (const item of items.splice(0).reverse()) {
        try {
          release(item);
        } catch (error) {
          failures.push(error);
        }
      }
      if (failures.length) throw failures[0];
    },
  };
}

export type Disposables = ReturnType<typeof createDisposables>;
