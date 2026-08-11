import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'
import { noticeTypeLabel } from '../data/notice-types'

// JSON Feed 1.1 (https://www.jsonfeed.org/version/1.1/) — the machine-readable
// counterpart to the RSS feed, so third parties can archive the record
// without scraping HTML (§7.6).
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL('https://radixdao.org'))
    .toString()
    .replace(/\/$/, '')
  const notices = (await getCollection('notices')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Radix DAO — Notices & Records',
    home_page_url: `${site}/notices/`,
    feed_url: `${site}/notices.json`,
    description:
      "The DAO's official record of notices, resolutions, and filings.",
    items: notices.map((notice) => ({
      id: `${site}/notices/${notice.id}/`,
      url: `${site}/notices/${notice.id}/`,
      title: notice.data.title,
      date_published: notice.data.pubDate.toISOString(),
      tags: [noticeTypeLabel(notice.data.type)],
      _radix_dao: {
        type: notice.data.type,
        notice_date: notice.data.noticeDate?.toISOString() ?? null,
        supersedes: notice.data.supersedes ?? null,
        verbatim: notice.data.verbatim
      }
    }))
  }

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' }
  })
}
