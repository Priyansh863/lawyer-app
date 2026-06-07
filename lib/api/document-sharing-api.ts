import axios from 'axios'
import { normalizeDocumentPrivacy, type DocumentPrivacy } from '@/lib/document-privacy'

function getBearerToken(): string | null {
  if (typeof window === 'undefined') return null
  const direct = localStorage.getItem('token')
  if (direct) return direct
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const fromRoot = parsed.token ?? parsed.access_token
    if (fromRoot && typeof fromRoot === 'string') return fromRoot
    const ud = parsed.userData
    if (ud && typeof ud === 'object' && !Array.isArray(ud)) {
      const t = (ud as Record<string, unknown>).token
      if (typeof t === 'string') return t
    }
    const data = parsed.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const d = data as Record<string, unknown>
      if (typeof d.token === 'string') return d.token
      const inner = d.userData
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        const t = (inner as Record<string, unknown>).token
        if (typeof t === 'string') return t
      }
    }
    return null
  } catch {
    return null
  }
}

type AppRole = 'lawyer' | 'client' | null

function resolveAccountRole(user: Record<string, unknown> | null): AppRole {
  if (!user) return null
  const raw =
    user.account_type ??
    user.accountType ??
    user.user_type ??
    user.role
  const s = String(raw ?? '').toLowerCase().trim()
  if (s === 'lawyer' || s === 'attorney') return 'lawyer'
  if (s === 'client') return 'client'
  return null
}

function parseStoredUser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const ud = parsed.userData
    if (ud && typeof ud === 'object' && !Array.isArray(ud)) {
      return { ...parsed, ...(ud as Record<string, unknown>) }
    }
    const data = parsed.data
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const d = data as Record<string, unknown>
      const inner = d.userData
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
        return { ...parsed, ...(inner as Record<string, unknown>) }
      }
    }
    return parsed
  } catch {
    return null
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const getAuthHeaders = () => {
  const token = getBearerToken()
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  }
}

export type DefaultGrantPool = 'own_clients' | 'own_lawyers' | 'all_users'

export interface ShareableUser {
  _id: string
  first_name: string
  last_name: string
  email: string
  account_type?: 'lawyer' | 'client' | string
  profile_image?: string
  /** Linked via Case: client assigned to this lawyer */
  is_own_client?: boolean
  /** Linked via Case: lawyer assigned to this client */
  is_own_lawyer?: boolean
  relationship?: string
}

export interface ShareDocumentRequest {
  documentId: string
  userIds: string[]
  userId: string
}

export interface UnshareDocumentRequest {
  documentId: string
  lawyerId: string
  userId: string
}

export type DocumentPrivacyLevel = DocumentPrivacy

export interface DocumentAccessDetails {
  document: {
    _id: string
    document_name?: string
    privacy?: DocumentPrivacyLevel
    shared_with?: ShareableUser[]
    uploaded_by?: ShareableUser | string
    owner?: ShareableUser
  }
  owner: ShareableUser | null
  hasAccessCount: number | null
  doesNotHaveAccessCount: number | null
  grantableUsers: ShareableUser[]
  allowShareWithAnyRegisteredUser: boolean
  defaultGrantPool: DefaultGrantPool
  lastVerifiedAt: string
}

function normalizeUser(row: any): ShareableUser | null {
  if (!row?._id) return null
  return {
    _id: String(row._id),
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    email: row.email || '',
    account_type: row.account_type,
    profile_image: row.profile_image,
    is_own_client: Boolean(row.is_own_client ?? row.isOwnClient),
    is_own_lawyer: Boolean(row.is_own_lawyer ?? row.isOwnLawyer),
    relationship: row.relationship ? String(row.relationship) : undefined,
  }
}

function pickUserList(value: unknown): ShareableUser[] {
  if (!Array.isArray(value)) return []
  return value.map(normalizeUser).filter(Boolean) as ShareableUser[]
}

function parseDefaultGrantPool(raw: unknown): DefaultGrantPool {
  const s = String(raw ?? '').toLowerCase().trim()
  if (s === 'own_clients') return 'own_clients'
  if (s === 'own_lawyers') return 'own_lawyers'
  return 'all_users'
}

function extractUserRows(body: Record<string, unknown>): unknown[] {
  const candidates = [body.data, body.users, body.clients, body.lawyers, body.results]
  for (const c of candidates) {
    if (Array.isArray(c)) return c
  }
  return []
}

