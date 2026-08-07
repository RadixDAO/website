# Requirements Brief — Radix DAO Official Venue (radixdao.org)

**Status:** Draft for implementer
**Audience:** The party building and hosting radixdao.org
**Date:** 2026-08-07

---

## 1. Purpose and standing

Radix DAO LLC needs an official website at **`https://www.radixdao.org`**.

This is not optional marketing. Under the Operating Agreement the site is the Company's **"Official
Venue"** — the defined venue at which "governance records, activation statements, status reports,
advisory acknowledgements, and other official communications of the Company are published." The domain
is already recorded as the Official Venue in the DAO's On-Chain Identifiers & Verification Policy, and
the site's existence and public accessibility is one of the conditions the DAO must satisfy before it
can activate.

Two consequences follow, and they shape everything below:

1. The **Notices & Records** area (§7) has real obligations attached — permanence, timestamps, verbatim
   publication, independent verifiability. It cannot be treated as a blog.
2. Everything else can and should be **very light**.

### The guiding principle: simple

The site is a **signpost, not a library**. The DAO's governance documents already exist, in full, in a
public repository. The Consultation App already exists and handles voting. The technology is already
documented at radixdlt.com. This site's job is to explain what the organisation is, show people how to
take part, say who is accountable and how to reach them, and hold the official record.

Nothing on this site should be a wall of text. §5 turns that principle into rules you can be held to.

---

## 2. Property map

Radix DAO LLC is a **separate legal entity** from Radix Publishing Ltd, which operates radixdlt.com.
The two sites must never be confused for one another. Use this table whenever you are unsure where a
piece of content belongs.

| Property | Owner | Covers |
|---|---|---|
| **radixdlt.com** | Radix Publishing Ltd | The technology — what Radix is, how to use it, buy XRD, build on it. **Unchanged by this project.** |
| **radixdao.org** | Radix DAO LLC | **This project. The organisation — what the DAO is, how to take part, who is elected, how to reach them, and the official record.** |
| **vote.radixdao.org** | Radix DAO LLC | The Consultation App (Consultation V2) — the recognised governance platform, where votes are actually cast. Already exists. |
| **github.com/Shadaffy/radix-dao-governance** | Radix DAO LLC | The operative governance documents. **Single source of truth** for all rules. |

If a visitor wants to *buy, use, or build on Radix*, this site's job is to send them to radixdlt.com.
If they want to *cast a vote*, this site's job is to send them to vote.radixdao.org. If they want to
*read a rule*, this site's job is to send them to the governance repository.

---

## 3. Audiences

Four, in priority order. Each maps to one primary page.

| Audience | What they arrive asking | Send them to |
|---|---|---|
| **The curious token holder** | "What is this, and is it real?" | Home → About |
| **The would-be participant** | "How do I propose something, vote, or stand for a seat?" | Participate |
| **The person with a grievance** | "Something is wrong. Who do I tell, and how do I challenge it?" | Contact → Notices |
| **The verifier** | "Prove these addresses and these results." | Verify |

---

## 4. Tone of voice

Plain, direct, unhurried. The DAO's own plain-language reading guides in the repository are the
reference for register — study
[`pending/policy-library-reading-guide.md`](pending/policy-library-reading-guide.md) before writing any
copy.

- Write for a token holder who is not a lawyer and not a developer.
- Prefer the concrete over the abstract: "Anyone holding XRD can put a proposal forward" beats
  "governance participation is permissionless."
- No hype, no "revolutionary," no exclamation marks. The organisation's credibility rests on being
  precise and boring where it counts.
- Never overstate the DAO's current status. Until activation, community governance is **advisory**.
  Copy that implies otherwise is a factual error, not a stylistic one.

---

## 5. "Simple" — the rules

These are testable requirements, not aspirations. Content that breaks them should be rejected in review.

