import type { Client, ClientStatus } from "@/types/client"

function normalizeClientStatus(raw: unknown): ClientStatus {
  const s = String(raw ?? "")
    .toLowerCase()
    .trim()
  if (s === "inactive") return "inactive"
  if (s === "pending") return "pending"
  return "active"
}
import type { Case } from "@/types/case"
import axios from "axios"

// Keep in sync with the backend used by cases/documents (commonly :3001 in dev).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {}

  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Helper function to get current user from localStorage
const getCurrentUser = () => {
  if (typeof window === 'undefined') return null

  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

interface GetClientsParams {
  status?: ClientStatus | "all"
  query?: string
  page?: number
  limit?: number
}

/**
 * Get clients or lawyers based on current user's role
 * If user is lawyer -> show clients
 * If user is client -> show lawyers
 */
export async function getClients({
  status = "all",
  query = "",
  page = 1,
  limit = 50,
}: GetClientsParams = {}) {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    // Determine what type of users to fetch based on current user's role
    let accountType: string
    if (currentUser.account_type === 'lawyer') {
      accountType = 'client' // Lawyers see clients
    } else if (currentUser.account_type === 'client') {
      accountType = 'lawyer' // Clients see lawyers
    } else {
      accountType = 'client' // Default to clients for admin/other roles
    }

    const offset = (page - 1) * limit

    // If client is viewing lawyers, use the lawyers-with-charges endpoint
    let response
    if (currentUser.account_type === 'client' && accountType === 'lawyer') {
      response = await axios.get(`${API_BASE_URL}/charges/lawyers-with-charges`, {
        headers: getAuthHeaders()
      })
    } else {
      response = await axios.get(`${API_BASE_URL}/user/list`, {
        headers: getAuthHeaders(),
        params: {
          account_type: accountType,
          offset,
          limit
        }
      })
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch users')
    }

    // Transform backend response to match Client interface
    const users = (currentUser.account_type === 'client' && accountType === 'lawyer')
      ? response.data.lawyers || []
      : response.data.data || response.data.clients || []

    const transformedClients: Client[] = users.map((user: any) => ({
      id: user._id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || 'N/A',
      address: user.address || 'N/A',
      status: normalizeClientStatus(
        user.status ?? user.client_status ?? user.account_status
      ),
      createdAt: user.created_at || new Date().toISOString(),
      lastContactDate: user.updated_at || user.created_at || new Date().toISOString(),
      caseId: '', // Will be populated if needed
      contactInfo: user.bio || '',
      activeCases: 0, // Will be populated if needed
      isFavorite: false,
      isBlocked: false,
      // Additional fields from backend
      account_type: user.account_type,
      _id: user._id,
      // Include charges for lawyers
      charges: user.charges || 0,
      video_rate: user.video_rate || 0,
      chat_rate: user.chat_rate || 0,
      pratice_area: user.pratice_area,
      experience: user.experience
    }))

    // Apply client-side filtering if needed
    let filteredClients = transformedClients

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredClients = filteredClients.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery) ||
          (c.phone && c.phone.includes(lowerQuery))
      )
    }

    return filteredClients
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * Get a client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  try {
    // Backend exposes user details via /user/info/:id (not /user/:id)
    const response = await axios.get(`${API_BASE_URL}/user/info/${id}`, {
      headers: getAuthHeaders()
    })

    if (!response.data.success) {
      return null
    }

    const user = response.data.data
    return {
      id: user._id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || 'N/A',
      address: user.address || 'N/A',
      status: 'active' as ClientStatus,
      createdAt: user.created_at || new Date().toISOString(),
      lastContactDate: user.updated_at || user.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: user.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked: false,
      account_type: user.account_type,
      _id: user._id
    }
  } catch (error) {
    console.error('Error fetching client by ID:', error)
    return null
  }
}

/**
 * Fetch a user's profile via the existing update endpoint.
 * Some deployments return the full profile only from this route.
 */
export async function getUserProfileViaUpdate(id: string): Promise<any | null> {
  try {
    const response = await axios.put(`${API_BASE_URL}/user/update/${id}`, {}, {
      headers: getAuthHeaders()
    })

    const data = response.data
    if (!data) return null
    if (data.success === false) return null
    // Support common shapes: {success, data}, or direct user object
    return data.data || data.user || data
  } catch (error) {
    console.error('Error fetching user via update endpoint:', error)
    return null
  }
}

/**
 * Get only the contact info we need for Case Details.
 * Uses the provided update endpoint first, then falls back to GET /user/:id
 * when some fields (commonly `email`) are not returned by the update endpoint.
 */
