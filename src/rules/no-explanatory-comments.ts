import { defineRule, type ESTree } from "@oxlint/plugins";

const TOOL_DIRECTIVES = [
  /^(?:oxlint|eslint)-(?:disable|enable)/u,
  /^@ts-(?:expect-error|ignore|nocheck|check)\b/u,
  /^\/\s*<(?:reference|amd-module|amd-dependency)\b/u,
  /^[@#]__(?:PURE|NO_SIDE_EFFECTS)__/u,
  /^@jsx(?:Frag|ImportSource|Runtime)?\b/u,
  /^(?:oxfmt|prettier|biome|dprint)-ignore/u,
  /^(?:v8|c8|istanbul)\s+ignore\b/u,
  /^node:coverage\s+(?:ignore|disable|enable)\b/u,
  /^@vite-ignore\b/u,
  /^(?:webpack|turbopack)[A-Z]\w*\s*:/u,
  /^@effect-diagnostics/u,
  /^@(?:vitest|jest)-environment/u,
  /^[#@]\s*source(?:Mapping)?URL=/u,
  /^@refresh\s+reset\b/u,
  /^cspell:/u,
  /^quarantine:\s*#\d+/u,
];
const LICENSE_NOTICE =
  /^!|@license\b|\bcopyright\b|©|\bSPDX-License-Identifier\b|\bPermission is hereby granted\b|\bLicensed under\b/iu;
const LEADING_COMMENT_DECORATION = /^[\s*]*/u;

const MESSAGE =
  "Delete this comment. Make the code say it: a name, a type, a smaller function or a test. " +
  "Only a license header at the top of the file and tool directives (lint, type-checker, " +
  "formatter, coverage and bundler comments) stay.";

const isToolDirective = (comment: ESTree.Comment) => {
  const text = comment.value.replace(LEADING_COMMENT_DECORATION, "");
  return TOOL_DIRECTIVES.some((directive) => directive.test(text));
};

const continuesBlock = (previous: ESTree.Comment | undefined, comment: ESTree.Comment) =>
  previous !== undefined && comment.loc.start.line - previous.loc.end.line <= 1;

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
          if (block !== undefined && continuesBlock(block.at(-1), comment)) block.push(comment);
          else headerBlocks.push([comment]);
        }
        for (const block of headerBlocks) {
          if (block.some((comment) => LICENSE_NOTICE.test(comment.value))) {
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
