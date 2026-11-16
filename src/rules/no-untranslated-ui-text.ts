import { defineRule, type ESTree } from "@oxlint/plugins";

const DEFAULT_MESSAGE =
  "Every user-facing string goes through the message catalogs. Move this text to a catalog and read it from there.";

const readMessage = (options: ReadonlyArray<unknown>): string => {
  const [first] = options;
  return typeof first === "object" &&
    first !== null &&
    "message" in first &&
    typeof first.message === "string"
    ? first.message
    : DEFAULT_MESSAGE;
};

const ATTRIBUTES_USERS_READ_OR_HEAR = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "label",
  "placeholder",
  "title",
]);

const HAS_LETTER_NOT_ONLY_SEPARATORS_OR_MARKS = /\p{L}/u;

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Disallow JSX text and user-facing attributes that bypass the i18n catalogs.",
    },
    schema: [
      {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "Names the project's catalogs and how to read them, in place of the default.",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const message = readMessage(context.options);
    const check = (node: ESTree.Node, text: string) => {
      if (HAS_LETTER_NOT_ONLY_SEPARATORS_OR_MARKS.test(text)) context.report({ node, message });
    };
    return {
      JSXText(node) {
        check(node, node.value);
      },
      JSXAttribute(node) {
        if (
          node.name.type !== "JSXIdentifier" ||
          !ATTRIBUTES_USERS_READ_OR_HEAR.has(node.name.name)
        ) {
          return;
        }
        const value = node.value;
        if (value?.type === "Literal" && typeof value.value === "string") check(value, value.value);
        if (
          value?.type === "JSXExpressionContainer" &&
          value.expression.type === "Literal" &&
          typeof value.expression.value === "string"
        ) {
          check(value.expression, value.expression.value);
        }
      },
    };
  },
});
