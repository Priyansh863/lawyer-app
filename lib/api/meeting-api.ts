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
}

export interface Meeting {
  _id: string
  lawyerId: string
  clientId: string
  meetingLink: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  clientName?: string
  lawyerName?: string
}

export interface MeetingResponse {
  success: boolean
  meeting?: Meeting
  meetings?: Meeting[]
  message?: string
}

/**
 * Create a new meeting
 */
export const createMeeting = async (data: CreateMeetingData): Promise<MeetingResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/metting/create`,
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
      `${API_BASE_URL}/metting/list`,
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
      `${API_BASE_URL}/metting/update-metting-status`,
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
