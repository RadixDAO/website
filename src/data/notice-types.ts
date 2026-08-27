// Single source of truth for notice types, shared between the content schema's
// enum (src/content.config.ts), the pages that list/filter by type, and the
// generated issue form (scripts/generate-notice-form.mjs).
//
// The categories are deliberately broad. A filer should never have to guess
// between two near-identical labels, so each one collects a family of related
// items and the description says which — that description is published on the
// type page, so it is the definition a reader gets too.
export const NOTICE_TYPES = [
  {
    value: 'resolutions-and-decisions',
    label: 'Resolutions & decisions',
    description:
      'Council resolutions, routine decisions, function allocations, and the Activation Statement.'
  },
  {
    value: 'reports-and-records',
    label: 'Reports & records',
    description:
      'Minutes of meetings, status reports, quarterly accountability reports, and post-deployment reports.'
  },
  {
    value: 'process-notices',
    label: 'Process notices',
    description:
      'Reduced-quorum activations, advisory acknowledgements, vote result determinations, pre-action and advance notices, and compliance challenge publications.'
  },
  {
    value: 'roles-and-seats',
    label: 'Roles & seats',
    description:
      'Vacancy notices, seatings, resignations, and delegate statements.'
  },
  {
    value: 'registry-updates',
    label: 'Registry updates',
    description:
      'Changes to the identifier register, the repository registry, and the Working Group registry.'
  },
  {
    value: 'legal-and-compliance',
    label: 'Legal & compliance',
    description:
      'Regulatory and legal demand notices, and emergency action disclosures.'
  }
] as const

export type NoticeType = (typeof NOTICE_TYPES)[number]['value']

export function noticeTypeLabel(value: string): string {
  return NOTICE_TYPES.find((t) => t.value === value)?.label ?? value
}
