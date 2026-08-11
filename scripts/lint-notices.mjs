#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  firstCommitTime,
  githubAnnotation,
  listMarkdownFiles,
  loadNoticeTypes,
  parseNoticeFile,
  publicationTimeWarning,
  validateNoticeData
} from './lib/notice-content.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const directoryArgument = process.argv.find((value) =>
  value.startsWith('--directory=')
)
const referenceArgument = process.argv.find((value) =>
  value.startsWith('--reference-time=')
)
const directory = directoryArgument
  ? path.resolve(directoryArgument.slice('--directory='.length))
  : path.join(root, 'src/content/notices')
const forcedReferenceTime = referenceArgument
  ? new Date(referenceArgument.slice('--reference-time='.length))
  : null

if (forcedReferenceTime && Number.isNaN(forcedReferenceTime.valueOf())) {
  throw new Error('--reference-time must be an ISO-8601 timestamp')
}

const noticeTypes = await loadNoticeTypes()
const files = await listMarkdownFiles(directory)
const errors = []
const warnings = []

for (const absoluteFile of files) {
  const file = path.relative(root, absoluteFile)
  const source = await readFile(absoluteFile, 'utf8')
  const parsed = parseNoticeFile(source, file)

  if (parsed.error) {
    errors.push({ file, message: parsed.error })
    continue
  }

  for (const message of validateNoticeData({
    data: parsed.data,
    file,
    allowedTypes: noticeTypes
  })) {
    errors.push({ file, message })
  }

  const referenceTime =
    forcedReferenceTime ?? (await firstCommitTime(file, new Date()))
  const warning = publicationTimeWarning({
    pubDate: parsed.data.pubDate,
    referenceTime,
    file
  })
  if (warning) warnings.push({ file, message: warning })
}

for (const warning of warnings) {
  console.warn(warning.message)
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.warn(githubAnnotation('warning', warning.file, warning.message))
  }
}

for (const error of errors) {
  console.error(error.message)
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.error(githubAnnotation('error', error.file, error.message))
  }
}

if (errors.length > 0) {
  console.error(`\nNotice validation failed with ${errors.length} error(s).`)
  process.exitCode = 1
} else {
  console.log(
    `Validated ${files.length} notice file(s) with ${warnings.length} timestamp warning(s).`
  )
}
