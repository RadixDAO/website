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

1. On GitHub, go to `src/content/notices/` and click **Add file → Create new file**.
2. Name it `YYYY-MM-DD-short-title.md` (the filename becomes the notice's permanent URL, so keep
   it short and don't reuse one).
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
6. **If this notice starts a statutory notice period** (e.g. a prior-disclosure notice for an
   amendment), also add a `noticeDate` line in the same format — it gets shown prominently on the
   published page.
7. Commit directly to `main` (or open a pull request first, if you'd rather have a second person
   check it before it goes live — either works).

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

Every push to `main` runs the site's checks (build, and a check that the governance-document
copies here haven't drifted from the source repository) and then deploys automatically. Nothing
you do here needs a manual "deploy" step — a merged commit is a published commit.
