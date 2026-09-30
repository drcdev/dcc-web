// The page policy addition a story with an embedded demo needs: frames from
// drc.dev and its subdomains (research R10). The story route calls this from its
// frontmatter, before the layout renders, because Astro writes the policy <meta>
// into the head before a block deeper in the body runs. Stories that only link to
// a demo, and every other page, keep the site policy; public/_headers is unchanged.
// docs.astro.build/en/reference/api-reference/#csp
type Csp = { insertDirective(directive: string): void };

export const DEMO_FRAME_SRC = "frame-src https://drc.dev https://*.drc.dev";

export function allowDemoFrames(csp: Csp | undefined): void {
  csp?.insertDirective(DEMO_FRAME_SRC);
}
