import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = new URL('..', import.meta.url)

// Stands in for the governance repository. The PDF is arbitrary bytes; what
// matters is that the script derives the digest from what it downloads rather
// than trusting anything it was told.
const PDF = Buffer.from('%PDF-1.4 pretend this is a governance document')
const PDF_SHA = createHash('sha256').update(PDF).digest('hex')
const COMMIT = 'a'.repeat(40)

function baseIndex() {
  return {
    documents: [
      {
        id: 'code-of-conduct',
        title: 'Code of Conduct',
        summary: 'Behaviour expected of participants.',
        path: 'pending/governance/code-of-conduct.md',
        status: 'pending'
      }
    ],
    shortlist: [],
    companionGuides: [],
    groups: [
      {
        name: 'Conduct, integrity, and fairness',
        documents: ['code-of-conduct']
      }
    ]
  }
}

/** Serves registry.json and the PDF the way raw.githubusercontent.com would. */
async function startUpstream({ registryDigest = PDF_SHA } = {}) {
  const registry = {
    documents: [
      {
        id: 'code-of-conduct',
        version: '1.0.0',
        markdown: { path: 'pending/governance/code-of-conduct.md' },
        pdf: { path: 'code-of-conduct.pdf', sha256: registryDigest }
      },
      {
        id: 'code-of-conduct',
        version: '1.1.0',
        markdown: { path: 'pending/governance/code-of-conduct.md' },
        pdf: { path: 'code-of-conduct.pdf', sha256: registryDigest }
      }
    ]
  }

  const server = createServer((request, response) => {
    if (request.url.endsWith('registry.json')) {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify(registry))
      return
    }
    if (request.url.endsWith('.pdf')) {
      response.writeHead(200, { 'content-type': 'application/pdf' })
      response.end(PDF)
      return
    }
    response.writeHead(404)
    response.end('not found')
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return { server, origin: `http://127.0.0.1:${port}` }
}

async function run(operation, fields, { index = baseIndex(), origin } = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'radix-document-test-'))
  const indexPath = path.join(directory, 'govern.json')
  const eventPath = path.join(directory, 'event.json')

  await writeFile(indexPath, JSON.stringify(index, null, '\t'))
  const body = Object.entries(fields)
    .map(([label, value]) => `### ${label}\n\n${value}`)
    .join('\n\n')
  await writeFile(eventPath, JSON.stringify({ issue: { number: 7, body } }))

  const environment = { ...process.env, GOVERN_JSON_PATH: indexPath }
  delete environment.GITHUB_OUTPUT
  if (origin) environment.CONTENT_SOURCE_RAW_ORIGIN = origin

  const result = await execFileAsync(
    process.execPath,
    ['scripts/update-document-from-issue.mjs', operation, eventPath],
    { cwd: root, env: environment }
  )

  return {
    output: JSON.parse(result.stdout),
    index: JSON.parse(await readFile(indexPath, 'utf8'))
  }
}

async function runExpectingFailure(...args) {
  try {
    await run(...args)
  } catch (error) {
    return error.stderr ?? error.message
  }
  throw new Error('Expected the script to fail, but it succeeded')
}

test('register adds a pending document and places it in a group', async () => {
  const { index } = await run('register', {
    'Document title': 'Records Retention Policy',
    Summary: 'How long the DAO keeps what it holds.',
    'Source path': 'pending/governance/records-retention-policy.md',
    Group: 'Conduct, integrity, and fairness',
    'Document id': '_No response_'
  })

  const added = index.documents.find((d) => d.id === 'records-retention-policy')
  assert.equal(added.status, 'pending')
  assert.equal(added.title, 'Records Retention Policy')
  assert.equal(added.pdf, undefined, 'a registered document has no digest')
  assert.ok(
    index.groups[0].documents.includes('records-retention-policy'),
    'the document is listed in its group'
  )
})

test('activation derives the digest from the published PDF', async () => {
  const { server, origin } = await startUpstream()
  try {
    const { index } = await run(
      'activate',
      {
        Document: 'Code of Conduct (code-of-conduct)',
        Version: '1.0.0',
        'Source commit': COMMIT,
        'Effective date': '2026-09-21',
        'Activating transaction': 'txid_rdx1abc'
      },
      { origin }
    )

    const doc = index.documents[0]
    assert.equal(doc.status, 'in-force')
    assert.equal(doc.version, '1.0.0')
    assert.equal(
      doc.pdf.sha256,
      PDF_SHA,
      'digest is the hash of the real bytes'
    )
    assert.equal(doc.pdf.bytes, PDF.length)
    assert.equal(doc.transaction, 'txid_rdx1abc')
  } finally {
    server.close()
  }
})

