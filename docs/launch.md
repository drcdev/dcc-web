# Launch walkthrough

This is the step-by-step plan for moving `doncoleman.ca` from the current Ghost site to the new
site, and for undoing the move if something goes wrong. Don follows it by hand, with or without an
assistant. Every step says what to do, where to do it, how to tell it worked, and what to do if it
did not.

**Order of the parts.** Part A checks the site is ready. Part B prepares the switch. Part C does
the switch. Part D checks the live site and tidies up. Part E is the rollback and is read before
Part C starts. Part F retires Ghost, Supabase and Mailgun and starts no earlier than 2 weeks after
the switch.

**When.** The switch happens only after the pull request that adds this walkthrough has merged to
`main`, because the live checks and the production build rules ship with it. After the switch,
rollback stays possible for at least 2 weeks, the window in which Ghost keeps running. Retirement
(Part F) starts no earlier than 2 weeks after the switch date.

**Who does what.** Don alone acts in a dashboard, an account, the DNS zone or an export. The
assisting agent never signs in, never creates accounts, never changes DNS and never handles or
asks for a credential. Where a token is involved, Don types it into the dashboard or into a
command he runs himself, and never pastes it into the chat. Exported files stay on Don's machine,
outside the repository; they are never opened in the chat, committed or logged.

**How an assisted run works.** At each step marked **Pause:** the agent stops and waits for one of
three answers: `Done — check it`, `Skip for now` or `Stop here`. It then runs the confirmation
shown in **How to confirm**. The walkthrough moves on only when the confirmation passes.

Commands are run from the repository root on `main`. The setup check (`pnpm setup:check`) reports
`complete`, `pending` (wait), `waiting` (not applicable yet), `missing` or `could-not-check`.

## Part A — Readiness {#part-a}

### L1. Pull main and run the full setup check {#l1}

**What to do**
Update `main` and run the whole setup check. Items 1 to 24 must be complete, except item 15
(review address removed), which reports `waiting` until the switch. Items 25 to 31 may report
`waiting` or `missing` for now.

**Where**
A terminal in the repository: `git switch main && git pull`, then `pnpm setup:check`.

**How to confirm**
The report lists items 1 to 24 as complete, with item 15 as `waiting`.

**If it does not confirm**
Fix the first item that is not complete using its section in `docs/setup.md`, then run the check
again. Do not go on to L2 until the list is clean.

### L2. Replace the placeholder copy and publish the pages {#l2}

