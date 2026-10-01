# Contract: `docs/launch.md`, the launch walkthrough

## Rules that apply to every step (FR-005, FR-006, FR-007)

- Each step is a `###` heading with an id and an anchor, for example
  `### L11. Point the bare domain at the new site {#l11}`. It has three labelled paragraphs, in
  this order: **What to do**, **Where**, **How to confirm**.
- Every step that needs Don has a line starting `**Pause:**`. The line says that the assisting
  agent stops there and waits for Don's answer: `Done — check it`, `Skip for now` or
  `Stop here`. The agent never signs in, creates accounts, changes DNS, or handles or asks for
  a credential. Don alone acts in a dashboard, account, DNS zone or export.
- No step asks for a secret to be pasted into the chat. Where a token is involved, the step says
  to type it into the dashboard or into the local command Don runs himself.
- Every step also says what to do when its confirmation fails: try again, wait, go to Part E
  (rollback), or stop (FR-005).
- Exported files and their contents are never pasted into the chat, committed or written to a
  log. They stay on Don's machine, outside the repository (FR-007).
- Confirmations are commands (`pnpm setup:check --item <id>`, `pnpm run site:check -- …`,
  `gh repo view … --json isArchived`) or something Don can see. The walkthrough moves on only
  when the confirmation passes.
- The intro states the order of the parts, says the switch happens only after this feature's
  pull request has merged, and gives the 2-week window.

## Step list

### Part A — Readiness (FR-003, FR-004)

| Step | What | Confirmed by |
|---|---|---|
| L1 | Pull `main` and run the full setup check. Items 1–25 are complete, except item 16, which reports `waiting`. | `pnpm setup:check` |
| L2 | **Pause.** Don replaces the Services and Speaking placeholder copy and the Focus Pocus placeholders, and publishes the pages (`draft: false`), through a normal small pull request to `main`. The same item confirms the privacy policy states D1 storage and names no retired service. | `pnpm setup:check --item launch-content-ready` |
| L3 | **Pause.** Don confirms that every Ghost post is on the new site: the Ghost Admin post list compared with `/blog/`. | Don |
| L4 | Check that no internal link points to a missing page on the review address, and that the production build from `main` names the bare domain as its main address (FR-003b). | `pnpm run site:check -- --base https://new.doncoleman.ca --expect-origin https://doncoleman.ca` exits 0, and the last merged pull request's `verify` (with its preview crawl) passed |
| L5 | **Pause.** Don sends a test message starting "Launch test" from `https://new.doncoleman.ca/contact/`, confirms it arrived using his usual retrieval method, then deletes it (FR-015b). He types any token only into his own terminal. Spam protection accepting the bare domain is confirmed here too. | Don; `pnpm setup:check --item contact-turnstile-widget` is complete |
| L6 | Main branch checks are passing, including the accessibility checks and the performance budget. | `pnpm setup:check --item launch-main-checks` |
| L7 | Readiness gate. A table of every FR-003 readiness row with its result from L1–L6. If any is not confirmed, **stop**: the walkthrough does not continue to Part B. | All of the above |

### Part B — Before the switch (FR-009)

| Step | What | Confirmed by |
|---|---|---|
| L8 | **Pause.** The recorded Ghost records are shown in a table (type, name, value, proxy, TTL) that matches `setup/dns-baseline.json`: `A doncoleman.ca 49.13.201.194, DNS only, TTL 14400 (shown as "4 hr")` and `CNAME www.doncoleman.ca drift-and-convergence.mymagic.page, DNS only, TTL 14400 (shown as "4 hr")`. If the dashboard shows anything else, the baseline is corrected first. Don checks they match Cloudflare → DNS → Records and saves a zone export (Import and Export → Export) on his own machine. | `pnpm setup:check --item dns-records-parity` and `--item live-domain-ghost` are complete. Don confirms the export file exists |
| L9 | **Pause.** Don reads Part E (rollback) before any change, then sends an email to and from his domain address and confirms both arrive (FR-016a, before the switch). | Don; `pnpm setup:check --item mail-records` is complete |
| L10 | **Pause.** Don turns on SSL/TLS → Edge Certificates → Always Use HTTPS. This affects proxied hostnames only; Ghost's DNS-only records are unaffected. | Dashboard shows "On" |

### Part C — The switch (FR-010, FR-010a)

