#!/usr/bin/env node
const origin = new URL(process.argv[2] ?? 'https://radixdao.org')
const expectedCommit = process.argv[3]
const slugs = (process.argv[4] ?? '').split(',').filter(Boolean)
const attempts = Number(process.env.LIVE_CHECK_ATTEMPTS ?? 10)
const interval = Number(process.env.LIVE_CHECK_INTERVAL_MS ?? 6000)

if (!expectedCommit) {
  throw new Error(
    'Usage: check-live-deployment.mjs <origin> <expected-commit> [comma-separated-slugs]'
  )
}

let lastError
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await verifyLiveDeployment()
    console.log(
      `Verified ${origin.origin} at ${expectedCommit}${slugs.length ? ` with ${slugs.length} new notice(s)` : ''}.`
    )
    process.exit(0)
  } catch (error) {
    lastError = error
    if (attempt < attempts) {
      console.warn(`Live check ${attempt}/${attempts} failed: ${error.message}`)
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }
}

throw new Error(
  `The production origin did not expose the expected deployment after ${attempts} attempts: ${lastError?.message}`
)

async function verifyLiveDeployment() {
  await verifyCanonicalRedirect()
  const build = await fetchJson('/build.json')
  if (build.commit !== expectedCommit) {
    throw new Error(
      `/build.json reports ${build.commit ?? 'no commit'}, expected ${expectedCommit}`
    )
  }

  const feed = await fetchJson('/notices.json')
  if (!Array.isArray(feed.items)) {
    throw new Error('/notices.json does not contain an items array')
  }

  for (const slug of slugs) {
    const permalink = new URL(`/notices/${slug}/`, origin).toString()
    if (!feed.items.some((item) => item.url === permalink)) {
      throw new Error(`/notices.json does not contain ${permalink}`)
    }
    await fetchOk(`/notices/${slug}/`)
  }
}

async function verifyCanonicalRedirect() {
  // Local integration tests use HTTP and have no sibling www hostname.
  if (origin.protocol !== 'https:' || origin.hostname.startsWith('www.')) return

  const source = new URL(origin)
  source.hostname = `www.${origin.hostname}`
  source.searchParams.set('publishing_check', Date.now().toString())
  const response = await fetch(source, {
    headers: { 'Cache-Control': 'no-cache' },
    redirect: 'manual',
    signal: AbortSignal.timeout(15000)
  })
  const expected = new URL(source.pathname + source.search, origin).toString()

  if (
    response.status !== 301 ||
    response.headers.get('location') !== expected
  ) {
    throw new Error(
      `${source.hostname} did not permanently redirect to ${expected}`
    )
  }
}

async function fetchJson(pathname) {
  const response = await fetchOk(pathname)
  try {
    return await response.json()
  } catch {
    throw new Error(`${pathname} did not return valid JSON`)
  }
}

async function fetchOk(pathname) {
  const url = new URL(pathname, origin)
  url.searchParams.set('publishing_check', Date.now().toString())
  const response = await fetch(url, {
    headers: { 'Cache-Control': 'no-cache' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000)
  })
  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}`)
  }
  return response
}
