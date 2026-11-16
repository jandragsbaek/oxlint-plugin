import "vite-plus/test/config";
import { defineConfig } from "vite-plus";

import { effect, recommended, tests } from "./src/presets.ts";

const BUILD_OUTPUT = ["dist", "node_modules", "pnpm-lock.yaml", "*.tsbuildinfo"];
const BUNDLED_SO_CONSUMERS_INSTALL_NOTHING_ELSE = ["@oxlint/plugins", "effect"];
const FORMAT_FIRST_SO_LINT_READS_THE_FORMATTED_FILE = "vp fmt --no-error-on-unmatched-pattern";
const RULE_TESTS_HOLD_REJECTED_CODE_AS_FIXTURE_STRINGS = ["src/rules/*.test.ts"];

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    hookTimeout: 60_000,
    testTimeout: 60_000,
    allowOnly: !process.env.CI,
    retry: 0,
  },
  pack: {
    entry: ["src/index.ts", "src/presets.ts"],
    platform: "node",
    dts: true,
    deps: { onlyBundle: BUNDLED_SO_CONSUMERS_INSTALL_NOTHING_ELSE },
    publint: true,
  },
  staged: {
    "*": [FORMAT_FIRST_SO_LINT_READS_THE_FORMATTED_FILE, "vp lint --no-error-on-unmatched-pattern"],
  },
  fmt: {
    ignorePatterns: BUILD_OUTPUT,
    sortPackageJson: {},
  },
  lint: {
    extends: [recommended, tests, effect],
    ignorePatterns: BUILD_OUTPUT,
    overrides: [
      {
        files: RULE_TESTS_HOLD_REJECTED_CODE_AS_FIXTURE_STRINGS,
        rules: {
          "jandragsbaek/no-dom-test-environment": "off",
          "jandragsbaek/no-em-dash-copy": "off",
        },
      },
    ],
  },
});
