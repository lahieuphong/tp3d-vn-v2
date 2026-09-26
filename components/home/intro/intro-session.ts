/** Session policy is separate from both the asset coordinator and the overlay.
 * This pre-paint script owns only a document attribute, never React markup. */
export const HOME_INTRO_SESSION_KEY = 'tanphong_intro_seen';

export type HomeIntroDecision = {
  play: boolean;
  force: boolean;
  startedAt: number;
};

type HomeIntroBoot = {
  play: boolean;
  claimed: boolean;
  expired: boolean;
  startedAt: number;
  watchdog?: number;
  force: boolean;
};

declare global {
  interface Window {
    __tpHomeIntroBoot?: HomeIntroBoot;
  }
}

/** Runs in the document head so an eligible first entry cannot paint Home before
 * the overlay CSS. If hydration fails, the attribute lock releases by itself. */
export const HOME_INTRO_BOOTSTRAP = `(() => {
  if (location.pathname !== '/' || window.__tpHomeIntroBoot) return;
  const restored = !!location.hash || Math.abs(window.scrollY) > 0;
  const navigation = performance.getEntriesByType('navigation')[0];
  const back = navigation ? navigation.type === 'back_forward' : performance.navigation?.type === 2;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const params = new URLSearchParams(location.search);
  const force = local && (params.get('intro') === '1' || params.get('forceIntro') === 'true');
  let seen = false;
  try { seen = sessionStorage.getItem('tanphong_intro_seen') === 'true'; } catch {}
  const play = !restored && !back && (force || !seen);
  const boot = window.__tpHomeIntroBoot = {
    play, force, claimed: false, expired: false, startedAt: performance.now(), watchdog: undefined
  };
  if (!play) return;
  document.documentElement.setAttribute('data-home-intro', 'waiting');
  boot.watchdog = window.setTimeout(() => {
    if (boot.claimed) return;
    boot.expired = true;
    boot.watchdog = undefined;
    document.documentElement.removeAttribute('data-home-intro');
  }, 4500);
})();`;

/** Call once for a Home mount and retain its result through effect replays.
 * A document can claim at most one full intro, even if storage is unavailable. */
export function claimHomeIntro(): HomeIntroDecision {
  const now = performance.now();
  const params = new URLSearchParams(location.search);
  const force =
    ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) &&
    (params.get('intro') === '1' || params.get('forceIntro') === 'true');
  const restored = !!location.hash || Math.abs(window.scrollY) > 0;
  let boot = window.__tpHomeIntroBoot;

  if (!boot) {
    let seen = false;
    try {
      seen = sessionStorage.getItem(HOME_INTRO_SESSION_KEY) === 'true';
    } catch {
      // Document ownership below still prevents SPA replays without storage.
    }
    // With no head decision this is a later SPA entry from another route. Its
    // original navigation entry must not be mistaken for a Home hard refresh.
    const navigation = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const back = navigation
      ? navigation.type === 'back_forward'
      : // oxlint-disable-next-line typescript/no-deprecated -- Navigation Timing fallback for older browsers.
        performance.navigation?.type === 2;
    boot = {
      play: location.pathname === '/' && !restored && !back && (force || !seen),
      force,
      claimed: false,
      expired: false,
      startedAt: now,
    };
    window.__tpHomeIntroBoot = boot;
  }

  if (boot.watchdog !== undefined) {
    window.clearTimeout(boot.watchdog);
    boot.watchdog = undefined;
  }
  const play =
    location.pathname === '/' &&
    boot.play &&
    !boot.claimed &&
    !boot.expired &&
    !restored;
  boot.claimed = true;
  if (!play) document.documentElement.removeAttribute('data-home-intro');
  return { play, force: boot.force, startedAt: boot.startedAt };
}

export function markHomeIntroSeen(): void {
  try {
    sessionStorage.setItem(HOME_INTRO_SESSION_KEY, 'true');
  } catch {
    // The document claim remains authoritative for subsequent client routes.
  }
}
