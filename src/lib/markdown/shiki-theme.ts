// The semantic Shiki theme (specs/008-blog/research.md R7). Astro writes every
// token colour into a `style` attribute, and the site's content security policy
// has no `'unsafe-inline'` for styles. So this theme gives each token category
// one placeholder colour that never reaches a reader: the transformer in
// shiki-classes.ts swaps each colour for a class, and the real colours live in
// src/styles/global.css, matched to the site palette in both themes. The theme
// has no `fontStyle`, because a font style would also be written as `style`.
import type { ShikiConfig } from "astro";

type Theme = Exclude<NonNullable<ShikiConfig["theme"]>, string>;

/** Placeholder colour to class. Every colour in the theme below is a key. */
export const highlightClasses = {
  "#010101": "hl-text",
  "#010102": "hl-comment",
  "#010103": "hl-keyword",
  "#010104": "hl-string",
  "#010105": "hl-number",
  "#010106": "hl-function",
  "#010107": "hl-type",
  "#010108": "hl-variable",
  "#010109": "hl-tag",
  "#01010a": "hl-attribute",
  "#01010b": "hl-punctuation",
} as const;

const colourOf = (cls: (typeof highlightClasses)[keyof typeof highlightClasses]): string =>
  Object.entries(highlightClasses).find(([, value]) => value === cls)![0];

const category = (cls: (typeof highlightClasses)[keyof typeof highlightClasses], scope: string[]) => ({
  scope,
  settings: { foreground: colourOf(cls) },
});

export const shikiTheme: Theme = {
  name: "dcc-semantic",
  type: "dark",
  fg: colourOf("hl-text"),
  // Never rendered: the transformer removes the `pre` style that carries it.
  bg: "#020202",
  settings: [
    category("hl-comment", ["comment", "punctuation.definition.comment"]),
    category("hl-keyword", [
      "keyword",
      "storage",
      "storage.type",
      "storage.modifier",
      "keyword.control",
      "constant.language",
      "support.type.primitive",
    ]),
    category("hl-string", ["string", "string.quoted", "punctuation.definition.string", "markup.inline.raw"]),
    category("hl-number", ["constant.numeric", "constant.character", "constant.other", "support.constant"]),
    category("hl-function", ["entity.name.function", "support.function", "meta.function-call", "entity.name.command"]),
    category("hl-type", [
      "support.type",
      "support.class",
      "entity.name.type",
      "entity.name.class",
      "meta.type.annotation",
      "entity.other.inherited-class",
    ]),
    category("hl-variable", [
      "variable",
      "variable.other.property",
      "meta.object-literal.key",
      "support.type.property-name",
      "support.variable",
      "entity.name.variable",
    ]),
    category("hl-tag", ["entity.name.tag", "meta.tag", "punctuation.definition.tag"]),
    category("hl-attribute", ["entity.other.attribute-name"]),
    category("hl-punctuation", ["punctuation", "keyword.operator", "meta.brace", "punctuation.separator"]),
  ],
};