| Step | What | Confirmed by |
|---|---|---|
| L11 | **Pause.** The bare domain first. In one sitting, Don deletes `A doncoleman.ca 49.13.201.194`, then adds Custom Domain `doncoleman.ca` on `dcc-web` (Workers & Pages → `dcc-web` → Settings → Domains & Routes → Add → Custom Domain). No other record changes. Don writes down the switch date and Ghost's next renewal date (FR-021). | `--item live-domain-ghost` reports "Switched…". `--item live-apex` is pending or complete |
| L12 | **Pause.** Then `www`, in the same sitting. Don deletes `CNAME www`, adds `AAAA www 100::` (Proxied), and creates the Redirect Rule: wildcard `*://www.doncoleman.ca/*` → `https://doncoleman.ca/${2}`, 301, preserve query string. If either half cannot be confirmed, Don completes it in this sitting or follows Part E for both halves; a half-switched domain is never left when the sitting ends (FR-010b). | `--item live-www-redirect` is pending or complete; `--item live-domain-ghost` reports each half |
| L13 | Wait for DNS and certificates to settle. Re-run the setup check every few minutes. `pending` means wait; a `Problem:` that cannot be fixed in the sitting means go to Part E; a check still pending 24 hours after the switch date is a problem (FR-017). The replacement records are proxied, so Cloudflare shows their TTL as "Auto" (5 minutes), within FR-010c's limit. | `pnpm setup:check` |

### Part D — After the switch (FR-013–FR-020)

| Step | What | Confirmed by |
|---|---|---|
| L14 | Post-launch checks: items 28–32 complete. **Pause:** Don also sends a test message starting "Launch test" from `https://doncoleman.ca/contact/`, confirms it arrived and deletes it (FR-015b), and sends an email to and from his domain address (FR-016a, after the switch). The step lists the rollback triggers (FR-011a): a `Problem:` that cannot be fixed in the sitting, any mail record differing from the baseline, a check still pending 24 hours after the switch, or Don judging the site unusable for readers. Don decides. | `pnpm setup:check` shows 28–32 complete. Don confirms the message and the email |
| L15 | **Pause.** External links reminder: Don updates links that point to old blog addresses (LinkedIn posts, profiles, other sites he controls). Old addresses are not redirected. | Don opens each updated link and it lands on a page |
| L16 | **Pause.** Remove the review address: Workers & Pages → `dcc-web` → Domains & Routes → remove `new.doncoleman.ca`. Confirm that its DNS record is gone. | `--item review-address-removed` is complete (pending while caches expire) |
| L17 | **Pause.** Optional: Don adds `https://doncoleman.ca/sitemap-index.xml` in Google Search Console for the domain. | Don |
| L18 | Note the switch date. Rollback stays possible until Ghost is cancelled. Retirement (Part F) starts no earlier than 2 weeks after this date. | The date is written in the retirement follow-up pull request |

### Part E — Rollback (FR-011, US3)

The intro says: use this while Ghost is still running, from the switch date until Ghost is
cancelled (no earlier than 2 weeks later). Rollback is impossible once Ghost is cancelled. It
does not need the review address; if Don later wants to switch again after the review address
is gone, he restores it first and Part A runs again. No search-engine step is needed after a
rollback.

| Step | What | Confirmed by |
|---|---|---|
| R1 | **Pause.** Remove Custom Domain `doncoleman.ca` from `dcc-web`. | Dashboard |
| R2 | **Pause.** Recreate `A doncoleman.ca 49.13.201.194`, DNS only, TTL 14400 ("4 hr"), exactly as in L8. | Dashboard |
| R3 | **Pause.** Delete `AAAA www 100::`. Recreate `CNAME www drift-and-convergence.mymagic.page`, DNS only, TTL 14400 ("4 hr"), exactly as in L8. | Dashboard |
| R4 | **Pause.** Turn off the www Redirect Rule. | Dashboard |
| R5 | Confirm that Ghost is back. | `--item live-domain-ghost` reports "still resolves to the recorded Ghost targets", `--item dns-records-parity` is complete, and `--item mail-records` is complete |

### Part F — Retirement, two weeks after the switch (FR-021–FR-024)

