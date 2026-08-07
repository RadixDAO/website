# radixdao.org

Official site of Radix DAO LLC — the DAO's designated "Official Venue" for governance records,
activation statements, status reports, and other official communications, alongside a small set of
front-of-house pages explaining what the DAO is and how to take part.

Astro + Tailwind, static output, deployed as a Cloudflare Worker serving static assets. No SSR, no
client framework, no wallet connection anywhere on the site.

- **Publishing a notice or updating the status band?** See [PUBLISHING.md](PUBLISHING.md) — no
  local setup required, everything's doable from GitHub's website.
- **Governance documents** (the single source of truth this site links out to, never reproduces):
  [github.com/Shadaffy/radix-dao-governance](https://github.com/Shadaffy/radix-dao-governance)
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
| `pnpm content:freshness` | Verify `src/data/*.json` hasn't drifted from the governance repo |
| `pnpm verify` | Everything CI runs |

## Deploying

Pushes to `main` deploy to production automatically; pull requests get a Worker preview at
`pr-<number>-*.workers.dev`, linked from the PR's checks. See `.github/workflows/deploy.yml` and
`wrangler.jsonc`.

## Content model

- `src/content/notices/*.md` — the official record (§7 of the requirements brief). One file per
  item, never edited after publishing; corrections are new files with `supersedes` set.
- `src/content/site/status.md` — the home page status band, the one piece of content meant to be
  edited constantly as the DAO's founding sequence progresses.
- `src/data/*.json` — structured data (People roster, Govern doc index, Verify identifier table)
  copied from the governance repository and checked for drift by `pnpm content:freshness`.
