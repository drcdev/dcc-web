# Pull request notes (T036)

For the PR body (SC-002, FR-022).

## Page heights at 390 px (SC-002)

Full-document height (`documentElement.scrollHeight`), 390 px viewport, light theme, reduced motion, lazy images loaded, non-production build. "Before" is [page-heights-before.md](./page-heights-before.md) (T001); "after" is the same method on the finished tree.

| Page | Before (px) | After (px) | Change |
|------|-------------|------------|--------|
| focus-pocus | 8069 | 5266 | -2803 (-35%) |
| drcdev-github-io | 5964 | 4111 | -1853 (-31%) |
| flux | 6275 | 4531 | -1744 (-28%) |
| plunge-buddy | 6351 | 4579 | -1772 (-28%) |
| tempo | 6162 | 4309 | -1853 (-30%) |

Every page is shorter than its T001 measurement.

## Dropped text per project (T033-T035; FR-022)

The full lists are in [dropped-text.md](./dropped-text.md); everything there was removed from the old files and nothing was added.
