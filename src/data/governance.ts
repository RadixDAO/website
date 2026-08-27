import raw from './govern.json'

// The governance repository is the single source of truth; this site only ever
// points at it. Repository and ref live here once rather than being baked into
// every URL, so moving the repository (or pinning a document to an immutable
// ref) is one edit instead of thirty.
export const SOURCE = {
  repository: 'RadixDAO/governance-framework',
  ref: 'main'
} as const

export const repoHref = `https://github.com/${SOURCE.repository}`

/** Link to a file in the governance repository, at a pinned ref where given. */
export const sourceHref = (path: string, ref: string = SOURCE.ref) =>
  `${repoHref}/blob/${ref}/${path}`

/**
 * Historic versions live as PDFs in the repository's root `archive/` folder —
 * a superseded document is moved there rather than deleted, so an old copy can
 * always be found where its digest can still be checked.
 */
export const archiveHref = `${repoHref}/tree/${SOURCE.ref}/archive`

// An activated document is published as a PDF whose SHA-256 is recorded on-chain
// by the proposal that activated it. Until then it has no PDF and no digest —
// `pending` is the honest state for everything in the framework today, and the
// in-force treatment is driven entirely by data.
export type DocumentStatusValue = 'pending' | 'in-force'

/**
 * A version that has been replaced. The site shows only what is currently
 * operative, so these are never rendered — they exist so the verifier can tell
 * someone holding an old PDF that their copy is genuine but superseded, rather
 * than reporting it as unrecognised. Prior versions are found through the
 * governance repository's history or the Compliance Liaison.
 */
export interface SupersededVersion {
  id: string
  title: string
  version: string
  sha256: string
  /** Date the replacement took effect. */
  supersededOn: string
  /** Version that replaced it. */
  supersededBy: string
}

export interface DocumentPdf {
  /** Path at the root of the governance repository of record. */
  path: string
  /** Lowercase hex SHA-256 over the raw bytes of the PDF as published. */
  sha256: string
  bytes?: number
}

/**
 * The signed PDF a pending document was published as for the ratification
 * vote. Distinct from `pdf`: that field means "activated and in force", while
 * this one means "this exact file is what the proposal asks the community to
 * ratify". Its digest comes from the proposal's ratified manifest, and the
 * signature must chain to the certificate in `ratification.certificate`.
 */
export interface SignedPdf {
  /** Path within the governance repository (under pending/signed/). */
  path: string
  /** Lowercase hex SHA-256 over the raw bytes of the signed PDF. */
  sha256: string
  bytes?: number
  /** Version stated for this document in the ratified manifest. */
  version?: string
}

/**
 * The ratification proposal and the certificate its signed PDFs chain to. The
 * certificate is ratified with the manifest and stays the same across document
 * changes until it is explicitly renewed, so it lives here once rather than on
 * every document.
 */
export interface Ratification {
  proposal: string
  title: string
  /** Path of the proposal within the governance repository. */
  path: string
  certificate: {
    serialNumber: string
    thumbprintSha1: string
    fingerprintSha256: string
  }
}

export interface GovernanceDocument {
  id: string
  title: string
  summary?: string
  /**
   * The "start here" list is deliberately terser than the full index; where a
   * document appears in both, this is the line the shortlist uses.
   */
  shortSummary?: string
  /** Path to the Markdown source within the governance repository. */
  path: string
  status: DocumentStatusValue
  version?: string
  effective?: string
  /** Commit the PDF was rendered from — pins the source against a mutable ref. */
  commit?: string
  /** Radix transaction that recorded this document's digest on-chain. */
  transaction?: string
  pdf?: DocumentPdf
  signedPdf?: SignedPdf
}

interface GovernData {
  documents: GovernanceDocument[]
  superseded?: SupersededVersion[]
  shortlist: string[]
  companionGuides: string[]
  groups: { name: string; documents: string[] }[]
  ratification?: Ratification
}

const SHA256 = /^[0-9a-f]{64}$/
const STATUSES: DocumentStatusValue[] = ['pending', 'in-force']

