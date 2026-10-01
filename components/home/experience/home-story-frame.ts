export const clamp = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
export const range = (p: number, a: number, b: number) =>
  smooth((p - a) / (b - a));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Every phase is expressed in the same native HomeStory progress. */
export const homeStoryTiming = {
  arrivalHold: 0.16,
  perspectiveReady: 0.34,
  perspectiveEnd: 0.48,
  bridgeStart: 0.34,
  breezeApproach: 0.495,
  breezeNear: 0.575,
  skyReveal: 0.565,
  skyStart: 0.61,
  breezeOutStart: 0.61,
  breezeOutEnd: 0.67,
  pullbackStart: 0.705,
  pullbackEnd: 0.895,
  uiStart: 0.825,
  interactive: 0.905,
  settled: 0.92,
} as const;

/** Zero velocity at either end, early peak and a long architectural arrival. */
export function cameraArrival(value: number) {
  const t = clamp(value);
  return 1 - (1 - t) ** 4 * (1 + 4 * t);
}

export function homeStoryFrame(
  progress: number,
  width: number,
  height: number,
) {
  const p = clamp(progress);
  const mobile = width < 768;
  const depth = mobile ? 0.5 : width < 1200 ? 0.7 : 1;
  const coveredHeight = Math.max(height, width / (1672 / 941));
  const originY = coveredHeight * 0.116;
  // The real sky is ~20% of this existing photograph. A 1.24× crop cannot fill
  // the viewport; use the same plate for sky and the entire camera pull-back.
  // Single-plate fallback. The only supplied sky has ~200 native vertical
  // pixels, so this framing is resolution-limited; do not synthesize depth
  // planes or pretend that a larger generated texture restores detail.
  const cropScale = Math.max(
    mobile ? 4.65 : 4.8,
    (height * (mobile ? 0.86 : 0.9)) / (coveredHeight * 0.18),
  );
  const voidEnd = mobile ? 0.69 : homeStoryTiming.pullbackStart;
  const end = mobile ? 0.885 : homeStoryTiming.pullbackEnd;
  const pullback = cameraArrival((p - voidEnd) / (end - voidEnd));
  // A very slow, scroll-bound advance through the actual sky during the void.
  // Sky/foliage are baked together: no invented independent parallax layers.
  const airTravel = range(p, homeStoryTiming.skyStart, voidEnd);
  const skyFraming = cropScale * (1 + 0.018 * depth * (1 - airTravel));
  const cameraZ = Math.log(skyFraming) * (1 - pullback);
  const scale = p >= end ? 1 : Math.exp(cameraZ);
  const imageY =
    (height * 0.5 - originY) * ((scale - 1) / (cropScale - 1)) +
    height * 0.006 * depth * (1 - airTravel) * (1 - pullback);
  const push = clamp((p - 0.48) / 0.13) ** 2.4;
  const departure = range(p, 0.48, 0.555);
  const near = range(
    p,
    homeStoryTiming.breezeApproach,
    homeStoryTiming.breezeNear,
  );
  const crossing = range(
    p,
    homeStoryTiming.skyReveal,
    homeStoryTiming.skyStart,
  );

  return {
    progress: p,
    storyScale: 1 / (1 - 0.075 * depth * push),
    storyY: -height * 0.014 * depth * push,
    textOpacity: 1 - departure,
    textY: -12 * departure,
    tpScale: 1 / (1 + 0.18 * depth * range(p, 0.48, 0.61)),
    tpY: 22 * depth * near,
    tpOpacity: 1 - range(crossing, 0.08, 0.86),
    storyVisible: p < homeStoryTiming.skyStart,
    skyVisible: p > homeStoryTiming.skyReveal,
    skyEdge: mix(
      -35,
      145,
      range(p, homeStoryTiming.skyReveal, homeStoryTiming.skyStart),
    ),
    scale,
    originY,
    imageY,
    exposure: range(p, 0.755, end),
    storyLight: 0.035 * near,
    skyLight: 0.06 * range(p, 0.58, 0.62) * (1 - range(p, 0.735, 0.855)),
    headerIvory: p >= 0.745,
    headerSky: p >= 0.585 && p < 0.745,
    headerShade: range(p, 0.73, 0.76) * (1 - range(p, 0.8, end)),
    occlusion: near * (1 - range(p, 0.61, 0.66)),
    near,
    crossing,
    airTravel,
    dissolve: range(
      p,
      homeStoryTiming.breezeOutStart,
      homeStoryTiming.breezeOutEnd,
    ),
    inertia:
      width < 1200
        ? 0
        : depth * range(p, 0.48, 0.515) * (1 - range(p, 0.855, end)),
    chapter: p < 0.27 ? 'arrival' : p < 0.78 ? 'perspective' : 'worlds',
    railOpacity: 1 - range(p, 0.555, 0.61) + range(p, 0.79, 0.845),
    railProgress:
      Math.min(p, homeStoryTiming.settled) / homeStoryTiming.settled,
  };
}

