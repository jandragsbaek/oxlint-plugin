import { assert, describe } from "@effect/vitest";

import { createOxlintRuleHarness } from "../../test/utils.ts";

const rule = createOxlintRuleHarness("jandragsbaek/no-raw-color", {
  filename: "apps/web/src/components/Example.tsx",
});

describe("jandragsbaek/no-raw-color", () => {
  rule.valid(
    "allows theme tokens, selectors, issue numbers and color words outside color places",
    `
      const node = <p style={{ color: "var(--accent)", borderColor: "currentColor" }}>{label}</p>;
      const link = "See issue #123 for details";
      const target = document.querySelector("#add");
      const gold = token("gold");
      const initial = <Panel initial="rubric" tone="red" />;
      const fill = palette.accent;
      const ring = <circle cx="8" cy="8" r="6" />;
      const page = \`\${at}.0\`;
      const note = "Mark it red if it is wrong: the margin shows why.";
    `,
  );

  rule.invalid("reports a hex color", `const node = <p style={{ color: "#1e2f7a" }} />;`);

  rule.invalid("reports a short hex color", `context.fillStyle = "#fff";`);

  rule.invalid("reports an rgb() color", `const shadow = "0 2px 6px rgb(30 47 122 / 22%)";`);

  rule.invalid("reports an oklch() color in a template", "const fill = `oklch(0.5 0.1 ${hue})`;");

  rule.invalid("reports a hex color inside a CSS value", `const border = "1px solid #c9c8d1";`);

  rule.invalid("reports a shadow made of lengths and a hex color", `const shadow = "0 0 #000";`);

  rule.invalid("reports two hex colors", `const stops = "#fff #000";`);

  rule.invalid(
    "reports a hex color encoded in a data URI",
    `const icon = "url(data:image/svg+xml,%3Csvg fill='%23ff0000'/%3E)";`,
  );

  rule.invalid(
    "reports a named color in a style object",
    `const node = <p style={{ color: "white" }} />;`,
  );

  rule.invalid("reports a named color assigned to a canvas", `context.fillStyle = "black";`);

  rule.invalid(
    "reports a named color in an SVG attribute",
    `const node = <path fill="rebeccapurple" />;`,
  );

  rule.invalid(
    "reports a named color set as a property",
    `element.style.setProperty("color", "teal");`,
  );

  rule.invalid("reports a named color inside a CSS value", `const border = "1px solid white";`);
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
