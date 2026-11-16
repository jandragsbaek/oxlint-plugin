import { assert, describe } from "@effect/vitest";

import { createOxlintRuleHarness } from "../../test/utils.ts";

const RULE = "jandragsbaek/max-file-lines";
const fileOf = (lineCount: number, header = "") =>
  header +
  Array.from({ length: lineCount }, (_, index) => `export const v${index} = ${index};`).join("\n") +
  "\n";
const blankFileOf = (lineCount: number) => "\n".repeat(lineCount);

const rule = createOxlintRuleHarness(RULE);
const withRequiredReason = createOxlintRuleHarness(RULE, {
  extraRules: { "jandragsbaek/require-suppression-reason": "error" },
});
const reasonCheckWithCap = createOxlintRuleHarness("jandragsbaek/require-suppression-reason", {
  extraRules: { [RULE]: "error" },
});
const capOfThree = createOxlintRuleHarness(RULE, { ruleOptions: [{ max: 3 }] });

describe(RULE, () => {
  rule.valid("allows 500 lines by default", fileOf(500));

  rule.invalid("reports 501 lines by default", fileOf(501), (output) => {
    assert.match(output, /This file has 501 lines; the cap is 500/);
  });

  rule.invalid("counts blank lines", blankFileOf(501));

  rule.invalid("counts comment lines", fileOf(1, "// note\n".repeat(500)));

  withRequiredReason.valid(
    "lets a reasoned disable keep a long file",
    fileOf(600, "/* oxlint-disable jandragsbaek/max-file-lines -- one generated table */\n"),
  );

  reasonCheckWithCap.invalid(
    "keeps the suppression reason required",
    fileOf(600, "/* oxlint-disable jandragsbaek/max-file-lines */\n"),
  );

  capOfThree.valid("takes the cap as an option", fileOf(3));

  capOfThree.invalid("reports one line past the option", fileOf(4), (output) => {
    assert.match(output, /This file has 4 lines; the cap is 3/);
  });
});
