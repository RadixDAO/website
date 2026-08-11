import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { NOTICE_TYPES } from './data/notice-types'

const noticeTypeValues = NOTICE_TYPES.map((t) => t.value) as [
  string,
  ...string[]
]

// Notices & Records items (§7). One file per item; corrections are new files
// with `supersedes` pointing at the item they correct — never edit a
// published item's frontmatter/body after the fact.
const notices = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notices' }),
  schema: z.object({
    type: z.enum(noticeTypeValues),
    title: z.string(),
    // ISO-8601 UTC publication timestamp (§7.2).
    pubDate: z.coerce.date(),
    // For prior-notice items that start a statutory clock (§7.4).
    noticeDate: z.coerce.date().optional(),
    // Slug of the item this one corrects/supersedes (§7.2).
    supersedes: z.string().optional(),
    // Compliance challenges and other items that must render exactly as received (§7.3).
    verbatim: z.boolean().default(false)
  })
})

// The home page status band (§10) — a single small file so it's editable by a
// non-developer in under a minute via GitHub's web UI.
const status = defineCollection({
  loader: glob({ pattern: 'status.md', base: './src/content/site' }),
  schema: z.object({
    phase: z.string(),
    headline: z.string(),
    linkHref: z.string(),
    linkText: z.string()
  })
})

export const collections = { notices, status }
