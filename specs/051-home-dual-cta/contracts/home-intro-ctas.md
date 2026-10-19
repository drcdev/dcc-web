# UI contract: home introduction card links

Supersedes the link row of `specs/003-standalone-pages/contracts/page-dom.md` "Home page" for the
card's links only. Everything else in the card (gradient wrapper, photo, `<h1>`, tagline, bio)
is unchanged.

## DOM (text column, after the bio)

```html
<div class="mt-4 flex w-full flex-col items-center gap-4 sm:items-start">
  <ul class="flex items-center justify-center gap-3 sm:justify-start">
    <li><a href="https://github.com/…">…GitHub</a></li>
    <li><a href="https://www.linkedin.com/…">…LinkedIn</a></li>
  </ul>
  <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
    <a href="{cta.href}"          class="BASE PRIMARY">{cta.label}</a>
    <!-- only when secondaryCta is set -->
    <a href="{secondaryCta.href}" class="BASE SECONDARY">{secondaryCta.label}</a>
  </div>
</div>
```

- `BASE`: `inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium motion-safe:transition-colors`
- `PRIMARY`: `border-transparent bg-rust-600 text-white hover:bg-rust-700 dark:bg-rust-300 dark:text-dusk-900 dark:hover:bg-rust-200`
- `SECONDARY`: `border-dusk-500 text-dusk-800 hover:bg-mist-200 dark:border-dusk-400 dark:text-mist-200 dark:hover:bg-dusk-700`

Exact class strings may change in implementation; the guarantees below may not.

## Guarantees

1. Source and focus order: GitHub, LinkedIn, main call to action, second call to action.
2. Both calls to action are `<a href>` with their label as accessible name; no `role`, no
   `aria-label`, no script.
3. Without `secondaryCta`, the group holds exactly one link and no placeholder element.
4. Below 640 px: the group and each link span the text column's full width, main on top.
5. From 640 px: links sit on one row, main first, each as wide as its label, left-aligned; the
   social row is above them.
6. Both links have equal rendered height ≥ 44 px and width ≥ 44 px at every width.
7. Contrast, light and dark, at rest and on hover: text ≥ 4.5:1 against its own background; the
   second link's border ≥ 3:1 against the card.
8. Focus uses the global `a:focus-visible` outline (2 px solid, 2 px offset).
