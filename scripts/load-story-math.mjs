/** Evaluate the real pure HomeStory TypeScript modules for Node assertions. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const modules = new Map();
export function loadStoryMath(name) {
  if (modules.has(name)) return modules.get(name);
  assert.match(name, /^[a-z-]+$/);
  const loaded = { exports: {} };
  modules.set(name, loaded.exports);
  runInNewContext(
    ts.transpileModule(
      readFileSync(
        new URL(`../components/home/experience/${name}.ts`, import.meta.url),
        'utf8',
      ),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    {
      module: loaded,
      exports: loaded.exports,
      require(specifier) {
        assert.match(specifier, /^\.\/[a-z-]+$/);
        return loadStoryMath(specifier.slice(2));
      },
    },
  );
  return loaded.exports;
}

/** home-motion as a DOM double wants it. `follow: false` switches the scroll
 * follow off (MOTION.follow.tau = 0, also where the room orbit's camera
 * travels: MOTION.follow.travel.tau) and `pace: false` drops the pace table
 * (MOTION.pace = null: scroll share is story progress), for doubles that
 * assert the frame a story position rests on. With the follow on, that frame
 * is reached a few frames later; with pacing, at another scroll position.
 * The checks that turn them on prove both. */
export function loadMotion({ follow = true, pace = true } = {}) {
  const motion = loadStoryMath('home-motion');
  if (follow && pace) return motion;
  return {
    ...motion,
    MOTION: {
      ...motion.MOTION,
      follow: follow
        ? motion.MOTION.follow
        : {
            ...motion.MOTION.follow,
            tau: { fine: 0, coarse: 0 },
            travel: {
              ...motion.MOTION.follow.travel,
              tau: { fine: 0, coarse: 0 },
            },
          },
      pace: pace ? motion.MOTION.pace : null,
    },
  };
}
