/** Document visibility: only `public` | `private` (legacy `fully_private` maps to `private`). */
export type DocumentPrivacy = 'public' | 'private'

export function normalizeDocumentPrivacy(raw: unknown): DocumentPrivacy {
  const s = String(raw ?? '')
    .toLowerCase()
    .trim()
    .replace(/-/g, '_')
  if (s === 'public' || s === 'public_shared') return 'public'
  // fully_private and private both use private access rules in the app
  return 'private'
}

export function isPrivateDocumentPrivacy(raw: unknown): boolean {
  return normalizeDocumentPrivacy(raw) === 'private'
}