| # | Rule |
|---|---|
| 5.1 | The home page has a **maximum of 6 bands** (sections). |
| 5.2 | No front-of-house page exceeds **~400 words** of body copy. Notices *detail* pages are exempt. |
| 5.3 | Every card is **at most 3 sentences** and ends in a link. |
| 5.4 | **No normative text is reproduced on the site.** A rule is paraphrased in one plain sentence, then linked to its source document. Never copy a policy across. |
| 5.5 | **No section-number citations in front-of-house copy.** No "PVF §6.2.4," no "OA §11.3." Those belong in the repository. Link the words instead. |
| 5.6 | Every page answers **one question** and offers **at most three** onward links. |
| 5.7 | If a page needs a scrollbar to reach its first outbound link, it is too long. |

Rule 5.4 is the important one. It keeps the site light *and* it removes the risk of the website and the
governance documents drifting apart — which, for a legally designated venue, would be a serious problem.

---

## 6. Sitemap

Eight pages. Deliberately small. Adding a ninth should require a conversation.

**Navigation: three items — Participate · Govern · Verify.** This deliberately parallels radixdlt.com's
*Use · Build · Learn*, which does the sibling-branding work at no cost.

### 6.1 Home
*Answers: "What is this?"*

Maximum six bands:

1. **Hero.** One-line statement of what Radix DAO is, one-line subhead, two CTAs (*Take part* → Participate,
   *Read the rules* → Govern).
2. **Status band.** Where the DAO currently is in its founding sequence. **This must be trivially
   editable** — it is the single element most likely to become wrong. See §10.
3. **Three pillars.** Propose · Vote · Stand for election. Three sentences each, each linking into
   Participate.
4. **Verify band.** "Every address and every result can be checked independently." Links to Verify.
5. **Latest notices.** The three most recent items from Notices & Records, with dates. Links to the full
   record.
6. **Contact / community band.** How to reach the elected roles.

### 6.2 About
*Answers: "What kind of organisation is this?"*

Radix DAO LLC is a non-profit Decentralized Autonomous Organization registered under Marshall Islands
law. It is member-managed at formation, and becomes fully community-governed at the Activation Date.

Source the substance from [`README.md`](README.md) and [`pending/README.md`](pending/README.md) —
compress heavily. Include a structure diagram; source artwork exists in `graphics/`
(`radix_dao_role_architecture_stages.png`, `token_holders_decide_members_execute.af`).

Carry the framework's central idea, in one line: **execution bodies execute, they do not govern.**
Token holders decide; elected roles carry out.

### 6.3 Participate
*Answers: "How do I take part?"* — **the most important page on the site.**

Four cards. Three sentences each, then a link.

| Card | Substance |
|---|---|
| **Make a proposal** | Open to any token holder. No minimum holding, no prior registration, and no approval from any DAO body is required. Three stages: draft discussion, a temperature check, then the binding vote. |
| **Vote** | Voting power is your XRD plus your liquid staking units, measured at a snapshot taken when each vote opens. Links to vote.radixdao.org. |
| **Stand for election** | Council seats and Working Group Steward roles are elected, time-bound, and renewable by vote. |
| **Challenge a decision** | There is a 48-hour window after a result is published in which token holders can file a veto. |

**Do not add a "delegate your vote" card.** The Charter recognises delegation of voting power as a mode
of participation, but it is **not yet enabled** — the governance platform does not support it. Presenting
it as available would be a false statement on a legally designated venue. It becomes a fifth card when
the platform supports it, with no other change required.

### 6.4 Govern *(the document index)*
*Answers: "What are the actual rules?"*

A list of every governance document with **one plain-language line each**, linking to GitHub. Do not
write these lines — **lift them verbatim** from
[`pending/policy-library-reading-guide.md`](pending/policy-library-reading-guide.md), which already has
one for every document, and keep that file's grouping:

> The numbers · How decisions get made and carried out · The people and roles · Conduct, integrity, and
> fairness · Staying alive in a crisis · Contributors and their work · Protecting the DAO's code and IP ·
> How the rulebook maintains itself

Lead the page with the reading guide's own **"If you only want to read a few"** shortlist, and surface
the three plain-language companion guides (Charter Reading Guide, Policy Library Reading Guide, Election
Methods Guide) prominently — they are the friendliest entry points the DAO has.

### 6.5 People
*Answers: "Who is accountable, and how do I reach them?"*

