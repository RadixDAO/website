const CANONICAL_HOST = 'radixdao.org'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST
      return Response.redirect(url, 301)
    }

    return env.ASSETS.fetch(request)
  }
}