**What to do**
Publish each page in `launch.expectedPages` in `setup/config.json` (`draft: false`) with no
placeholder copy. A page kept hidden with `visible: false` (Work with me, until issue #122) is
accepted as it is. No published project visual may still be marked as a placeholder, and the
privacy policy must say contact messages are stored in Cloudflare D1 and name no retired service.
If the check already reports complete, no pull request is needed. Otherwise do this through a normal
small pull request to `main`.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Content files under `src/content/pages/` and `src/content/projects/`, then the pull request on GitHub.

**How to confirm**
After the pull request has merged and `main` is pulled, `pnpm setup:check --item launch-content-ready`
reports complete.

**If it does not confirm**
Read the details the check prints: each names a page or project still to fix. Fix them in a new
small pull request and run the item again.

### L3. Confirm every Ghost post is on the new site {#l3}

**What to do**
Compare the Ghost post list with the writing list on the new site and make sure every post is
there. Old Ghost post addresses are not redirected, so a missing post is lost to readers.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Ghost Admin → Posts (published), compared with `https://new.doncoleman.ca/writing/`.

**How to confirm**
Don confirms the two lists match, post for post.

**If it does not confirm**
Add each missing post to `src/content/posts/` through a pull request, then compare again. Do not
continue while any post is missing.

### L4. Check internal links and the production origin {#l4}

**What to do**
Run the site crawl against the review address, expecting the bare domain as the site's main
address, and make sure the latest merged pull request passed its own checks, including the preview
crawl.

**Where**
A terminal in the repository:
`pnpm run site:check -- --base https://new.doncoleman.ca --expect-origin https://doncoleman.ca`.
The pull request checks are on GitHub (the `verify` check of the last merged pull request).

**How to confirm**
The crawl exits 0 and prints no broken link, and the last merged pull request's `verify` is green.

**If it does not confirm**
The crawl names each broken link or wrong address. Fix them in a pull request to `main`, wait for
it to merge and deploy, and run the crawl again.

### L5. Send a test message through the contact form {#l5}

**What to do**
Send a message that starts with "Launch test" from `https://new.doncoleman.ca/contact/`, check it
arrived using the usual way of reading messages, then delete it. This also proves spam protection
accepts the bare domain. Any token is typed only into Don's own terminal, never pasted into the chat.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
The contact page on the review address, and Don's usual message retrieval.

**How to confirm**
The message arrived and has been deleted, and `pnpm setup:check --item contact-turnstile-widget`
reports complete (the widget allows the bare domain).

**If it does not confirm**
If the form refuses the message, open the spam-protection widget in the Cloudflare dashboard and
check that `doncoleman.ca` is in its hostname list (item 19 in `docs/setup.md`), then try again.
If the message never arrives, stop and fix the contact form first.

### L6. Main branch checks are passing {#l6}

**What to do**
Confirm the automated checks on `main` pass, including the accessibility checks and the
performance budget.

**Where**
A terminal in the repository: `pnpm setup:check --item launch-main-checks`.

**How to confirm**
The item reports complete.

**If it does not confirm**
A failing accessibility or performance check blocks the switch. Fix the failure in a pull request
and run the item again; if it reports `could-not-check`, repeat when GitHub is reachable.

### L7. Readiness gate {#l7}

**What to do**
Fill in this table from L1 to L6. If any row is not confirmed, **stop**: the walkthrough does not
continue to Part B.

| Readiness row | Step | Result |
|---|---|---|
| Items 1 to 24 complete (15 `waiting`) | L1 | |
| Pages published, privacy policy correct | L2 | |
| Every Ghost post is on the new site | L3 | |
| No broken internal links, bare domain as main address | L4 | |
| Contact form works end to end, spam protection accepts the bare domain | L5 | |
| Main branch checks passing (accessibility, performance) | L6 | |

**Where**
The results of L1 to L6 above.

**How to confirm**
Every row says confirmed. The agent shows this table and asks no one to act until it is complete.

**If it does not confirm**
Go back to the step of the first unconfirmed row, fix it and repeat from there. Do not start Part B.

## Part B — Before the switch {#part-b}

### L8. Check the recorded Ghost records and save a zone export {#l8}

**What to do**
Compare the Ghost web records below with the Cloudflare zone. These are the records the switch
replaces and the ones the rollback restores. Then save a whole-zone export on Don's own machine,
outside the repository.

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| `A` | `doncoleman.ca` | `49.13.201.194` | DNS only | 14400 (shown as "4 hr") |
| `CNAME` | `www.doncoleman.ca` | `drift-and-convergence.mymagic.page` | DNS only | 14400 (shown as "4 hr") |

If the dashboard shows anything else, correct `setup/dns-baseline.json` first in a pull request.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → the `doncoleman.ca` zone → DNS → Records, then DNS → Records → Import and
Export → Export. Save the file somewhere outside the repository.

**How to confirm**
`pnpm setup:check --item dns-records-parity` and `pnpm setup:check --item live-domain-ghost` both
report complete, and Don confirms the export file exists on his machine.

**If it does not confirm**
If a record differs, fix the zone or the baseline so they agree and run the checks again. If the
export fails, try again; do not start the switch without a saved export.

### L9. Read the rollback and test mail {#l9}

**What to do**
Read Part E (rollback) from start to finish before changing anything. Then send an email to and from
Don's domain address and confirm both arrive. This is the baseline for mail after the switch.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Part E of this document, then Don's mail client.

**How to confirm**
Don confirms both emails arrived, and `pnpm setup:check --item mail-records` reports complete.

**If it does not confirm**
If mail does not arrive, do not switch: mail comes before the website. Compare the mail records
with the baseline using the check's details and fix the difference first, then repeat the test.

### L10. Turn on Always Use HTTPS {#l10}

**What to do**
Turn on Always Use HTTPS for the zone. It affects proxied hostnames only; Ghost's DNS-only records
are not affected.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → the zone → SSL/TLS → Edge Certificates → Always Use HTTPS.

**How to confirm**
The dashboard shows Always Use HTTPS as "On".

**If it does not confirm**
Turn it on again and reload the page. If it will not stay on, stop and do not start Part C.

## Part C — The switch {#part-c}

Do L11, L12 and L13 in one sitting, with time to roll back. The bare domain goes first, then
`www`. Note the switch date and Ghost's next renewal date when you start.

### L11. Point the bare domain at the new site {#l11}

**What to do**
Delete the `A doncoleman.ca 49.13.201.194` record, then add the Custom Domain `doncoleman.ca` on
`dcc-web`. No other record changes. Write down today's date as the switch date, and Ghost's next
renewal date, so the retirement date is not missed.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → the zone → DNS → Records (delete the apex `A`), then Workers & Pages →
`dcc-web` → Settings → Domains & Routes → Add → Custom Domain.

**How to confirm**
`pnpm setup:check --item live-domain-ghost` reports "Switched…" for the bare domain, and
`pnpm setup:check --item live-apex` is pending or complete.

**If it does not confirm**
If the Custom Domain cannot be added, add the `A` record back exactly as in L8 and stop. If it is
added but the check is not yet happy, carry on to L12 in the same sitting and watch L13.

### L12. Point www at the bare domain {#l12}

**What to do**
In the same sitting, delete the `CNAME www` record, add `AAAA www 100::` (Proxied), and create the
Redirect Rule: wildcard `*://www.doncoleman.ca/*` to `https://doncoleman.ca/${2}`, status 301,
preserve query string. If either half cannot be confirmed, finish it in this sitting or follow Part
E for both halves. A half-switched domain is never left when the sitting ends.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → the zone → DNS → Records, then Rules → Redirect Rules → Create rule.

**How to confirm**
`pnpm setup:check --item live-www-redirect` is pending or complete, and
`pnpm setup:check --item live-domain-ghost` reports each half (bare domain and `www`) as switched.

**If it does not confirm**
If the `www` half cannot be made to work in this sitting, go to Part E and roll back both halves.
Do not leave one half switched.

### L13. Wait for DNS and certificates to settle {#l13}

**What to do**
Run the setup check every few minutes. `pending` means wait. The replacement records are proxied,
so Cloudflare shows their TTL as "Auto", which is 5 minutes, within the 5-minute limit for this
switch.

**Where**
A terminal in the repository: `pnpm setup:check`.

**How to confirm**
Items 27 and 28 report complete.

**If it does not confirm**
A `Problem:` that cannot be fixed in the sitting means go to Part E. A check still pending 24 hours
after the switch date is also a problem: go to Part E.

## Part D — After the switch {#part-d}

### L14. Run the post-launch checks {#l14}

**What to do**
Run the post-launch checks (items 27 to 31). Then send a test message starting "Launch test" from
`https://doncoleman.ca/contact/`, confirm it arrived and delete it. Send an email to and from the domain address again
and confirm both arrive.

The rollback triggers are: a `Problem:` that is unfixable in the sitting, any mail record differing
from the baseline, a check still pending after 24 hours, or Don judging the site unusable for
readers. If any of these happens, follow Part E. Don decides.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
A terminal in the repository, then the contact page on `doncoleman.ca` and Don's mail client:
`pnpm setup:check`.

**How to confirm**
`pnpm setup:check` shows `live-apex`, `live-www-redirect`, `live-sitemap`, `live-contact-endpoint`
and `mail-records` complete, and Don confirms the message and the email arrived.

**If it does not confirm**
If a check is pending, wait and run it again. If any rollback trigger above applies, go to Part E.

### L15. Update external links {#l15}

**What to do**
Update links that point to old blog addresses: LinkedIn posts and profile, other sites Don
controls, and anything else he can edit. Old addresses are not redirected, so a stale link lands
on the not-found page.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
LinkedIn and each other site where the old addresses appear.

**How to confirm**
Don opens each updated link and it lands on a real page on `doncoleman.ca`.

**If it does not confirm**
Correct the link to the new address from the sitemap and open it again. Links that cannot be
edited are left; they cost a visit, not the site.

### L16. Remove the review address {#l16}

**What to do**
Remove `new.doncoleman.ca` from `dcc-web` and delete its DNS record, so only one address serves
the site. Then confirm it no longer resolves.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → Workers & Pages → `dcc-web` → Settings → Domains & Routes → remove
`new.doncoleman.ca`; then the zone → DNS → Records, to confirm its DNS record is gone.

**How to confirm**
`pnpm setup:check --item review-address-removed` reports complete. It reports `pending` while
caches expire.

**If it does not confirm**
If it is `pending`, wait for the record's cache lifetime and run it again. If it is `missing`,
the Custom Domain or the DNS record is still there: remove it and run the check again.

### L17. Optional: add the sitemap in Search Console {#l17}

**What to do**
Optional. Add `https://doncoleman.ca/sitemap-index.xml` in Google Search Console for the domain,
so Google finds the new site faster.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Google Search Console → the `doncoleman.ca` property → Sitemaps.

**How to confirm**
Search Console shows the sitemap as submitted. Don confirms.

**If it does not confirm**
This step is optional: skip it, or try again later. Nothing else depends on it.

### L18. Note the switch date {#l18}

**What to do**
Write the switch date into the retirement follow-up plan. Rollback stays possible until Ghost is
cancelled. Retirement starts no earlier than 2 weeks after this date.

**Where**
The note Don made in L11, and the follow-up pull request for retirement when it is opened.

**How to confirm**
The date is written down where the retirement work will find it.

**If it does not confirm**
If the date was not recorded, take it from the Cloudflare Custom Domain's creation time and write
it down now.

## Part E — Rollback {#rollback}

Use this while Ghost is still running: from the switch date until Ghost is cancelled, which is no
earlier than 2 weeks later. Rollback is impossible once Ghost is cancelled, because Ghost's content
and members cannot be recovered after that. It does not need the review address, which may already
be gone. If Don later wants to switch again after the review address is removed, he restores it
first and Part A runs again. No search-engine step or indexing step is needed after a rollback.

The Ghost records to restore, exactly as they were:

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| `A` | `doncoleman.ca` | `49.13.201.194` | DNS only | 14400 ("4 hr") |
| `CNAME` | `www.doncoleman.ca` | `drift-and-convergence.mymagic.page` | DNS only | 14400 ("4 hr") |

Do R1 to R5 in one sitting, in order.

### R1. Remove the Custom Domain {#r1}

**What to do**
Remove the Custom Domain `doncoleman.ca` from `dcc-web`.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → Workers & Pages → `dcc-web` → Settings → Domains & Routes → `doncoleman.ca`
→ Remove.

**How to confirm**
The dashboard no longer lists `doncoleman.ca` under Domains & Routes.

**If it does not confirm**
Reload and remove it again. If it will not go, stop and contact Cloudflare support before editing
any DNS.

### R2. Restore the apex A record {#r2}

**What to do**
Create `A doncoleman.ca 49.13.201.194`, DNS only (grey cloud), TTL 14400 ("4 hr"), exactly as in L8.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → the zone → DNS → Records → Add record.

**How to confirm**
The dashboard lists the record with the grey cloud and "4 hr".

**If it does not confirm**
Check the address and the proxy setting against the table above and correct the record.

### R3. Restore the www CNAME {#r3}

**What to do**
Delete `AAAA www 100::`. Create `CNAME www drift-and-convergence.mymagic.page`, DNS only, TTL 14400
("4 hr"), exactly as in L8.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → the zone → DNS → Records.

**How to confirm**
The dashboard lists the `www` CNAME with the grey cloud and "4 hr", and no `AAAA www`.

**If it does not confirm**
A CNAME cannot coexist with another `www` record: delete any leftover `www` record and add the
CNAME again.

### R4. Turn off the www Redirect Rule {#r4}

**What to do**
Turn off (or delete) the Redirect Rule that sends `www` to the bare domain.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → the zone → Rules → Redirect Rules.

**How to confirm**
The rule shows as disabled or is gone.

**If it does not confirm**
Reload the page and disable it again. A still-enabled rule would send `www` visitors to the wrong
place.

### R5. Confirm Ghost is back {#r5}

**What to do**
Run the setup check and confirm Ghost serves the domain again and the mail records are intact.

**Where**
A terminal in the repository: `pnpm setup:check`.

**How to confirm**
`pnpm setup:check --item live-domain-ghost` reports "still resolves to the recorded Ghost targets",
`pnpm setup:check --item dns-records-parity` is complete, and
`pnpm setup:check --item mail-records` is complete.

**If it does not confirm**
DNS caches can take up to 4 hours to expire (the restored records' lifetime). Wait and run the
checks again. If a check still reports a `Problem:` after that, compare the zone with the table at
the top of this part and fix any difference.

## Part F — Retirement, two weeks after the switch {#part-f}

Start Part F no earlier than 2 weeks after the switch date Don wrote down in L11 and L18, and only
when Don is satisfied with the live site. The steps are in order and several cannot be undone, so
they are labelled **Irreversible** (cannot be undone) or **Reversible** (can be undone). Each
irreversible step lists the evidence that must exist first, and the agent checks that evidence
before it asks Don to act. The agent never signs in, never opens the exported files and never asks
for a credential. The edits that follow the retirement are one small follow-up pull request,
described in T9.

### T1. Confirm you are satisfied with the live site {#t1}

**What to do**
Confirm the new site has served `doncoleman.ca` well for at least 2 weeks and that nothing is
missing. **Rollback ends when Ghost is cancelled** (T3): Ghost's content and members cannot be
recovered once the subscription ends. Read the private-records rules too. The members file and any
exported contact submissions stay only on Don's machine, are deleted within 12 months of the
export, and any request about personal data in them is answered by hand within 30 days.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Nowhere to act yet. Look at the live site, the setup check and the contact messages that arrived.

**How to confirm**
Don says he is satisfied and has read the two rules above. The agent does not go on without that.

**If it does not confirm**
If anything is wrong, do not continue. Fix it, or roll back with Part E while Ghost is still
running, and start Part F again later.

### T2. Export Ghost's content and members {#t2}

**What to do**
Export Ghost's content as JSON and its members as CSV to a folder outside the repository. These
files are the only copy of the content and members once Ghost is cancelled. They are never copied
into the repository, never committed and never opened in the chat.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Ghost Admin → Settings → Advanced → Import/Export → Export content (JSON). Then Members → Export
all members (CSV).

**How to confirm**
Don gives the agent the two file paths. The agent runs `ls -l <path>` on each. Both files exist and
are not empty. The agent never opens the members file, and never opens the content file in the chat.

**If it does not confirm**
If a file is missing or empty, export it again and check again. Do not go on to T3 until both files
are confirmed.

### T3. Cancel Ghost {#t3}

**What to do**
**Irreversible.** Evidence first: T1 is done and both T2 files are confirmed. Cancel the Ghost
subscription with the Ghost host's billing. Then revoke any Ghost integration keys and remove
leftover Ghost secrets from GitHub, Cloudflare and local untracked files.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
The Ghost host's billing page; Ghost Admin → Settings → Advanced → Integrations for the keys; the
GitHub repository secrets; Cloudflare Workers & Pages → `dcc-web` → Settings → Variables and
Secrets; and `git status --ignored` locally for untracked files.

**How to confirm**
Don sees the cancellation confirmation. The agent confirms no Ghost key or secret remains in the
places listed.

**If it does not confirm**
If the cancellation did not go through, try again or contact the Ghost host. If a leftover secret
remains, remove it and look again. After the cancellation, rollback is no longer possible.

### T4. Delete the Mailgun records {#t4}

**What to do**
**Irreversible.** Evidence first: Ghost is cancelled (T3), and Don confirms nothing other than
Ghost's newsletter sends through Mailgun (the contact form sends no email). Delete all five Mailgun
records for `mail.doncoleman.ca`: `MX mail.doncoleman.ca mxa.eu.mailgun.org`,
`MX mail.doncoleman.ca mxb.eu.mailgun.org`, `TXT mail.doncoleman.ca "v=spf1 include:mailgun.org ~all"`,
`TXT mta._domainkey.mail.doncoleman.ca` (DKIM) and `CNAME email.mail.doncoleman.ca eu.mailgun.org`
(tracking). The iCloud records stay: do not touch them. Then delete the Mailgun sending domain and
its API keys, and send an email to and from the domain address and confirm both arrive. Straight
after the deletion the agent opens the follow-up pull request that sets those five baseline entries,
and the Ghost web records, to `drop` with dated reasons in `setup/dns-baseline.json`. Retirement is
not complete until `pnpm setup:check --item mail-records` passes against the updated baseline.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Cloudflare dashboard → the zone → DNS → Records; Mailgun dashboard → Sending → Domains, and
Settings → API keys; Don's mail client for the email test.

**How to confirm**
`pnpm setup:check --item mail-records` is complete, showing iCloud only, and
`pnpm setup:check --item dns-records-parity` is complete, both against the updated baseline.

**If it does not confirm**
If the mail test fails, check the iCloud records first: they must be unchanged. If a Mailgun record
is left, delete it and run the checks again. If the baseline and the zone disagree, correct the
baseline entry, never the iCloud records.

### T5. Review and export the Supabase contact submissions {#t5}

**What to do**
Look at what the old Supabase project holds before it is deleted. The agent asks Don to read out
the project's tables, their fields and the number of records in each. Don then exports the contact
submissions he wants to keep as CSV to a folder outside the repository, opens the file himself, and
checks that the number of records in it matches the number the project shows. Nothing from the file
is shown in the chat.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Supabase dashboard → Table Editor → the table → Export to CSV. Don opens the file on his own
machine.

**How to confirm**
The agent runs `ls -l <path>` on the path Don gives and sees a non-empty file. Don says the record
count in the file matches the count shown in the project.

**If it does not confirm**
If the counts differ, export again (check the table filter and the page size) and compare again.
Do not go on to T7 until they match.

### T6. Confirm the Supabase project is Flux's {#t6}

**What to do**
Make sure the project about to be deleted is Flux's and not his other Supabase project. Don
confirms two independent identifiers: the project name, and that the project reference matches the
one in the Flux repository's Supabase configuration. Don also confirms it holds Flux's `contact`
table and `contact` edge function.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Supabase dashboard → Project Settings → General (name and reference); the `drcdev/flux`
repository's Supabase configuration file for its reference.

**How to confirm**
Don states the project name and that the reference matches the Flux repository's. The agent writes
both down before T7.

**If it does not confirm**
If the name or the reference does not match, stop. Do not delete anything. Look for the right
project, or leave Supabase alone and note it.

### T7. Delete the Supabase project {#t7}

**What to do**
**Irreversible.** Evidence first: the T5 export is confirmed and the T6 identity is confirmed.
Delete the project, then remove any leftover Supabase secrets from GitHub, Cloudflare and local
untracked files.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
Supabase dashboard → Project Settings → General → Delete project; then the GitHub repository
secrets, Cloudflare Workers & Pages → `dcc-web` → Variables and Secrets, and `git status --ignored`
locally.

**How to confirm**
The project is gone from the dashboard's project list, and no Supabase secret remains in the
places listed.

**If it does not confirm**
If the project is still listed, reload and check it is not just paused. If the wrong project was
targeted, stop and tell the agent at once. If a secret remains, remove it and look again.

### T8. Scan and archive the Flux repository {#t8}

**What to do**
**Reversible.** Before archiving, scan `drcdev/flux` for committed secrets and personal data.
Revoke any secret found and remove the personal data, or keep the repository private. Then archive
the Flux repository. It can still be cloned, and GitHub can unarchive it.

**Pause:** the agent stops here and waits for Don's answer: `Done — check it`, `Skip for now` or `Stop here`.

**Where**
The agent scans a local clone of `drcdev/flux` for secrets and personal data and reports file
names only. Then GitHub → `drcdev/flux` → Settings → Archive this repository. Revoking a secret
happens in the issuing service's dashboard.

**How to confirm**
`gh repo view drcdev/flux --json isArchived` shows `true`.

**If it does not confirm**
If the scan finds a secret, revoke it in its service and remove it before archiving. If the command
shows `false`, repeat the archive in Settings and check again. Unarchiving in Settings undoes it.

### T9. Follow-up pull request and final check {#t9}

**What to do**
The agent opens one small follow-up pull request. `docs/design-source.md` says Flux is archived
but can still be cloned with the same `gh repo clone` command. `setup/dns-baseline.json` drops the
records retired in T4. The `new.doncoleman.ca` rule in `_headers` is removed. Optionally, the apex
Custom Domain moves into `wrangler.jsonc`. A final check confirms no DNS record points at Ghost,
Mailgun or the review address. None of these edits are made before Part F.

**Where**
A pull request from the agent; the clone command in `docs/design-source.md`.

**How to confirm**
That pull request's `verify` check passes, and `pnpm setup:check --item mail-records` and
`pnpm setup:check --item dns-records-parity` are complete.
`gh repo clone drcdev/flux .reference/flux -- --depth 1` still works.

**If it does not confirm**
If `verify` fails, fix the baseline or docs change and push again. If a record still points at
Ghost, Mailgun or the review address, Don deletes it in the dashboard and the checks run again.
