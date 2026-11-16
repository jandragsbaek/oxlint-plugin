import { assert, describe } from "@effect/vitest";

import { createOxlintRuleHarness } from "../../test/utils.ts";

const RULE = "jandragsbaek/no-explanatory-comments";
const rule = createOxlintRuleHarness(RULE, { filename: "fixture.tsx" });
const SOURCE_MAP_SPLIT_TO_HIDE_IT_FROM_VITEST = ["sourceMapping", "URL"].join("");
const DIAGNOSTIC = /jandragsbaek\(no-explanatory-comments\)/g;
const assertReportCount = (count: number) => (output: string) =>
  assert.strictEqual(output.match(DIAGNOSTIC)?.length, count);

describe(RULE, () => {
  rule.valid(
    "allows lint directives in every form",
    `
      /* oxlint-disable no-console -- this script reports to the terminal */
      /* oxlint-enable no-console */
      /* eslint-disable no-console -- same, through the eslint spelling */
      /* eslint-enable no-console */
      // oxlint-disable-next-line no-unused-vars -- kept for the fixture
      const a = 1;
      const b = 2; // eslint-disable-line no-unused-vars -- kept for the fixture
      const c = <div>{/* oxlint-disable-next-line no-unused-vars -- kept */}</div>;
      /* biome-ignore lint: kept for the fixture */
      export { c };
    `,
  );

  rule.valid(
    "allows type-checker directives",
    `
      /// <reference types="vite/client" />
      // @ts-check
      // @ts-expect-error the fixture passes a string on purpose
      const count: number = "text";
      /* @ts-ignore old types */
      // @effect-diagnostics floatingEffect:off
      export { count };
    `,
  );

  rule.valid(
    "allows bundler, JSX and formatter hints",
    `
      /** @jsxImportSource preact */
      /* @jsx h */
      const value = /* @__PURE__ */ create();
      const other = /*#__PURE__*/ create();
      /* @__NO_SIDE_EFFECTS__ */
      function create() { return {}; }
      const page = import(/* @vite-ignore */ path);
      const chunk = import(/* webpackChunkName: "chunk", webpackPrefetch: true */ "./chunk");
      // oxfmt-ignore
      const matrix = [1,0,
                      0,1];
      // prettier-ignore
      const other2 = [1,0];
      export { value, other, page, chunk, matrix, other2 };
    `,
  );

  rule.valid(
    "allows coverage, test-environment and source-map pragmas",
    `
      /* v8 ignore next */
      /* c8 ignore next 3 */
      /* istanbul ignore if */
      // node:coverage ignore next
      // cspell:ignore oxfmt
      // @refresh reset
      // quarantine: #1234 flakes on Windows until the pty fix lands
      export const value = 1;
      //# ${SOURCE_MAP_SPLIT_TO_HIDE_IT_FROM_VITEST}=fixture.js.map
    `,
  );

  rule.valid(
    "allows a license header before any code",
    `#!/usr/bin/env node
// SPDX-License-Identifier: MIT
export const value = 1;
`,
  );

  rule.valid(
    "allows a multi-line MIT notice where only one line names the license",
    `/*
 * Adapted from T3 Code.
 * Copyright (c) 2025 T3 Tools Inc.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software, to deal in the Software without restriction.
 */
export const value = 1;
`,
  );

  rule.valid(
    "allows a license header written as consecutive line comments",
    `// Adapted from T3 Code.
// Copyright (c) 2025 T3 Tools Inc.
// Licensed under the MIT License.
export const value = 1;
`,
  );

  rule.valid("allows a legal comment that starts with !", `/*! lib v1 | MIT */\nexport {};`);

  rule.invalid(
    "reports a why comment",
    `
      // Retries are capped because the API rate-limits us.
      const MAX_RETRIES = 3;
      export { MAX_RETRIES };
    `,
    (output) => assert.match(output, /Delete this comment/),
  );

  rule.invalid(
    "reports JSDoc",
    `
      /** Returns the total. */
      export const total = (items: number[]) => items.length;
    `,
  );

  rule.invalid("reports a JSDoc @deprecated tag", `/** @deprecated use total */\nexport {};`);

  rule.invalid("reports a TODO, even with an issue link", `// TODO(#12): drop this\nexport {};`);

  rule.invalid("reports a section header", `// ---- Helpers ----\nexport {};`);

  rule.invalid("reports a folding region", `// #region helpers\nexport {};\n// #endregion`);

  rule.invalid("reports a trailing comment", `export const a = 1; // the first value`);

  rule.invalid(
    "reports a comment that names a directive only after other words",
    `// see oxlint-disable docs\nexport {};`,
  );

  rule.invalid(
    "reports a quarantine marker without an issue number",
    `// quarantine: flaky\nexport {};`,
  );

  rule.invalid(
    "reports a license-like comment after the first line of code",
    `
      export const value = 1;
      // Copyright notice for the next part.
    `,
  );

  rule.invalid(
    "reports a comment block before code that names no license",
    `// This module wires the CLI.\nexport {};`,
  );

  rule.invalid(
    "reports an explanation set apart from the license header by a blank line",
    `// SPDX-License-Identifier: MIT

// This module wires the CLI.
export {};
`,
    assertReportCount(1),
  );

  rule.invalid(
    "reports prose glued to a directive token",
    `
      // oxfmt-ignoreThis explanation is prose
      export const a = 1;
      // oxlint-disabled because the old parser crashed
      export const b = 2;
      // @ts-expect-errors are fine here
      export const c = 3;
      // cspell: the words below are real
      export const d = 4;
    `,
    assertReportCount(4),
  );

  rule.invalid(
    "reports a header comment that only mentions copyright in prose",
    `// No copyright checks are needed because the input is trusted.\nexport {};`,
  );

  rule.invalid(
    "reports a line comment that starts with !",
    `//! This explanation is prose\nexport {};`,
  );

  rule.invalid(
    "reports JSDoc right after a block license header",
    `/* SPDX-License-Identifier: MIT */
/** Returns the total. */
export const total = 1;
`,
    assertReportCount(1),
  );

  rule.invalid(
    "reports consecutive line comments once, and a directive splits them",
    `
      // first
      // second
      // oxlint-disable-next-line no-unused-vars -- kept for the fixture
      // third
      export {};
    `,
    assertReportCount(2),
  );
});
