// The page policy additions the contact page needs: the Turnstile script and
// frame (contracts/contact-page.md "CSP"). The page route calls this before the
// layout renders, because Astro writes the policy <meta> into the head before a
// section deeper in the body runs; ContactForm calls it too, so the form asks
// for what it needs wherever it is used. Astro merges and de-duplicates.
// docs.astro.build/en/reference/api-reference/#csp
type Csp = {
  insertScriptResource(resource: string): void;
  insertDirective(directive: string): void;
};

export function allowTurnstile(csp: Csp | undefined): void {
  csp?.insertScriptResource("https://challenges.cloudflare.com");
  csp?.insertDirective("frame-src https://challenges.cloudflare.com");
}
