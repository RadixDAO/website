# Governance Document Integrity — PDFs, hashes, and on-chain anchoring

Status: **proposal, not yet adopted.** Two open questions for the RAC: Rule 5.4 (mirroring), and the mixed-corpus choice under step 5.

## Context

Every document in the Govern section links to a markdown file in the separate governance repo,
under `pending/`. We need each activated document to also exist as a PDF whose SHA-256 is recorded
on-chain by the activating proposal, so anyone can later download the PDF and prove it is
byte-identical to what was voted on.

This document is about where the artifacts and hash records live, and how the website surfaces
them.

### The two-repository split

| Repository | Role |
|---|---|
| `Shadaffy/radix-dao-governance` | **Development.** Drafting and iteration, with whatever churn that needs. Nothing here is operative. |
| `RadixDAO/governance` | **Of record.** `pending/` holds Markdown of the next governance changes; the **repository root** holds the master PDF of every activated document plus `registry.json`. |

A file at the root *is* the document. A file under `pending/` is a proposal *about* a document.
Markdown stays the editing surface because it is easy to adjust and review; the root PDF is the
immutable, hash-anchored artifact.

```
drafting (Shadaffy) ──PR──▶ pending/**/*.md ──proposal passes──▶ <doc>.pdf  (root)
                                                                  registry.json
                                                                       │
                                                                       ▼
                                                            SHA-256 recorded on Radix
```

**The governing principle:** once the hash is on-chain, storage location stops being a trust
question and becomes purely an availability question. No host — GitHub, Cloudflare, or a hostile
one — can serve a PDF that matches an on-chain hash it didn't produce. That means plain Git is
sufficient, and mirroring copies is safe and desirable rather than a duplication risk.

Note that the requirements brief (`docs/plans/Official-Venue-Website-Requirements.md`) does not
mention PDFs, hashes, or signing anywhere. This is net-new scope, not a reinterpretation of existing
requirements.

### What already exists (reuse, don't rebuild)

- [`scripts/check-content-freshness.mjs`](../../scripts/check-content-freshness.mjs) already does
  exactly the right hashing: `createHash('sha256')` over raw upstream file bytes, compared against
  pinned values in [`content-sources.lock`](../../content-sources.lock), failing CI on drift. It
  tracks only 3 of ~22 documents and never surfaces hashes in the UI. This is the foundation to
  extend.
- [`src/data/govern.json`](../../src/data/govern.json) holds all documents as
  `{ title, summary, href }`, with the repo/branch prefix repeated 30+ times. No `status`,
  `version`, or date field exists on a document.
- [`src/pages/verify.astro`](../../src/pages/verify.astro) is already the site's "verify things
  independently" page, driven by [`src/data/identifiers.json`](../../src/data/identifiers.json).
  Document verification belongs here, not on a new parallel page.
- [`src/content.config.ts`](../../src/content.config.ts) shows the house pattern for Zod-validated
  content and the `supersedes` versioning model used by notices.

---

## Recommendation

**Store the PDFs and the hash records in Git, in the governance repo, alongside the markdown.** The
website links to them and republishes their digests, showing only what is currently in force.
Mirroring PDFs onto radixdao.org is deferred until the RAC rules on Rule 5.4; the data model is
shaped so enabling it later is a config change, not a rewrite.

Sizing sanity check: ~25 documents × ~300 KB ≈ 8 MB, written once each and never modified. Git's
weakness is large binaries that *churn*; activated documents are immutable by definition, so this is
close to the ideal case for Git.

### 0. Stand up `RadixDAO/governance` (do this first)

Create the repository of record and seed it from the development repo. This must precede the
website work, because the URL-builder refactor in step 4 touches the same 30+ hardcoded strings —
doing both in one pass costs one edit instead of two.

- Default branch `main`. The development repo keeps `master`; they are separate repositories now,
  not a rename, so no redirect exists — every hardcoded URL must be updated, including the
  `repository`/`ref` fields in [`content-sources.lock`](../../content-sources.lock).
- Use **GitHub rulesets, not classic branch protection** — rulesets can protect *tags*, classic
  protection cannot. Since activation tags are the immutable anchor for "which commit was voted
  on," an unprotected tag can be silently moved to another commit.
- Require PR review, block force-push and deletion, and require signed commits on `main`.
- Grant the RAC access via a GitHub **team**, not individual collaborator entries — auditable, and
  survives people leaving.
