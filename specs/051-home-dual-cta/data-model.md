# Data model: Second call to action

## HomeIntro (`pages` collection, `intro` field, `src/content/schemas/page.ts`)

Strict object; optional on a page, used by the home page only.

| Field | Type | Required | Rule |
|---|---|---|---|
| `photo` | image with alt | yes | unchanged |
| `name` | text | yes | unchanged |
| `tagline` | text | yes | unchanged |
| `bio` | text | yes | unchanged |
| `cta` | CallToAction | yes | unchanged (FR-002) |
| `secondaryCta` | CallToAction | **no (new)** | same rules as `cta` (FR-001) |

Any other key in `intro` is rejected (strict object, unchanged).

## CallToAction

Strict object, one shared definition for `cta` and `secondaryCta`.

| Field | Type | Rule |
|---|---|---|
| `label` | text | `requiredText`: non-empty |
| `href` | text | `linkTarget`: site path or https URL; protocol-relative rejected (#95) |

Extra keys are rejected.

## Validation cases (for the schema unit test)

| Input | Result |
|---|---|
| `intro` with `cta`, no `secondaryCta` | valid |
| `intro` with `cta` and `secondaryCta: { label: "Read my writing", href: "/writing/" }` | valid |
| `secondaryCta.label` empty | invalid (names `secondaryCta.label`) |
| `secondaryCta.href` missing, relative (`writing`) or protocol-relative (`//x`) | invalid |
| `secondaryCta` with an extra key | invalid |
| `secondaryCta` set, `cta` missing | invalid |

## Launch content (`src/content/pages/index.mdx`)

```yaml
  cta:
    label: See how I can help
    href: /contact/
  secondaryCta:
    label: Read my writing
    href: /writing/
```
