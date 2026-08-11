import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

test('issue form generation preserves body content and stamps a valid server time', async () => {
  const childEnvironment = { ...process.env }
  delete childEnvironment.GITHUB_OUTPUT
  const directory = await mkdtemp(path.join(tmpdir(), 'radix-notice-test-'))
  const eventPath = path.join(directory, 'event.json')
  const body = [
    '### Notice type',
    '',
    'Status report (status-report)',
    '',
    '### Notice title',
    '',
    'A measured update',
    '',
    '### Body',
    '',
    '  leading spaces stay  ',
    '',
    'Second paragraph.',
    '',
    '### Notice date',
    '',
    '_No response_',
    '',
    '### Verbatim publication',
    '',
    'Yes',
    '',
    '### Supersedes',
    '',
    '_No response_'
  ].join('\n')

  await writeFile(eventPath, JSON.stringify({ issue: { number: 42, body } }))
  const { stdout } = await execFileAsync(
    process.execPath,
    ['scripts/create-notice-from-issue.mjs', eventPath],
    {
      cwd: new URL('..', import.meta.url),
      env: { ...childEnvironment, NOTICE_OUTPUT_DIRECTORY: directory }
    }
  )
  const result = JSON.parse(stdout)
  const notice = await readFile(
    path.join(directory, `${result.slug}.md`),
    'utf8'
  )

  assert.match(notice, /pubDate: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/)
  assert.match(notice, /verbatim: true/)
  assert.ok(notice.endsWith('  leading spaces stay  \n\nSecond paragraph.'))

  const lint = await execFileAsync(
    process.execPath,
    ['scripts/lint-notices.mjs', `--directory=${directory}`],
    { cwd: new URL('..', import.meta.url) }
  )
  assert.match(lint.stdout, /Validated 1 notice file/)
})