test('activation fails when registry.json and the PDF disagree', async () => {
  const { server, origin } = await startUpstream({
    registryDigest: 'b'.repeat(64)
  })
  try {
    const stderr = await runExpectingFailure(
      'activate',
      {
        Document: 'Code of Conduct (code-of-conduct)',
        Version: '1.0.0',
        'Source commit': COMMIT,
        'Effective date': '2026-09-21',
        'Activating transaction': '_No response_'
      },
      { origin }
    )
    assert.match(stderr, /Digest mismatch/)
    assert.match(stderr, /Do not publish this/)
  } finally {
    server.close()
  }
})

test('activating a document already in force is refused', async () => {
  const index = baseIndex()
  Object.assign(index.documents[0], {
    status: 'in-force',
    version: '1.0.0',
    commit: COMMIT,
    pdf: { path: 'code-of-conduct.pdf', sha256: PDF_SHA }
  })

  const stderr = await runExpectingFailure(
    'activate',
    {
      Document: 'Code of Conduct (code-of-conduct)',
      Version: '1.1.0',
      'Source commit': COMMIT,
      'Effective date': '2027-03-04',
      'Activating transaction': '_No response_'
    },
    { index }
  )
  assert.match(stderr, /already in force/)
  assert.match(stderr, /new-version form/)
})

test('publishing a new version of a pending document is refused', async () => {
  const stderr = await runExpectingFailure('version', {
    Document: 'Code of Conduct (code-of-conduct)',
    Version: '1.1.0',
    'Source commit': COMMIT,
    'Effective date': '2027-03-04',
    'Activating transaction': '_No response_'
  })
  assert.match(stderr, /is not in force/)
  assert.match(stderr, /activation form/)
})

test('a new version must be greater than the version in force', async () => {
  const index = baseIndex()
  Object.assign(index.documents[0], {
    status: 'in-force',
    version: '1.1.0',
    commit: COMMIT,
    pdf: { path: 'code-of-conduct.pdf', sha256: PDF_SHA }
  })

  const stderr = await runExpectingFailure(
    'version',
    {
      Document: 'Code of Conduct (code-of-conduct)',
      Version: '1.0.0',
      'Source commit': COMMIT,
      'Effective date': '2027-03-04',
      'Activating transaction': '_No response_'
    },
    { index }
  )
  assert.match(stderr, /does not follow the version in force/)
})

test('a new version retains the previous digest for verification', async () => {
  const previous = 'c'.repeat(64)
  const index = baseIndex()
  Object.assign(index.documents[0], {
    status: 'in-force',
    version: '1.0.0',
    commit: COMMIT,
    pdf: { path: 'code-of-conduct.pdf', sha256: previous }
  })

  const { server, origin } = await startUpstream()
  try {
    const result = await run(
      'version',
      {
        Document: 'Code of Conduct (code-of-conduct)',
        Version: '1.1.0',
        'Source commit': COMMIT,
        'Effective date': '2027-03-04',
        'Activating transaction': '_No response_'
      },
      { index, origin }
    )

    assert.equal(result.index.documents[0].version, '1.1.0')
    assert.equal(result.index.documents[0].pdf.sha256, PDF_SHA)

    // Not rendered anywhere, but kept so a holder of the old PDF is told it is
    // genuine and superseded rather than unrecognised.
    assert.deepEqual(result.index.superseded, [
      {
        id: 'code-of-conduct',
        title: 'Code of Conduct',
        version: '1.0.0',
        sha256: previous,
        supersededOn: '2027-03-04',
        supersededBy: '1.1.0'
      }
    ])
  } finally {
    server.close()
  }
})

test('a version that is not in registry.json is refused', async () => {
  const { server, origin } = await startUpstream()
  try {
    const stderr = await runExpectingFailure(
      'activate',
      {
        Document: 'Code of Conduct (code-of-conduct)',
        Version: '9.9.9',
        'Source commit': COMMIT,
        'Effective date': '2026-09-21',
        'Activating transaction': '_No response_'
      },
      { origin }
    )
    assert.match(stderr, /has no entry for "code-of-conduct" v9\.9\.9/)
    assert.match(stderr, /Available: v1\.0\.0, v1\.1\.0/)
  } finally {
    server.close()
  }
})

test('malformed operator input is rejected before any network call', async () => {
  const stderr = await runExpectingFailure('activate', {
    Document: 'Code of Conduct (code-of-conduct)',
    Version: '1.0',
    'Source commit': COMMIT,
    'Effective date': '2026-09-21',
    'Activating transaction': '_No response_'
  })
  assert.match(stderr, /Version must be major\.minor\.patch/)
})
