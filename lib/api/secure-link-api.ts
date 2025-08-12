import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Get token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

// Get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
});

// Interfaces
export interface SecureLink {
  link_id: string;
  client_name: string;
  client_email: string;
  secure_url: string;
  is_used: boolean;
  created_at: string;
  expires_at: string;
  used_at?: string;
  uploaded_document?: {
    file_name: string;
    upload_date: string;
  };
}

export interface GenerateSecureLinkData {
  client_id: string;
  password: string;
  expires_in_hours?: number;
}

export interface SecureLinkValidation {
  link_id: string;
  lawyer_name: string;
  client_name: string;
  expires_at: string;
  created_at: string;
}

export interface SecureLinkAuth {
  upload_token: string;
  lawyer_name: string;
  client_name: string;
  expires_at: string;
}

// API Functions

/**
 * Generate a secure upload link for a client (Lawyer only)
 */
export const generateSecureLink = async (data: GenerateSecureLinkData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/secure-link/generate`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error generating secure link:', error);
    throw error.response?.data || error;
  }
};

/**
 * Validate a secure link (Public - no auth required)
 */
export const validateSecureLink = async (token: string): Promise<SecureLinkValidation> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/secure-link/validate/${token}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error validating secure link:', error);
    throw error.response?.data || error;
  }
};

/**
 * Authenticate with password (Public - no auth required)
 */
export const authenticateSecureLink = async (token: string, password: string): Promise<SecureLinkAuth> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/secure-link/authenticate`, {
      token,
      password
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error authenticating secure link:', error);
    throw error.response?.data || error;
  }
};

/**
 * Upload document through secure link (Public - uses upload token)
 */
export const uploadThroughSecureLink = async (
  uploadToken: string,
  fileUrl: string,
  fileName: string,
  fileSize?: number
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/secure-link/upload`, {
      upload_token: uploadToken,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize
    });
    return response.data;
  } catch (error: any) {
    console.error('Error uploading through secure link:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get lawyer's secure links (Lawyer only)
 */
export const getMySecureLinks = async (page = 1, limit = 10, status = 'all') => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/secure-link/my-links?page=${page}&limit=${limit}&status=${status}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching secure links:', error);
    throw error.response?.data || error;
  }
};