Lists the **Radix Accountability Council** (the RAC — refer to it as the Accountability Council in
front-of-house copy), the Delegated Functions (Treasury Signers, Governance Operator, Legal Signatory,
Compliance Liaison, Web2 Custodian), and Working Group Stewards. Structure follows
[`pending/governance/roles-registry.md`](pending/governance/roles-registry.md).

Each entry: name or alias, role, term start and end, and a contact route. The Council has 5–7 seats with
six-month terms, so **this page changes regularly** — treat it as data, not hand-written HTML.

**It must render honestly while seats are unfilled** — show the seat, show that it is vacant or not yet
elected, and link to how it gets filled. An empty page is a failure state; a page that says "5 of 7
seats currently filled" is correct.

Note that Delegated Functions are not separately elected — they are allocated by the Council from among
its own seated members and end when that member's seat ends. Show them attached to the person, not as
standalone offices.

### 6.6 Notices & Records
*Answers: "What has officially happened?"* — see §7. This is the Official Venue proper.

### 6.7 Verify
*Answers: "Can I check any of this myself?"*

Renders the DAO's on-chain identifier register as a table with live verification links to
`dashboard.radixdlt.com`, taken directly from
[`pending/governance/on-chain-identifiers-and-verification-policy.md`](pending/governance/on-chain-identifiers-and-verification-policy.md).

Requirements:
- Show the governance component, badges, package, and the XRD voting-power resource, each with a
  working verification link.
- **Show the treasury rows even though they are not yet deployed**, marked clearly as pending. Hiding
  them would misrepresent the state of the DAO.
- Note that liquid staking units have no single address by design — each validator mints its own — and
  are converted to XRD-equivalent at snapshot. One sentence; link out for the method.

### 6.8 Contact
*Answers: "How do I reach a person?"*

The monitored mailboxes, the veto filing route, how to request a Community Accountability Hearing, and
where discussion happens. See §12 — some of these destinations do not exist yet.

---

## 7. Official Venue requirements *(non-negotiable)*

This section is legally load-bearing. An implementer optimising for "simple" will be tempted to reduce
Notices & Records to a blog. Do not. Every requirement below exists because a governance document
depends on it.

### 7.1 Item types the system must publish

Activation Statement · Council written resolutions · advisory acknowledgements and reasons for declining
to act · vacancy notices · reduced-quorum activation notices · changes to the on-chain identifier
register · **veto filings** · notices of receipt of regulatory or legal demands · status reports ·
prior-disclosure notices for amendments · signed statements by Delegates · Working Group and repository
registries.

Items are typed and filterable by type.

### 7.2 Permanence

- Every item has a **unique permanent URL** and an **ISO-8601 UTC publication timestamp**.
- **Items are never edited in place.** A correction is published as a *new* item that links to the item
  it supersedes; the superseded item stays reachable and is marked as superseded.
- The archive is **complete**. Nothing ages out, nothing is paginated beyond reach.

### 7.3 Verbatim publication of veto filings

Veto filings arrive by email and must be published **exactly as received** — unedited, unformatted,
untruncated — together with their receipt timestamp, **within 6 hours of receipt**. The publishing tool
must not silently reformat, wrap, or strip content. This window is a governance parameter; failure to
publish is a reportable breach.

### 7.4 Prior-notice items

Certain notices start statutory clocks — 14 days and 21 days before an amendment can take effect. Where
an item is of that kind, its **notice date must be displayed prominently**, not buried in metadata.

### 7.5 Multi-operator publishing

The governance framework requires that a notice can be published by the **Governance Operator**, *or* by
the **Council** where the Operator is unavailable or is the subject of the filing, *or* — in one
specific edge case — by the **Registered Agent**.

Therefore: the publishing path must support **at least two independent operators** and **must not depend
on any single person's account, device, or credentials**. A CMS with one admin login fails this
requirement.

### 7.6 Accessibility of the record

- Readable **without JavaScript**, **without login**, and **without a cookie wall**.
- **Machine-readable feed** — RSS or Atom, plus JSON — so third parties can independently archive the
  record without scraping.

