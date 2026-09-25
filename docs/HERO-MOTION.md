# Homepage opening — superseded implementation

The former five-part geometric editorial opening has been replaced by the two-scene architectural SpatialHero. Its unused `components/hero/` files have been removed after checking that the application no longer imports them. Historical validation of that implementation does not validate the replacement.

See [Spatial opening — implementation and QA record](SPATIAL-HERO-QA.md) for the current art direction, assets, implementation scope and browser verification status.

Current source is under `components/home/hero/`, composed by `components/sections/home-hero.tsx`. The controller uses one 20-second WAAPI clock for discovery, the ribbon transition, the studio story, and the return. It pauses for visibility, navigation interaction and manual controls, respects reduced motion, and owns cleanup of its animations, observers, listeners and queued work.

Run `yarn check:hero` for the current deterministic lifecycle checks. The former command, `node scripts/check-hero-motion.mjs`, remains a compatibility entry point for the same new checks. These checks use browser doubles; they do not measure browser RAM, GPU/VRAM, compositor layers or rendered FPS. Real browser observations belong in the current QA record.
