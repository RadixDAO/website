# radixdao.org

Official site of Radix DAO LLC — the DAO's designated "Official Venue" for governance records,
activation statements, status reports, and other official communications, alongside a small set of
front-of-house pages explaining what the DAO is and how to take part.

Astro + Tailwind, static output, deployed as a Cloudflare Worker serving static assets. No SSR, no
client framework, no wallet connection anywhere on the site.

- **Publishing a notice or updating the status band?** See [PUBLISHING.md](PUBLISHING.md) — no
  local setup required, everything's doable from GitHub's website.
- **Governance documents** (the source of truth this site links out to, never loads at runtime):
  [github.com/RadixDAO/governance-framework](https://github.com/RadixDAO/governance-framework).
  The site-copy verification is pinned reproducibly in `content-sources.lock`.
- **Voting platform:** [vote.radixdao.org](https://vote.radixdao.org)

## Development

```sh
pnpm install
pnpm dev
```

| Command | Action |
| --- | --- |
| `pnpm dev` | Local dev server |
| `pnpm build` | Build to `./dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` | Biome check |
| `pnpm check` | Astro type/content check |
| `pnpm content:lint` | Plain-language notice validation and timestamp warnings |
| `pnpm content:freshness` | Verify `src/data/*.json` hasn't drifted from the governance repo |
| `pnpm notice-form:check` | Confirm the generated GitHub notice form matches the type registry |
| `pnpm verify` | Everything CI runs |

## Deploying

Pushes to `main` in the canonical `RadixDAO/website` repository deploy automatically. The deploy is
reported successful only after the public origin identifies the new commit and new notice URLs are
live. Internal pull requests get a Worker preview at `pr-<number>-*.workers.dev`; forks cannot use
either deployment job. See `.github/workflows/deploy.yml`, `.github/workflows/publishing-canary.yml`
and `wrangler.jsonc`.

## Content model

- `src/content/notices/*.md` — the official record (§7 of the requirements brief). One file per
  item, never edited after publishing; corrections are new files with `supersedes` set.
- `src/content/site/status.md` — the home page status band, the one piece of content meant to be
  edited constantly as the DAO's founding sequence progresses.
- `src/data/*.json` — structured data (People roster, Govern doc index, Verify identifier table)
  copied from the governance repository and checked for drift by `pnpm content:freshness`.
