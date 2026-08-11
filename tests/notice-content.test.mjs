import assert from 'node:assert/strict'
import test from 'node:test'
import {
  loadNoticeTypes,
  parseNoticeFile,
  publicationTimeWarning,
  validateNoticeData
} from '../scripts/lib/notice-content.mjs'

test('plain-language validation lists every allowed notice type', async () => {
  const allowedTypes = await loadNoticeTypes()
  const errors = validateNoticeData({
    data: {
      type: 'council resolution',
      title: 'Example',
      pubDate: '2026-08-11T14:30:00Z'
    },
    file: 'src/content/notices/example.md',
    allowedTypes
  })

  assert.equal(allowedTypes.length, 12)
  assert.match(errors[0], /field "type"/)
  for (const { value } of allowedTypes)
    assert.match(errors[0], new RegExp(value))
})

test('timestamp validation shows the required UTC format and example', async () => {
  const errors = validateNoticeData({
    data: { type: 'status-report', title: 'Example', pubDate: 'tomorrow' },
    file: 'example.md',
    allowedTypes: await loadNoticeTypes()
  })

  assert.match(errors.join('\n'), /YYYY-MM-DDTHH:MM:SSZ/)
  assert.match(errors.join('\n'), /2026-08-11T14:30:00Z/)
})

test('publication time warns outside the agreed 15-minute window', () => {
  const referenceTime = new Date('2026-08-11T14:30:00Z')
  assert.equal(
    publicationTimeWarning({
      pubDate: '2026-08-11T14:45:00Z',
      referenceTime,
      file: 'example.md'
    }),
    null
  )
  assert.match(
    publicationTimeWarning({
      pubDate: '2026-08-11T14:46:00Z',
      referenceTime,
      file: 'example.md'
    }),
    /16 minutes after/
  )
})

test('frontmatter parser preserves notice body whitespace', () => {
  const source = `---\ntype: status-report\ntitle: "Example"\npubDate: 2026-08-11T14:30:00Z\n---\n\n  exact body  \nsecond line`
  const parsed = parseNoticeFile(source, 'example.md')

  assert.equal(parsed.error, null)
  assert.equal(parsed.body, '\n  exact body  \nsecond line')
})
