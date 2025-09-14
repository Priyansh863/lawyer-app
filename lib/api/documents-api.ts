import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Get auth headers with improved token handling
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    // Try to get token from Redux state first, then localStorage
    const authData = localStorage.getItem('authUser')
    if (authData) {
      try {
        const user = JSON.parse(authData)
        const token = user.token || localStorage.getItem('authToken')
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      } catch (error) {
        console.error('Error parsing auth user:', error)
      }
    }
  }
  return {
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

// Enhanced document upload with full feature support
export const uploadDocumentEnhanced = async (data: {
  userId: string
  fileUrl: string
  fileName: string
  privacy: 'public' | 'private' | 'fully_private'
  processWithAI: boolean
  fileSize: number
  fileType: string
  associatedUserId?: string
  caseId?: string
  documentType?: 'case_related' | 'general'
}) => {
  try {
    console.log('📤 Uploading document (enhanced):', data)
    
    const uploadPayload = {
      user_id: data.userId,
      document_name: data.fileName,
      link: data.fileUrl,
      privacy: data.privacy,
      process_with_ai: data.processWithAI,
      file_size: data.fileSize,
      file_type: data.fileType,
      document_type: data.documentType || 'general',
      case_id: data.caseId,
      associated_user_id: data.associatedUserId
    }
    
    const response = await axios.post(`${API_BASE_URL}/document/upload-enhanced`, uploadPayload, {
      headers: getAuthHeaders()
    })
    
    console.log('✅ Enhanced upload response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Enhanced upload error:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to upload document'
    }
  }
}

// Upload document with privacy settings (legacy support)
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
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to upload document'
    }
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

// Download original document
export const downloadDocument = async (documentId: string, documentName: string, documentUrl: string) => {
  try {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = documentUrl;
    link.setAttribute('download', documentName);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(documentUrl);
    }, 100);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error downloading document:', error);
    throw new Error('Failed to initiate document download');
  }
};

// Download document summary as text file
export const downloadDocumentSummary = async (documentId: string, summary: string, documentName: string) => {
  try {
    console.log('📥 Downloading document summary:', documentId)

    
    // Create and download text file
    const blob = new Blob([summary], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${documentName.replace(/\.[^/.]+$/, '')}_summary.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('✅ Document summary downloaded successfully')
    return { success: true, message: 'Summary downloaded successfully' }
  } catch (error: any) {
    console.error('❌ Download document summary error:', error)
    throw new Error(error.response?.data?.message || 'Failed to download document summary')
  }
}

// Get documents for a specific case
export const getCaseDocuments = async (caseId: string): Promise<DocumentResponse> => {
  try {
    console.log('📥 Fetching case documents for case:', caseId)
    
    const headers = getAuthHeaders()
    const response = await axios.get(`${API_BASE_URL}/document/case/${caseId}`, { headers })
    
    console.log('✅ Success fetching case documents:', response.data)

    if (response.data.success) {
      const documents = response.data.documents || []
      console.log(`📄 Found ${documents.length} documents for case ${caseId}`)
      
      return {
        success: true,
        documents: documents.map((doc: any) => ({
          _id: doc._id,
          document_name: doc.document_name,
          status: doc.status,
          uploaded_by: doc.uploaded_by,
          link: doc.link,
          file_type: doc.file_type,
          document_type: doc.document_type,
          privacy: doc.privacy,
          file_size: doc.file_size,
          summary: doc.summary,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          shared_with: doc.shared_with || [],
          case_id: doc.case_id
        }))
      }
    } else {
      throw new Error(response.data.message || 'Failed to fetch case documents')
    }
  } catch (error: any) {
    console.error('❌ Get case documents error:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch case documents',
      documents: []
    }
  }
}
