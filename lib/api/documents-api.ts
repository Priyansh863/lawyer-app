import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Get auth headers with improved token handling
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {


    // Try to get token from Redux state first, then localStorage
    try {
      const token = getToken()
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    } catch (error) {
      console.error('Error parsing auth user:', error)
    }
  }
  return {
    'Content-Type': 'application/json'
  }
}



const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

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
  ai_summary?: string
  summary_text?: string
  document_summary?: string
  privacy?: 'public' | 'private'
  file_size?: number
  file_type?: string
  storage_type?: 'app' | 'cloud' | 'app_cloud'
  storage_location?: string
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

const normalizeDocumentSummary = (doc: any) => {
  const resolvedSummary =
    doc?.summary ||
    doc?.ai_summary ||
    doc?.summary_text ||
    doc?.document_summary ||
    ''

  return {
    ...doc,
    summary: resolvedSummary,
  } as Document
}

export interface DocumentResponse {
  success: boolean
  documents?: Document[]
  document?: Document
  message?: string
}

const isLikelyOpenableUrl = (value?: string) => {
  if (!value) return false
  const v = value.trim()
  if (!v || v === '#') return false
  // Allow relative URLs coming back from backend.
  if (v.startsWith('/')) return true
  if (v.startsWith('http://') || v.startsWith('https://')) return true
  if (v.startsWith('data:') || v.startsWith('blob:')) return true
  return false
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
      '/document/list',
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
      return {
        ...data,
        documents: (data.documents || []).map(normalizeDocumentSummary),
        document: data.document ? normalizeDocumentSummary(data.document) : data.document
      }
    } else if (data.documents || Array.isArray(data)) {
      const normalizedDocs = (data.documents || data || []).map(normalizeDocumentSummary)
      return {
        success: true,
        documents: normalizedDocs
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

// Create a new folder
export const createFolder = async (folderName: string, userId: string): Promise<DocumentResponse> => {
  try {
    console.log('📁 Creating folder:', folderName)
    const payload = {
      document_name: folderName,
      user_id: userId,
      file_size: 0,
      file_type: 'folder',
      storage_type: 'cloud',
      // used by the UI to group documents into folders
      storage_location: folderName
    }
    const response = await axios.post(`${API_BASE_URL}/document/create-folder`, payload, {
      headers: getAuthHeaders()
    })
    console.log('✅ Create folder response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Create folder error:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create folder'
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
  storageType?: 'app' | 'cloud' | 'app_cloud'
  storageLocation?: string
  file_base64?: string
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
      associated_user_id: data.associatedUserId,
      storage_type: data.storageType || 'cloud',
      storage_location: data.storageLocation,
      file_base64: data.file_base64
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
export const downloadDocument = async (documentId: string, documentName: string, documentUrl: string, fileBase64?: string) => {
  try {
    let downloadHref = documentUrl;
    
    // 1. If base64 was passed directly, use it
    if (fileBase64 && fileBase64.startsWith('data:')) {
      downloadHref = fileBase64;
    } else if (documentId) {
      // 2. Try fetching the file base64 from the new download endpoint
      try {
        const response = await axios.get(`${API_BASE_URL}/document/${documentId}/download`, {
          headers: getAuthHeaders()
        });
        if (response.data?.success && response.data?.file_base64) {
          downloadHref = response.data.file_base64;
        }
      } catch (err) {
        console.warn('Failed to fetch document base64 from download API, falling back to stored URL', err);
      }
    }

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadHref;
    link.setAttribute('download', documentName);
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      if (downloadHref && downloadHref.startsWith('blob:')) {
        window.URL.revokeObjectURL(downloadHref);
      }
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
          name: doc.document_name,
          status: doc.status,
          uploaded_by: doc.uploaded_by,
          link: doc.link,
          file_type: doc.file_type,
          document_type: doc.document_type,
          privacy: doc.privacy,
          file_size: doc.file_size,
          summary: doc.summary,
          storage_type: doc.storage_type || 'cloud',
          created_at: doc.created_at || doc.createdAt,
          updated_at: doc.updated_at || doc.updatedAt,
          updatedAt: doc.updatedAt || doc.updated_at,
          createdAt: doc.createdAt || doc.created_at,
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

// Update document storage type (e.g. upload to cloud from app, or remove from cloud)
export const updateDocumentStorageType = async (documentId: string, storageType: 'app' | 'cloud' | 'app_cloud', fileUrl?: string): Promise<DocumentResponse> => {
  try {
    console.log('🔄 Updating document storage type:', documentId, storageType)
    const payload: any = { storage_type: storageType }
    if (fileUrl) payload.link = fileUrl

    const response = await axios.patch(`${API_BASE_URL}/document/${documentId}/storage-type`, payload, {
      headers: getAuthHeaders()
    })
    console.log('✅ Storage type update response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Update storage type error:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update storage type'
    }
  }
}

// Remove document from cloud (keeps app reference)
export const removeFromCloud = async (documentId: string): Promise<DocumentResponse> => {
  try {
    console.log('☁️ Removing document from cloud:', documentId)
    const response = await axios.patch(`${API_BASE_URL}/document/${documentId}/remove-cloud`, {}, {
      headers: getAuthHeaders()
    })
    console.log('✅ Remove from cloud response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('❌ Remove from cloud error:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to remove from cloud'
    }
  }
}

// Resolve a viewable URL for a document (handles non-public/private links)
export const getDocumentViewUrl = async (documentId: string, fallbackLink?: string): Promise<string> => {
  const normalizeResolvedUrl = (u?: string) => {
    if (!u) return u
    const v = u.trim()
    if (!v) return v
    // Normalize common backend formats to something window.open can open.
    if (typeof window !== 'undefined') {
      if (v.startsWith('/')) return `${window.location.origin}${v}`
      if (v.startsWith('//')) return `https:${v}`
      
      // Chrome and modern browsers block window.open("data:...")
      // Convert base64 data URLs to Blob URLs to bypass navigation restrictions.
      if (v.startsWith('data:')) {
        try {
          const parts = v.split(',');
          const match = parts[0].match(/:(.*?);/);
          const mimeType = match ? match[1] : 'application/pdf';
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mimeType });
          return URL.createObjectURL(blob);
        } catch (e) {
          console.error("Failed to extract Blob from data URL", e);
          return v;
        }
      }
    }
    return v
  }

  if (isLikelyOpenableUrl(fallbackLink)) {
    const normalizedFallback = normalizeResolvedUrl(fallbackLink)
    return normalizedFallback!.trim()
  }

  const headers = getAuthHeaders()
  const candidates = [
    { method: 'get' as const, url: `${API_BASE_URL}/document/${documentId}/view` },
    { method: 'get' as const, url: `${API_BASE_URL}/document/${documentId}/download` },
    { method: 'get' as const, url: `${API_BASE_URL}/document/view/${documentId}` },
    { method: 'get' as const, url: `${API_BASE_URL}/document/download/${documentId}` },
    { method: 'get' as const, url: `${API_BASE_URL}/document/${documentId}` },
    { method: 'post' as const, url: `${API_BASE_URL}/document/generate-secure-link`, body: { fileId: documentId } },
  ]

  for (const candidate of candidates) {
    try {
      const response = candidate.method === 'post'
        ? await axios.post(candidate.url, candidate.body || {}, { headers })
        : await axios.get(candidate.url, { headers })

      const data = response?.data || {}
      const resolvedCandidates: Array<string | undefined> = [
        data?.url,
        data?.link,
        data?.document?.url,
        data?.document?.link,
        data?.data?.url,
        data?.data?.link,
        data?.secureUrl,
        data?.secure_url,
        data?.document?.secure_url,
        data?.document?.secureUrl,
      ]

      for (const maybe of resolvedCandidates) {
        if (!maybe) continue
        const normalized = normalizeResolvedUrl(maybe)
        if (isLikelyOpenableUrl(normalized)) {
          return normalized!.trim()
        }
      }
    } catch {
      // continue trying fallbacks
    }
  }

  if (fallbackLink && fallbackLink.trim()) {
    const normalizedFallback = normalizeResolvedUrl(fallbackLink)
    return normalizedFallback!.trim()
  }

  throw new Error('No view URL available')
}
