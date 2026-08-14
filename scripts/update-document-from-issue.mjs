#!/usr/bin/env node
// Applies a governance-document change to src/data/govern.json from a GitHub
// issue form. Three operations share this script because they differ only in
// which state transition they are allowed to make:
//
//   register  — add a new document to the index as a draft (no digest at all)
//   activate  — pending  -> in force   (an activation vote passed)
//   version   — in force -> in force   (an amendment vote passed)
//
// The operator declares which one they are doing and the script verifies that
// against the document's actual state, refusing on mismatch. Inference would
// quietly do something plausible when the operator's mental model is wrong;
// this stops instead.
//
// No digest is ever accepted as input. For activate and version the PDF is
// downloaded and hashed here, then cross-checked against registry.json in the
// governance repository at the given commit.
//
// Usage: update-document-from-issue.mjs <register|activate|version> <event.json>

import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import {
  COMMIT_PATTERN,
  compareVersions,
  DATE_PATTERN,
  findDocument,
  loadGovernanceSource,
  loadGovernData,
  resolveActivation,
  VERSION_PATTERN,
  writeGovernData
} from './lib/governance-documents.mjs'

const OPERATIONS = new Set(['register', 'activate', 'version'])

const operation = process.argv[2]
const eventPath = process.argv[3] ?? process.env.GITHUB_EVENT_PATH

if (!OPERATIONS.has(operation)) {
  throw new Error(`Operation must be one of: ${[...OPERATIONS].join(', ')}`)
}
if (!eventPath) throw new Error('Pass a GitHub issue event JSON file')

const event = JSON.parse(await readFile(eventPath, 'utf8'))
const issue = event.issue
if (!issue?.body || !Number.isInteger(issue.number)) {
  throw new Error('The event does not contain an issue body and number')
}

const data = await loadGovernData()
const { repository } = await loadGovernanceSource()

const result =
  operation === 'register'
    ? await register()
    : await publish(operation === 'activate')

await writeGovernData(data)
await emit({ ...result, branch: `document/issue-${issue.number}` })

// --- operations -------------------------------------------------------------

async function register() {
  const title = required('Document title')
  const summary = required('Summary')
  const path = required('Source path')
  const group = choice('Group')
  const id = optional('Document id') || slugify(basename(path))

  if (data.documents.some((entry) => entry.id === id)) {
    throw new Error(
      `"${id}" is already registered. To activate it, use the activation form.`
    )
  }
  if (!path.endsWith('.md')) {
    throw new Error(`Source path must be a Markdown file, got "${path}"`)
  }

  const target = data.groups.find((entry) => entry.name === group)
  if (!target) {
    throw new Error(
      `Unknown group "${group}". Expected one of: ${data.groups.map((g) => g.name).join(' | ')}`
    )
  }

  data.documents.push({ id, title, summary, path, status: 'pending' })
  target.documents.push(id)

  return {
    id,
    title,
    operation: 'register',
    summaryLine: `Registered **${title}** as a pending document in _${group}_.`
  }
}

async function publish(isActivation) {
  const id = choice('Document')
  const version = required('Version')
  const commit = required('Source commit')
  const effective = required('Effective date')
  const transaction = optional('Activating transaction')

  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Version must be major.minor.patch, got "${version}"`)
  }
  if (!COMMIT_PATTERN.test(commit)) {
    throw new Error(
      `Source commit must be a full 40-character SHA, got "${commit}"`
    )
  }
  if (!DATE_PATTERN.test(effective)) {
    throw new Error(`Effective date must be YYYY-MM-DD, got "${effective}"`)
  }

  const document = findDocument(data, id)

  // The intent check. Declared operation must match actual state.
  if (isActivation && document.status === 'in-force') {
    throw new Error(
      `"${id}" is already in force at v${document.version}. ` +
        'To publish an amendment, use the new-version form instead.'
    )
  }
  if (!isActivation && document.status !== 'in-force') {
    throw new Error(
      `"${id}" is not in force, so there is no version to replace. ` +
        'To activate it for the first time, use the activation form instead.'
    )
  }
  if (!isActivation && compareVersions(version, document.version) <= 0) {
    throw new Error(
      `Version ${version} does not follow the version in force (${document.version}).`
    )
  }

  const resolved = await resolveActivation({ repository, commit, id, version })

  if (!isActivation) {
    // The site shows only what is operative, so the previous version is not
    // rendered anywhere. Its digest is kept solely so the verifier can tell a
    // holder of that PDF it is genuine but superseded.
    data.superseded ??= []
    data.superseded.push({
      id: document.id,
      title: document.title,
      version: document.version,
      sha256: document.pdf.sha256,
      supersededOn: effective,
      supersededBy: version
    })
  }

  Object.assign(document, {
    status: 'in-force',
    version,
    effective,
    commit,
    pdf: resolved.pdf
  })
  if (transaction) document.transaction = transaction

  return {
    id,
    title: document.title,
    operation: isActivation ? 'activate' : 'version',
    summaryLine:
      `${isActivation ? 'Activated' : 'Published'} **${document.title} v${version}**, ` +
      `effective ${effective}.\n\n` +
      `Digest verified against \`registry.json\` at \`${commit.slice(0, 12)}\` ` +
      `and recomputed from the published PDF:\n\n\`${resolved.pdf.sha256}\``
  }
}

// --- issue form parsing -----------------------------------------------------

function section(label) {
  const marker = `### ${label}\n\n`
  const start = issue.body.indexOf(marker)
  if (start === -1) throw new Error(`Issue form field is missing: ${label}`)
  const from = start + marker.length
  const next = issue.body.indexOf('\n\n### ', from)
  return issue.body.slice(from, next === -1 ? undefined : next).trim()
}

function optional(label) {
  const value = section(label)
  return value === '_No response_' ? '' : value
}

function required(label) {
  const value = optional(label)
  if (!value) throw new Error(`Issue form field cannot be empty: ${label}`)
  return value
}

/**
 * A dropdown selection. Options render as "Human label (machine-value)", so the
 * value in the trailing parentheses wins — but only for dropdowns. Free-text
 * fields are taken literally, or a title like "Charter (2026)" would be
 * silently reduced to "2026".
 */
function choice(label) {
  const value = required(label)
  return value.match(/\(([-a-z0-9.]+)\)$/)?.[1] ?? value
}

// A declaration, not a const: the operations run at module top level, before a
// const declared down here would be initialised.
function basename(value) {
  return value.split('/').pop().replace(/\.md$/, '')
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function emit(result) {
  if (!process.env.GITHUB_OUTPUT) {
    console.log(JSON.stringify(result, null, 2))
    return
  }
  const delimiter = `DOCUMENT_${randomUUID()}`
  const output = Object.entries(result)
    .map(([key, value]) => `${key}<<${delimiter}\n${value}\n${delimiter}`)
    .join('\n')
  await writeFile(process.env.GITHUB_OUTPUT, `${output}\n`, { flag: 'a' })
}
