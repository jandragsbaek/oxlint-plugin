import { assert, describe } from "@effect/vitest";

import { createOxlintRuleHarness } from "../../test/utils.ts";

const rule = createOxlintRuleHarness("jandragsbaek/require-suppression-reason", {
  filename: "fixture.tsx",
});

describe("jandragsbaek/require-suppression-reason", () => {
  rule.valid(
    "allows a directive with a -- reason",
    `
      // oxlint-disable-next-line no-control-regex -- ANSI sequences start with ESC.
      const ansi = /\\x1b\\[/;
      /* eslint-disable no-console -- this script reports to the terminal */
    `,
  );

  rule.invalid(
    "reports a directive explained only by a comment above",
    `
      // Positions are stable for a given string.
      // oxlint-disable-next-line react/no-array-index-key
      const items = ["a"].map((item, index) => <li key={index}>{item}</li>);
    `,
  );

  rule.invalid(
    "reports a TypeScript directive explained only by a comment above",
    `
      // The fixture is invalid on purpose.
      // @ts-expect-error
      const value: number = "text";
    `,
  );

  rule.valid(
    "allows a TypeScript directive followed by its reason",
    `
      // @ts-expect-error the fixture passes a string on purpose
      const count: number = "text";
    `,
  );

  rule.valid(
    "allows a directive in a JSX comment with a reason",
    `const el = <div>{/* oxlint-disable-next-line react/no-danger -- sanitized above */}</div>;`,
  );

  rule.valid("ignores enable directives", `/* oxlint-enable no-console */`);

  rule.invalid(
    "reports a lint directive without a reason",
    `
      // oxlint-disable-next-line no-control-regex
      const ansi = /\\x1b\\[/;
    `,
    (output) => {
      assert.match(output, /end the directive with `-- <reason>`/);
    },
  );

  rule.invalid(
    "reports a file-level directive without a reason",
    `/* oxlint-disable eslint/no-useless-escape */`,
  );

  rule.invalid(
    "reports a TypeScript directive without a reason",
    `
      // @ts-expect-error
      const count: number = "text";
    `,
    (output) => {
      assert.match(output, /write the reason after the directive, on the same comment/);
    },
  );

  rule.invalid(
    "does not count a trailing comment on the code line above",
    `
      const first = 1; // the first value
      const second = 2; // oxlint-disable-line no-unused-vars
    `,
  );
});
