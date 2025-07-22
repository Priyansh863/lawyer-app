import axios from "axios"
import { makeStore } from "@/lib/store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Create a store instance
const store = makeStore()

const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).token : null;
    }
    return null;
  };

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export interface Activity {
  _id: string
  activity_name: string
  description: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  title: string
  value: number
  icon: string
}

export const activityApi = {
  // Get all activities for a user
  getActivities: async (userId: string): Promise<{ success: boolean; data: Activity[] }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/activity/get-activities`, {
        headers: getAuthHeaders(),
        params: { user_id: userId }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching activities:', error)
      throw error
    }
  },

  // Get dashboard summary
  getDashboardSummary: async (userId: string): Promise<{ success: boolean; data: DashboardSummary[] }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/dashboard-summary`, {
        headers: getAuthHeaders(),
        params: { user_id: userId }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
      throw error
    }
  },

  // Create new activity
  createActivity: async (activityData: {
    activity_name: string
    description: string
    user_id: string
  }): Promise<{ success: boolean; data: Activity }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/activity/create-activity`, activityData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error creating activity:', error)
      throw error
    }
  }
}
