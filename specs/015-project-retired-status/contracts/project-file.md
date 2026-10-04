# Contract: project file, retired status

Adds to `specs/014-project-four-part-story/contracts/project-file.md`. This is what Don or
Claude Code writes; `docs/projects.md` and the comment in `src/content/projects/_template.mdx`
document it (FR-011).

## status

```yaml
status: retired   # one of shipped, experiment, in-progress, retired
```

`retired` means "no longer used or maintained". The project stays on the index in its usual
place, and its story is shown in full with a fixed note under the header.

## replacedBy (optional, retired projects only)

Replaced by another project on this site (the file name, without `.mdx`):

```yaml
replacedBy:
  project: cadence
```

Replaced by something off the site, with or without an address:

```yaml
replacedBy:
  name: Cadence
  href: https://example.com/cadence   # optional, https only
```

Rules: exactly one of `project` or `name`; `href` only with `name`; only with
`status: retired`; `project` must be another project's file name (a draft counts). Breaking a
rule fails the build naming the file (contracts/build-errors.md rows RP01 to RP05).

The note cannot be customised: it is always "**Retired.** I no longer use or maintain this
project." plus " It was replaced by <name>." when `replacedBy` is set.
