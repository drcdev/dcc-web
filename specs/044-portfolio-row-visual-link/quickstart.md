# Quickstart: Clickable project row visuals

Manual check on the branch preview (or `pnpm run dev` locally, after `nvm use`).

1. Open `/projects/`. Click the screenshot or diagram in any row: that project's story opens.
2. Rest the pointer on a visual: the pointer is a hand, the image dims slightly, and no text,
   pill or row moves.
3. Turn on "Reduce motion" in the OS and repeat step 2: the image dims instantly, with no fade.
4. Press Tab from the top of the list: focus stops once per row, on the title, never on the
   visual.
5. With VoiceOver (or the browser's accessibility tree), list the links: each project appears
   once, by title. Move through a row: the visual's description is read after the pills.
6. Turn JavaScript off and repeat step 1: the story still opens.

Automated coverage: `tests/component/project/ProjectRow.test.ts`, the added cases in
`tests/e2e/projects.spec.ts` and `tests/e2e/projects-motion.spec.ts`, and the unchanged
`tests/e2e/projects-no-js.spec.ts`, axe and visual checks (see plan.md, "Test changes").