### 7.7 Recommended implementation shape

**Publish notices as Markdown files in a public Git repository, and build the site statically from it.**

This single choice satisfies four requirements at once:

| Requirement | How this satisfies it |
|---|---|
| Permanence and no in-place editing (§7.2) | Git history *is* the audit trail; any edit is itself a recorded, timestamped, attributed event. |
| Multi-operator publishing (§7.5) | Commit access is granted to the Operator and the Council independently. No shared login. |
| Independent archival (§7.6) | Anyone can clone the entire record. |
| Survivability | The record outlives the hosting provider. |

It is also the cheapest option to build and operate, and it mirrors how the DAO already treats its
governance repository — where the commit history is explicitly the governance audit trail.

You may propose an alternative architecture, but it must demonstrably meet all four properties above.

---

## 8. Design

**Same family as radixdlt.com, distinct accent.** Visitors should recognise the relationship instantly
and never confuse the two entities.

### 8.1 Carry over from radixdlt.com

- Dark, near-black charcoal base; high-contrast white body text.
- Bold geometric sans for headlines; clean sans for body.
- Angled geometric dividers between sections.
- Generous vertical rhythm — sections breathe, wide centred content column.
- Text-link CTAs with chevrons rather than heavy filled buttons.
- Card grids for feature sets; a community band near the foot.

### 8.2 Deliberately diverge

These three are **legal-clarity requirements, not taste preferences**:

1. **A distinct accent colour** — not Radix cyan.
2. **Its own wordmark** — Radix DAO, visually related but not identical to the Radix mark.
3. **A persistent footer line** stating that Radix DAO LLC is a Marshall Islands non-profit DAO LLC and a
   separate legal entity from Radix Publishing Ltd, which operates radixdlt.com.

---

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| **Accessibility** | WCAG 2.2 AA. The official record must be reachable by anyone, including via screen reader. |
| **Performance** | Static-first. Fast on a slow mobile connection. No heavy client framework required to read a notice. |
| **No wallet connection** | The site never asks to connect a wallet, anywhere. Voting happens at vote.radixdao.org. |
| **Privacy** | No third-party trackers on the Notices & Records area at all. Analytics elsewhere, if any, must be privacy-preserving and cookieless. |
| **Uptime** | Treat as a designated legal venue, not a brochure. Static hosting on a CDN; the Git-backed record means an outage never loses data. |
| **Domain custody** | The domain sits under the **Web2 Custodian** Delegated Function, which may **not** transfer domain ownership or delete repositories without a passed Governance Proposal. Registrar and DNS must be held in DAO-controlled accounts, not personal ones, and handover procedure must be documented at delivery. |

---

## 10. Phasing

Tied to the DAO's actual founding sequence, not invented milestones.

| Phase | State of the DAO | Site scope |
|---|---|---|
| **1 — Now (pre-formation)** | Framework drafted, ratification vote pending. Nothing is operative yet. | All pages live except People. Notices live but nearly empty. Status band reads that ratification is pending. |
| **2 — Advisory period** | Entity formed, member-managed, community governance advisory. | People populated. Notices carrying resolutions and advisory acknowledgements. Treasury rows on Verify filled in as accounts deploy. |
| **3 — Activation** | Activation Statement published; DAO becomes fully community-governed. | Status band flips. Elected Council and Delegates listed. |

**The status band on the home page must be editable in under a minute by a non-developer.** During
Phases 1 and 2 the DAO's status changes in ways that make an out-of-date homepage actively misleading.

---

## 11. Out of scope

State these back to us if you disagree; otherwise treat them as settled.

- **No voting UI.** Voting is vote.radixdao.org. Do not rebuild any part of the Consultation App.
- **No token purchase, price, or market data.** Ever.
- **No wallet connect.**
- **No technology or developer documentation.** That is radixdlt.com's job.
- **No forum software.** Discussion is a link out to whatever platform the DAO designates (§12).
- **One governance repository only.** The site links to `radix-dao-governance`, the operative documents.
  The DAO's reference/working-drafts repository must **not** be linked or referenced anywhere on the
  site — including in copy adapted from [`README.md`](README.md) or
  [`pending/README.md`](pending/README.md), both of which currently cite it. Strip those references when
  adapting.

