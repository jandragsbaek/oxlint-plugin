import { defineRule } from "@oxlint/plugins";

import { countFileLines, maxLinesSchema, readMaxLines } from "../utils.ts";

export const DEFAULT_HARD_MAX_FILE_LINES = 750;

const BEFORE_EVERY_DIRECTIVE = { line: 1, column: 0 };

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Report a file longer than `max` lines (default 750); no disable directive can silence it.",
    },
    schema: maxLinesSchema(DEFAULT_HARD_MAX_FILE_LINES),
  },
  create(context) {
    const max = readMaxLines(context.options, DEFAULT_HARD_MAX_FILE_LINES);
    const count = countFileLines(context.sourceCode.lines);
    if (count <= max) return {};
    return {
      Program() {
        context.report({
          loc: { start: BEFORE_EVERY_DIRECTIVE, end: BEFORE_EVERY_DIRECTIVE },
          message:
            `This file has ${count} lines; the hard cap is ${max}, and no directive silences it. ` +
            "Split the file by responsibility.",
        });
      },
    };
  },
});
