export type HeroVariant = 'desktop' | 'tablet' | 'mobile';
export type HeroPlayback = 'static' | 'paused' | 'slow' | 'playing';
export const HERO_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
export const HERO_DURATIONS = { desktop: 17000, tablet: 15000, mobile: 13000 };
export function heroVariant(width: number): HeroVariant {
  return width >= 1024 ? 'desktop' : width > 760 ? 'tablet' : 'mobile';
}
export function heroPlayback({
  ratio,
  hidden,
  reduced,
  ready,
  manualPaused = false,
}: {
  ratio: number;
  hidden: boolean;
  reduced: boolean;
  ready: boolean;
  manualPaused?: boolean;
}): HeroPlayback {
  if (reduced || !ready) return 'static';
  if (hidden || manualPaused || ratio <= 0) return 'paused';
  return ratio < 0.25 ? 'slow' : 'playing';
}

/** Five compositions on one normalized clock. Geometry always interpolates
 * between compatible masks; all scene resets happen under the walnut wipe. */
export function heroTimeline(width: number, height: number) {
  const variant = heroVariant(width);
  const mobile = variant === 'mobile';
  const compact = variant !== 'desktop';
  const opening = mobile
    ? 'polygon(39% 37%, 87% 37%, 87% 69%, 39% 69%)'
    : compact
      ? 'polygon(49% 29%, 88% 29%, 88% 74%, 49% 74%)'
      : 'polygon(57% 22%, 85% 22%, 85% 72%, 57% 72%)';
  const angled = mobile
    ? 'polygon(23% 22%, 91% 22%, 91% 78%, 23% 78%)'
    : 'polygon(50% 8%, 92% 27%, 78% 90%, 35% 64%)';
  const expanded = mobile
    ? 'polygon(-10% -10%, 110% -10%, 110% 110%, -10% 110%)'
    : 'polygon(50% -110%, 210% 50%, 50% 210%, -110% 50%)';
  const side = Math.min(width, height) * (mobile ? 0.64 : 0.48);
  const coverScale = (Math.max(width, height) / side) * 1.04;
  const x = ((width - side) / width) * 50;
  const y = ((height - side) / height) * 50;
  const square = `polygon(${x}% ${y}%, ${100 - x}% ${y}%, ${100 - x}% ${100 - y}%, ${x}% ${100 - y}%)`;
  const squareInset = `inset(${y}% ${x}% ${y}% ${x}% round 0%)`;
  const smallCircle = `inset(${y + (50 - y) * 0.3}% ${x + (50 - x) * 0.3}% ${y + (50 - y) * 0.3}% ${x + (50 - x) * 0.3}% round 50%)`;
  const closed = 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)';
  const circleClosed = 'inset(50% 50% 50% 50% round 50%)';
  const fullInset = 'inset(0% 0% 0% 0% round 0%)';
  const swatch = mobile ? 'inset(76% 8% 16% 80%)' : 'inset(76% 6% 12% 89%)';
  const crop = mobile ? 1.18 : 1.45;
  const track = (selector: string, entries: [number, Keyframe][]) => ({
    selector,
    frames: entries.map(([seconds, values]) => ({
      offset: seconds / 17,
      easing: HERO_EASE,
      ...values,
    })),
  });
  const show = (opacity: number, y = 0): Keyframe => ({
    opacity,
    transform: `translateY(${y}px)`,
  });
  const tracks = [
    track('.emh-image-primary', [
      [0, { clipPath: opening }],
      [2.6, { clipPath: opening }],
      [4.1, { clipPath: angled }],
      [6, { clipPath: expanded }],
      [8.8, { clipPath: expanded }],
      [10.2, { clipPath: square }],
      [10.7, { clipPath: closed }],
      [15.8, { clipPath: closed }],
      [16.05, { clipPath: opening }],
      [17, { clipPath: opening }],
    ]),
    track('.emh-image-primary img', [
      [0, { transform: `scale(${crop})` }],
      [2.6, { transform: `scale(${crop + 0.04})` }],
      [6, { transform: 'scale(1)' }],
      [8.8, { transform: 'scale(1.025)' }],
      [10.7, { transform: 'scale(1.1)' }],
      [15.8, { transform: 'scale(1.1)' }],
      [16.05, { transform: `scale(${crop})` }],
      [17, { transform: `scale(${crop})` }],
    ]),
    track('.emh-word-1', [
      [0, show(1)],
      [2.7, show(1)],
      [5.5, { opacity: 0, transform: 'translate(-7%, -24px)' }],
      [15.8, show(0)],
      [16.05, show(1)],
      [17, show(1)],
    ]),
    track('.emh-word-2', [
      [0, show(0, 22)],
      [0.45, show(0, 22)],
      [1.55, show(1)],
      [3.6, show(1)],
      [5.8, show(0, -30)],
      [16, show(0, 22)],
      [17, show(0, 22)],
    ]),
    track('.emh-word-3', [
      [0, show(0, 18)],
      [1.05, show(0, 18)],
      [2.35, show(1)],
      [4.4, show(1)],
      [5.85, show(0, -20)],
      [16, show(0, 18)],
      [17, show(0, 18)],
    ]),
    track('.emh-note-opening', [
      [0, show(1)],
      [3.3, show(1)],
      [4.5, show(0)],
      [15.8, show(0)],
      [16.05, show(1)],
      [17, show(1)],
    ]),
    track('.emh-opening-caption', [
      [0, show(1)],
      [0.4, show(1)],
      [1.4, show(0)],
      [15.8, show(0)],
      [16.05, show(1)],
      [17, show(1)],
    ]),
    track('.emh-swatch-label', [
      [0, show(1)],
      [1.8, show(1)],
      [2.8, show(0)],
      [16.3, show(0)],
      [17, show(1)],
    ]),
    track('.emh-residence', [
      [0, show(0, 18)],
      [5.65, show(0, 18)],
      [6.4, show(1)],
      [8.15, show(1)],
      [9, show(0, -18)],
      [16.2, show(0, 18)],
      [17, show(0, 18)],
    ]),
    track('.emh-material', [
      [
        0,
        {
          transform: 'translateY(102%) rotate(0deg) scale(1)',
          clipPath: fullInset,
        },
      ],
      [
        7.65,
        {
          transform: 'translateY(102%) rotate(0deg) scale(1)',
          clipPath: fullInset,
        },
      ],
      [
        8.8,
        {
          transform: 'translateY(57%) rotate(0deg) scale(1)',
          clipPath: fullInset,
        },
      ],
      [
        10.2,
        {
          transform: 'translateY(0%) rotate(0deg) scale(1)',
          clipPath: squareInset,
        },
      ],
      [
        11.1,
        {
          transform: `translateY(0%) rotate(${mobile ? 0 : compact ? 18 : 38}deg) scale(1.18)`,
          clipPath: squareInset,
        },
      ],
      [
        12.8,
        {
          transform: `translateY(0%) rotate(0deg) scale(${coverScale})`,
          clipPath: squareInset,
        },
      ],
      [
        15.8,
        {
          transform: `translateY(0%) rotate(0deg) scale(${coverScale})`,
          clipPath: squareInset,
        },
      ],
      [
        16.05,
        {
          transform: 'translateY(102%) rotate(0deg) scale(1)',
          clipPath: fullInset,
        },
      ],
      [
        17,
        {
          transform: 'translateY(102%) rotate(0deg) scale(1)',
          clipPath: fullInset,
        },
      ],
    ]),
    track('.emh-material-type', [
      [0, { opacity: 1 }],
      [8.8, { opacity: 1 }],
      [9.5, { opacity: 0 }],
      [16, { opacity: 0 }],
      [16.3, { opacity: 1 }],
      [17, { opacity: 1 }],
    ]),
    track('.emh-image-secondary', [
      [0, { clipPath: circleClosed }],
      [10.6, { clipPath: circleClosed }],
      [11.35, { clipPath: smallCircle }],
      [12.8, { clipPath: 'inset(-25% -25% -25% -25% round 50%)' }],
      [13.2, { clipPath: 'inset(-25% -25% -25% -25% round 50%)' }],
      [
        14.1,
        {
          clipPath: mobile
            ? 'inset(32% 0% 18% 29% round 0%)'
            : 'inset(13% 0% 11% 36% round 0%)',
        },
      ],
      [
        15.8,
        {
          clipPath: mobile
            ? 'inset(32% 0% 18% 29% round 0%)'
            : 'inset(13% 0% 11% 36% round 0%)',
        },
      ],
      [16.05, { clipPath: circleClosed }],
      [17, { clipPath: circleClosed }],
    ]),
    track('.emh-image-secondary img', [
      [0, { transform: 'scale(1.12)' }],
      [10.6, { transform: 'scale(1.12)' }],
      [13.2, { transform: 'scale(1)' }],
      [15.8, { transform: 'scale(1.025)' }],
      [16.05, { transform: 'scale(1.12)' }],
      [17, { transform: 'scale(1.12)' }],
    ]),
    track('.emh-quiet', [
      [0, show(0, 24)],
      [13.2, show(0, 24)],
      [14.15, show(1)],
      [15.2, show(1)],
      [15.8, show(0)],
      [16.1, show(0, 24)],
      [17, show(0, 24)],
    ]),
    track('.emh-walnut', [
      [0, { clipPath: swatch }],
      [1.8, { clipPath: swatch }],
      [3.2, { clipPath: mobile ? swatch : 'inset(16% 0% 17% 86%)' }],
      [5, { clipPath: 'inset(16% 0% 17% 100%)' }],
      [14.6, { clipPath: 'inset(16% 0% 17% 100%)' }],
      [15.1, { clipPath: 'inset(43% 0% 43% 0%)' }],
      [15.65, { clipPath: 'inset(0% 0% 0% 0%)' }],
      [16.15, { clipPath: 'inset(0% 0% 0% 0%)' }],
      [17, { clipPath: swatch }],
    ]),
  ];
  const ink = [
    [0, 'var(--foreground)'],
    [15.35, 'var(--foreground)'],
    [15.8, 'var(--background)'],
    [16.25, 'var(--background)'],
    [16.85, 'var(--foreground)'],
    [17, 'var(--foreground)'],
  ] as const;
  tracks.push(
    track(
      '@header',
      ink.map(([time, color]) => [time, { '--tp-hero-ink': color }]),
    ),
  );
  tracks.push(
    track(
      '.emh-controls',
      ink.map(([time, color]) => [time, { color }]),
    ),
  );
  return { duration: HERO_DURATIONS[variant], variant, tracks };
}
