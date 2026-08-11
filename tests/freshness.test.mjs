import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

test('an upstream fetch failure is reported distinctly from content drift', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/check-content-freshness.mjs'],
    {
      cwd: new URL('..', import.meta.url),
      encoding: 'utf8',
      env: {
        ...process.env,
        CONTENT_SOURCE_RAW_ORIGIN: 'http://127.0.0.1:1'
      }
    }
  )

  assert.equal(result.status, 2)
  assert.match(result.stderr, /could not be verified/i)
  assert.match(result.stderr, /not evidence that content drifted/i)
  assert.doesNotMatch(result.stderr, /Pinned governance content does not match/)
})
