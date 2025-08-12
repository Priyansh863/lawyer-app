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
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'active' | 'completed' | 'cancelled'
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
    const response = await axios.post(
      `${API_BASE_URL}/meeting/create`,
      data,
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Create meeting error:', error)
    throw new Error(error.response?.data?.message || 'Failed to create meeting')
  }
}

/**
 * Get all meetings for the current user
 */
export const getMeetings = async (): Promise<MeetingResponse> => {
  try {
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
export const updateMeetingStatus = async (meetingId: string, status: string): Promise<MeetingResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/meeting/update-metting-status`,
      {
        meetingId,
        status
      },
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Update meeting status error:', error)
    throw new Error(error.response?.data?.message || 'Failed to update meeting status')
  }
}

/**
 * Approve a meeting
 */
export const approveMeeting = async (meetingId: string): Promise<MeetingResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/meeting/approve/${meetingId}`,
      {},
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Approve meeting error:', error)
    throw new Error(error.response?.data?.message || 'Failed to approve meeting')
  }
}

/**
 * Reject a meeting
 */
export const rejectMeeting = async (meetingId: string, reason?: string): Promise<MeetingResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/meeting/reject/${meetingId}`,
      {
        rejection_reason: reason
      },
      {
        headers: getAuthHeaders()
      }
    )
    return response.data
  } catch (error: any) {
    console.error('Reject meeting error:', error)
    throw new Error(error.response?.data?.message || 'Failed to reject meeting')
  }
}
