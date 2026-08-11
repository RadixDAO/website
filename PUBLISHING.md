# Publishing to radixdao.org

This is a guide for publishing a notice or updating the home page status band **without needing a
local development setup** — everything below can be done from GitHub's website. No developer,
no laptop with Node installed, just a browser and write access to this repository.

If you have write access to this repository, you can publish. That's deliberate: the DAO's
governance framework requires that publishing not depend on any single person's account, device,
or credentials (the Governance Operator, the Council, or — in one specific case — the Registered
Agent must each independently be able to publish).

---

## Publishing a notice

Every notice is one Markdown file in `src/content/notices/`. **Never edit an existing notice file
after it's published** — if something needs correcting, publish a *new* file that supersedes it
(see below). The published file's git commit is itself part of the DAO's audit trail.

### Form-based path (recommended for ordinary notices)

1. Open the repository's **Issues → New issue → Publish a notice** form.
2. Choose the notice type, enter the title and body, and complete any optional fields.
3. Submit the form. The workflow checks that the submitter has write, maintain or admin access;
   anyone else is rejected before a branch can be written.
4. The workflow stamps `pubDate` from GitHub's clock, validates the generated file and opens a pull
   request. Review the rendered diff carefully.
5. Approve the pull request's workflow run when GitHub asks, wait for green checks, then merge.

The form is an authoring convenience, not a new source of truth: the generated Markdown file and
its git history remain the official record. GitHub Actions must be allowed to create pull requests
in the repository settings. Keep the manual path below available as the fallback whenever the form
or its workflow is unavailable.

### Manual browser path (fallback and urgent-publication path)

1. On GitHub, go to `src/content/notices/` and click **Add file → Create new file**. The committed
   `.gitkeep` means the directory is present even before the first notice.
2. Name it `YYYY-MM-DD-short-title.md`. The filename becomes the notice's permanent URL, so keep it
   short and don't reuse one.
3. Paste this template at the top, then write the notice body below the second `---`:

   ```markdown
   ---
   type: council-resolution
   title: "Exact title of the notice"
   pubDate: 2026-08-07T14:30:00Z
   ---

   The body of the notice goes here. Plain Markdown — paragraphs, links, lists all work.
   ```

4. Set `type` to whichever of these fits (must match exactly, lowercase, with hyphens):
   `activation-statement`, `council-resolution`, `advisory-acknowledgement`, `vacancy-notice`,
   `reduced-quorum-notice`, `identifier-register-change`, `compliance-challenge`,
   `regulatory-demand-notice`, `status-report`, `prior-disclosure-notice`, `delegate-statement`,
   `registry-update`.
5. Set `pubDate` to the current UTC time in the exact format shown (`YYYY-MM-DDTHH:MM:SSZ`).
   A difference of more than 15 minutes from the commit time creates a visible warning so a wrong
   year or timezone is hard to miss. The warning does not block a deliberate backdated notice.
6. **If this notice starts a statutory notice period** (e.g. a prior-disclosure notice for an
   amendment), also add a `noticeDate` line in the same format — it gets shown prominently on the
   published page.
7. Commit directly to `main` (or open a pull request first, if you'd rather have a second person
   check it before it goes live — either works).

`pubDate` is a record field, **not an embargo**. A future-dated notice publishes immediately when
its commit reaches `main`. Timed publication is not supported.

### Publishing a compliance challenge (verbatim, within 6 hours)

A compliance challenge is a filing that a decision breaks a specific rule (Proposal & Voting
Framework §8.4). Filings arrive at the two Filing Channel addresses — `veto@radix.community` as
primary, `rac@radix.community` in copy — so that receipt never depends on one role holder. The
`veto@` name is retained deliberately; it is not a leftover to be tidied up.

Challenge filings must be published **exactly as received** — no reformatting, no trimming, no
fixing typos. You may not filter, withhold, delay, or edit a filing.

Use the same steps above, but:

- Set `type: compliance-challenge`.
- Add `verbatim: true` to the frontmatter.
- Paste the filing's content into the body **completely unchanged** — copy-paste from the email
  exactly as it arrived.
- Do this within 6 hours of receiving the filing. This window is a governance parameter — treat it
  as a hard deadline, not a target.

Use the manual path for a time-critical compliance challenge. It must remain possible to publish
when the form workflow is unavailable, and the direct copy-paste path avoids introducing another
automation dependency into the six-hour route.

### Correcting a published notice

Never edit the original file. Instead:

1. Create a new notice file as above.
2. Add `supersedes: <the-old-file's-name-without-.md>` to the frontmatter (e.g.
   `supersedes: 2026-08-01-example-resolution`).
3. Explain the correction in the new notice's body.

The old notice stays exactly as it was, now shown with a "superseded by" banner linking to the
correction. The correction shows a "this corrects…" banner linking back.

---

## Updating the status strip

The pink strip across the top of every page is one small file: `src/content/site/status.md`. Edit
it directly on GitHub (pencil icon), change any of the lines below, and commit. It is live as soon
as the commit reaches `main` and the deploy finishes (a couple of minutes).

| Line | What it is | Example |
|---|---|---|
| `phase` | The short tag in the pink box. Keep it short — it must fit on one line on a phone. | `Phase 1 · Pre-formation` |
| `headline` | The one sentence everyone sees, on every page. | `Ratification vote pending. Community decisions are advisory until activation.` |
| `linkHref` | Where the link at the right goes. | `/govern/` |
| `linkText` | The words of that link. | `The sequence` |

The paragraph below the second `---` shows only on the home page, under the strip. Use it for the
longer explanation; keep the `headline` above for the part that must be true everywhere.

**This is the thing most likely to go out of date.** If the DAO's status changes and this strip
still says otherwise, every page on the site is wrong — so it is worth changing first, before
anything else.

---

## What happens after you commit

Every push to `main` runs local checks (`lint`, notice validation, form synchronization, Astro type
checking, build and tests) and then deploys automatically. There is no production reviewer or wait
timer and no manual deploy step.

Publishing is complete only when the commit's **publishing/live** status is green. That status is
set only after the workflow fetches `https://radixdao.org`, confirms the live build identifies the
new commit, finds each new notice in `/notices.json`, and receives HTTP 200 from every new
permalink. A successful notice publication also leaves a commit comment containing the live URL.
If the status is absent, pending for too long or red, treat the notice as unpublished.

The governance-content freshness check is intentionally separate. It runs on pull requests, pushes
to `main` and a schedule, but a changed or unreachable upstream repository cannot stop an unrelated
notice from publishing. Its source repository and immutable commit are recorded in
`content-sources.lock`; advancing that pin is a deliberate maintenance action.

A daily canary repeats the complete local verification, checks that the Cloudflare credential is
valid, compiles the production upload without deploying, and confirms that the public origin serves
the current `main` commit. Canary failures are visible in GitHub Actions. Multi-person Telegram
delivery is deferred to a later iteration.

Operational facts recorded for handover:

- The canonical hostname is `radixdao.org`; `www.radixdao.org` permanently redirects to it.
- GitHub environment `production` has no required reviewers or wait timer.
- The Cloudflare API token has no scheduled expiry. The current Cloudflare administrator owns its
  rotation; account custody must expand beyond one person in a future handover.
- Production and credential-using workflows run only in the exact canonical repository
  `RadixDAO/website`; a fork is skipped before it can use deployment credentials.
