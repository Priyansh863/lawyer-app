import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Get auth headers with token from localStorage
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

export interface MeetingRequest {
  lawyer_id: string;
  meeting_title: string;
  meeting_description?: string;
  requested_date: string;
  requested_time: string;
}

export interface MeetingApproval {
  meeting_link: string;
  notes?: string;
}

export interface MeetingRejection {
  rejection_reason: string;
}

export interface Meeting {
  _id: string;
  meeting_title: string;
  meeting_description?: string;
  requested_date: string;
  requested_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  client_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  lawyer_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  meeting_link?: string;
  notes?: string;
  rejection_reason?: string;
  approval_date?: string;
  createdAt: string;
  updatedAt: string;
}

export const meetingApi = {
  // Create a new meeting request (client creates, goes to lawyer for approval)
  createMeetingRequest: async (meetingData: MeetingRequest): Promise<{ success: boolean; data?: Meeting; message?: string }> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/meeting/create-request`,
        meetingData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating meeting request:', error);
      throw error.response?.data || { success: false, message: 'Failed to create meeting request' };
    }
  },

  // Approve a meeting request (lawyer only)
  approveMeeting: async (meetingId: string, approvalData: MeetingApproval): Promise<{ success: boolean; data?: Meeting; message?: string }> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/meeting/approve/${meetingId}`,
        approvalData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error approving meeting:', error);
      throw error.response?.data || { success: false, message: 'Failed to approve meeting' };
    }
  },

  // Reject a meeting request (lawyer only)
  rejectMeeting: async (meetingId: string, rejectionData: MeetingRejection): Promise<{ success: boolean; data?: Meeting; message?: string }> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/meeting/reject/${meetingId}`,
        rejectionData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error rejecting meeting:', error);
      throw error.response?.data || { success: false, message: 'Failed to reject meeting' };
    }
  },

  // Get pending meeting requests for a lawyer
  getPendingMeetings: async (): Promise<{ success: boolean; data?: Meeting[]; message?: string }> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/meeting/pending`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pending meetings:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch pending meetings' };
    }
  },

  // List all meetings for a user (lawyer or client)
  listMeetings: async (status?: string): Promise<{ success: boolean; data?: Meeting[]; message?: string }> => {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(
        `${API_BASE_URL}/meeting/list`,
        { 
          headers: getAuthHeaders(),
          params
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error listing meetings:', error);
      throw error.response?.data || { success: false, message: 'Failed to list meetings' };
    }
  },

  // Get a specific meeting by ID
  getMeeting: async (meetingId: string): Promise<{ success: boolean; data?: Meeting; message?: string }> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/meeting/${meetingId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching meeting:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch meeting' };
    }
  },

  // Update meeting status (for active, completed, cancelled)
  updateMeetingStatus: async (meetingId: string, status: string): Promise<{ success: boolean; data?: Meeting; message?: string }> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/meeting/status/${meetingId}`,
        { status },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating meeting status:', error);
      throw error.response?.data || { success: false, message: 'Failed to update meeting status' };
    }
  }
};

export default meetingApi;
