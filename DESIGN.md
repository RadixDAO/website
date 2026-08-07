# Design notes

Why the site looks the way it does. Read this before changing a colour, a typeface, or the shape
of a page — most of what follows is load-bearing for reasons that are not aesthetic.

---

## The relationship to radixdlt.com

Section 8.1 of the requirements brief asks for a "dark, near-black charcoal base," a bold geometric
sans, and angled geometric dividers, on the grounds that this is what radixdlt.com looks like.

**It is not, and has not been for years.** radixdlt.com today is:

| | |
|---|---|
| Ground | white, with `#f4f5f9` for lifted sections |
| Ink | navy `#003057`, used for every heading and every line of body text |
| Type | IBM Plex Sans throughout, 700 for headings |
| Accent | Radix blue `#052cc0`; Radix green `#00c389` in the mark |
| Deep sections | full-bleed deep blue, white text — no charcoal anywhere |
| Dividers | none; sections change by colour and spacing |
| Shell | 1280px |

Building faithfully to §8.1 produced a site that resembled neither radixdlt.com nor anything else.
This design follows the sibling that actually exists, which is what §8.1 was trying to achieve.

The three requirements in §8.2 are met and are **not** open to taste: a distinct accent, our own
wordmark, and the persistent footer line stating separate legal identity.

---

## The idea: a register

radixdlt.com sells a future. radixdao.org attests to a present state — it is a legally designated
venue whose job is to say what is true right now, with a date on it, in a form anyone can check.

So the organising idea is a **public register**: dated rows, hairline rules, and every
independently verifiable fact set in monospace.

That means, concretely:

- **Rows, not cards.** Where you are tempted to reach for a bordered box in a three-up grid, reach
  for a row with a key and a date. `Row.astro` and `NoticeRegister.astro` exist so that this is the
  path of least resistance.
- **No decorative dividers.** Bands change by ground (`tone="ground" | "paper" | "deep"`) and by
  vertical rhythm. Nothing between them.
- **One chevron.** Onward links — links that leave the page — get a single `›`. Nothing else does.

---

## Colour

Radix's brand gradient, taken verbatim from radixdlt.com's own stylesheet, has three stops:

```
radial-gradient(…, rgb(206,13,152) 0%, rgb(5,44,192) 46.35%, rgb(0,195,137) 100%)
        #CE0D98 magenta      →      #052CC0 blue      →      #00C389 green
```

radixdlt.com builds its identity on the blue and the green. **The magenta is unclaimed**, so that
is our accent. It is provably inside the Radix palette and provably not the colour Radix uses for
itself — an argument that holds up to the "never be confused for one another" requirement in a way
that a taste preference would not.

`#CE0D98` is darkened to `#A80C7C` for light mode so it clears WCAG AA both as text on white
(6.98:1) and as a fill under white text (6.98:1). Dark mode lifts it to `#F272C6` (6.13:1 on the
deep band, 7.09:1 on the ground) — tuned, not inverted.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-ink` | `#012B4E` | `#E6EDF7` | All text. Radix's navy, one notch deeper. |
| `--color-muted` | `#51637A` | `#A9BAD1` | Secondary copy, dates. Blue-biased, never neutral grey. |
| `--color-accent` | `#A80C7C` | `#F272C6` | Links, the status token, the mark. |
| `--color-band` | `#00204A` | `#00204A` | Full-bleed deep sections. At most twice per page. |
| `--color-live` / `--color-pending` | `#00734F` / `#8A5A00` | `#3DDC9A` / `#E8B54A` | State. Deliberately **not** the accent — status must never read as brand. |

The lowest contrast ratio anywhere in the system is 5.7:1. Nothing needs a large-text exemption.

**If you change the accent, re-run the contrast maths for all four combinations** (as text on both
grounds, and as a fill under both text colours). The previous build's amber scored 2.17:1 on white,
which is why light mode had silently substituted a different colour.

---

## Type

**IBM Plex Sans** is what radixdlt.com sets everything in; we adopt it directly. **IBM Plex Mono**
is added for anything a reader could independently verify — timestamps, on-chain addresses, phase
tags, seat counts, table headers.

That second face is the whole separation strategy in one move. Same superfamily as the parent, so
the relationship reads instantly; a completely different texture, so the two are never confused.

Both are **self-hosted** via `@fontsource`, latin subset only, ~104 KB total. A font CDN would
breach the privacy requirement — no third-party requests, cookieless.

> The previous build declared Space Grotesk and never loaded it, so every visitor saw their OS
> default. If you add a weight, add the `@import` in `global.css` too.

Use `.data` for verifiable values and `.label` for small uppercase mono labels. Do not set
monospace by hand.

---

## Structure

- **The status strip runs across every page**, not just home. It is the element most likely to go
  out of date, and a stale one makes the whole site wrong. It is edited in one file,
  `src/content/site/status.md` — see [PUBLISHING.md](PUBLISHING.md).
- **Every page opens with the question it answers** (`PageHeader.astro`). The brief defines each
  page by a single question; showing it is a structural device that comes from the content rather
  than being applied to it.
- **Vacant and pending are designed states.** The People page renders every Council seat whether or
  not it is filled; Verify renders treasury rows that do not exist yet, marked pending. Hiding
  either would misrepresent the DAO.

---

## The mark

Radix's mark is a check. Ours is a check inside brackets — the notation for something entered into
a record. Same gesture, different container, different colour, no shared artwork
(`Wordmark.astro`, `public/favicon.svg`, `public/favicon.ico`).

The previous `favicon.svg` was Radix's own logo glyph. For an entity whose central design
requirement is not being mistaken for Radix Publishing Ltd, that is the one asset that can never be
shared.
