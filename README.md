# @jandragsbaek/oxlint-plugin

Oxlint rules and presets, learned in real projects and shared between them. The rules keep
tests deterministic, Effect code idiomatic, React code honest about its effects, files short,
and code free of comments that explain it.

The rules started in [Glose](https://github.com/jandragsbaek/glose) and are adapted from
[T3 Code](https://github.com/pingdotgg/t3code) under its MIT license.

## Install

```bash
pnpm add -D @jandragsbaek/oxlint-plugin
```

## Use

Each preset is an Oxlint config object. Put the ones a project needs in `extends`. They load
the plugin themselves, so `jsPlugins` stays empty.

With [Vite+](https://viteplus.dev), in `vite.config.ts`:

```ts
import { effect, react, recommended, tests } from "@jandragsbaek/oxlint-plugin/presets";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    extends: [recommended, tests, effect, react],
  },
});
```

With plain Oxlint, in `oxlint.config.ts`:

```ts
import { recommended, tests } from "@jandragsbaek/oxlint-plugin/presets";
import { defineConfig } from "oxlint";

export default defineConfig({ extends: [recommended, tests] });
```

Later entries override earlier ones, and the project's own `rules` and `overrides` override
them all.

### Presets

| Preset                       | For                                                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recommended`                | Any TypeScript project. Built-in rule choices, plus `max-file-lines`, `max-file-lines-hard`, `namespace-node-imports`, `no-explanatory-comments`, `no-unscoped-has`, `require-suppression-reason`. |
| `tests`                      | Projects with Vitest tests. The rules read the filename and check only test files.                                                                                                                 |
| `effect`                     | Projects on [Effect](https://effect.website). `prefer-effect-fn` is off in test files.                                                                                                             |
| `react`                      | React projects. Strict hook and render rules, and `no-unreasoned-state-sync`.                                                                                                                      |
| `reactCompiler({ files })`   | Files the React Compiler compiles. The compiler owns memoization. Use with `react`.                                                                                                                |
| `productCopy({ files })`     | Code that holds text users or agents read: no em dashes.                                                                                                                                           |
| `uiText({ files, message })` | Interface code with i18n catalogs: no inline JSX text. `message` tells the reader where the catalogs are.                                                                                          |

The presets that take `files` skip test files. `excludeFiles` skips more. Glose's setup:

```ts
extends: [
  recommended,
  tests,
  effect,
  react,
  reactCompiler({ files: ["apps/web/src/**/*.{ts,tsx}"] }),
  productCopy({ files: ["apps/*/src/**", "packages/*/src/**"] }),
  uiText({
    files: ["apps/web/src/**"],
    message: "Move this text to apps/web/src/i18n and read it with useT().",
  }),
],
```

### Rules

All rules have the `jandragsbaek/` prefix.

| Rule                                 | Rejects                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `max-file-lines`                     | Files longer than 500 lines (option `max`). A file that must stay long says why: `/* oxlint-disable jandragsbaek/max-file-lines -- <why> */`. |
| `max-file-lines-hard`                | Files longer than 750 lines (option `max`). No disable directive silences it: split the file.                                                 |
| `namespace-node-imports`             | Node built-ins imported other than as a namespace with the canonical name (`import * as NodeFS from "node:fs"`).                              |
| `no-dom-test-environment`            | Per-file Vitest environment pragmas and DOM emulator imports (jsdom, happy-dom).                                                              |
| `no-em-dash-copy`                    | Em dashes in strings and JSX text.                                                                                                            |
| `no-explanatory-comments`            | Every comment except a license header at the top of the file and tool directives. See [Comments](#comments).                                  |
| `no-hookless-use-function`           | `use*` functions that call no hook; the React Compiler skips them.                                                                            |
| `no-inline-schema-compile`           | Effect Schema decoders and encoders compiled inside function bodies.                                                                          |
| `no-manual-effect-runtime-in-tests`  | Effect runtimes made or run by hand in tests; use `@effect/vitest`.                                                                           |
| `no-manual-memo`                     | `useMemo`, `useCallback` and memo directives where the React Compiler memoizes.                                                               |
| `no-polling-loop-in-tests`           | Test loops that spin on ticks until a condition holds.                                                                                        |
| `no-real-time-wait-in-tests`         | Real-clock waits in tests.                                                                                                                    |
| `no-test-in-loop`                    | Tests declared in a `for` loop; use `.each`.                                                                                                  |
| `no-test-timeout-or-unreasoned-skip` | Per-test timeouts and retries, and skipped or focused tests with no tracking issue.                                                           |
| `no-unreasoned-state-sync`           | Every React effect hook, until a suppression above it says what it keeps in step.                                                             |
| `no-unscoped-has`                    | Tailwind `has-[...]` variants not anchored to a class, attribute, id or tag.                                                                  |
| `no-untranslated-ui-text`            | JSX text and user-facing attributes that are not read from a catalog.                                                                         |
| `no-wall-clock-in-tests`             | `Date.now()`, `new Date()`, `performance.now()` and `process.hrtime` in tests.                                                                |
| `prefer-catch-tags`                  | `Effect.catchTag`; use `Effect.catchTags`.                                                                                                    |
| `prefer-effect-fn`                   | Functions that return `Effect.gen`; use `Effect.fn`.                                                                                          |
| `require-suppression-reason`         | Lint and type-checker suppressions with no reason in the directive itself.                                                                    |

### Comments

The code explains itself: names, types, small functions and tests carry what a comment would.
`no-explanatory-comments` allows only:

- A license header: a comment block before any code that carries a license or copyright notice
  (`SPDX-License-Identifier`, `Copyright`, `@license`, `/*!`, an MIT or "Licensed under" notice).
- Tool directives, which a tool reads:
  - lint: `oxlint-disable*`, `oxlint-enable`, `eslint-disable*`, `eslint-enable`, `biome-ignore`
  - type checker: `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`, `@ts-check`,
    `/// <reference …>`, `/// <amd-module …>`, `/// <amd-dependency …>`, `@effect-diagnostics`
  - bundler and JSX: `@__PURE__`, `@__NO_SIDE_EFFECTS__` (and their `#__` forms), `@jsx`, `@jsxFrag`,
    `@jsxImportSource`, `@jsxRuntime`, `@vite-ignore`, `webpack*:` and `turbopack*:` magic
    comments, `# sourceMappingURL=`, `# sourceURL=`
  - formatter: `oxfmt-ignore`, `prettier-ignore`, `dprint-ignore`
  - coverage: `v8 ignore`, `c8 ignore`, `istanbul ignore`, `node:coverage`
  - tests and editors: `@vitest-environment`, `@jest-environment`, `@refresh reset`, `cspell:`,
    and `quarantine: #<issue>` above a skipped test (read by `no-test-timeout-or-unreasoned-skip`)

Everything else fails: JSDoc, TODOs, section headers and "why" comments. A suppression's reason
goes in the directive, after `--`.

## Add a rule

A rule learned in a project goes here, so every project gets it.

1. Add `src/rules/<name>.ts` and `src/rules/<name>.test.ts`. The tests run real Oxlint on
   fixture files.
2. Register the rule in `src/index.ts`, and turn it on in a preset in `src/presets.ts`.
3. Add it to the table above.
4. `pnpm check` runs what CI runs: format, lint, typecheck, tests and the package build.

## Release

Bump `version` in `package.json`, then push a `v<version>` tag. The Release workflow publishes
to npm with provenance, through npm trusted publishing (no token).