/** The same TP remains mounted. Content moves around it; no second clock. */
export function arrivalFrame(
  progress: number,
  width: number,
  storyReady: boolean,
) {
  const p = clamp(progress);
  const depthFactor = width < 768 ? 0.5 : width < 1200 ? 0.7 : 1;
  const depth = range(p, 0.16, 0.33);
  const architecture = storyReady ? cameraArrival((p - 0.205) / 0.115) : 0;
  const move = (x: number, y: number, scale = 1) =>
    `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0) scale(${scale.toFixed(5)})`;
  const opacity = (v: number) => v.toFixed(5);
  const copy = (start: number, end: number, direction: number) => {
    const leave = range(p, start, end);
    return {
      opacity: opacity(1 - leave),
      transform: move(direction * 12 * leave, -8 * leave),
    };
  };
  const reveal = range(p, 0.27, 0.34);
  return {
    '.sh-welcome-en': copy(0.195, 0.265, -1),
    '.sh-welcome-vi': copy(0.208, 0.278, 1),
    '.sh-discovery-axis': {
      opacity: opacity(1 - range(p, 0.2, 0.27)),
      transform: move(0, -8 * depth),
    },
    '.sh-story': {
      opacity: opacity(reveal),
      transform: move(0, 12 * (1 - reveal)),
    },
    '.sh-center-copy': {
      opacity: opacity(reveal),
      transform: move(0, 8 * (1 - reveal)),
    },
    '.sh-monogram': {
      transform: `translate3d(calc(var(--sh-monogram-story-x, 0px) * ${depth}), calc(var(--sh-monogram-story-y) * ${depth}), 0) scale(calc(1 + (var(--sh-monogram-story-scale) - 1) * ${depth}))`,
    },
    '.sh-leaves': {
      transform: move(12 * depth * depthFactor, -42 * depth * depthFactor),
    },
    '[data-hero-layer="architecture-a"]': {
      opacity: opacity(1 - architecture),
      transform: move(
        -6 * depth * depthFactor,
        -4 * depth * depthFactor,
        1 + 0.024 * depth * depthFactor,
      ),
    },
    '[data-hero-layer="architecture-b"]': {
      opacity: opacity(architecture),
      transform: move(
        6 * (1 - depth) * depthFactor,
        4 * (1 - depth) * depthFactor,
        1 + 0.024 * (1 - depth) * depthFactor,
      ),
    },
    '.sh-scroll-indicator': { opacity: opacity(1 - range(p, 0.16, 0.2)) },
  } satisfies Record<string, Partial<CSSStyleDeclaration>>;
}

export function portalDeparture(p: number, index: number, width: number) {
  const leave = range(p, 0.205 + index * 0.009, 0.285 + index * 0.009);
  const depth = width < 768 ? 0.5 : width < 1200 ? 0.7 : 1;
  return {
    opacity: 1 - leave,
    y: 52 * depth * leave,
    scale: 1 - 0.025 * leave,
  };
}

// Living → Bedroom → Bathroom → Kitchen, then editorial copy and CTA.
export const worldRevealStarts = [
  0.825, 0.834, 0.843, 0.852, 0.862, 0.87, 0.878, 0.886, 0.889, 0.895,
] as const;
export function worldContentReveal(p: number, order: number) {
  const start = worldRevealStarts[order] ?? 0.895;
  return range(p, start, start + 0.025);
}

export type CameraPose = {
  storyScale: number;
  storyY: number;
  scale: number;
  imageY: number;
};
/** Only architecture's last 2px / .25% may trail input; settles in ~180ms. */
export function settleCamera(
  target: CameraPose,
  previous: CameraPose | null,
  elapsed: number,
  strength: number,
) {
  const pose = { ...target };
  let moving = false;
  if (previous && strength > 0) {
    const decay = Math.exp(-Math.max(1, elapsed) / 32);
    for (const key of ['storyScale', 'storyY', 'scale', 'imageY'] as const) {
      const isScale = key === 'scale' || key === 'storyScale';
      const limit = (isScale ? 0.0025 : 2) * strength;
      const offset =
        Math.max(-limit, Math.min(limit, previous[key] - target[key])) * decay;
      if (Math.abs(offset) > (isScale ? 0.00001 : 0.01)) {
        pose[key] += offset;
        moving = true;
      }
    }
  }
  return { pose, moving };
}
