import { defineRule, type ESTree } from "@oxlint/plugins";

const END = String.raw`(?![\w-])`;
const TOOL_DIRECTIVES = [
  new RegExp(String.raw`^(?:oxlint|eslint)-(?:disable(?:-next-line|-line)?|enable)${END}`, "u"),
  new RegExp(String.raw`^@ts-(?:expect-error|ignore|nocheck|check)${END}`, "u"),
  /^\/\s*<(?:reference|amd-module|amd-dependency)\s/u,
  new RegExp(String.raw`^[@#]__(?:PURE|NO_SIDE_EFFECTS)__${END}`, "u"),
  new RegExp(String.raw`^@jsx(?:Frag|ImportSource|Runtime)?${END}`, "u"),
  new RegExp(String.raw`^(?:oxfmt|prettier|biome|dprint)-ignore(?:-start|-end)?${END}`, "u"),
  new RegExp(String.raw`^(?:v8|c8|istanbul)\s+ignore${END}`, "u"),
  new RegExp(String.raw`^node:coverage\s+(?:ignore|disable|enable)${END}`, "u"),
  new RegExp(String.raw`^@vite-ignore${END}`, "u"),
  /^(?:webpack|turbopack)[A-Z]\w*\s*:/u,
  new RegExp(String.raw`^@effect-diagnostics(?:-next-line)?${END}`, "u"),
  new RegExp(String.raw`^@(?:vitest|jest)-environment${END}`, "u"),
  /^[#@]\s*source(?:Mapping)?URL=/u,
  new RegExp(String.raw`^@refresh\s+reset${END}`, "u"),
  new RegExp(
    String.raw`^cspell:\s*(?:words|ignore|ignoreRegExp|includeRegExp|flagWords|dictionaries|language|locale|enable|disable(?:-next-line|-line)?)${END}`,
    "u",
  ),
  /^quarantine:\s*#\d+(?!\w)/u,
];
const LICENSE_NOTICE_LINE =
  /^[\s*]*(?:copyright\b|©|\(c\)\s|SPDX-License-Identifier:|@license\b|Permission is hereby granted\b|Licensed under\b)/imu;
const isLicenseNotice = (comment: ESTree.Comment) =>
  (comment.type === "Block" && comment.value.startsWith("!")) ||
  LICENSE_NOTICE_LINE.test(comment.value);
const LEADING_COMMENT_DECORATION = /^[\s*]*/u;

const MESSAGE =
  "Delete this comment. Make the code say it: a name, a type, a smaller function or a test. " +
  "Only a license header at the top of the file and tool directives (lint, type-checker, " +
  "formatter, coverage and bundler comments) stay.";

const isToolDirective = (comment: ESTree.Comment) => {
  const text = comment.value.replace(LEADING_COMMENT_DECORATION, "");
  return TOOL_DIRECTIVES.some((directive) => directive.test(text));
};

const continuesLineComment = (previous: ESTree.Comment | undefined, comment: ESTree.Comment) =>
  comment.type === "Line" &&
  previous?.type === "Line" &&
  previous.loc.end.line === comment.loc.start.line - 1 &&
  previous.loc.start.column === comment.loc.start.column;

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Reject every comment except a license header at the top of the file and tool directives.",
    },
  },
  create(context) {
    const { sourceCode } = context;
    return {
      Program(program) {
        const firstCodeStart = program.body[0]?.range[0] ?? Number.POSITIVE_INFINITY;
        const comments = sourceCode
          .getAllComments()
          .filter((comment) => comment.type !== "Shebang");

        const licenseHeader = new Set<ESTree.Comment>();
        const headerBlocks: Array<Array<ESTree.Comment>> = [];
        for (const comment of comments) {
          if (comment.range[0] >= firstCodeStart) break;
          const block = headerBlocks.at(-1);
          if (block !== undefined && continuesLineComment(block.at(-1), comment))
            block.push(comment);
          else headerBlocks.push([comment]);
        }
        for (const block of headerBlocks) {
          if (block.some(isLicenseNotice)) {
            for (const comment of block) licenseHeader.add(comment);
          }
        }

        const reported: Array<Array<ESTree.Comment>> = [];
        for (const comment of comments) {
          if (licenseHeader.has(comment) || isToolDirective(comment)) continue;
          const group = reported.at(-1);
          if (group !== undefined && continuesLineComment(group.at(-1), comment))
            group.push(comment);
          else reported.push([comment]);
        }
        for (const group of reported) {
          context.report({
            loc: { start: group[0]!.loc.start, end: group.at(-1)!.loc.end },
            message: MESSAGE,
          });
        }
      },
    };
  },
});
