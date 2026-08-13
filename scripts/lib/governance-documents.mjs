import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export const SHA256_PATTERN = /^[0-9a-f]{64}$/
export const VERSION_PATTERN = /^\d+\.\d+\.\d+$/
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
export const COMMIT_PATTERN = /^[0-9a-f]{40}$/

// Both overridable so the pipeline can be exercised against a temporary index
// and a local server, rather than only against the live repository.
const GOVERN_JSON = process.env.GOVERN_JSON_PATH
  ? new URL(`file://${process.env.GOVERN_JSON_PATH.replaceAll('\\', '/')}`)
  : new URL('../../src/data/govern.json', import.meta.url)
const GOVERNANCE_TS = new URL('../../src/data/governance.ts', import.meta.url)
const rawOrigin =
  process.env.CONTENT_SOURCE_RAW_ORIGIN ?? 'https://raw.githubusercontent.com'

/**
 * Read the governance repository coordinates out of src/data/governance.ts
 * rather than restating them, so the site and the tooling can never disagree
 * about which repository is the source of truth.
 */
export async function loadGovernanceSource(sourcePath = GOVERNANCE_TS) {
  const source = await readFile(sourcePath, 'utf8')
  const repository = source.match(/repository:\s*'([^']+)'/)?.[1]
  const ref = source.match(/ref:\s*'([^']+)'/)?.[1]

  if (!repository || !ref) {
    throw new Error(`Could not read SOURCE from ${fileURLToPath(sourcePath)}`)
  }

  return { repository, ref }
}

export async function loadGovernData(target = GOVERN_JSON) {
  return JSON.parse(await readFile(target, 'utf8'))
}

/**
 * Written with tab indentation to match the repository's formatter. Callers in
 * CI still run `pnpm format` afterwards, because Biome collapses short arrays
 * in ways JSON.stringify does not.
 */
export async function writeGovernData(data, target = GOVERN_JSON) {
  await writeFile(target, `${JSON.stringify(data, null, '\t')}\n`)
}

export function findDocument(data, id) {
  const document = data.documents.find((entry) => entry.id === id)
  if (!document) {
    throw new Error(
      `Unknown document id "${id}". Register it before activating it.`
    )
  }
  return document
}

export const rawUrl = (repository, ref, path) =>
  `${rawOrigin}/${repository}/${ref}/${path}`

export const sha256 = (buffer) =>
  createHash('sha256').update(buffer).digest('hex')

async function get(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Fetching ${url} failed: ${response.status} ${response.statusText}`
    )
  }
  return response
}

export async function fetchJson(url) {
  return (await get(url)).json()
}

/** Download a file and hash it here — never trust a digest that was typed in. */
export async function fetchAndHash(url) {
  const buffer = Buffer.from(await (await get(url)).arrayBuffer())
  return { sha256: sha256(buffer), bytes: buffer.length }
}

/** -1, 0 or 1. Versions are `major.minor.patch`, validated before comparison. */
export function compareVersions(a, b) {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1
  }
  return 0
}

/**
 * Resolve an activated document against the governance repository: find its
 * entry in registry.json at the given commit, download the PDF, hash it, and
 * refuse to continue unless both agree. Two independent sources must confirm a
 * digest before it can reach the site.
 */
export async function resolveActivation({ repository, commit, id, version }) {
  const registry = await fetchJson(rawUrl(repository, commit, 'registry.json'))
  const entry = registry.documents?.find(
    (item) => item.id === id && item.version === version
  )

  if (!entry) {
    const available = (registry.documents ?? [])
      .filter((item) => item.id === id)
      .map((item) => `v${item.version}`)
      .join(', ')
    throw new Error(
      `registry.json at ${commit.slice(0, 12)} has no entry for "${id}" v${version}.` +
        (available
          ? ` Available: ${available}.`
          : ' That document has no activated versions there.')
    )
  }

  if (!SHA256_PATTERN.test(entry.pdf?.sha256 ?? '')) {
    throw new Error(
      `registry.json entry for "${id}" v${version} has a malformed PDF digest.`
    )
  }

  const downloaded = await fetchAndHash(
    rawUrl(repository, commit, entry.pdf.path)
  )

  if (downloaded.sha256 !== entry.pdf.sha256) {
    throw new Error(
      `Digest mismatch for "${id}" v${version}.\n` +
        `  registry.json says: ${entry.pdf.sha256}\n` +
        `  the PDF hashes to:  ${downloaded.sha256}\n` +
        'The published file and the registry disagree. Do not publish this.'
    )
  }

  return {
    pdf: {
      path: entry.pdf.path,
      sha256: downloaded.sha256,
      bytes: downloaded.bytes
    },
    markdownPath: entry.markdown?.path,
    effective: entry.effective
  }
}