- Set at least three org Owners and require org-wide 2FA. Otherwise the single-person dependency
  that [`PUBLISHING.md`](../../PUBLISHING.md) is written against has moved rather than gone.

### 1. Repository layout

```
RadixDAO/governance
  code-of-conduct.pdf              ← activated. In force. Never modified.
  conflict-of-interest-policy.pdf
  charter.pdf
  registry.json                    ← digests for every activated version
  README.md
  pending/
    governance/code-of-conduct.md  ← the editing surface
    constitutional/charter.md
  tools/
    build-document.mjs             ← Markdown → PDF + digests + registry
    md.mjs
```

Root PDFs are flat and named by document id, so the published URL of a document is stable and
obvious. Tag each activation (`code-of-conduct-v1.0.0`).

This matters: every link on the site today points at `/blob/master/`, a **mutable** ref — the
markdown behind those links can change silently with no trace on the site. Links to activated
documents must be pinned to a tag or commit SHA.

**A published PDF is never regenerated.** Verified empirically during this planning work: building
`code-of-conduct.pdf` twice from byte-identical Markdown produced two files of identical length
(209,121 bytes) with different digests —

```
build 1  9d2ebc00037b4d77c98705a0df99f73d1e5baf5289823a3a0ad41f387b177705
build 2  f518aa3365ac781efbad53b5e8cb63d05deeabfece3187ab9fa90e903a403b2a
```

— because the renderer embeds `/CreationDate` and `/ModDate`. Regenerating a published document
would therefore silently invalidate its on-chain anchor. `build-document.mjs` refuses to overwrite
a published version. A correction is a **new version**: new PDF, new registry entry with
`supersedes` set, new on-chain record, and the superseded PDF stays in the repository forever
because its digest was anchored and holders of that copy must still be able to verify it.

### 2. `registry.json` — the single hash ledger

One entry per activated document version. This is where hash information lives. Shape below is
**real output** from the working prototype, not a sketch:

```json
{
  "id": "code-of-conduct",
  "title": "Code of Conduct",
  "version": "1.0.0",
  "status": "in-force",
  "effective": "2026-09-21",
  "commit": "00eb84ca97b7fe78b23cb59fa72b3a4f409dc416",
  "markdown": {
    "path": "pending/governance/code-of-conduct.md",
    "sha256": "e73ecf05532935b56e2015b6c0eed20ecb55c871744ba989d02c9ffc49ae7b6c"
  },
  "pdf": {
    "path": "code-of-conduct.pdf",
    "sha256": "f518aa3365ac781efbad53b5e8cb63d05deeabfece3187ab9fa90e903a403b2a",
    "bytes": 209121
  },
  "onChain": null,
  "signature": null,
  "supersedes": null
}
```

Note `markdown.path` points into `pending/` — the source a document was rendered from stays where
it was authored, pinned by `commit`. The root PDF is the artifact; the Markdown remains the
editing surface for the *next* version.

`signature` is `null` today and reserved for cryptographic sealing (step 5), so adopting seals later
is not a schema break. When populated:
`{ "type": "pades-ltv", "sealedAt", "sealer", "certSerial", "tsa" }`.

Append-only, in the governance repository: a new version is a new entry and the old one stays with
`status: "superseded"`. The website mirrors only the current version (step 4).

### 3. Hashing rules (write these into the governance repo README)

- **SHA-256 over raw file bytes, lowercase hex.** Identical to what
  [`check-content-freshness.mjs`](../../scripts/check-content-freshness.mjs) already does.
- **Hash the PDF exactly as published; never regenerate** (evidence in step 1).
- **Hash the Markdown separately**, and print its SHA-256 on the PDF cover page. That binds the
  pair, so the single on-chain PDF digest transitively covers the source. The PDF's own digest
  cannot appear on the cover — including it would change it — so the cover says so explicitly and
  points at `registry.json`.
- **A git blob SHA is not the file's SHA-256** (git hashes `blob <len>\0<content>`). Never quote a
  git object ID as the document hash.
- On-chain, record the value algorithm-prefixed — `sha256:<hex>` — plus document id and version, so
  a future algorithm change is unambiguous.

### 3a. Tooling — already prototyped and working

A working prototype exists (see "Prototype" at the end) with two files to be committed under
`tools/` in the governance repo:

