export const HERO_SESSION_KEY = 'tan-phong:hero-seen:v1';
export type HeroMotionMode = 'full' | 'short' | 'reduced' | 'settled';

export function chooseHeroMotion({
  reduced,
  seen,
  awayFromHero,
}: {
  reduced: boolean;
  seen: boolean;
  awayFromHero: boolean;
}): HeroMotionMode {
  if (awayFromHero) return 'settled';
  if (reduced) return 'reduced';
  return seen ? 'short' : 'full';
}

/** Small, static pre-paint bootstrap. It only selects a CSS mode; no app content
 *  is interpolated. The client adopts this value to avoid replay on hydration. */
export const HERO_BOOTSTRAP = `(()=>{const h=document.currentScript?.parentElement;if(!h)return;let seen=false;try{seen=sessionStorage.getItem('${HERO_SESSION_KEY}')==='1'}catch{}const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;h.dataset.heroMotion=(scrollY>32||location.hash||document.hidden)?'settled':reduced?'reduced':seen?'short':'full';h.dataset.heroBootstrapped='true';h.dataset.heroStarted=String(performance.now())})()`;
