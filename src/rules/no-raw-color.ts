import { defineRule, type ESTree } from "@oxlint/plugins";

const DEFAULT_MESSAGE =
  "Colors come from the theme. Read a CSS custom property (var(--token)) instead of a color literal, so every theme and its light and dark variants apply.";

const readMessage = (options: ReadonlyArray<unknown>): string => {
  const [first] = options;
  return typeof first === "object" &&
    first !== null &&
    "message" in first &&
    typeof first.message === "string"
    ? first.message
    : DEFAULT_MESSAGE;
};

const HEX_COLOR = /^\s*#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\s*$/i;
const HEX_IN_VALUE = /(?:^|[\s,(])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?=$|[\s,;)])/i;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const CSS_VALUE_CONTEXT = /\b(?:solid|dashed|dotted|inset|gradient|px|em|rem|%)\b|[:;]/;

const isColorText = (text: string) =>
  HEX_COLOR.test(text) ||
  COLOR_FUNCTION.test(text) ||
  (CSS_VALUE_CONTEXT.test(text) && HEX_IN_VALUE.test(text));

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow color literals in code, so colors come from theme tokens that follow light and dark.",
    },
    schema: [
      {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Names the project's theme tokens and where they live.",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const message = readMessage(context.options);
    const check = (node: ESTree.Node, text: string) => {
      if (isColorText(text)) context.report({ node, message });
    };
    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
});
