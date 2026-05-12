import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const getAuthHeaders = () => {
  // Keep consistent with the rest of the app: token is stored inside `localStorage.user`
  const token = (() => {
    try {
      const raw = localStorage.getItem('user')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.token ?? null
    } catch {
      return null
    }
  })()
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'Content-Type': 'application/json'
  }
}

export interface Lawyer {
  _id: string
  first_name: string
  last_name: string
  email: string
  account_type: 'lawyer'
}

export interface Client {
  _id: string
  first_name: string
  last_name: string
  email: string
  account_type: 'client'
}

export type ShareableUser = Lawyer | Client

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

/**
 * Get all available lawyers to share documents with
 */
export async function getAvailableLawyers(): Promise<Lawyer[]> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/lawyers`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch lawyers')
    }

    return response.data.data || []
  } catch (error) {
    console.error('Error fetching lawyers:', error)
    throw error
  }
}

/**
 * Get all available clients to share documents with
 */
export async function getAvailableClients(): Promise<Client[]> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/clients-list`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch clients')
    }

    return response.data.clients || []
  } catch (error) {
    console.error('Error fetching clients:', error)
    throw error
  }
}

/**
 * Get all shareable users (clients + lawyers).
 * The backend share/unshare endpoints should accept any user id; the UI should not be role-limited.
 */
export async function getAvailableUsers(): Promise<ShareableUser[]> {
  const [lawyers, clients] = await Promise.allSettled([getAvailableLawyers(), getAvailableClients()])

  const merged: ShareableUser[] = []
  const seen = new Set<string>()

  for (const result of [lawyers, clients]) {
    if (result.status !== 'fulfilled') continue
    for (const u of result.value || []) {
      if (!u?._id || seen.has(u._id)) continue
      seen.add(u._id)
      merged.push(u)
    }
  }

  return merged
}

/**
 * Share a document with specific lawyers
 */
export async function shareDocumentWithLawyers({
  documentId,
  userIds,
  userId
}: ShareDocumentRequest): Promise<any> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/document/${documentId}/share`,
      {
        userId,
        userIds
      },
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to share document')
    }

    return response.data.document
  } catch (error) {
    console.error('Error sharing document:', error)
    throw error
  }
}

/**
 * Unshare a document from a specific lawyer
 */
export async function unshareDocumentFromLawyer({
  documentId,
  lawyerId,
  userId
}: UnshareDocumentRequest): Promise<any> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/document/${documentId}/unshare`,
      {
        userId: lawyerId, // Pass target user as userId to avoid removing the owner
        lawyerId: lawyerId
      },
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to unshare document')
    }

    return response.data.document
  } catch (error) {
    console.error('Error unsharing document:', error)
    throw error
  }
}

/**
 * Get document sharing details
 */
export async function getDocumentSharingDetails(documentId: string): Promise<any> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/document/${documentId}`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get document details')
    }

    return response.data.document
  } catch (error) {
    console.error('Error getting document details:', error)
    throw error
  }
}
