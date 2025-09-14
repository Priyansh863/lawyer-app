import type { Client, ClientStatus } from "@/types/client"
import type { Case } from "@/types/case"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

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
  limit = 10,
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
          accountType,
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
      : response.data.data || []
      
    const transformedClients: Client[] = users.map((user: any) => ({
      id: user._id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || 'N/A',
      address: user.address || 'N/A',
      status: 'active' as ClientStatus, // Default status
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
    const response = await axios.get(`${API_BASE_URL}/user/${id}`, {
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
      account_type: client.account_type,
      _id: client._id
    }
  } catch (error) {
    console.error('Error creating client:', error)
    throw error
  }
}
