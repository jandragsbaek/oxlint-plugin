import { assert, describe } from "@effect/vitest";

import { createOxlintRuleHarness } from "../../test/utils.ts";

const rule = createOxlintRuleHarness("jandragsbaek/no-raw-color", {
  filename: "apps/web/src/components/Example.tsx",
});

describe("jandragsbaek/no-raw-color", () => {
  rule.valid(
    "allows theme tokens, issue numbers and ids",
    `
      const node = <p style={{ color: "var(--accent)", borderColor: "currentColor" }}>{label}</p>;
      const link = "See issue #123 for details";
      const id = "#root";
      const fill = palette.accent;
    `,
  );

  rule.invalid("reports a hex color", `const node = <p style={{ color: "#1e2f7a" }} />;`);

  rule.invalid("reports a short hex color", `context.fillStyle = "#fff";`);

  rule.invalid("reports an rgb() color", `const shadow = "0 2px 6px rgb(30 47 122 / 22%)";`);

  rule.invalid("reports an oklch() color in a template", "const fill = `oklch(0.5 0.1 ${hue})`;");

  rule.invalid("reports a hex color inside a CSS value", `const border = "1px solid #c9c8d1";`);
});

const ruleWithMessage = createOxlintRuleHarness("jandragsbaek/no-raw-color", {
  filename: "src/Example.tsx",
  ruleOptions: [{ message: "Use a token from src/styles/themes." }],
});

describe("jandragsbaek/no-raw-color with a message", () => {
  ruleWithMessage.invalid("reports the configured message", `const fill = "#000000";`, (output) =>
    assert.include(output, "Use a token from src/styles/themes."),
  );
});
