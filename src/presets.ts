import type { OxlintConfig, OxlintOverride } from "oxlint";
import * as NodePath from "node:path";
import * as NodeURL from "node:url";

// The plugin is the sibling entry: index.ts in source, index.mjs once built.
const here = NodeURL.fileURLToPath(import.meta.url);
const PLUGIN_PATH = NodePath.join(NodePath.dirname(here), `index${NodePath.extname(here)}`);
const jsPlugins: OxlintConfig["jsPlugins"] = [PLUGIN_PATH];

export const TEST_FILES = [
  "**/*.{test,spec,testkit}.{ts,tsx,js,jsx,mts,cts,mjs,cjs}",
  "**/{test,tests,__tests__,testkit,testing,fixtures,integration}/**",
];

interface FileScope {
  /** Globs the rules apply to, relative to the config file. */
  readonly files: ReadonlyArray<string>;
  /** Globs inside `files` the rules skip. Test files are always skipped. */
  readonly excludeFiles?: ReadonlyArray<string>;
}

const scoped = (
  scope: FileScope,
  rules: NonNullable<OxlintOverride["rules"]>,
  excludeTests = true,
): OxlintOverride => {
  const excludeFiles = [...(excludeTests ? TEST_FILES : []), ...(scope.excludeFiles ?? [])];
  return {
    files: [...scope.files],
    ...(excludeFiles.length > 0 ? { excludeFiles } : {}),
    rules,
  };
};

/** Built-in rule choices and the plugin rules that fit any TypeScript project. */
export const recommended: OxlintConfig = {
  plugins: ["eslint", "oxc", "unicorn", "typescript"],
  jsPlugins,
  categories: {
    correctness: "warn",
    suspicious: "warn",
    perf: "warn",
  },
  rules: {
    "eslint/no-await-in-loop": "off",
    "eslint/no-control-regex": "off",
    "eslint/no-empty-pattern": "error",
    "eslint/no-new": "error",
    "eslint/no-shadow": "off",
    "eslint/no-underscore-dangle": "off",
    "eslint/no-unneeded-ternary": "error",
    "eslint/no-unsafe-optional-chaining": "error",
    "eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
    ],
    "oxc/no-accumulating-spread": "error",
    "oxc/no-map-spread": "off",
    "typescript/no-extraneous-class": "error",
    "typescript/no-this-alias": "off",
    "unicorn/consistent-function-scoping": "off",
    "unicorn/no-array-reverse": "off",
    "unicorn/no-array-sort": "off",
    "unicorn/no-new-array": "off",
    "unicorn/no-useless-fallback-in-spread": "error",
    "unicorn/no-useless-spread": "error",
    "unicorn/prefer-add-event-listener": "off",
    "unicorn/prefer-array-find": "off",
    "unicorn/prefer-set-has": "off",
    "unicorn/prefer-string-starts-ends-with": "off",
    "unicorn/require-module-specifiers": "error",
    "jandragsbaek/namespace-node-imports": "error",
    "jandragsbaek/no-low-value-comments": "error",
    "jandragsbaek/no-unscoped-has": "error",
    "jandragsbaek/require-suppression-reason": "error",
  },
  options: {
    reportUnusedDisableDirectives: "error",
  },
};

/** Deterministic tests: no real time, no polling, no timeouts or unreasoned skips. */
export const tests: OxlintConfig = {
  jsPlugins,
  rules: {
    // These rules read the filename and only check test files.
    "jandragsbaek/no-dom-test-environment": "error",
    "jandragsbaek/no-polling-loop-in-tests": "error",
    "jandragsbaek/no-real-time-wait-in-tests": "error",
    "jandragsbaek/no-test-in-loop": "error",
    "jandragsbaek/no-test-timeout-or-unreasoned-skip": "error",
    "jandragsbaek/no-wall-clock-in-tests": "error",
  },
};

/** Effect code: Effect.fn, catchTags, hoisted Schema compilers, @effect/vitest. */
export const effect: OxlintConfig = {
  jsPlugins,
  rules: {
    "jandragsbaek/no-inline-schema-compile": "error",
    "jandragsbaek/no-manual-effect-runtime-in-tests": "error",
    "jandragsbaek/prefer-catch-tags": "error",
    "jandragsbaek/prefer-effect-fn": "error",
  },
  overrides: [{ files: TEST_FILES, rules: { "jandragsbaek/prefer-effect-fn": "off" } }],
};

/** React: strict hook and render rules, and a reason on every effect that stays. */
export const react: OxlintConfig = {
  plugins: ["react"],
  jsPlugins,
  rules: {
    "react-hooks/exhaustive-deps": "off",
    "react-in-jsx-scope": "off",
    "react/capitalized-calls": "error",
    "react/exhaustive-effect-dependencies": "error",
    "react/immutability": "error",
    "react/memo-dependencies": "error",
    "react/no-array-index-key": "error",
    "react/no-object-type-as-default-prop": "off",
    "react/no-unstable-nested-components": "error",
    "react/purity": "error",
    "react/refs": "error",
    "react/set-state-in-effect": "error",
    "react/static-components": "error",
    // Skips test files itself.
    "jandragsbaek/no-unreasoned-state-sync": "error",
  },
};

/**
 * Files the React Compiler compiles. The compiler owns memoization, and it caches `use*`
 * functions only if they call a hook. Use with `react`.
 */
export const reactCompiler = (scope: FileScope): OxlintConfig => ({
  jsPlugins,
  overrides: [
    scoped(
      scope,
      {
        "react/globals": "error",
        "react/hooks": "error",
        // The compiler memoizes context values; this rule would ask for useMemo.
        "react/jsx-no-constructed-context-values": "off",
        "react/preserve-manual-memoization": "error",
        "react/set-state-in-render": "error",
        "react/unsupported-syntax": "error",
        "jandragsbaek/no-manual-memo": "error",
      },
      false,
    ),
    scoped(scope, { "jandragsbaek/no-hookless-use-function": "error" }),
  ],
});

/** Product copy that users or agents read: no em dashes. Test files are skipped. */
export const productCopy = (scope: FileScope): OxlintConfig => ({
  jsPlugins,
  overrides: [scoped(scope, { "jandragsbaek/no-em-dash-copy": "error" })],
});

/**
 * Interface text lives in message catalogs, never inline in JSX. `message` names the
 * project's catalogs and how to read them. Test files are skipped.
 */
export const uiText = (scope: FileScope & { readonly message?: string }): OxlintConfig => ({
  jsPlugins,
  overrides: [
    scoped(scope, {
      "jandragsbaek/no-untranslated-ui-text":
        scope.message === undefined ? "error" : ["error", { message: scope.message }],
    }),
  ],
});
