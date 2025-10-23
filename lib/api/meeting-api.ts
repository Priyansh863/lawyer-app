import axios from 'axios'
import { RootState } from '@/lib/store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const state = JSON.parse(localStorage.getItem('persist:root') || '{}')
    const authState = JSON.parse(state.auth || '{}')
    const token = authState.token
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
  return {
    'Content-Type': 'application/json'
  }
}

export interface CreateMeetingData {
  lawyerId: string
  clientId: string
  meetingLink: string
  meeting_title?: string
  meeting_description?: string
  requested_date?: string
  requested_time?: string
  consultation_type?: 'free' | 'paid'
  hourly_rate?: number
  custom_fee?: boolean
}

export interface User {
  _id: string
  first_name: string
  last_name: string
  email: string
  account_type: string
  charges?: number
}

export interface Meeting {
  _id: string
  lawyer_id: User
  client_id: User
  created_by: User
  meeting_title: string
  title?: string // Alias for meeting_title
  meeting_description?: string
  description?: string // Alias for meeting_description
  requested_date: string
  date?: string // Alias for requested_date
  requested_time?: string
  time?: string // Alias for requested_time
  meeting_link?: string
  consultation_type?: 'free' | 'paid'
  hourly_rate?: number
  custom_fee?: boolean
  status: 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'active' | 'completed' | 'cancelled'
  approval_date?: string
  rejection_reason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MeetingResponse {
  success: boolean
  meeting?: Meeting
  meetings?: Meeting[]
  data?: Meeting | Meeting[] | any
  message?: string
}

/**
 * Create a new meeting
 */
export const createMeeting = async (data: any): Promise<MeetingResponse> => {
  try {
    // Get current user info
    const state = JSON.parse(localStorage.getItem('persist:root') || '{}')
    const authState = JSON.parse(state.auth || '{}')
    const user = authState.user ? JSON.parse(authState.user) : null
    
    // Add createdBy and status if not provided
    const meetingData = {
      ...data,
      created_by: user?._id,
      status: user?.account_type === 'client' ? 'pending' : 'approved',
      // Add timestamps for better tracking
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const response = await axios.post(`${API_BASE_URL}/meeting/create`, meetingData, {
      headers: getAuthHeaders()
    })
    
    return response.data
  } catch (error: any) {
    console.error('Error creating meeting:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create meeting'
    }
  }
}

/**
 * Get all meetings for the current user
 */
export const getMeetings = async (): Promise<MeetingResponse> => {
  try {
    console.log('Fetching meetings from API...')
    const response = await axios.get(
      `${API_BASE_URL}/meeting/list`,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Get meetings error:', error)
    throw new Error(error.response?.data?.message || 'Failed to fetch meetings')
  }
}

/**
 * Update meeting status
 */
export const updateMeetingStatus = async (meetingId: string, status: string, reason?: string): Promise<MeetingResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/meeting/status/${meetingId}`,
      { 
        status,
        ...(reason && { rejection_reason: reason }),
        updated_at: new Date().toISOString()
      },
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error: any) {
    console.error('Error updating meeting status:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update meeting status'
    }
  }
}

/**
 * Approve a meeting
 */
export const approveMeeting = async (meetingId: string): Promise<MeetingResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/meeting/approve/${meetingId}`,
      { 
        approval_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error: any) {
    console.error('Error approving meeting:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to approve meeting'
    }
  }
}

export const rejectMeeting = async (meetingId: string, reason: string = 'Meeting rejected'): Promise<MeetingResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/meeting/reject/${meetingId}`,
      { 
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      },
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error: any) {
    console.error('Error rejecting meeting:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to reject meeting'
    }
  }
}

// Get pending meetings for lawyer
export const getPendingMeetings = async (): Promise<MeetingResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/meeting/pending`, {
      headers: getAuthHeaders()
    })
    return response.data
  } catch (error: any) {
    console.error('Error fetching pending meetings:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch pending meetings'
    }
  }
}

// Update meeting details (date, time, rates, etc.)
export const updateMeeting = async (meetingId: string, updateData: Partial<CreateMeetingData>): Promise<MeetingResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/meeting/edit/${meetingId}`,
      {
        ...updateData,
        updated_at: new Date().toISOString()
      },
      { headers: getAuthHeaders() }
    )
    return response.data
  } catch (error: any) {
    console.error('Error updating meeting:', error)
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to update meeting'
    }
  }
}