export async function getClientContactForCaseDetails(id: string): Promise<{ email?: string | null; phone?: string | null } | null> {
  const viaUpdate = await getUserProfileViaUpdate(id)
  // Some backends return phone/email with different key casing or nesting.
  const v: any = viaUpdate || {}
  const emailFromUpdate =
    v?.email ??
    v?.Email ??
    v?.user?.email ??
    v?.contact?.email ??
    null
  const phoneFromUpdate =
    v?.phone ??
    v?.Phone ??
    v?.mobile ??
    v?.phone_number ??
    v?.user?.phone ??
    v?.contact?.phone ??
    null

  // Helpful for debugging "N/A" issues in Case Details.
  console.log("[getClientContactForCaseDetails] viaUpdate parsed:", {
    id,
    emailFromUpdate,
    phoneFromUpdate,
    rawKeys: v ? Object.keys(v) : [],
  })

  // If update endpoint already provides at least one useful field, keep it,
  // but fall back to /user/:id for missing email.
  if (emailFromUpdate || phoneFromUpdate) {
    if (emailFromUpdate) return { email: emailFromUpdate, phone: phoneFromUpdate }
    const viaGet = await getClientById(id)
    return { email: (viaGet as any)?.email ?? null, phone: phoneFromUpdate }
  }

  // If update endpoint provides nothing, fallback to /user/:id entirely.
  const viaGet = await getClientById(id)
  if (!viaGet) return null
  return { email: (viaGet as any)?.email ?? null, phone: (viaGet as any)?.phone ?? null }
}

// Placeholder functions for backward compatibility
export async function toggleFavorite(id: string, isFavorite: boolean): Promise<Client> {
  // This would be implemented when needed
  throw new Error('Not implemented')
}

/**
 * Toggle blocked status of a client
 */
export async function toggleBlocked(id: string, isBlocked: boolean): Promise<Client> {
  try {
    const response = await axios.patch(`${API_BASE_URL}/user/${id}`, {
      isBlocked,
    }, {
      headers: getAuthHeaders(),
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update client')
    }

    const client = response.data.data
    return {
      id: client._id,
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || 'N/A',
      address: client.address || 'N/A',
      status: 'active' as ClientStatus,
      createdAt: client.created_at || new Date().toISOString(),
      lastContactDate: client.updated_at || client.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: client.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked,
      account_type: client.account_type,
      _id: client._id
    }
  } catch (error) {
    console.error('Error toggling blocked status:', error)
    throw error
  }
}

/**
 * Update a client's status
 */
export async function updateClientStatus(id: string, status: ClientStatus): Promise<Client> {
  try {
    const response = await axios.patch(`${API_BASE_URL}/user/${id}`, {
      status,
    }, {
      headers: getAuthHeaders(),
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update client')
    }

    const client = response.data.data
    return {
      id: client._id,
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || 'N/A',
      address: client.address || 'N/A',
      status,
      createdAt: client.created_at || new Date().toISOString(),
      lastContactDate: client.updated_at || client.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: client.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked: false,
      account_type: client.account_type,
      _id: client._id
    }
  } catch (error) {
    console.error('Error updating client status:', error)
    throw error
  }
}

/**
 * Update a client's notes
 */
export async function updateClientNotes(id: string, notes: string): Promise<Client> {
  try {
    const response = await axios.put(`${API_BASE_URL}/client/${id}/notes`, {
      notes,
    }, {
      headers: getAuthHeaders(),
    })

    console.log(response)

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update client')
    }

    const client = response.data.data
    return {
      id: client._id,
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || 'N/A',
      address: client.address || 'N/A',
      status: 'active' as ClientStatus,
      createdAt: client.created_at || new Date().toISOString(),
      lastContactDate: client.updated_at || client.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: client.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked: false,
      notes,
      account_type: client.account_type,
      _id: client._id
    }
  } catch (error) {
    console.error('Error updating client notes:', error)
    throw error
  }
}

/**
 * Get cases for a specific client
 */
export async function getClientCases(clientId: string): Promise<Case[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/case/list`, {
      headers: getAuthHeaders(),
      params: {
        clientId,
      }
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch cases')
    }

    const cases = response.data.data || []
    return cases.map((caseData: any) => ({
      id: caseData._id,
      title: caseData.title,
      clientName: caseData.client_name,
      clientId: caseData.client_id,
      status: caseData.status,
      createdAt: caseData.created_at || new Date().toISOString(),
      updatedAt: caseData.updated_at || caseData.created_at || new Date().toISOString(),
      description: caseData.description,
      assignedTo: caseData.assigned_to,
    }))
  } catch (error) {
    console.error('Error fetching cases:', error)
    throw error
  }
}

/**
 * Create a new client
 */
export async function createClient(clientData: Partial<Client>): Promise<Client> {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/create`, clientData, {
      headers: getAuthHeaders(),
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create client')
    }

    const client = response.data.data
    return client
  } catch (error) {
    console.error('Error creating client:', error)
    throw error
  }
}
