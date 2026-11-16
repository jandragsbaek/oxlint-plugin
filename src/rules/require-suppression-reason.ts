import { defineRule } from "@oxlint/plugins";

const TS_DIRECTIVE_PATTERN = /^\s*\*?\s*@ts-(?:expect-error|ignore|nocheck)(?![\w-])(.*)$/su;

export default defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Require every lint or type-checker suppression to say why, in the directive.",
    },
  },
  create(context) {
    const { sourceCode } = context;
    return {
      Program() {
        for (const directive of sourceCode.getDisableDirectives().directives) {
          if (directive.type === "enable" || directive.justification.trim()) continue;
          context.report({
            loc: directive.node.loc,
            message: "Say why: end the directive with `-- <reason>`.",
          });
        }

        for (const comment of sourceCode.getAllComments()) {
          const after = TS_DIRECTIVE_PATTERN.exec(comment.value)?.[1];
          if (after === undefined || after.replace(/^[\s:-]+/u, "").trim()) continue;
          context.report({
            loc: comment.loc,
            message: "Say why: write the reason after the directive, on the same comment.",
          });
        }
      },
    };
  },
});
