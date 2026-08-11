import type { APIContext } from 'astro'

export function GET(_context: APIContext) {
  return new Response(
    JSON.stringify({
      commit: import.meta.env.PUBLIC_BUILD_SHA ?? 'development'
    }),
    {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      }
    }
  )
}
