import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const source = readFileSync(
  new URL('../components/home/experience/home-story-frame.ts', import.meta.url),
  'utf8',
);
const loaded = { exports: {} };
runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { module: loaded, exports: loaded.exports },
);
const { arrivalFrame, portalDeparture } = loaded.exports;
for (const width of [
  375, 390, 430, 768, 820, 1024, 1280, 1366, 1440, 1728, 1920, 2560,
]) {
  const samples = Array.from({ length: 101 }, (_, i) =>
    arrivalFrame(i / 100, width, true),
  );
  assert.deepEqual(
    samples,
    Array.from({ length: 101 }, (_, i) =>
      arrivalFrame((100 - i) / 100, width, true),
    ).reverse(),
  );
  for (const frame of samples) {
    assert(
      Math.abs(
        Number(frame['[data-hero-layer="architecture-a"]'].opacity) +
          Number(frame['[data-hero-layer="architecture-b"]'].opacity) -
          1,
      ) < 0.0001,
    );
    assert.equal(
      frame['.sh-monogram'].opacity,
      undefined,
      'one persistent TP never crossfades',
    );
  }
  assert.deepEqual(
    arrivalFrame(0, width, true),
    arrivalFrame(0.16, width, true),
    'stable Arrival',
  );
  assert.deepEqual(
    arrivalFrame(0.34, width, true),
    arrivalFrame(0.48, width, true),
    'stable Philosophy',
  );
  assert.equal(
    arrivalFrame(0.4, width, false)['[data-hero-layer="architecture-a"]']
      .opacity,
    '1.00000',
    'fallback retains architecture',
  );
  const departing = Array.from({ length: 4 }, (_, i) =>
    portalDeparture(0.25, i, width),
  );
  assert(
    departing.every((p, i) => i === 0 || p.opacity > departing[i - 1].opacity),
    'staggered portal departure',
  );
  for (let i = 0; i < 4; i++)
    assert.equal(portalDeparture(0.34, i, width).opacity, 0);
}
const hero = readFileSync(
  new URL('../components/home/hero/spatial-hero.tsx', import.meta.url),
  'utf8',
);
assert.doesNotMatch(
  hero,
  /useLayoutEffect|requestAnimationFrame|mountSpatialHero/,
  'Hero is presentation only',
);
console.log(
  'Arrival/Perspective passed: quiet holds, persistent TP, staggered portals, source fallback, all 12 sizes and exact reverse sampling.',
);
