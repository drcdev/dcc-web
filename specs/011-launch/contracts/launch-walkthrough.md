# Contract: `docs/launch.md`, the launch walkthrough

## Rules that apply to every step (FR-005, FR-006, FR-007)

- Each step is a `###` heading with an id and an anchor, for example
  `### L11. Point the bare domain at the new site {#l11}`. It has three labelled paragraphs, in
  this order: **What to do**, **Where**, **How to confirm**.
- Every step that needs Don has a line starting `**Pause:**`. The line says that the assisting
  agent stops there and waits for Don's answer: `Done — check it`, `Skip for now` or
  `Stop here`. The agent never signs in, creates accounts, changes DNS, or handles or asks for
  a credential.
- No step asks for a secret to be pasted into the chat. Where a token is involved, the step says
  to type it into the dashboard or into the local command Don runs himself.
- Confirmations are commands (`pnpm setup:check --item <id>`, `pnpm run site:check -- …`,
  `gh repo view … --json isArchived`) or something Don can see. The walkthrough moves on only
  when the confirmation passes.
- The intro states the order of the parts, says the switch happens only after this feature's
  pull request has merged, and gives the 2-week window.

## Step list

### Part A — Readiness (FR-003, FR-004)

| Step | What | Confirmed by |
|---|---|---|
| L1 | Pull `main` and run the full setup check. Items 1–25 are complete. | `pnpm setup:check` |
| L2 | **Pause.** Don replaces the Services and Speaking placeholder copy and the Focus Pocus placeholders, and publishes the pages (`draft: false`). | `pnpm setup:check --item launch-content-ready` |
| L3 | **Pause.** Don confirms that every Ghost post is on the new site: the Ghost Admin post list compared with `/blog/`. | Don |
| L4 | Check that no internal link points to a missing page on the review address. | `pnpm run site:check -- --base https://new.doncoleman.ca` exits 0, and the last merged pull request's `verify` (with its preview crawl) passed |
| L5 | **Pause.** Don sends a test message from `https://new.doncoleman.ca/contact/` and confirms it arrived, using his usual retrieval method. He types any token only into his own terminal. | Don |
| L6 | Main branch checks are passing. | `pnpm setup:check --item launch-main-checks` |
| L7 | Readiness gate. A table of L1–L6 results. If any is not confirmed, **stop**: the walkthrough does not continue to Part B. | All of the above |

### Part B — Before the switch (FR-009)

| Step | What | Confirmed by |
|---|---|---|
| L8 | **Pause.** The recorded Ghost records are shown in a table: `A doncoleman.ca 49.13.201.194, DNS only, TTL Auto` and `CNAME www.doncoleman.ca drift-and-convergence.mymagic.page, DNS only, TTL Auto`. Don checks they match Cloudflare → DNS → Records and saves a zone export (Import and Export → Export) on his own machine. | `pnpm setup:check --item dns-records-parity` and `--item live-domain-ghost` are complete. Don confirms the export file exists |
| L9 | **Pause.** Don reads Part E (rollback) before any change. | Don |
| L10 | **Pause.** Don turns on SSL/TLS → Edge Certificates → Always Use HTTPS. This affects proxied hostnames only; Ghost's DNS-only records are unaffected. | Dashboard shows "On" |

### Part C — The switch (FR-010, FR-010a)

| Step | What | Confirmed by |
|---|---|---|
| L11 | **Pause.** In one sitting, Don deletes `A doncoleman.ca 49.13.201.194`, then adds Custom Domain `doncoleman.ca` on `dcc-web` (Workers & Pages → `dcc-web` → Settings → Domains & Routes → Add → Custom Domain). No other record changes. | `--item live-domain-ghost` reports "Switched…". `--item live-apex` is pending or complete |
| L12 | **Pause.** Don deletes `CNAME www`, adds `AAAA www 100::` (Proxied), and creates the Redirect Rule: wildcard `*://www.doncoleman.ca/*` → `https://doncoleman.ca/${2}`, 301, preserve query string. | `--item live-www-redirect` is pending or complete |
| L13 | Wait for DNS and certificates to settle. Re-run the setup check every few minutes. `pending` means wait; `Problem:` means go to Part E. | `pnpm setup:check` |

### Part D — After the switch (FR-013–FR-020)

| Step | What | Confirmed by |
|---|---|---|
| L14 | Post-launch checks: items 28–32 complete. **Pause:** Don also sends a real test message from `https://doncoleman.ca/contact/` and confirms it arrived. | `pnpm setup:check` shows 28–32 complete. Don confirms the message |
| L15 | **Pause.** External links reminder: Don updates links that point to old blog addresses (LinkedIn posts, profiles, other sites he controls). Old addresses are not redirected. | Don opens each updated link and it lands on a page |
| L16 | **Pause.** Remove the review address: Workers & Pages → `dcc-web` → Domains & Routes → remove `new.doncoleman.ca`. Confirm that its DNS record is gone. | `--item review-address-removed` is complete (pending while caches expire) |
| L17 | **Pause.** Optional: Don adds `https://doncoleman.ca/sitemap-index.xml` in Google Search Console for the domain. | Don |
| L18 | Note the switch date. Rollback stays possible until Ghost is cancelled. Retirement (Part F) starts no earlier than 2 weeks after this date. | The date is written in the retirement follow-up pull request |

