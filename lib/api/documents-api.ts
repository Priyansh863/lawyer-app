import axios from 'axios'
import { RootState } from '@/lib/store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const state = JSON.parse(localStorage.getItem('persist:root') || '{}')
    const authState = JSON.parse(state.auth || '{}')
    const token = authState.user?.token
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
  return {
    'Content-Type': 'application/json'
  }
}

export interface DocumentUploadData {
  userId: string
  fileUrl: string
  fileName: string
}

export interface Document {
  _id: string
  document_name: string
    status: 'Pending' | 'Approved' | 'Rejected'  // Updated to match backend

  uploaded_by: string
  link: string
  summary?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentResponse {
  success: boolean
  documents?: Document[]
  document?: Document
  message?: string
  fileUrl?: string
  summary?: string
}

/**
 * Upload document to backend after file is uploaded to S3
 */
export const uploadDocument = async (data: DocumentUploadData): Promise<DocumentResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/document/upload`,
      data,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Document upload error:', error)
    throw new Error(error.response?.data?.message || 'Failed to upload document')
  }
}

/**
 * Upload document with AI summary generation
 */
export const uploadDocumentWithSummary = async (data: DocumentUploadData): Promise<DocumentResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/document/upload-with-summary`,
      data,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Document upload with summary error:', error)
    throw new Error(error.response?.data?.message || 'Failed to upload document with summary')
  }
}

/**
 * Get all documents for the current user
 */
export const getDocuments = async (): Promise<DocumentResponse> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/document/list`,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Get documents error:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch documents')
  }
}

/**
 * Delete a document by ID
 */
export const deleteDocument = async (documentId: string): Promise<DocumentResponse> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/document/${documentId}`,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Delete document error:', error)
    throw new Error(error.response?.data?.message || 'Failed to delete document')
  }
}

/**
 * Get document processing status
 */
export const getDocumentStatus = async (documentId: string): Promise<DocumentResponse> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/ai/status/${documentId}`,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Get document status error:', error)
    throw new Error(error.response?.data?.message || 'Failed to get document status')
  }
}
