import { defineRule } from "@oxlint/plugins";

const COMBINATOR_PATTERN = /[\s>+~]/u;
const CLASS_ID_ATTRIBUTE_OR_LEADING_TAG = /[.#[]|^[a-z]/iu;
const ROOT_COMPOUND_PATTERN = /^(?:html|body|:root)(?![\w-])/iu;

const GROUP_OR_PEER_ELEMENT_PREFIX = /(?:^|:)(?:group|peer)-$/u;
const ANCESTOR_PREFIX = /(?:^|:)in-$/u;
const ATTRIBUTE_VALUE_NOT_SELECTOR_PREFIX = /(?:^|:)(?:data|aria)-$/u;
const TAILWIND_SPACE = "_";
const TAILWIND_ELEMENT_WITH_THE_CLASS = "&";
const QUOTED_PATTERN = /(["'])(?:\\.|(?!\1).)*\1/gu;

const VARIANT_END_PATTERN = /^(?:\/[\w-]+)?:/u;

function variantGroups(token: string): { prefix: string; group: string }[] {
  const groups: { prefix: string; group: string }[] = [];
  let depth = 0;
  let start = -1;
  for (let index = 0; index < token.length; index++) {
    const char = token[index];
    if (char === "[") {
      if (depth === 0) start = index + 1;
      depth++;
    } else if (char === "]" && depth > 0) {
      depth--;
      if (depth === 0 && VARIANT_END_PATTERN.test(token.slice(index + 1))) {
        groups.push({ prefix: token.slice(0, start - 1), group: token.slice(start, index) });
      }
    }
  }
  return groups;
}

function closingParen(selector: string, open: number): number {
  let depth = 0;
  for (let index = open; index < selector.length; index++) {
    if (selector[index] === "(") depth++;
    else if (selector[index] === ")" && --depth === 0) return index;
  }
  return selector.length;
}

function hasIsInSubjectPositionOfNotIsOrWhere(selector: string, from: number): boolean {
  let depth = 0;
  for (let index = from; index < selector.length; index++) {
    const char = selector[index] ?? "";
    if (char === "(") depth++;
    else if (char === ")") {
      if (depth === 0) return true;
      depth--;
    } else if (depth > 0) continue;
    else if (char === ",") return true;
    else if (COMBINATOR_PATTERN.test(char)) {
      const next = selector.slice(index).trimStart()[0];
      if (/\s/u.test(char) && (next === undefined || next === ")" || next === ",")) continue;
      return false;
    }
  }
  return true;
}

function hasCompounds(selector: string): string[] {
  const compounds: string[] = [];
  let index = selector.indexOf(":has(");
  while (index !== -1) {
    let compound = "";
    let depth = 0;
    let subjectEnd = closingParen(selector, index + ":has".length) + 1;
    let skippingOtherSelectorListBranch = false;
    for (let position = index - 1; position >= 0; position--) {
      const char = selector[position] ?? "";
      if (char === ")") depth++;
      else if (char === "(") {
        if (depth > 0) depth--;
        else {
          if (!hasIsInSubjectPositionOfNotIsOrWhere(selector, subjectEnd)) break;
          skippingOtherSelectorListBranch = false;
          subjectEnd = closingParen(selector, position) + 1;
        }
      } else if (depth === 0 && char === ",") {
        skippingOtherSelectorListBranch = true;
        continue;
      } else if (depth === 0 && !skippingOtherSelectorListBranch && COMBINATOR_PATTERN.test(char))
        break;
      if (!skippingOtherSelectorListBranch) compound = char + compound;
    }
    compounds.push(compound);
    index = selector.indexOf(":has(", index + 1);
  }
  return compounds;
}

function withoutNegations(compound: string): string {
  let result = "";
  let index = 0;
  while (index < compound.length) {
    if (!compound.startsWith(":not(", index)) {
      result += compound[index];
      index++;
      continue;
    }
    let depth = 0;
    for (index += ":not".length; index < compound.length; index++) {
      if (compound[index] === "(") depth++;
      else if (compound[index] === ")" && --depth === 0) break;
    }
    index++;
  }
  return result;
}

function findUnscopedHasVariants(text: string): string[] {
  if (!text.toLowerCase().includes(":has(")) return [];
  const offenders: string[] = [];
  for (const token of text.split(/\s+/u)) {
    for (const { prefix, group } of variantGroups(token)) {
      if (ATTRIBUTE_VALUE_NOT_SELECTOR_PREFIX.test(prefix)) continue;
      const relative = group
        .toLowerCase()
        .replace(QUOTED_PATTERN, '""')
        .replaceAll(TAILWIND_SPACE, " ");
      const owner = GROUP_OR_PEER_ELEMENT_PREFIX.test(prefix) ? ".group" : ".self";
      const selector = ANCESTOR_PREFIX.test(prefix)
        ? `:is(${relative.replaceAll(TAILWIND_ELEMENT_WITH_THE_CLASS, "*")}) .self`
        : relative.includes(TAILWIND_ELEMENT_WITH_THE_CLASS)
          ? relative.replaceAll(TAILWIND_ELEMENT_WITH_THE_CLASS, owner)
          : `${owner}:is(${relative})`;
      const unscoped = hasCompounds(selector).some((compound) => {
        const anchor = withoutNegations(compound);
        return (
          !CLASS_ID_ATTRIBUTE_OR_LEADING_TAG.test(anchor) || ROOT_COMPOUND_PATTERN.test(anchor)
        );
      });
      if (unscoped) offenders.push(`[${group}]`);
    }
  }
  return offenders;
}

export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind arbitrary variants with a :has() that is not anchored to a class, attribute, id, or tag.",
    },
  },
  create(context) {
    const message = (variant: string) =>
      `Anchor the :has() in ${variant} to a class, attribute, or tag below the document root, e.g. [&+[data-x]_…] or a has-* variant. Chrome evaluates an unanchored :has() on every ancestor, so any DOM change then restyles the whole page.`;
    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        for (const variant of findUnscopedHasVariants(node.value)) {
          context.report({ node, message: message(variant) });
        }
      },
      TemplateElement(node) {
        for (const variant of findUnscopedHasVariants(node.value.cooked ?? node.value.raw)) {
          context.report({ node, message: message(variant) });
        }
      },
    };
  },
});
