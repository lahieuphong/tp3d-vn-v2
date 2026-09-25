# Homepage opening — scroll interaction

The opening now follows native scroll, replacing the former 20-second autoplay system. No timer, loop, Play/Pause control, pointer parallax or animation-library dependency remains.

Current source lives in `components/home/hero/`, composed by `components/sections/home-hero.tsx`. One shared monogram, ribbon and existing site header span Discovery → Story. The sticky stage releases into the new Worlds → Spaces → Materials chapters. The original A→B progress range is preserved; a separate 40vh departure fades TP after Story. See [HOME-EXPERIENCE-QA.md](HOME-EXPERIENCE-QA.md) for the current five-chapter Home.

See [SPATIAL-HERO-QA.md](SPATIAL-HERO-QA.md) for progress ranges, responsive behavior, verified checks and remaining browser QA. Run `yarn check:hero` for the current controller tests; the compatibility command `node scripts/check-hero-motion.mjs` runs the same tests. Browser doubles do not establish RAM, GPU or FPS acceptance.
