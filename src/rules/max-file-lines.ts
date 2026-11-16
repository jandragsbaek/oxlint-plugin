import { defineRule } from "@oxlint/plugins";

import { countFileLines, maxLinesSchema, readMaxLines } from "../utils.ts";

export const DEFAULT_MAX_FILE_LINES = 500;

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Report a file longer than `max` lines (default 500); a reasoned disable can keep it.",
    },
    schema: maxLinesSchema(DEFAULT_MAX_FILE_LINES),
  },
  create(context) {
    const max = readMaxLines(context.options, DEFAULT_MAX_FILE_LINES);
    const { lines } = context.sourceCode;
    const count = countFileLines(lines);
    if (count <= max) return {};
    return {
      Program() {
        context.report({
          loc: {
            start: { line: max + 1, column: 0 },
            end: { line: lines.length, column: lines.at(-1)!.length },
          },
          message:
            `This file has ${count} lines; the cap is ${max}. Split it by responsibility. ` +
            "If this file must stay long, say why at its top: " +
            "`/* oxlint-disable jandragsbaek/max-file-lines -- <why this file is long> */`.",
        });
      },
    };
  },
});
