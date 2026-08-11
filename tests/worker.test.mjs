import assert from 'node:assert/strict'
import test from 'node:test'
import worker from '../worker/index.js'

test('www permanently redirects to the canonical apex and preserves the URL', async () => {
  const response = await worker.fetch(
    new Request('https://www.radixdao.org/notices/example/?source=feed'),
    { ASSETS: { fetch: () => assert.fail('redirect must run before assets') } }
  )

  assert.equal(response.status, 301)
  assert.equal(
    response.headers.get('location'),
    'https://radixdao.org/notices/example/?source=feed'
  )
})

test('canonical requests are delegated to static assets unchanged', async () => {
  const request = new Request('https://radixdao.org/notices/')
  const expected = new Response('assets')
  const response = await worker.fetch(request, {
    ASSETS: {
      fetch(received) {
        assert.equal(received, request)
        return expected
      }
    }
  })

  assert.equal(response, expected)
})
