import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createServer } from 'node:http'
import test from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

test('live deployment check verifies build identity, feed entry and permalink', async (context) => {
  const commit = '0123456789abcdef0123456789abcdef01234567'
  const slug = '2026-08-11-example'
  let origin
  const server = createServer((request, response) => {
    const url = new URL(request.url, origin)
    response.setHeader('Content-Type', 'application/json')

    if (url.pathname === '/build.json') {
      response.end(JSON.stringify({ commit }))
      return
    }
    if (url.pathname === '/notices.json') {
      response.end(
        JSON.stringify({ items: [{ url: `${origin}/notices/${slug}/` }] })
      )
      return
    }
    if (url.pathname === `/notices/${slug}/`) {
      response.setHeader('Content-Type', 'text/html')
      response.end('<h1>Example</h1>')
      return
    }

    response.statusCode = 404
    response.end('{}')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  context.after(() => server.close())
  const address = server.address()
  origin = `http://127.0.0.1:${address.port}`

  const result = await execFileAsync(
    process.execPath,
    ['scripts/check-live-deployment.mjs', origin, commit, slug],
    {
      cwd: new URL('..', import.meta.url),
      env: {
        ...process.env,
        LIVE_CHECK_ATTEMPTS: '1',
        LIVE_CHECK_INTERVAL_MS: '0'
      }
    }
  )

  assert.match(result.stdout, /Verified/)
})
