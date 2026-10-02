/** Document lifetime only. Fresh/reloaded Home documents play the loader;
 * history restores native scroll. No persistent storage participates. */
export type HomeIntroDecision = {
  play: boolean;
  force: boolean;
  startedAt: number;
  scrollRestoration?: ScrollRestoration;
};
type HomeIntroRuntime = {
  play: boolean;
  claimed: boolean;
  played: boolean;
  expired: boolean;
  watchdog?: number;
  restoreWatchdog?: number;
  scrollRestoration?: ScrollRestoration;
};
declare global {
  interface Window {
    __tpHomeIntroRuntime?: HomeIntroRuntime;
  }
}

/** Inline in <head>, before Home can paint. Initialize on every route so a
 * later SPA arrival cannot mistake the original document reload for its own. */
export const HOME_INTRO_BOOTSTRAP = `(() => {
  if (window.__tpHomeIntroRuntime) return;
  const navigation = performance.getEntriesByType('navigation')[0];
  const type = navigation ? navigation.type : performance.navigation?.type === 2 ? 'back_forward' : performance.navigation?.type === 1 ? 'reload' : 'navigate';
  const force = new URLSearchParams(location.search).get('intro') === '1';
  const play = location.pathname === '/' && (force || type === 'navigate' || type === 'reload');
  const runtime = window.__tpHomeIntroRuntime = {play, claimed: false, played: false, expired: false};
  if (!play) {
    if (location.pathname === '/' && type === 'back_forward') {
      document.documentElement.setAttribute('data-home-restoring', '');
      runtime.restoreWatchdog = window.setTimeout(() => {
        document.documentElement.removeAttribute('data-home-restoring');
        runtime.restoreWatchdog = undefined;
      }, 4500);
    }
    return;
  }
  runtime.scrollRestoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  document.documentElement.setAttribute('data-home-intro', 'waiting');
  window.scrollTo({top: 0, left: 0, behavior: 'instant'});
  runtime.watchdog = window.setTimeout(() => {
    if (runtime.claimed) return;
    runtime.expired = true;
    runtime.watchdog = undefined;
    history.scrollRestoration = runtime.scrollRestoration || 'auto';
    document.documentElement.removeAttribute('data-home-intro');
  }, 4500);
})();`;

/** Small synchronous first-frame gate: even before the main stylesheet loads,
 * a new Home document paints ivory, never an exposed Homepage/header. */
export const HOME_INTRO_CRITICAL_CSS = `
.home-intro-loader{display:none}
html[data-home-restoring] .home-experience{opacity:0}
html[data-home-intro]{background:#eee9df;overflow:hidden;scrollbar-gutter:stable}
html[data-home-intro] .home-intro-loader{display:block;position:fixed;inset:0;z-index:200;overflow:clip}
html[data-home-intro] .site-header,html[data-home-intro] .site-footer,html[data-home-intro] .skip-link{visibility:hidden}
html[data-home-intro='waiting'] .home-experience,html[data-home-intro='ready'] .home-experience{visibility:hidden}
html[data-home-intro='waiting'] .home-intro-loader,html[data-home-intro='ready'] .home-intro-loader{background:#eee9df}
`;

/** Retain the decision in the component ref through StrictMode effect replays.
 * ?intro=1 deliberately opts each new Home mount into a full visual QA run. */
export function claimHomeIntro(): HomeIntroDecision {
  const runtime = (window.__tpHomeIntroRuntime ??= {
    play: false,
    claimed: false,
    played: false,
    expired: false,
  });
  const force = new URLSearchParams(location.search).get('intro') === '1';
  if (runtime.watchdog !== undefined) {
    window.clearTimeout(runtime.watchdog);
    runtime.watchdog = undefined;
  }
  const play =
    location.pathname === '/' &&
    !runtime.expired &&
    (force || (runtime.play && !runtime.claimed && !runtime.played));
  const scrollRestoration = !runtime.claimed
    ? runtime.scrollRestoration
    : undefined;
  runtime.claimed = true;
  if (!play) document.documentElement.removeAttribute('data-home-intro');
  return { play, force, startedAt: performance.now(), scrollRestoration };
}

export function markHomeIntroPlayed(): void {
  if (window.__tpHomeIntroRuntime) window.__tpHomeIntroRuntime.played = true;
}
