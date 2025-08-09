import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Get auth headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Get user ID from localStorage
const getUserId = () => {
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('authUser')
    if (authData) {
      try {
        const user = JSON.parse(authData)
        return user._id
      } catch (error) {
        console.error('Error parsing auth user:', error)
      }
    }
  }
  return null
}

export interface Document {
  _id: string
  document_name: string
  status: 'Pending' | 'Completed' | 'Failed'
  uploaded_by: {
    _id: string
    first_name: string
    last_name: string
    email: string
    account_type: 'client' | 'lawyer' | 'admin'
  } | string
  link: string
  summary?: string
  privacy?: 'public' | 'private'
  file_size?: number
  file_type?: string
  shared_with?: {
    _id: string
    first_name: string
    last_name: string
    email: string
    account_type: string
    profile_image?: string
  }[]
  is_shared?: boolean
  created_at?: string
  updated_at?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentResponse {
  success: boolean
  documents?: Document[]
  document?: Document
  message?: string
}

// Get all documents (with fallback endpoints)
export const getDocuments = async (): Promise<DocumentResponse> => {
  try {
    console.log('🔍 Fetching documents...') // Debug log
    console.log('🌐 API Base URL:', API_BASE_URL) // Debug log
    
    const headers = getAuthHeaders()
    console.log('🔑 Auth headers:', headers) // Debug log
    
    let response
    
    // Try multiple endpoints to ensure compatibility
    const endpoints = [
      '/document/accessible',
      '/document/list',
      '/documents/list',
      '/documents'
    ]
    
    let lastError = null
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🚀 Trying endpoint: ${API_BASE_URL}${endpoint}`)
        
        // Use POST for /document/accessible, GET for others
        if (endpoint === '/document/accessible') {
          const userId = getUserId()
          if (!userId) {
            throw new Error('User not authenticated')
          }
          response = await axios.post(`${API_BASE_URL}${endpoint}`, { userId }, { headers })
        } else {
          response = await axios.get(`${API_BASE_URL}${endpoint}`, { headers })
        }
        
        console.log(`✅ Success with endpoint: ${endpoint}`, response.data)
        break
      } catch (error: any) {
        console.log(`❌ Failed endpoint ${endpoint}:`, error.response?.status, error.response?.data?.message)
        lastError = error
        continue
      }
    }
    
    if (!response) {
      throw lastError || new Error('All document endpoints failed')
    }
    
    // Ensure consistent response format
    const data = response.data
    if (data.success !== undefined) {
      return data
    } else if (data.documents || Array.isArray(data)) {
      return {
        success: true,
        documents: data.documents || data
      }
    } else {
      return {
        success: false,
        message: 'Invalid response format',
        documents: []
      }
    }
    
  } catch (error: any) {
    console.error('❌ Get documents error:', error)
    console.error('❌ Error response:', error.response?.data)
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to get documents',
      documents: []
    }
  }
}

// Delete a document by ID
export const deleteDocument = async (documentId: string): Promise<DocumentResponse> => {
  try {
    console.log('🗑️ Deleting document:', documentId)
    const response = await axios.delete(`${API_BASE_URL}/document/${documentId}`, {
      headers: getAuthHeaders()
    })
    console.log('✅ Delete response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Delete document error:', error)
    throw new Error(error.response?.data?.message || 'Failed to delete document')
  }
}

// Upload document with privacy settings
export const uploadDocumentWithPrivacy = async (data: any) => {
  try {
    console.log('📤 Uploading document with privacy:', data)
    const response = await axios.post(`${API_BASE_URL}/document/upload-with-ai`, data, {
      headers: getAuthHeaders()
    })
    console.log('✅ Upload response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Upload document with privacy error:', error)
    throw new Error(error.response?.data?.message || 'Failed to upload document')
  }
}

// Basic document upload (legacy)
export const uploadDocument = async (data: any) => {
  try {
    console.log('📤 Uploading document (legacy):', data)
    const response = await axios.post(`${API_BASE_URL}/document/upload`, data, {
      headers: getAuthHeaders()
    })
    console.log('✅ Legacy upload response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Upload document error:', error)
    throw new Error(error.response?.data?.message || 'Failed to upload document')
  }
}
