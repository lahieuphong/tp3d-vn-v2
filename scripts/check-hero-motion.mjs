/** Pure lifecycle policy + the actual pre-paint bootstrap; no browser dependency. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const compiled = ts.transpileModule(
  readFileSync(
    new URL('../components/hero/hero-motion-policy.ts', import.meta.url),
    'utf8',
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
);
const exports = {};
runInNewContext(compiled.outputText, { exports });
const { chooseHeroMotion, HERO_BOOTSTRAP, HERO_SESSION_KEY } = exports;
for (const seen of [false, true]) {
  for (const reduced of [false, true]) {
    for (const awayFromHero of [false, true]) {
      const expected = awayFromHero
        ? 'settled'
        : reduced
          ? 'reduced'
          : seen
            ? 'short'
            : 'full';
      assert.equal(chooseHeroMotion({ seen, reduced, awayFromHero }), expected);
      const host = { dataset: {} };
      runInNewContext(HERO_BOOTSTRAP, {
        performance: { now: () => 100 },
        document: { currentScript: { parentElement: host }, hidden: false },
        location: { hash: '' },
        scrollY: awayFromHero ? 100 : 0,
        matchMedia: () => ({ matches: reduced }),
        sessionStorage: {
          getItem: (key) => {
            assert.equal(key, HERO_SESSION_KEY);
            return seen ? '1' : null;
          },
        },
      });
      assert.equal(
        host.dataset.heroMotion,
        expected,
        'Bootstrap and React policy must agree before hydration',
      );
      assert.equal(host.dataset.heroBootstrapped, 'true');
    }
  }
}
for (const overrides of [
  {},
  { location: { hash: '#introduction' } },
  { document: { hidden: true } },
]) {
  const host = { dataset: {} };
  runInNewContext(HERO_BOOTSTRAP, {
    performance: { now: () => 100 },
    document: {
      currentScript: { parentElement: host },
      hidden: overrides.document?.hidden ?? false,
    },
    location: overrides.location ?? { hash: '' },
    scrollY: 0,
    matchMedia: () => ({ matches: false }),
    sessionStorage: {
      getItem: () => {
        throw new Error('Storage disabled');
      },
    },
  });
  assert.equal(
    host.dataset.heroMotion,
    Object.keys(overrides).length ? 'settled' : 'full',
  );
}
console.log(
  'Hero policy passed: fresh/return session, reduced motion, restored scroll, hash entry, hidden tab and blocked storage; bootstrap matches client decisions.',
);
