import "vite-plus/test/config";
import { defineConfig } from "vite-plus";

import { effect, recommended, tests } from "./src/presets.ts";

const BUILD_OUTPUT = ["dist", "node_modules", "pnpm-lock.yaml", "*.tsbuildinfo"];

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    hookTimeout: 60_000,
    testTimeout: 60_000,
    allowOnly: !process.env.CI,
    // Flaky tests are fixed, not retried.
    retry: 0,
  },
  pack: {
    entry: ["src/index.ts", "src/presets.ts"],
    platform: "node",
    dts: true,
    // Bundled, so a project that installs the plugin installs nothing else.
    deps: { onlyBundle: ["@oxlint/plugins", "effect"] },
    publint: true,
  },
  staged: {
    // In order, so lint reads the formatted file.
    "*": ["vp fmt --no-error-on-unmatched-pattern", "vp lint --no-error-on-unmatched-pattern"],
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
        // Rule tests hold the code each rule rejects as fixture strings.
        files: ["src/rules/*.test.ts"],
        rules: {
          "jandragsbaek/no-dom-test-environment": "off",
          "jandragsbaek/no-em-dash-copy": "off",
        },
      },
    ],
  },
});
