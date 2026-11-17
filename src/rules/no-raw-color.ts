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

const NAMED_COLORS: ReadonlySet<string> = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue " +
    "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk " +
    "crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki " +
    "darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue " +
    "dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite " +
    "gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen " +
    "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen " +
    "magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream " +
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen " +
    "steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
);

const HEX = "#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})";
const HEX_COLOR = new RegExp(`^\\s*${HEX}\\s*$`, "i");
const HEX_IN_VALUE = new RegExp(`(?:^|[\\s,(:])${HEX}(?=$|[\\s,;)!])`, "i");
const ENCODED_HEX = /%23(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const CSS_VALUE =
  /\b(?:solid|dashed|dotted|double|inset|gradient|-?[\d.]+(?:px|em|rem|%|deg))\b|^\s*[a-z-]+\s*:/i;
const ONLY_LENGTHS_AND_HEX = new RegExp(`^\\s*(?:(?:-?[\\d.]+[a-z%]*|${HEX})\\s*)+$`, "i");
const WORDS = /[a-z]+/gi;
const COLOR_PLACE = /(?:color|colour|background|fill|stroke|border|outline|shadow|style)$/i;
const SELECTOR_CALLS = new Set(["querySelector", "querySelectorAll", "closest", "matches"]);

const hasNamedColor = (text: string) =>
  Array.from(text.matchAll(WORDS), ([word]) => word.toLowerCase()).some((word) =>
    NAMED_COLORS.has(word),
  );

const isValueText = (text: string) =>
  HEX_COLOR.test(text) ||
  COLOR_FUNCTION.test(text) ||
  ENCODED_HEX.test(text) ||
  (ONLY_LENGTHS_AND_HEX.test(text) && HEX_IN_VALUE.test(text)) ||
  (CSS_VALUE.test(text) && (HEX_IN_VALUE.test(text) || hasNamedColor(text)));

const nameOf = (node: ESTree.Node | null | undefined): string | null => {
  if (node === null || node === undefined) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "MemberExpression") return nameOf(node.property);
  return null;
};

const isColorPlace = (node: ESTree.Node): boolean => {
  const parent = node.parent;
  if (parent === undefined || parent === null) return false;
  if (parent.type === "JSXExpressionContainer") return isColorPlace(parent);
  if (parent.type === "Property" && parent.value === node) {
    return COLOR_PLACE.test(nameOf(parent.key) ?? "");
  }
  if (parent.type === "AssignmentExpression" && parent.right === node) {
    return COLOR_PLACE.test(nameOf(parent.left) ?? "");
  }
  if (parent.type === "JSXAttribute") return COLOR_PLACE.test(nameOf(parent.name) ?? "");
  if (parent.type === "CallExpression" && parent.arguments[1] === node) {
    return nameOf(parent.callee) === "setProperty";
  }
  return false;
};

const isSelector = (node: ESTree.Node) => {
  const parent = node.parent;
  return (
    parent?.type === "CallExpression" &&
    parent.arguments[0] === node &&
    SELECTOR_CALLS.has(nameOf(parent.callee) ?? "")
  );
};

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
    return {
      Literal(node) {
        if (typeof node.value !== "string" || isSelector(node)) return;
        const text = node.value;
        const named = NAMED_COLORS.has(text.trim().toLowerCase()) && isColorPlace(node);
        if (named || isValueText(text)) context.report({ node, message });
      },
      TemplateElement(node) {
        if (isValueText(node.value.cooked ?? node.value.raw)) context.report({ node, message });
      },
    };
  },
});
