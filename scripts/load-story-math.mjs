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

/** home-motion with the scroll follow switched off (MOTION.follow.tau = 0),
 * for DOM doubles that assert the frame a scroll position rests on. With the
 * follow on, that frame is reached a few frames later; the checks that turn
 * it on prove both agree. */
export function loadRawScrollMotion() {
  const motion = loadStoryMath('home-motion');
  return {
    ...motion,
    MOTION: {
      ...motion.MOTION,
      follow: { ...motion.MOTION.follow, tau: { fine: 0, coarse: 0 } },
    },
  };
}
