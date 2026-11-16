import { assert, describe } from "@effect/vitest";

import { createOxlintRuleHarness } from "../../test/utils.ts";

const RULE = "jandragsbaek/max-file-lines-hard";
const lines = (count: number) =>
  Array.from({ length: count }, (_, index) => `export const v${index} = ${index};`);
const fileOf = (count: number) => lines(count).join("\n") + "\n";

const rule = createOxlintRuleHarness(RULE);
const capOfThree = createOxlintRuleHarness(RULE, { ruleOptions: [{ max: 3 }] });
const assertHardCap = (output: string) =>
  assert.match(output, /This file has \d+ lines; the hard cap is 3, and no directive silences it/);

describe(RULE, () => {
  rule.valid("allows 750 lines by default", fileOf(750));

  rule.invalid("reports 751 lines by default", fileOf(751), (output) => {
    assert.match(output, /This file has 751 lines; the hard cap is 750/);
  });

  capOfThree.valid("takes the cap as an option", fileOf(3));

  capOfThree.invalid(
    "is not silenced by a blanket oxlint-disable",
    `/* oxlint-disable -- try to hide the length */\n${fileOf(4)}`,
    assertHardCap,
  );

  capOfThree.invalid(
    "is not silenced by an oxlint-disable that names it",
    `/* oxlint-disable jandragsbaek/max-file-lines-hard -- try */\n${fileOf(4)}`,
    assertHardCap,
  );

  capOfThree.invalid(
    "is not silenced by a blanket eslint-disable",
    `/* eslint-disable -- try to hide the length */\n${fileOf(4)}`,
    assertHardCap,
  );

  capOfThree.invalid(
    "is not silenced by an eslint-disable that names it",
    `/* eslint-disable jandragsbaek/max-file-lines-hard -- try */\n${fileOf(4)}`,
    assertHardCap,
  );

  capOfThree.invalid(
    "is not silenced by a disable after a shebang",
    `#!/usr/bin/env node\n/* oxlint-disable */\n${fileOf(3)}`,
    assertHardCap,
  );

  capOfThree.invalid(
    "is not silenced by disable-line on the first line",
    `${lines(1)[0]} // oxlint-disable-line -- try\n${lines(4).slice(1).join("\n")}\n`,
    assertHardCap,
  );

  capOfThree.invalid(
    "is not silenced by a disable-line comment that starts the file",
    `/* oxlint-disable-line jandragsbaek/max-file-lines-hard -- try */ ${fileOf(4)}`,
    assertHardCap,
  );

  capOfThree.invalid(
    "is not silenced by disable-next-line on any line",
    `// oxlint-disable-next-line -- try\n${lines(4).join("\n// eslint-disable-next-line -- try\n")}\n// oxlint-disable-next-line -- try\n`,
    assertHardCap,
  );

  capOfThree.invalid(
    "is not silenced by every directive form at once",
    [
      "/* oxlint-disable */ /* eslint-disable */ // oxlint-disable-line",
      "// eslint-disable-next-line",
      ...lines(4),
      "/* oxlint-disable jandragsbaek/max-file-lines-hard */",
      "// oxlint-disable-next-line",
      "",
    ].join("\n"),
    assertHardCap,
  );
});
