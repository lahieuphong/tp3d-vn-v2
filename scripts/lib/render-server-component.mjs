/** Renders a TSX server component to static markup outside the framework:
 * the real module, transpiled by TypeScript, with imports resolved from an
 * explicit map (anything unmapped fails the check). Used by the World checks
 * to assert real markup without a browser. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
export const root = new URL('../../', import.meta.url);
export const read = (path) => readFileSync(new URL(path, root), 'utf8');
const jsxRuntime = require('react/jsx-runtime');
const { renderToStaticMarkup } = require('react-dom/server');

/** `source` is TSX text; `modules` maps import specifiers to exports. */
export function loadSource(source, modules = {}, label = 'module') {
  const loaded = { exports: {} };
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module: loaded,
      exports: loaded.exports,
      URL,
      URLSearchParams,
      require: (name) => {
        if (name === 'react/jsx-runtime') return jsxRuntime;
        if (name.endsWith('.css')) return {};
        assert(name in modules, `unexpected import ${name} in ${label}`);
        return modules[name];
      },
    },
  );
  return loaded.exports;
}

export const load = (path, modules) => loadSource(read(path), modules, path);

/** next/link as plain server markup: an anchor with its props. */
export const linkModule = {
  __esModule: true,
  default: ({ href, prefetch: _prefetch, children, ...props }) =>
    jsxRuntime.jsx('a', { href, ...props, children }),
};

/** Client islands render nothing on the server path being checked. */
export const nullComponent = () => null;

export const render = (component, props = {}) =>
  renderToStaticMarkup(jsxRuntime.jsx(component, props));
