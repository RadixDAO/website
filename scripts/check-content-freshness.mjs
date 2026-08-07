#!/usr/bin/env node
// Tripwire against silent drift between this site's copied content
// (src/data/govern.json, src/data/roles.json, src/data/identifiers.json) and
// the governance repository they were lifted from. This site is fully
// static, so nothing here fetches those documents at request time — instead,
// this script hashes the pinned upstream files and compares against
// content-sources.lock. A mismatch means the source moved since someone last
// verified this site's copy, and fails CI until a human re-syncs it.
//
// Usage:
//   node scripts/check-content-freshness.mjs           # verify (exit 1 on drift)
//   node scripts/check-content-freshness.mjs --accept   # record current hashes as known-good

import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const REPO = 'Shadaffy/radix-dao-governance'
const BRANCH = 'master'
const LOCK_PATH = fileURLToPath(
  new URL('../content-sources.lock', import.meta.url)
)

const TRACKED_FILES = [
  'pending/policy-library-reading-guide.md',
  'pending/governance/roles-registry.md',
  'pending/governance/on-chain-identifiers-and-verification-policy.md'
]

const accept = process.argv.includes('--accept')

async function fetchHash(path) {
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Fetching ${url} failed: ${res.status} ${res.statusText}`)
  }
  const text = await res.text()
  return createHash('sha256').update(text).digest('hex')
}

async function readLock() {
  try {
    return JSON.parse(await readFile(LOCK_PATH, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return {}
    throw err
  }
}

async function main() {
  const lock = await readLock()
  const current = {}
  const drifted = []

  for (const path of TRACKED_FILES) {
    current[path] = await fetchHash(path)
    if (lock[path] && lock[path] !== current[path]) {
      drifted.push(path)
    }
  }

  if (accept) {
    await writeFile(LOCK_PATH, `${JSON.stringify(current, null, '\t')}\n`)
    console.log(
      `Recorded known-good hashes for ${TRACKED_FILES.length} upstream file(s).`
    )
    return
  }

  const missing = TRACKED_FILES.filter((path) => !lock[path])
  if (missing.length > 0) {
    console.error('content-sources.lock is missing an entry for:')
    for (const path of missing) console.error(`  - ${path}`)
    console.error('\nRun: node scripts/check-content-freshness.mjs --accept')
    process.exitCode = 1
    return
  }

  if (drifted.length > 0) {
    console.error(
      "The governance repository has changed since this site's copy was last verified:\n"
    )
    for (const path of drifted) {
      console.error(`  - ${path}`)
      console.error(`    https://github.com/${REPO}/blob/${BRANCH}/${path}`)
    }
    console.error(
      '\nReview the upstream diff, update the corresponding file(s) in src/data/ if the content actually changed, then run:\n  node scripts/check-content-freshness.mjs --accept'
    )
    process.exitCode = 1
    return
  }

  console.log('Content is in sync with the governance repository.')
}

main().catch((err) => {
  console.error(err.message)
  process.exitCode = 1
})