| Step | What | Confirmed by |
|---|---|---|
| T1 | **Pause.** Don confirms he is satisfied with the live site. The step states: **rollback ends when Ghost is cancelled**, and Ghost's content and members cannot be recovered once the subscription ends. It also states the private-records rules (FR-021a): the members file and any exported contact submissions stay only on Don's machine, are deleted within 12 months of the export, and personal-data requests about them are answered by hand within 30 days. | Don |
| T2 | **Pause.** Export from Ghost: Settings → Advanced → Import/Export → Export content (JSON), and Members → Export all members (CSV), to a folder outside the repository. | The agent runs `ls -l <path>` on the two paths Don gives. Both files exist and are not empty. The agent never opens the members file |
| T3 | **Pause. Irreversible.** Evidence first: T1 done and both T2 files confirmed. Cancel the Ghost subscription (Ghost host billing), then revoke any Ghost integration keys and remove leftover Ghost secrets from GitHub, Cloudflare and local untracked files (FR-025b). | Don sees the cancellation confirmation |
| T4 | **Pause. Irreversible.** Evidence first: Ghost cancelled (T3), and Don confirms nothing other than Ghost's newsletter sends through Mailgun (the contact form sends no email). Delete the Mailgun records: `MX mail.doncoleman.ca mxa.eu.mailgun.org`, `MX mail.doncoleman.ca mxb.eu.mailgun.org`, `TXT mail.doncoleman.ca "v=spf1 include:mailgun.org ~all"`, `TXT mta._domainkey.mail.doncoleman.ca` (DKIM) and `CNAME email.mail.doncoleman.ca eu.mailgun.org` (tracking): all five Mailgun records (spec FR-024). The iCloud records are **not** touched. Then delete the Mailgun sending domain and its API keys (FR-025b), and send an email to and from the domain address (FR-016a, after the deletion). The agent sets those baseline entries, and the Ghost web records, to `drop` with dated reasons in the follow-up pull request straight after the deletion; retirement is not complete until `--item mail-records` passes against the updated baseline (FR-024). | `--item mail-records` is complete (iCloud only) and `--item dns-records-parity` is complete |
| T5 | **Pause.** Supabase review and export: the step shows Don the project's tables, their fields and the number of records; Don exports the contact submissions he wants to keep (Table Editor → table → Export to CSV) outside the repository, opens the file himself and checks its record count matches the project's (FR-022). | `ls -l <path>`; Don confirms the count matches |
| T6 | **Pause.** Supabase identity, two independent identifiers: Don confirms the project's name, that its project reference matches the one in the Flux repository's Supabase configuration, and that it holds Flux's `contact` table and `contact` edge function, so it is not his other project. | Don states the project name and that the reference matches |
| T7 | **Pause. Irreversible.** Evidence first: T5 export confirmed and T6 identity confirmed. Supabase delete: Project Settings → General → Delete project. Remove any leftover Supabase secrets from GitHub, Cloudflare and local untracked files (FR-025b). | The project is gone from the dashboard list |
| T8 | **Pause. Reversible.** Before archiving, scan `drcdev/flux` for committed secrets and personal data; revoke any secret found and remove personal data (or keep the repository private) (FR-023). Then archive the Flux repository: GitHub → `drcdev/flux` → Settings → Archive. | `gh repo view drcdev/flux --json isArchived` shows `true` |
| T9 | Follow-up pull request (by the agent, FR-025c): `docs/design-source.md` says Flux is archived but can still be cloned with the same `gh repo clone` command; the `setup/dns-baseline.json` drops from T4; the `new.doncoleman.ca` `_headers` rule is removed; optionally, the apex Custom Domain moves into `wrangler.jsonc`. A final check confirms no DNS record points at Ghost, Mailgun or the review address (FR-025a, SC-008). | That pull request's `verify`; `--item mail-records` and `--item dns-records-parity` complete. `gh repo clone drcdev/flux .reference/flux -- --depth 1` still works |

## Tests that pin this contract (`tests/unit/setup/launch-doc.test.ts`)

- The parts appear in the order A to F. The step ids are L1–L18, R1–R5 and T1–T9, in order,
  each with an anchor.
- Every step has **What to do**, then **Where**, then **How to confirm**.
- Every step listed with **Pause** above contains `**Pause:**`.
- The L8 table equals the Ghost web records in `setup/dns-baseline.json`: type, name, content,
  "DNS only" and TTL (14400). R2 and R3 name the same TTL.
- Every step states what to do when its confirmation fails.
- L5 and L14 say "Launch test" and that the message is deleted; L9, L14 and T4 include the mail
  test; L12 states the one-sitting, both-halves rule; L14 lists the four rollback triggers.
- Ghost cancellation (T3), Mailgun deletion (T4) and Supabase deletion (T7) are labelled
  irreversible with their evidence; T8 is labelled reversible.
- T5 includes the record-count match, T6 the project reference, T8 the secret scan, T3, T4 and
  T7 the key and secret removal, and T9 the final dangling-record check.
- L15 (external links) comes directly after L14 (the post-launch checks).
- Part E names every record from L8. Its intro says rollback is impossible once Ghost is
  cancelled. T1 restates that before T3.
- T2 (the exports) comes before T3 (the cancellation). T5 (the export) and T6 (the identity
  check) come before T7 (the delete).
- No step contains "paste" next to "chat" except in a "never" sentence.
- Every `pnpm setup:check --item <id>` named in the document is a registry id.
- `docs/setup.md`'s intro links to `docs/launch.md`, and its Launch part heading comes before
  section 26.
