#!/usr/bin/env node
// Tripwire against silent drift between this site's copied content
// (src/data/govern.json, src/data/roles.json, src/data/identifiers.json) and
// the governance repository they were lifted from. This check is deliberately
// separate from the publication deploy: an upstream outage or content change
// must never block a time-critical notice from going live.
//
// Usage:
//   node scripts/check-content-freshness.mjs           # verify (exit 1 on drift)
//   node scripts/check-content-freshness.mjs --accept   # record current hashes as known-good

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const LOCK_PATH = fileURLToPath(
  new URL('../content-sources.lock', import.meta.url)
)

const accept = process.argv.includes('--accept')
const rawOrigin =
  process.env.CONTENT_SOURCE_RAW_ORIGIN ?? 'https://raw.githubusercontent.com'

async function fetchHash(repository, ref, path) {
  const url = `${rawOrigin}/${repository}/${ref}/${path}`
  let res
  try {
    res = await fetch(url)
  } catch (cause) {
    const error = new Error(
      `Could not verify ${path}: request to ${url} failed (${cause.message})`
    )
    error.name = 'UpstreamFetchError'
    throw error
  }
  if (!res.ok) {
    const error = new Error(
      `Could not verify ${path}: ${res.status} ${res.statusText} from ${url}`
    )
    error.name = 'UpstreamFetchError'
    throw error
  }
  const text = await res.text()
  return createHash('sha256').update(text).digest('hex')
}

async function readLock() {
  try {
    return JSON.parse(await readFile(LOCK_PATH, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('content-sources.lock does not exist')
    }
    throw err
  }
}

async function main() {
  const lock = await readLock()
  const repository = lock.source?.repository
  const ref = lock.source?.ref
  const trackedFiles = Object.keys(lock.files ?? {})

  if (!repository || !ref || trackedFiles.length === 0) {
    throw new Error(
      'content-sources.lock must define source.repository, source.ref, and files'
    )
  }

  const current = {}
  const drifted = []
  const unavailable = []

  for (const path of trackedFiles) {
    try {
      current[path] = await fetchHash(repository, ref, path)
      if (lock.files[path] !== current[path]) drifted.push(path)
    } catch (error) {
      if (error.name !== 'UpstreamFetchError') throw error
      unavailable.push(error.message)
    }
  }

  if (unavailable.length > 0) {
    console.error('Upstream content could not be verified:\n')
    for (const message of unavailable) console.error(`  - ${message}`)
    console.error(
      '\nThis is a network or upstream-access failure, not evidence that content drifted.'
    )
    process.exitCode = 2
    return
  }

  if (accept) {
    const updated = { source: lock.source, files: current }
    await writeFile(LOCK_PATH, `${JSON.stringify(updated, null, '\t')}\n`)
    console.log(
      `Recorded known-good hashes for ${trackedFiles.length} upstream file(s) at ${ref}.`
    )
    return
  }

  if (drifted.length > 0) {
    console.error(
      'Pinned governance content does not match the accepted hashes:\n'
    )
    for (const path of drifted) {
      console.error(`  - ${path}`)
      console.error(`    https://github.com/${repository}/blob/${ref}/${path}`)
    }
    console.error(
      '\nReview the pinned source, then update src/data/ and explicitly advance source.ref before accepting new hashes.'
    )
    process.exitCode = 1
    return
  }

  console.log(
    `Content matches ${repository}@${ref}; changes to its default branch cannot affect this result.`
  )
}

main().catch((err) => {
  console.error(err.message)
  process.exitCode = 1
})
