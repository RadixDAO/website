#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  loadNoticeTypes,
  UTC_TIMESTAMP_PATTERN
} from './lib/notice-content.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const noticeDirectory = process.env.NOTICE_OUTPUT_DIRECTORY
  ? path.resolve(process.env.NOTICE_OUTPUT_DIRECTORY)
  : path.join(root, 'src/content/notices')
const eventPath = process.argv[2] ?? process.env.GITHUB_EVENT_PATH
if (!eventPath) throw new Error('Pass a GitHub issue event JSON file')

const event = JSON.parse(await readFile(eventPath, 'utf8'))
const issue = event.issue
if (!issue?.body || !Number.isInteger(issue.number)) {
  throw new Error('The event does not contain an issue body and number')
}

const typeSelection = section(issue.body, 'Notice type')
const title = section(issue.body, 'Notice title').trim()
const body = section(issue.body, 'Body')
const noticeDate = optionalSection(issue.body, 'Notice date')
const verbatim = section(issue.body, 'Verbatim publication').trim() === 'Yes'
const supersedes = optionalSection(issue.body, 'Supersedes')
const typeMatch = typeSelection.match(/\(([-a-z0-9]+)\)\s*$/)
const type = typeMatch?.[1] ?? typeSelection.trim()
const noticeTypes = await loadNoticeTypes()

if (!noticeTypes.some(({ value }) => value === type)) {
  throw new Error(`Unknown notice type: ${typeSelection}`)
}
if (!title) throw new Error('Notice title cannot be empty')
if (!body) throw new Error('Notice body cannot be empty')
if (noticeDate && !validTimestamp(noticeDate)) {
  throw new Error('Notice date must use YYYY-MM-DDTHH:MM:SSZ in UTC')
}
if (
  supersedes &&
  !/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(supersedes)
) {
  throw new Error('Supersedes must be a notice filename without .md')
}

const now = new Date()
const pubDate = now.toISOString().replace(/\.\d{3}Z$/, 'Z')
const date = pubDate.slice(0, 10)
const titleSlug = slugify(title) || `notice-${issue.number}`
const baseSlug = `${date}-${titleSlug}`.slice(0, 100).replace(/-+$/, '')
let slug = baseSlug
let target = path.join(noticeDirectory, `${slug}.md`)

try {
  await readFile(target)
  slug = `${baseSlug}-${issue.number}`
  target = path.join(noticeDirectory, `${slug}.md`)
} catch {}

const frontmatter = [
  '---',
  `type: ${type}`,
  `title: ${JSON.stringify(title)}`,
  `pubDate: ${pubDate}`,
  noticeDate ? `noticeDate: ${noticeDate}` : null,
  supersedes ? `supersedes: ${supersedes}` : null,
  verbatim ? 'verbatim: true' : null,
  '---',
  ''
]
  .filter((line) => line !== null)
  .join('\n')

// Do not trim or reflow the submitted body. The only removed bytes are the
// Issue Form's structural separator before the following field heading.
await writeFile(target, `${frontmatter}\n${body}`)

const result = {
  branch: `notice/issue-${issue.number}`,
  path: path.relative(root, target),
  slug,
  title
}

if (process.env.GITHUB_OUTPUT) {
  const delimiter = `NOTICE_${randomUUID()}`
  const output = Object.entries(result)
    .map(([key, value]) => `${key}<<${delimiter}\n${value}\n${delimiter}`)
    .join('\n')
  await writeFile(process.env.GITHUB_OUTPUT, `${output}\n`, { flag: 'a' })
} else {
  console.log(JSON.stringify(result, null, 2))
}

function section(markdown, label) {
  const marker = `### ${label}\n\n`
  const start = markdown.indexOf(marker)
  if (start === -1) throw new Error(`Issue form field is missing: ${label}`)
  const contentStart = start + marker.length
  const next = markdown.indexOf('\n\n### ', contentStart)
  return markdown.slice(contentStart, next === -1 ? undefined : next)
}

function optionalSection(markdown, label) {
  const value = section(markdown, label).trim()
  return value === '_No response_' ? '' : value
}

function validTimestamp(value) {
  return UTC_TIMESTAMP_PATTERN.test(value) && !Number.isNaN(Date.parse(value))
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