| File | Purpose |
|---|---|
| `build-document.mjs` | Renders Markdown → cover-paged A4 PDF via headless Chrome, computes both digests, appends to `registry.json`, refuses to overwrite a published version |
| `md.mjs` | Markdown renderer scoped to the constructs these documents actually use — headings, lists, pipe tables, rules, emphasis, links, blockquotes |

Every PDF carries a **cover page** (title, status, version, document id, effective date,
repository, source commit, source path, source SHA-256, and a plain-language explanation of what
tamper-evidence means) and a closing **verification page** with the `sha256sum` / `shasum` /
`Get-FileHash` one-liners. Typography follows [`DESIGN.md`](../../DESIGN.md) — navy on white, IBM
Plex Sans and Mono, hairline rules — and the fonts are embedded so output does not depend on what
is installed on the machine of whoever produces it.

Requires Node ≥ 22.12 and Chrome or Edge. No new dependencies.

### 4. Website changes

**Scope decision: the site shows only what is currently operative.** The Govern page answers "what
are the actual rules?", and superseded documents are not the rules. A version history would grow
without bound against Rule 5.2's word budget and Rule 5.7's scrollbar test, and the history is
already preserved immutably in git in both repositories and in the append-only `registry.json`. A
reader who needs a prior version uses GitHub history or asks the Compliance Liaison.

Consequently **`govern.json` is current state, not a ledger.** An amendment overwrites a document's
`version`, `commit`, and `pdf` fields in place — no second entry, no `supersedes` chain, no
`superseded` status rendered anywhere.

The one exception is invisible: superseded digests are retained in the **verifier's match list
only**, so a reader holding an old PDF is told *"this is Code of Conduct v1.0.0, superseded on
2027-03-04; the current version is v1.1.0"* rather than the misleading *"no activated document has
this digest."* Nothing is rendered on either page; it costs a few entries in a JS array and
prevents the site telling someone a genuine document is unrecognised.

**Data model** — [`src/data/govern.json`](../../src/data/govern.json): every document defined once
with an `id`; shortlist, companion guides and groups reference ids, removing the duplicated entries
the old file carried. Repository and ref live in one constant in
[`src/data/governance.ts`](../../src/data/governance.ts) instead of 30+ repeated URL prefixes.
Validation is hand-written rather than Zod — `astro:content`'s zod re-export is deprecated in Astro
7 and its `z` cannot be used as a type namespace, and hand-written checks keep the module usable
from plain Node scripts.

**No mirror** (pending Rule 5.4). PDFs are linked from the governance repo of record. The data model
carries the PDF path, so enabling a mirror later is a config change plus a copy step.

**Rendering** — [`src/pages/govern/index.astro`](../../src/pages/govern/index.astro): the page
gains a real status distinction it does not have today. An **in force** row links to the PDF and
shows its truncated SHA-256 in the existing `.data` mono style, full hash copyable. A **pending**
row links to the Markdown under `pending/` and renders as it does now. This is the first time the
site can honestly show which rules are operative — currently everything is implicitly draft, marked
only by the `/pending/` segment inside each URL.

**CI guard** — extend
[`scripts/check-content-freshness.mjs`](../../scripts/check-content-freshness.mjs) to re-verify that
every in-force digest in `govern.json` still matches the governance repo's `registry.json` at the
pinned commit. A stale or edited hash then cannot survive CI. The script already runs in
`pnpm verify` and in [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).

### 4a. How a Governance Operator actually maintains this

**Nobody ever types a hash.** Hand-copying a 64-character digest between two repositories is
error-prone, fails silently, and would happen at the highest-stress moment — immediately after an
activation vote. A wrong digest on a page whose entire purpose is verification is worse than no
digest at all.