// Validated at build time so a malformed entry fails the build rather than
// rendering a broken or — worse — a misleading row. An unverifiable digest on a
// page whose whole purpose is verification is the failure mode to prevent.
function validate(data: GovernData): GovernData {
  const seen = new Set<string>()

  for (const doc of data.documents) {
    if (seen.has(doc.id)) {
      throw new Error(`govern.json: duplicate document id "${doc.id}".`)
    }
    seen.add(doc.id)

    if (!STATUSES.includes(doc.status)) {
      throw new Error(
        `govern.json: "${doc.id}" has unknown status "${doc.status}". Expected one of ${STATUSES.join(', ')}.`
      )
    }
    if (doc.pdf && !SHA256.test(doc.pdf.sha256)) {
      throw new Error(
        `govern.json: "${doc.id}" has a malformed digest. Expected 64 lowercase hex characters.`
      )
    }
    if (doc.signedPdf && !SHA256.test(doc.signedPdf.sha256)) {
      throw new Error(
        `govern.json: "${doc.id}" has a malformed signed-PDF digest. Expected 64 lowercase hex characters.`
      )
    }
    if (doc.status === 'in-force' && !(doc.pdf && doc.version)) {
      throw new Error(
        `govern.json: "${doc.id}" is in-force but is missing its version or its pdf digest. An in-force document must be verifiable.`
      )
    }
  }

  for (const old of data.superseded ?? []) {
    if (!SHA256.test(old.sha256)) {
      throw new Error(
        `govern.json: superseded entry "${old.id}" v${old.version} has a malformed digest.`
      )
    }
  }

  for (const [field, ids] of [
    ['shortlist', data.shortlist],
    ['companionGuides', data.companionGuides],
    ...data.groups.map((g) => [`group "${g.name}"`, g.documents] as const)
  ] as [string, string[]][]) {
    for (const id of ids) {
      if (!seen.has(id)) {
        throw new Error(
          `govern.json: ${field} references unknown document id "${id}".`
        )
      }
    }
  }

  return data
}

const data = validate(raw as GovernData)

const byId = new Map(data.documents.map((d) => [d.id, d]))
const resolve = (id: string) => byId.get(id) as GovernanceDocument

// Ids are the only cross-reference in govern.json, so a document is described
// exactly once no matter how many places it appears.
export const shortlist = data.shortlist.map(resolve)
export const companionGuides = data.companionGuides.map(resolve)
export const groups = data.groups.map((g) => ({
  name: g.name,
  documents: g.documents.map(resolve)
}))

export const documents = data.documents
export const inForce = data.documents.filter((d) => d.status === 'in-force')
export const superseded = data.superseded ?? []

// Pending documents that have been published as signed PDFs for the
// ratification vote. Their digests are checkable now, before anything is in
// force — the proposal's manifest is the reference, not this site.
export const signedForRatification = data.documents.filter(
  (d) => d.status === 'pending' && d.signedPdf
)

export const ratification = data.ratification ?? null
export const ratificationHref = data.ratification
  ? sourceHref(data.ratification.path)
  : null

/** Public URL of an activated document's PDF, in the repository of record. */
export const pdfUrl = (doc: GovernanceDocument) =>
  doc.pdf ? `${repoHref}/raw/${doc.commit ?? SOURCE.ref}/${doc.pdf.path}` : null

/** Public URL of the signed PDF published for the ratification vote. */
export const signedPdfUrl = (doc: GovernanceDocument) =>
  doc.signedPdf ? `${repoHref}/raw/${SOURCE.ref}/${doc.signedPdf.path}` : null

/** Markdown source link, pinned to the activating commit once one exists. */
export const markdownUrl = (doc: GovernanceDocument) =>
  sourceHref(doc.path, doc.commit ?? SOURCE.ref)

/** First 16 hex characters — enough to eyeball, never enough to verify with. */
export const shortDigest = (sha256: string) => sha256.slice(0, 16)
