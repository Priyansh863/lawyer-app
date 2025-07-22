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