/** Search any registered platform user (manual grant — not limited to default pool). */
export async function searchRegisteredUsersForSharing(
  query: string,
  options?: { excludeIds?: string[]; limit?: number }
): Promise<ShareableUser[]> {
  const headers = getAuthHeaders()
  if (!headers.Authorization) throw new Error('Not authenticated')

  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const exclude = new Set(options?.excludeIds ?? [])
  const max = options?.limit ?? 20
  const selfId = String(parseStoredUser()?._id ?? '')

  const response = await axios.get(`${API_BASE_URL}/user/list`, {
    headers,
    params: { limit: 100, offset: 0 },
  })
  const body = response.data as Record<string, unknown>
  if (body.success === false) {
    throw new Error(String(body.message || 'Failed to search users'))
  }

  const rows = extractUserRows(body)
  const matched = rows
    .map(normalizeUser)
    .filter(Boolean)
    .filter((u) => {
      const user = u as ShareableUser
      if (exclude.has(user._id) || user._id === selfId) return false
      const hay = `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase()
      return hay.includes(q)
    }) as ShareableUser[]

  return matched.slice(0, max)
}

function pickUsers(body: Record<string, unknown>): ShareableUser[] {
  const raw =
    body.grantable_users ??
    body.grantableUsers ??
    body.clients ??
    body.lawyers ??
    body.users ??
    body.data
  return pickUserList(raw)
}

/** Users the current role may grant access to (lawyer → clients, client → lawyers). */
export async function getGrantableUsers(): Promise<ShareableUser[]> {
  const role = resolveAccountRole(parseStoredUser())
  const headers = getAuthHeaders()
  if (!headers.Authorization) throw new Error('Not authenticated')

  if (role === 'lawyer') {
    const response = await axios.get(`${API_BASE_URL}/user/clients-list`, { headers })
    const body = response.data as Record<string, unknown>
    if (body.success === false) throw new Error(String(body.message || 'Failed to fetch clients'))
    return pickUsers(body)
  }

  if (role === 'client') {
    const response = await axios.get(`${API_BASE_URL}/charges/lawyers-with-charges`, { headers })
    const body = response.data as Record<string, unknown>
    if (body.success === false) throw new Error(String(body.message || 'Failed to fetch lawyers'))
    return pickUsers(body)
  }

  return []
}

/** @deprecated Use getGrantableUsers */
export async function getAvailableLawyers(): Promise<ShareableUser[]> {
  const headers = getAuthHeaders()
  const response = await axios.get(`${API_BASE_URL}/charges/lawyers-with-charges`, { headers })
  const body = response.data as Record<string, unknown>
  return pickUsers(body)
}

/** @deprecated Use getGrantableUsers */
export async function getAvailableClients(): Promise<ShareableUser[]> {
  const headers = getAuthHeaders()
  const response = await axios.get(`${API_BASE_URL}/user/clients-list`, { headers })
  const body = response.data as Record<string, unknown>
  return pickUsers(body)
}

/** @deprecated Use getGrantableUsers */
export async function getAvailableUsers(): Promise<ShareableUser[]> {
  return getGrantableUsers()
}

export async function getDocumentAccessDetails(
  documentId: string,
  fallback?: {
    document_name?: string
    privacy?: string
    shared_with?: any[]
    uploaded_by?: any
  }
): Promise<DocumentAccessDetails> {
  const lastVerifiedAt = new Date().toISOString()

  try {
    const response = await axios.get(
      `${API_BASE_URL}/document/${documentId}/access-details`,
      {
        headers: getAuthHeaders(),
        timeout: 60000,
      }
    )
    const data = response.data as Record<string, unknown>
    if (data.success === false) throw new Error(String(data.message || 'Failed to load access details'))

    const doc = (data.document ?? data.data ?? data) as Record<string, unknown>
    const shared = pickUserList(data.shared_with ?? doc.shared_with)
    const grantable = pickUserList(data.grantable_users ?? data.grantableUsers)
    const owner =
      normalizeUser(data.owner) ||
      normalizeUser(doc.owner) ||
      normalizeUser(doc.uploaded_by)

    const docPrivacy = normalizeDocumentPrivacy(doc.privacy ?? fallback?.privacy)
    const rawHasAccess = data.has_access_count ?? data.hasAccessCount
    const rawDoesNotHave =
      data.does_not_have_access_count ?? data.doesNotHaveAccessCount

    const hasAccess =
      docPrivacy === 'public' && (rawHasAccess === null || rawHasAccess === undefined)
        ? null
        : Number(rawHasAccess ?? shared.length)
    const doesNotHave =
      docPrivacy === 'public' && (rawDoesNotHave === null || rawDoesNotHave === undefined)
        ? null
        : Number(rawDoesNotHave ?? grantable.length)

    return {
      document: {
        _id: String(doc._id || documentId),
        document_name: String(doc.document_name || fallback?.document_name || ''),
        privacy: normalizeDocumentPrivacy(doc.privacy ?? fallback?.privacy),
        shared_with: shared,
        uploaded_by: doc.uploaded_by as any,
      },
      owner,
      hasAccessCount: hasAccess,
      doesNotHaveAccessCount: doesNotHave,
      grantableUsers: grantable,
      allowShareWithAnyRegisteredUser: Boolean(
        data.allow_share_with_any_registered_user ??
          data.allowShareWithAnyRegisteredUser ??
          true
      ),
      defaultGrantPool: parseDefaultGrantPool(
        data.default_grant_pool ?? data.defaultGrantPool
      ),
      lastVerifiedAt: String(
        data.last_verified_at ?? data.lastVerifiedAt ?? lastVerifiedAt
      ),
    }
  } catch (err) {
    console.warn('[getDocumentAccessDetails] falling back:', err)
    const sharedRaw = fallback?.shared_with || []
    const shared = sharedRaw
      .map((u) => (typeof u === 'string' ? null : normalizeUser(u)))
      .filter(Boolean) as ShareableUser[]
    const grantable = await loadGrantableExcluding(shared)
    const owner =
      normalizeUser(fallback?.uploaded_by) ||
      normalizeUser(parseStoredUser())

    return {
      document: {
        _id: documentId,
        document_name: fallback?.document_name,
        privacy: (fallback?.privacy as DocumentPrivacyLevel) || 'private',
        shared_with: shared,
      },
      owner,
      hasAccessCount: shared.length,
      doesNotHaveAccessCount: grantable.length,
      grantableUsers: grantable,
      allowShareWithAnyRegisteredUser: true,
      defaultGrantPool: resolveAccountRole(parseStoredUser()) === 'lawyer'
        ? 'own_clients'
        : resolveAccountRole(parseStoredUser()) === 'client'
          ? 'own_lawyers'
          : 'all_users',
      lastVerifiedAt,
    }
  }
}

async function loadGrantableExcluding(
  shared: ShareableUser[]
): Promise<ShareableUser[]> {
  const sharedIds = new Set(shared.map((u) => u._id))
  const all = await getGrantableUsers()
  return all.filter((u) => !sharedIds.has(u._id))
}

export async function updateDocumentPrivacy(
  documentId: string,
  privacy: DocumentPrivacyLevel
): Promise<any> {
  const headers = getAuthHeaders()
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/document/${documentId}/privacy`,
      { privacy },
      { headers }
    )
    if (response.data?.success === false) {
      throw new Error(response.data.message || 'Failed to update privacy')
    }
    return response.data.document ?? response.data.data ?? response.data
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      const response = await axios.put(
        `${API_BASE_URL}/document/${documentId}`,
        { privacy },
        { headers }
      )
      if (response.data?.success === false) {
        throw new Error(response.data.message || 'Failed to update privacy')
      }
      return response.data.document ?? response.data.data ?? response.data
    }
    throw err
  }
}