---

## 12. Open items — for the DAO, not the implementer

These are content decisions no developer can make. They block specific pages, noted below.

| # | Item | Blocks |
|---|---|---|
| 12.1 | **Formal designation of the Official Venue.** Operating Agreement Schedule 3 is still marked to be completed. Launching this site is what makes the designation real. | Activation |
| 12.2 | **No discussion forum exists.** Stage 1 of every proposal requires a designated discussion platform, and around 25 policy references point to a "governance forum" that currently has no address. A platform must be chosen. | Participate, Contact |
| 12.3 | **No public social channels.** The Code of Conduct refers to "Discord, Telegram, etc." but no handles or invite links exist anywhere in the framework. | Contact, Home |
| 12.4 | **Council member identities** and their contact routes. | People |
| 12.5 | **Treasury addresses** are undeployed placeholders. Verify must handle this state gracefully until they exist. | Verify (partial) |
| 12.6 | **Ownership of the registrar and DNS accounts** must be established in DAO-controlled form before handover. | Delivery |

Items 12.2 and 12.3 are the sharpest: today the framework tells a token holder exactly *how* to
participate, but there is nowhere to actually go. Resolving them is what makes the Participate page true
rather than theoretical.

---

## 13. Acceptance criteria

The site is accepted when all of the following hold.

**Content discipline**
- [ ] Home page has 6 bands or fewer.
- [ ] No front-of-house page exceeds ~400 words of body copy.
- [ ] No card exceeds 3 sentences.
- [ ] No page reproduces normative text from a governance document.
- [ ] No section-number citations appear in front-of-house copy.
- [ ] Every page offers at most three onward links.

**Official Venue**
- [ ] Every published item has a unique permanent URL and an ISO-8601 UTC timestamp.
- [ ] An item cannot be edited in place; corrections publish as new, linked items.
- [ ] A veto filing can be published verbatim, with its receipt timestamp, within 6 hours.
- [ ] Two independent operators can publish without sharing credentials.
- [ ] Every notice is readable with JavaScript disabled.
- [ ] A machine-readable feed (RSS/Atom + JSON) exposes the full record.
- [ ] The complete archive is reachable and filterable by type and date.

**Correctness**
- [ ] Every on-chain identifier on Verify resolves on the Radix Dashboard.
- [ ] The status band accurately reflects the DAO's current phase, and can be changed by a
      non-developer in under a minute.
- [ ] Nowhere does the site imply that community governance is binding before the Activation Date.
- [ ] No feature is presented as available unless it actually is — specifically, vote delegation is not
      offered or implied anywhere until the governance platform supports it.
- [ ] The footer states the separate legal identity of Radix DAO LLC.
- [ ] No link to the DAO's reference/working-drafts repository appears anywhere.

**Handover**
- [ ] Registrar, DNS, hosting, and repository access are held in DAO-controlled accounts.
- [ ] Publishing procedure for a notice is documented, in plain language, for a non-developer.

---

## Appendix — sample copy

Illustrative only, to show the intended register and density. Replace with final copy.

> **Hero**
> *Radix DAO*
> **The community governs Radix.**
> A non-profit DAO registered in the Marshall Islands, owned and directed by the people who hold XRD.
> Anyone can propose. Anyone can vote. Every decision is recorded on-chain.
> [ Take part → ] [ Read the rules → ]

> **Status band (Phase 1)**
> **Where things stand:** the governance framework has been drafted and is going to the community for
> ratification. Until the activation vote passes, community decisions are advisory. [ See the sequence → ]

> **Pillar — Make a proposal**
> Anyone holding XRD can put a proposal to the DAO. There is no minimum holding and no approval step —
> you discuss it, test support with a temperature check, then it goes to a binding vote.
> [ How proposals work → ]

> **Verify band**
> **Don't take our word for it.**
> Every governance contract, badge, and treasury account the DAO uses is published with a link to check
> it yourself on the Radix Dashboard. [ Verify the addresses → ]
