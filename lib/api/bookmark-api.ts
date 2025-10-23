import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export interface BookmarkResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Toggle bookmark (add/remove)
export const toggleBookmark = async (postId: string): Promise<BookmarkResponse> => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Please login to bookmark posts');
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/bookmark/toggle`,
      { postId },
      {
        headers: getAuthHeaders()
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Please login to bookmark posts');
    }
    throw new Error(error.response?.data?.message || 'Failed to toggle bookmark');
  }
};

// Check if post is bookmarked
export const checkBookmark = async (postId: string): Promise<{ isBookmarked: boolean }> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/bookmark/check/${postId}`,
      {
        headers: getAuthHeaders()
      }
    );
    return response.data.data;
  } catch (error: any) {
    // If authentication fails, return false instead of throwing error
    if (error.response?.status === 401) {
      return { isBookmarked: false };
    }
    throw new Error(error.response?.data?.message || 'Failed to check bookmark');
  }
};

// Get user bookmarks (with pagination)
export const getUserBookmarks = async (page: number = 1, limit: number = 10) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Please login to view bookmarks');
    }
    
    const response = await axios.get(
      `${API_BASE_URL}/bookmark/user?page=${page}&limit=${limit}`,
      {
        headers: getAuthHeaders()
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get bookmarks');
  }
};

// Get all bookmarked posts (no pagination)
export const getAllBookmarkedPosts = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('Please login to view bookmarks');
    }
    
    const response = await axios.get(
      `${API_BASE_URL}/post/bookmarked`,
      {
        headers: getAuthHeaders()
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to get bookmarked posts');
  }
};

// Report post
export const reportPost = async (postId: string, reason: string): Promise<BookmarkResponse> => {
  try {

    
    const response = await axios.post(
      `${API_BASE_URL}/report/create`,
      { postId, reason },
      {
        headers: getAuthHeaders()
      }
    );
    debugger
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Please login to report posts');
    }
    throw new Error(error.response?.data?.message || 'Failed to report post');
  }
};
