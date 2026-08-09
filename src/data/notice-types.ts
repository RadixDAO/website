// Single source of truth for notice types, shared between the content schema's
// enum (src/content.config.ts) and the pages that list/filter by type.
export const NOTICE_TYPES = [
  { value: 'activation-statement', label: 'Activation statement' },
  { value: 'council-resolution', label: 'Council resolution' },
  { value: 'advisory-acknowledgement', label: 'Advisory acknowledgement' },
  { value: 'vacancy-notice', label: 'Vacancy notice' },
  { value: 'reduced-quorum-notice', label: 'Reduced-quorum activation notice' },
  { value: 'identifier-register-change', label: 'Identifier register change' },
  { value: 'compliance-challenge', label: 'Compliance challenge' },
  {
    value: 'regulatory-demand-notice',
    label: 'Regulatory or legal demand notice'
  },
  { value: 'status-report', label: 'Status report' },
  { value: 'prior-disclosure-notice', label: 'Prior-disclosure notice' },
  { value: 'delegate-statement', label: 'Delegate statement' },
  {
    value: 'registry-update',
    label: 'Working Group / repository registry update'
  }
] as const

export type NoticeType = (typeof NOTICE_TYPES)[number]['value']

export function noticeTypeLabel(value: string): string {
  return NOTICE_TYPES.find((t) => t.value === value)?.label ?? value
}