Operation follows the notice pipeline already built here: a GitHub **issue form** (browser only, no
local setup — [`PUBLISHING.md`](../../PUBLISHING.md) requires publishing not to depend on one
person's device), an authorisation check, a generated commit, and a **pull request** a human
reviews. Merging is publishing.

GitHub issue forms cannot show fields conditionally, so the template chooser does the branching:

| Form | When | Asks for |
|---|---|---|
| Register a governance document | A new document exists in `pending/` and should appear as a draft | title, summary, source path, group |
| Activate a document | An activation vote passed for a pending document | document, version, source commit, effective date, activating transaction |
| Publish a new version | An amendment vote passed for a document in force | document, new version, source commit, effective date, activating transaction |

The last two take identical fields but stay separate so the operator **declares intent**, which the
workflow then verifies against actual state and refuses on mismatch: activating something already in
force, versioning something never activated, or a version not greater than the current one all fail
loudly. Inference would silently do something plausible; declaration stops a wrong mental model.

The workflow derives the digest rather than accepting one:

1. Authorise the submitter (reuse the existing job from
   [`publish-notice-form.yml`](../../.github/workflows/publish-notice-form.yml) verbatim)
2. Fetch `registry.json` from the governance repo **at the given commit**
3. Download the PDF and **compute its SHA-256 independently**
4. Fail if the computed digest and the registry's disagree
5. Patch `govern.json`, run `pnpm verify`, open a PR

Transcription error becomes structurally impossible and the digest is cross-checked against two
independent sources before a PR exists. One shared script backs all three forms; the document
dropdown is generated from `govern.json` the way
[`generate-notice-form.mjs`](../../scripts/generate-notice-form.mjs) generates the notice form, with
a `--check` mode in `verify` so it cannot drift.

Two things deliberately outside this: **corrections** (fixing a typo in a summary) are an ordinary
pull request against `govern.json`, touching no digest and needing no ceremony — worth stating so
nobody reaches for the activation form to fix a comma. And **repeal** is not yet modelled; a vote can
withdraw a document entirely, and that is a real state the data model does not cover.

**Verification UX** — add a documents section to the existing
[`src/pages/verify.astro`](../../src/pages/verify.astro): a drop zone that reads the file with
`FileReader`, computes `crypto.subtle.digest('SHA-256', bytes)`, and compares against the expected
hash. Runs entirely in the browser — no upload, no server, works on a static Cloudflare deployment.
Alongside it, the copy-paste equivalents: `Get-FileHash -Algorithm SHA256 file.pdf` (PowerShell),
`sha256sum file.pdf` (Linux), `shasum -a 256 file.pdf` (macOS), plus a link to the Radix transaction
holding the hash.

### 5. Cryptographic sealing (later, additive — not a replacement)

Both mechanisms are used together. They answer different questions:

| | Proves | Doesn't prove |
|---|---|---|
| SHA-256 + on-chain | This exact file existed at this time, referenced by proposal X | Who issued it (except via the vote) |
| Cryptographic seal | Radix DAO LLC issued this document | That the DAO activated it |

For a DAO the on-chain hash is the stronger *permanence* guarantee; the seal is the stronger *legal
recognition* guarantee. Add the second; never let it replace the first.

#### Seal, not signature

The right primitive is an **electronic seal**, not an electronic signature. eIDAS distinguishes
them: a signature binds a *natural person*, a seal binds a *legal entity* and asserts origin and
integrity with no human signer. A document activated by token vote has no signer ceremony — the
authority is the vote — so a seal is the honest instrument.

This rules out e-signature and envelope/workflow products generally. They are built around sending a
document to a named person to click through, they typically stamp envelope identifiers onto every
page and append a completion certificate — so the file that comes back is not the file that went in,
and the document's layout is overprinted with vendor metadata. The cryptographic signer also ends up
being the vendor, attesting that *the vendor processed an envelope*, not that the LLC issued the
document.

#### Minimum requirements for a seal provider

Any provider must meet all of the following. Items 1–5 are what separate a seal that still validates
in ten years from one that shows a yellow warning triangle; 6–10 are what make it usable by a
council rather than by one person.

**Cryptographic**

1. **PAdES** format — an embedded PDF signature, not a generic detached CMS or a separate `.p7s`
   file. The seal must travel inside the document.
2. **Organisational seal certificate** issued to Radix DAO LLC as a legal entity — not a personal
   certificate held by a role-holder.
3. Chains to **AATL and/or EUTL**, so Acrobat and EU validators trust it with no manual
   configuration by the reader. A certificate outside these trust lists produces "validity unknown",
   which reads to a lay reader as *worse* than an unsealed document.
4. **RFC 3161 timestamp** from a TSA applied at sealing time. Not optional and not retrofittable —
   without it the seal's validity dies with the certificate.
5. **LTV** — embedded OCSP/CRL revocation data (ETSI B-LT or B-LTA), so validation survives
   certificate expiry and CA changes.

**Operational**

6. **Keys in an HSM** (FIPS 140-2 Level 3 / Common Criteria EAL4+ or equivalent). The private key
   must never be exportable or land on a laptop.
7. **Multi-party authorisation** — sealing requires M-of-N approval from RAC members, not a single
   credential. This is the requirement that keeps sealing consistent with
   [`PUBLISHING.md`](../../PUBLISHING.md); a provider that cannot do it reintroduces the
   single-person dependency the governance framework exists to prevent.
8. **API-driven sealing** with no human signer ceremony, so the step fits an activation pipeline
   rather than an inbox.
9. **Independent audit trail** — a tamper-evident log of who authorised each sealing and when,
   exportable so it survives the vendor relationship ending.
10. **Exit terms** — written confirmation of what happens to already-sealed documents if the
    contract lapses. Sealed PDFs must remain independently validatable with no live account, and
    the certificate must be revocable by the DAO alone.

**Two things to confirm explicitly in writing**, because they are the failure modes that only appear
years later: that seals remain valid after the certificate expires (this is what 4 and 5 buy), and
that revoking the certificate does **not** retroactively invalidate documents sealed while it was
valid.

Candidate approaches, to be priced when the time comes: **pyHanko** (open source, excellent
PAdES-LTV support, works with a certificate from any CA plus a hardware or cloud key — cheapest and
fully controllable, though requirements 6–9 then fall to us to build), or a **managed sealing
service** from an established CA (HSM-backed keys and API sealing, with several supporting M-of-N
authorisation out of the box).

#### Ordering — the rule that must not be got wrong

```
render PDF → apply seal → hash the SEALED file → anchor that hash on-chain
```

The seal is embedded inside the PDF as an incremental update, so applying it changes the file's
bytes. Hashing before sealing anchors a digest of an unsigned intermediate that nobody will ever
download, and **every** verification attempt then fails. The intuition to resist is "hash the
document, then sign the hash" — true of the signature's internals, irrelevant at the artifact
level. The sealed file is the published file, so the sealed file is what gets hashed.

**Publish one file, not two.** Never ship an unsealed and a sealed PDF of the same version — two
files, two digests, and no way for a reader to know which is canonical.

#### Timing is decided for us

A CA issues an organisational seal certificate only after validating the legal entity. The DAO is
pre-formation ([`src/data/roles.json`](../../src/data/roles.json) opens *"The DAO has not yet
formed"*), so no such certificate can be obtained yet. Hash-anchoring now is not merely preferable —
it is the only currently available option. Sealing becomes possible after formation.

Consequence: documents activated before the certificate exists **cannot be retro-sealed** — sealing
them would change their bytes and break their anchors. That leaves a mixed corpus, and the RAC
should choose deliberately:

- **Accept the mix** *(recommended)*. Every document is hash-verifiable; later ones additionally
  carry a seal. `registry.json` already distinguishes them via the `signature` field.
- **Re-issue at formation.** Republish the activated set as sealed v1.0.1, each with a new on-chain
  record, old versions retained. Uniform, but it costs a second full activation cycle and changes
  every document's citation.

#### Standing constraints

- **Revocation is contagious.** A compromised, revoked key taints every seal made with it, including
  on legitimate documents. An on-chain hash cannot be revoked.
- **Key custody reintroduces the [`PUBLISHING.md`](../../PUBLISHING.md) single-person dependency**
  unless the key lives in an HSM or a multi-party service requiring several RAC members to authorise
  each sealing.
- **Do not build browser-side PAdES validation.** Chain building, OCSP, and trust lists are hard,
  and Acrobat already does it. The drag-drop page stays hash-only; seal validation links out to
  Acrobat or the EU DSS validator.
- **Most readers will never see the seal.** No mainstream browser PDF viewer validates signatures,
  and most people open PDFs in a browser. The seal serves institutional and legal recognition; the
  hash serves everyone.

#### No tooling change required

`build-document.mjs` computes its digest from whatever file is on disk, so inserting a sealing step
before hashing is a workflow change, not a code change. `registry.json` already carries the reserved
`signature` field, to be populated as
`{ "type": "pades-ltv", "sealedAt", "sealer", "certSerial", "tsa" }`.

---

## Open question for the RAC: Rule 5.4

Rule 5.4 of the requirements brief (`docs/plans/Official-Venue-Website-Requirements.md`, §5) reads:

> **No normative text is reproduced on the site.** A rule is paraphrased in one plain sentence, then
> linked to its source document. Never copy a policy across.

with the stated rationale:

> Rule 5.4 is the important one. It keeps the site light *and* it removes the risk of the website and
> the governance documents drifting apart — which, for a legally designated venue, would be a serious
> problem.

Hosting a full PDF at `radixdao.org/govern/*.pdf` puts the normative text on the site. **This is the
one decision that could invalidate the mirror.** The case for allowing it:

- The rule's stated purpose is **drift**, and a hash-pinned, CI-verified mirror cannot drift — the
  build fails the moment the bytes differ from `registry.json`. The specific harm 5.4 targets is
  mechanically impossible here.
- The rule's operative instruction — "paraphrased in one plain sentence, then linked" — governs
  **page copy**, the prose a reader scrolls through. The govern page continues to obey it exactly:
  every row stays one sentence plus a link. A downloadable file is the document itself, byte-for-byte,
  not a restatement. The failure mode 5.4 polices is *paraphrase that quietly becomes wrong*; a
  byte-identical copy is its opposite.

The strict counter-reading is that the bytes are hosted on radixdao.org, so the text is on the site.
If the RAC takes that reading, the fallback is to keep PDFs only in the governance repo and link out
— everything else in this plan is unaffected.

**Also check Rule 5.5** ("No section-number citations in front-of-house copy"). A SHA-256 is not a
section citation, but it is the same instinct — keep repository-shaped detail out of front-of-house.
This may shape how prominently the hash renders even if the mirror is approved.

> The requirements brief currently exists only on the unmerged branch
> `upstream/design/register-identity` (commit `5648f1f`), not on `main`. Worth landing on `main`
> independently of this plan.

## Prototype (built, working)

A simulation of `RadixDAO/governance` exists at
`…/scratchpad/sim-governance/` with the exact topology above, and **two real documents have been
produced end to end**:

| Document | Version | PDF | Pages | SHA-256 |
|---|---|---|---|---|
| Code of Conduct | 1.0.0 | `code-of-conduct.pdf` | 8 | `f518aa3365ac781e…03b2a` |
| Conflict of Interest Policy | 1.0.0 | `conflict-of-interest-policy.pdf` | 8 | `fb937b6ae738c743…7dd8f` |

Both were rendered from the live governance repo at commit `00eb84ca`, with digests recorded in
`registry.json` and verified to match the files on disk. The Markdown renderer was additionally
tested against `roles-registry.md` (3 tables, 32 rows) to confirm table support ahead of the
documents that need it.

**What "signed" means today:** these PDFs are hash-anchored, not certificate-signed. The digest is
the proof, and it is the RAC's chosen mechanism (step 5 covers adding certificates later). No
signing certificate exists yet, and producing one is a key-custody decision, not a technical step.

**Not yet done in the prototype:** page numbers in a running footer. Headless Chrome's
`--print-to-pdf` cannot template footers; this needs Puppeteer, which would add a ~150 MB
dependency. Worth deciding before first activation, since adding it later changes every digest.

## Rejected alternatives

- **Git LFS** — adds bandwidth quotas and a smudge filter, and LFS pointers make a clone
  non-self-contained. Unnecessary at 8 MB of never-changing files.
- **IPFS / Arweave as primary** — the on-chain hash already provides everything a CID would, and
  pinning is a recurring operational cost. Worth adding later as an extra mirror; not as the system
  of record.
- **GitHub Releases as primary** — release assets can be replaced or deleted with no git history
  trace, which is strictly weaker than a committed file.

## Verification

1. `pnpm verify` — passes lint, `astro check`, build, and the extended freshness/mirror check.
2. Deliberately flip one byte in a `public/govern/*.pdf` and re-run `pnpm content:freshness` — it
   must fail and name the file.
3. Serve the built site (`pnpm preview`); on `/verify/`, drop the real PDF and confirm a match, then
   drop the tampered copy and confirm a clear mismatch.
4. Independently confirm the displayed hash: `Get-FileHash -Algorithm SHA256 public/govern/<f>.pdf`
   must equal the value in `registry.json`, in `govern.json`, and on the page.
5. Confirm the on-chain value for one document matches that same hash via the Radix dashboard.