### Part E — Rollback (FR-011, US3)

The intro says: use this while Ghost is still running, within 2 weeks of the switch. Rollback
is impossible once Ghost is cancelled.

| Step | What | Confirmed by |
|---|---|---|
| R1 | **Pause.** Remove Custom Domain `doncoleman.ca` from `dcc-web`. | Dashboard |
| R2 | **Pause.** Recreate `A doncoleman.ca 49.13.201.194`, DNS only, TTL Auto. | Dashboard |
| R3 | **Pause.** Delete `AAAA www 100::`. Recreate `CNAME www drift-and-convergence.mymagic.page`, DNS only, TTL Auto. | Dashboard |
| R4 | **Pause.** Turn off the www Redirect Rule. | Dashboard |
| R5 | Confirm that Ghost is back. | `--item live-domain-ghost` reports "still resolves to the recorded Ghost targets", `--item dns-records-parity` is complete, and `--item mail-records` is complete |

### Part F — Retirement, two weeks after the switch (FR-021–FR-024)

| Step | What | Confirmed by |
|---|---|---|
| T1 | **Pause.** Don confirms he is satisfied with the live site. The step states: **rollback ends when Ghost is cancelled.** | Don |
| T2 | **Pause.** Export from Ghost: Settings → Advanced → Import/Export → Export content (JSON), and Members → Export all members (CSV). | The agent runs `ls -l <path>` on the two paths Don gives. Both files exist and are not empty. The agent never opens the members file |
| T3 | **Pause.** Cancel the Ghost subscription (Ghost host billing). | Don sees the cancellation confirmation |
| T4 | **Pause.** Delete the Mailgun records: `MX mail.doncoleman.ca mxa.eu.mailgun.org`, `MX mail.doncoleman.ca mxb.eu.mailgun.org`, `TXT mail.doncoleman.ca "v=spf1 include:mailgun.org ~all"`, `TXT mta._domainkey.mail.doncoleman.ca` (DKIM). Don decides on the fifth Mailgun record, `CNAME email.mail.doncoleman.ca eu.mailgun.org`, which is recommended for deletion (research R11). The iCloud records are **not** touched. The agent then sets those baseline entries, and the Ghost web records, to `drop` with dated reasons. | `--item mail-records` is complete (iCloud only) and `--item dns-records-parity` is complete |
| T5 | **Pause.** Supabase export: Don exports the contact submissions he wants to keep (Table Editor → table → Export to CSV). | `ls -l <path>` |
| T6 | **Pause.** Supabase identity: Don confirms the project's name, and that it holds Flux's `contact` table and `contact` edge function, so it is not his other project. | Don states the project name |
| T7 | **Pause.** Supabase delete: Project Settings → General → Delete project. | The project is gone from the dashboard list |
| T8 | **Pause.** Archive the Flux repository: GitHub → `drcdev/flux` → Settings → Archive. | `gh repo view drcdev/flux --json isArchived` shows `true` |
| T9 | Follow-up pull request (by the agent): `docs/design-source.md` says Flux is archived but can still be cloned with the same `gh repo clone` command; the `setup/dns-baseline.json` drops from T4; the `new.doncoleman.ca` `_headers` rule is removed; optionally, the apex Custom Domain moves into `wrangler.jsonc`. | That pull request's `verify`. `gh repo clone drcdev/flux .reference/flux -- --depth 1` still works |

## Tests that pin this contract (`tests/unit/setup/launch-doc.test.ts`)

- The parts appear in the order A to F. The step ids are L1–L18, R1–R5 and T1–T9, in order,
  each with an anchor.
- Every step has **What to do**, then **Where**, then **How to confirm**.
- Every step listed with **Pause** above contains `**Pause:**`.
- The L8 table equals the Ghost web records in `setup/dns-baseline.json`: type, name, content,
  and "DNS only".
- L15 (external links) comes directly after L14 (the post-launch checks).
- Part E names every record from L8. Its intro says rollback is impossible once Ghost is
  cancelled. T1 restates that before T3.
- T2 (the exports) comes before T3 (the cancellation). T5 (the export) and T6 (the identity
  check) come before T7 (the delete).
- No step contains "paste" next to "chat" except in a "never" sentence.
- Every `pnpm setup:check --item <id>` named in the document is a registry id.
- `docs/setup.md`'s intro links to `docs/launch.md`, and its Launch part heading comes before
  section 26.
