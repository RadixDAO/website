import { execFile } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { LineCounter, parseDocument } from 'yaml'

const execFileAsync = promisify(execFile)

export const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
export const PUBLICATION_TOLERANCE_MS = 15 * 60 * 1000

export async function loadNoticeTypes(
  sourcePath = new URL('../../src/data/notice-types.ts', import.meta.url)
) {
  const source = await readFile(sourcePath, 'utf8')
  const types = []
  const pattern = /value:\s*'([^']+)'[\s\S]*?label:\s*'([^']+)'/g

  for (const match of source.matchAll(pattern)) {
    types.push({ value: match[1], label: match[2] })
  }

  if (types.length === 0) {
    throw new Error(`No notice types found in ${sourcePath}`)
  }

  return types
}

export async function listMarkdownFiles(directory) {
  const files = []

  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(entryPath)
      if (entry.isFile() && entry.name.endsWith('.md')) files.push(entryPath)
    }
  }

  await visit(directory)
  return files.sort()
}

export function parseNoticeFile(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) {
    return {
      error: `${file}: missing YAML frontmatter delimited by ---`,
      data: null,
      body: ''
    }
  }

  const lineCounter = new LineCounter()
  const document = parseDocument(match[1], {
    lineCounter,
    prettyErrors: false,
    uniqueKeys: true
  })

  if (document.errors.length > 0) {
    const details = document.errors
      .map((error) => {
        const line = error.linePos?.[0]?.line
        return line ? `line ${line + 1}: ${error.message}` : error.message
      })
      .join('; ')
    return {
      error: `${file}: invalid YAML frontmatter (${details})`,
      data: null,
      body: ''
    }
  }

  const data = document.toJS()
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    return {
      error: `${file}: frontmatter must be a mapping of field names to values`,
      data: null,
      body: ''
    }
  }

  return { error: null, data, body: source.slice(match[0].length) }
}

export function validateNoticeData({ data, file, allowedTypes }) {
  const errors = []
  const allowed = allowedTypes.map(({ value }) => value)

  if (typeof data.type !== 'string' || !allowed.includes(data.type)) {
    errors.push(`${file}: field "type" must be one of: ${allowed.join(', ')}`)
  }

  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push(`${file}: field "title" must be a non-empty string`)
  }

  validateTimestampField(data, 'pubDate', file, errors, true)
  validateTimestampField(data, 'noticeDate', file, errors, false)

  if (
    data.supersedes !== undefined &&
    (typeof data.supersedes !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.supersedes))
  ) {
    errors.push(
      `${file}: field "supersedes" must be a notice filename without .md`
    )
  }

  if (data.verbatim !== undefined && typeof data.verbatim !== 'boolean') {
    errors.push(`${file}: field "verbatim" must be true or false`)
  }

  return errors
}

function validateTimestampField(data, field, file, errors, required) {
  const value = data[field]
  if (value === undefined && !required) return

  if (
    typeof value !== 'string' ||
    !UTC_TIMESTAMP_PATTERN.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    errors.push(
      `${file}: field "${field}" must use UTC format YYYY-MM-DDTHH:MM:SSZ, for example 2026-08-11T14:30:00Z`
    )
  }
}

export function publicationTimeWarning({ pubDate, referenceTime, file }) {
  if (
    typeof pubDate !== 'string' ||
    !UTC_TIMESTAMP_PATTERN.test(pubDate) ||
    Number.isNaN(Date.parse(pubDate))
  ) {
    return null
  }

  const difference = Date.parse(pubDate) - referenceTime.valueOf()
  if (Math.abs(difference) <= PUBLICATION_TOLERANCE_MS) return null

  const minutes = Math.round(Math.abs(difference) / 60000)
  const direction = difference > 0 ? 'after' : 'before'
  return `${file}: pubDate is ${minutes} minutes ${direction} the file's commit time. Publication is immediate; pubDate does not create an embargo.`
}

export async function firstCommitTime(file, fallback = new Date()) {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', '--follow', '--diff-filter=A', '--format=%cI', '-1', '--', file],
      { cwd: process.cwd() }
    )
    const value = stdout.trim()
    if (value && !Number.isNaN(Date.parse(value))) return new Date(value)
  } catch {
    // An untracked file has no commit time; local lint compares it with now.
  }
  return fallback
}

export function githubAnnotation(level, file, message) {
  const escapeAnnotation = (value) =>
    value.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A')
  return `::${level} file=${escapeAnnotation(file)}::${escapeAnnotation(message)}`
}
