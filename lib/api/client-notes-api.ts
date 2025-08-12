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

export interface ClientNotes {
  client_id: string;
  client_name: string;
  client_email: string;
  notes: string;
}

export const clientNotesApi = {
  // Update client notes (lawyer only)
  updateClientNotes: async (clientId: string, notes: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/user/client/${clientId}/notes`,
        { notes },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating client notes:', error);
      throw error.response?.data || { success: false, message: 'Failed to update client notes' };
    }
  },

  // Get client notes (lawyer only)
  getClientNotes: async (clientId: string): Promise<{ success: boolean; data?: ClientNotes; message?: string }> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/user/client/${clientId}/notes`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching client notes:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch client notes' };
    }
  }
};

export default clientNotesApi;
