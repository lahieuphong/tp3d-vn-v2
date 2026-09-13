export type HeroVariant = 'desktop' | 'tablet' | 'mobile';
export type HeroPlayback = 'static' | 'paused' | 'slow' | 'playing';

export const HERO_EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
export const HERO_DURATIONS: Record<HeroVariant, number> = {
  desktop: 13000,
  tablet: 11000,
  mobile: 10000,
};

export function heroVariant(width: number): HeroVariant {
  return width >= 1024 ? 'desktop' : width > 760 ? 'tablet' : 'mobile';
}

export function heroPlayback({
  ratio,
  hidden,
  reduced,
  ready,
}: {
  ratio: number;
  hidden: boolean;
  reduced: boolean;
  ready: boolean;
}): HeroPlayback {
  if (reduced || !ready) return 'static';
  if (hidden || ratio <= 0) return 'paused';
  return ratio < 0.25 ? 'slow' : 'playing';
}

/** One photograph, an architectural aperture and at most three material planes.
 * Every track shares the same clock; the first and last frames are identical. */
export function heroTimeline(width: number, height: number) {
  const variant = heroVariant(width);
  const compact = variant !== 'desktop';
  const apertureSide = Math.min(width, height) * (compact ? 0.56 : 0.48);
  const insetY = ((height - apertureSide) / (height * 2)) * 100;
  const insetX = ((width - apertureSide) / (width * 2)) * 100;
  const aperture = `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}%)`;
  const full = 'inset(0% 0% 0% 0%)';
  const track = (selector: string, frames: Keyframe[]) => ({
    selector,
    frames: frames.map((frame) => ({ easing: HERO_EASE, ...frame })),
  });

  const tracks = [
    track(':scope > .editorial-image', [
      { offset: 0, clipPath: full },
      { offset: 0.27, clipPath: full },
      { offset: 0.39, clipPath: aperture },
      { offset: 0.43, clipPath: aperture },
      { offset: 0.61, clipPath: full },
      { offset: 1, clipPath: full },
    ]),
    track(':scope > .editorial-image img', [
      { offset: 0, transform: 'scale(1)', easing: 'ease-in-out' },
      { offset: 0.2, transform: 'scale(1.02)' },
      { offset: 0.43, transform: `scale(${compact ? 1.04 : 1.08})` },
      { offset: 0.64, transform: `scale(${compact ? 1.06 : 1.12})` },
      { offset: 0.86, transform: 'scale(1.02)' },
      { offset: 0.97, transform: 'scale(1)' },
      { offset: 1, transform: 'scale(1)' },
    ]),
    track('.hero-motion-plane-left', [
      { offset: 0, transform: 'translateX(-101%)' },
      { offset: 0.14, transform: 'translateX(-101%)' },
      { offset: 0.29, transform: 'translateX(0%)' },
      { offset: 0.4, transform: 'translateX(0%)' },
      { offset: 0.56, transform: 'translateX(-101%)' },
      { offset: 0.66, transform: 'translateX(-101%)' },
      { offset: 0.77, transform: 'translateX(0%)' },
      { offset: 0.94, transform: 'translateX(-101%)' },
      { offset: 1, transform: 'translateX(-101%)' },
    ]),
    track('.hero-motion-plane-right', [
      { offset: 0, transform: 'translateX(101%)' },
      { offset: 0.18, transform: 'translateX(101%)' },
      { offset: 0.32, transform: 'translateX(40%)' },
      { offset: 0.41, transform: 'translateX(40%)' },
      { offset: 0.58, transform: 'translateX(101%)' },
      { offset: 0.64, transform: 'translateX(101%)' },
      { offset: 0.79, transform: 'translateX(0%)' },
      { offset: 0.94, transform: 'translateX(101%)' },
      { offset: 1, transform: 'translateX(101%)' },
    ]),
    // The existing shade stays above every plane, including the ivory surface.
    track(':scope > .hero-shade', [
      { offset: 0, opacity: 0.31 },
      { offset: 0.14, opacity: 0.31 },
      { offset: 0.18, opacity: 0.58 },
      { offset: 0.58, opacity: 0.58 },
      { offset: 0.62, opacity: 0.31 },
      { offset: 0.64, opacity: 0.58 },
      { offset: 0.94, opacity: 0.58 },
      { offset: 0.98, opacity: 0.31 },
      { offset: 1, opacity: 0.31 },
    ]),
  ];

  if (!compact) {
    tracks.push(
      track('.hero-motion-plane-sill', [
        { offset: 0, transform: 'translateY(101%)' },
        { offset: 0.69, transform: 'translateY(101%)' },
        { offset: 0.8, transform: 'translateY(0%)' },
        { offset: 0.95, transform: 'translateY(101%)' },
        { offset: 1, transform: 'translateY(101%)' },
      ]),
    );
  }

  return { duration: HERO_DURATIONS[variant], variant, tracks };
}
