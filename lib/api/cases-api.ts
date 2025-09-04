import axios from "axios"
import type { Case, CaseStatus } from "@/types/case"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Helper function to get auth headers
const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

interface GetCasesParams {
  status?: CaseStatus | "all"
  query?: string
  page?: number
  limit?: number
}

interface CasesApiResponse {
  success: boolean
  cases: Case[]
  total?: number
  page?: number
  limit?: number
}

export const casesApi = {
  /**
   * Get cases with optional filtering
   */
  getCases: async ({
    status = "all",
    query = "",
    page = 1,
    limit = 10,
  }: GetCasesParams = {}): Promise<CasesApiResponse> => {
    try {
      const params: any = {
        page: page.toString(),
        limit: limit.toString()
      }
      
      if (status && status !== "all") {
        params.status = status
      }
      
      if (query && query.trim()) {
        params.query = query.trim()
      }

      const response = await axios.get(`${API_BASE_URL}/user/cases`, {
        headers: getAuthHeaders(),
        params
      })

      return {
        success: response.data.success || true,
        cases: response.data.cases || [],
        total: response.data.total,
        page: page,
        limit: limit
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
      throw error
    }
  },

  /**
   * Get single case by ID
   */
  getCaseById: async (caseId: string): Promise<{ success: boolean; case: Case }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cases/${caseId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching case:', error)
      throw error
    }
  },

  /**
   * Create new case
   */
   createCase: async (caseData: any): Promise<{ success: boolean; case: Case }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/CreateCases`, caseData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error creating case:', error)
      throw error
    }
  },

  /**
   * Update case status
   */
  updateCaseStatus: async (caseId: string, status: CaseStatus): Promise<{ success: boolean; case: Case }> => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/user/cases/${caseId}/status`, 
        { status }, 
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      console.error('Error updating case status:', error)
      throw error
    }
  }
}

// Export the main function for backward compatibility
export const getCases = casesApi.getCases
export const createCase = casesApi.createCase
export const updateCaseStatus = casesApi.updateCaseStatus

/**
 * Get cases for a specific client
 */
export async function getClientCases(clientId: string,account_type:string): Promise<Case[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/case/${account_type}/${clientId}`, {
      headers: getAuthHeaders(),
    })

    console.log('Client cases response:', response.data)

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch client cases')
    }

    const cases = response.data.data || []
    return cases.map((caseData: any) => ({
      id: caseData._id,
      case_number: caseData.case_number,
      title: caseData.title,
      description: caseData.description,
      summary: caseData.summary,
      key_points: caseData.key_points || [],
      status: caseData.status.toLowerCase(),
      client_id: caseData.client_id,
      lawyer_id: caseData.lawyer_id,
      files: caseData.files || [],
      important_dates: caseData.important_dates || [],
      createdAt: caseData.created_at || new Date().toISOString(),
      updatedAt: caseData.updated_at || caseData.created_at || new Date().toISOString(),
      created_at: caseData.created_at || new Date().toISOString(),
      updated_at: caseData.updated_at || caseData.created_at || new Date().toISOString(),
      // Legacy fields
      clientName: caseData.client_id ? `${caseData.client_id.first_name} ${caseData.client_id.last_name || ''}`.trim() : '',
      clientId: caseData.client_id?._id,
      assignedTo: caseData.lawyer_id ? [`${caseData.lawyer_id.first_name} ${caseData.lawyer_id.last_name || ''}`.trim()] : [],
    }))
  } catch (error) {
    console.error('Error fetching client cases:', error)
    throw error
  }
}