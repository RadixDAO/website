import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import { parseDocument } from 'yaml'

test('GitHub workflow files contain valid YAML', async () => {
  const directory = new URL('../.github/workflows/', import.meta.url)
  const files = (await readdir(directory)).filter((file) =>
    /\.ya?ml$/.test(file)
  )

  for (const file of files) {
    const source = await readFile(new URL(file, directory), 'utf8')
    const document = parseDocument(source)
    assert.deepEqual(
      document.errors.map((error) => error.message),
      [],
      file
    )
  }
})

test('notice form quotes timestamp-like example values', async () => {
  const source = await readFile(
    new URL('../.github/ISSUE_TEMPLATE/publish-notice.yml', import.meta.url),
    'utf8'
  )

  assert.match(source, /placeholder: ["']2026-08-11T14:30:00Z["']/)
})

test('every Cloudflare credential workflow fails closed outside the canonical repo', async () => {
  for (const file of ['deploy.yml', 'publishing-canary.yml']) {
    const source = await readFile(
      new URL(`../.github/workflows/${file}`, import.meta.url),
      'utf8'
    )
    assert.match(source, /github\.repository == 'RadixDAO\/website'/, file)
  }
})

test('governance freshness is absent from the deployment gate', async () => {
  const deploy = await readFile(
    new URL('../.github/workflows/deploy.yml', import.meta.url),
    'utf8'
  )
  assert.doesNotMatch(deploy, /content:freshness/)
})

test('production publishing reports progress on the merged notice pull request', async () => {
  const deploy = await readFile(
    new URL('../.github/workflows/deploy.yml', import.meta.url),
    'utf8'
  )

  assert.match(deploy, /listPullRequestsAssociatedWithCommit/)
  assert.match(deploy, /Production publishing is in progress/)
  assert.match(deploy, /Published and verified on the Official Venue/)
  assert.match(deploy, /Production publishing or public verification failed/)
})