export async function shareDocumentWithLawyers({
  documentId,
  userIds,
}: Omit<ShareDocumentRequest, 'userId'> & { userId?: string }): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/document/${documentId}/share`,
    { userIds },
    { headers: getAuthHeaders() }
  )
  if (response.data?.success === false) {
    throw new Error(response.data.message || 'Failed to share document')
  }
  return response.data.document ?? response.data
}

export async function grantDocumentAccess(
  documentId: string,
  userIds: string[],
  _actorUserId?: string
): Promise<any> {
  if (!userIds.length) return null
  return shareDocumentWithLawyers({ documentId, userIds })
}

export async function unshareDocumentFromLawyer({
  documentId,
  lawyerId,
  userId,
}: UnshareDocumentRequest): Promise<any> {
  const response = await axios.post(
    `${API_BASE_URL}/document/${documentId}/unshare`,
    { userId: lawyerId, lawyerId },
    { headers: getAuthHeaders() }
  )
  if (response.data?.success === false) {
    throw new Error(response.data.message || 'Failed to revoke access')
  }
  return response.data.document ?? response.data
}

export async function revokeDocumentAccess(
  documentId: string,
  targetUserId: string,
  actorUserId: string
): Promise<any> {
  return unshareDocumentFromLawyer({
    documentId,
    lawyerId: targetUserId,
    userId: actorUserId,
  })
}

export async function getDocumentSharingDetails(documentId: string): Promise<any> {
  const response = await axios.get(`${API_BASE_URL}/document/${documentId}`, {
    headers: getAuthHeaders(),
  })
  if (response.data?.success === false) {
    throw new Error(response.data.message || 'Failed to get document details')
  }
  return response.data.document ?? response.data.data ?? response.data
}
