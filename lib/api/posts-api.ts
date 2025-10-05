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
export interface SpatialInfo {
  planet?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  timestamp?: string;
  floor?: number;
}

export interface Citation {
  type: 'spatial' | 'user' | 'url';
  content: string;
  spatialInfo?: SpatialInfo;
  userId?: string;
  url?: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
  };
  slug: string;
  spatialInfo?: SpatialInfo;
  citations: Citation[];
  hashtag?: string;
  hashtags?: string[];
  usefulLinks?: {
    title: string;
    url: string;
    description?: string;
  }[];
  customUrl?: string;
  shortUrl?: string;
  qrCodeUrl?: string;
  status: 'draft' | 'published';
  isAiGenerated?: boolean;
  aiPrompt?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  spatialInfo?: SpatialInfo;
  citations?: Citation[];
  hashtag?: string;
  status?: 'draft' | 'published';
  image?: string;
}

export interface GenerateAiPostData {
  prompt?: string;
  topic?: string;
  tone?: 'professional' | 'casual' | 'formal' | 'friendly';
  length?: 'short' | 'long';
  includeHashtags?: boolean;
  spatialInfo?: SpatialInfo;
  citations?: Citation[];
  image?: string;
}

// API Functions

/**
 * Create a new post
 */
export const createPost = async (data: CreatePostData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/create`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Generate AI post
 */
export const generateAiPost = async (data: GenerateAiPostData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/generate-ai`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error generating AI post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get all posts with pagination
 */
export const getPosts = async (page = 1, limit = 10, status = 'all', type = 'all') => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/list?page=${page}&limit=${limit}&status=${status}&type=${type}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get single post by slug
 */
export const getPostBySlug = async (slug: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/post/slug/${slug}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Update post
 */
export const updatePost = async (id: string, data: Partial<CreatePostData>) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/post/update/${id}`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Delete post
 */
export const deletePost = async (id: string) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/post/delete/${id}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error deleting post:', error);
    throw error.response?.data || error;
  }
};

/**
 * Generate QR code for post
 */
export const generateQrCode = async (slug: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/qr-code/${slug}`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    throw error.response?.data || error;
  }
}

/**
 * Generate AI image
 */
export const generateAiImage = async ({ prompt }: { prompt: string }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/post/generate-image`,
      { prompt },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error generating AI image:', error);
    throw error.response?.data || error;
  }
};
