import { getCollection } from 'astro:content'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { noticeTypeLabel } from '../../data/notice-types'

export async function GET(context: APIContext) {
  const notices = (await getCollection('notices')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  return rss({
    title: 'Radix DAO — Notices & Records',
    description:
      "The DAO's official record of notices, resolutions, and filings.",
    site: context.site ?? 'https://www.radixdao.org',
    items: notices.map((notice) => ({
      title: notice.data.title,
      pubDate: notice.data.pubDate,
      link: `/notices/${notice.id}/`,
      categories: [noticeTypeLabel(notice.data.type)]
    }))
  })
}
