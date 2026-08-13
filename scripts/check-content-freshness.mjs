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

// Separate from fetchHash because a PDF must be hashed as bytes. Reading it
// through res.text() would decode it as UTF-8 and produce a digest for
// something that is not the file.
async function fetchBinaryHash(repository, ref, path) {
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
  return createHash('sha256')
    .update(Buffer.from(await res.arrayBuffer()))
    .digest('hex')
}

// Every in-force document publishes a digest that readers check their own copy
// against, so a stale or hand-edited value here is worse than a missing one.
// Each is re-derived from the published PDF at the commit it was rendered from.
async function verifyInForceDigests(repository) {
  const govern = JSON.parse(
    await readFile(
      fileURLToPath(new URL('../src/data/govern.json', import.meta.url)),
      'utf8'
    )
  )
  const inForce = (govern.documents ?? []).filter(
    (doc) => doc.status === 'in-force' && doc.pdf?.sha256 && doc.commit
  )

  const mismatched = []
  const unavailable = []

  for (const doc of inForce) {
    try {
      const actual = await fetchBinaryHash(repository, doc.commit, doc.pdf.path)
      if (actual !== doc.pdf.sha256) {
        mismatched.push(
          `${doc.id} v${doc.version}\n` +
            `      govern.json says: ${doc.pdf.sha256}\n` +
            `      the PDF hashes to: ${actual}`
        )
      }
    } catch (error) {
      if (error.name !== 'UpstreamFetchError') throw error
      unavailable.push(error.message)
    }
  }

  return { checked: inForce.length, mismatched, unavailable }
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

  const documents = await verifyInForceDigests(repository)

  if (documents.unavailable.length > 0) {
    console.error('Published document digests could not be verified:\n')
    for (const message of documents.unavailable) console.error(`  - ${message}`)
    console.error(
      '\nThis is a network or upstream-access failure, not evidence that a digest is wrong.'
    )
    process.exitCode = 2
    return
  }

  if (documents.mismatched.length > 0) {
    console.error(
      'A published document digest does not match its PDF in the governance repository:\n'
    )
    for (const entry of documents.mismatched) console.error(`  - ${entry}`)
    console.error(
      '\nReaders check their copies against these values, so this must be corrected before deploy.\nNever edit a digest by hand — re-run the activation workflow for the affected document.'
    )
    process.exitCode = 1
    return
  }

  if (documents.checked > 0) {
    console.log(
      `Verified ${documents.checked} published document digest(s) against their PDFs.`
    )
  }

  console.log(
    `Content matches ${repository}@${ref}; changes to its default branch cannot affect this result.`
  )
}

main().catch((err) => {
  console.error(err.message)
  process.exitCode = 1
})
