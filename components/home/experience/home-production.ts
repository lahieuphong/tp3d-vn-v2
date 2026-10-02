/** Loading/interaction policy only. The approved PASS 4 camera curves stay in
 * home-motion.ts and are not retimed by production enhancements. */
export const HOME_PRODUCTION = {
  scenePreload: 0.16,
  thumbnailPreload: 0.3,
  discoveryStart: 0.92,
} as const;

export function complexityTier(width: number, fine: boolean, reduced: boolean) {
  if (reduced) return 'minimal';
  if (width < 768 || !fine) return 'light';
  return width < 1200 ? 'medium' : 'full';
}
