import type { FileMetadata } from "@/types/file"
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const getAuthHeaders = () => {
  if (typeof window === 'undefined') {
    return {
      'Content-Type': 'application/json'
    }
  }
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

interface UploadFileParams {
  file: File
  description?: string
  storageLocation: "s3" | "local"
  metadata?: Record<string, string>
  onProgress?: (progress: number) => void
}



/**
 * Get files for a specific case
 */


/**
 * Get files for a specific client
 */
export async function getClientFiles(clientId: string): Promise<FileMetadata[]> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/document/client/${clientId}`,
      {
        headers: getAuthHeaders(),
      }
    )

    console.log('📄 getClientFiles raw response:', JSON.stringify(response.data, null, 2))

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch client documents')
    }

    // Handle both 'data' and 'documents' response formats
    const docs = response.data.data || response.data.documents || []
    const result = Array.isArray(docs) ? docs : []

    console.log('📄 getClientFiles parsed docs count:', result.length)
    if (result.length > 0) {
      console.log('📄 First doc keys:', Object.keys(result[0]))
      console.log('📄 First doc summary:', result[0].summary)
    }

    return result

  } catch (error) {
    console.error('Error fetching client files:', error)
    throw error
  }
}


/**
 * Get files for a specific client
 */
export async function getLawyerFiles(clientId: string): Promise<FileMetadata[]> {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/document/lawyer/${clientId}`,
      {
        headers: getAuthHeaders(),
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch client documents')
    }

    // Transform backend document format to frontend FileMetadata format
    return Array.isArray(response.data.data) ? response.data.data : []

  } catch (error) {
    console.error('Error fetching client files:', error)
    throw error
  }
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return true
}

/**
 * Download a file
 */
export async function downloadFile(fileId: string): Promise<Blob> {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const mockPdfContent = "Mock PDF content"
  return new Blob([mockPdfContent], { type: "application/pdf" })
}
