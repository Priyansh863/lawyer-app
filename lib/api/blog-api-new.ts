import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Get token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user).token : null
  }
  return null
}

// Get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json'
})

// Backend response interfaces (matching exact backend contract)
export interface Author {
  _id: string
  first_name: string
  last_name: string
  email: string
  avatar?: string
}

export interface BlogPost {
  _id: string
  title: string
  content: string
  excerpt: string
  category: string
  status: 'draft' | 'published'
  image?: string
  author: Author
  createdAt: string
  updatedAt: string
  likes?: number
  views?: number
}

// API Response interfaces
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface BlogListResponse {
  blogs: BlogPost[]
  pagination: {
    currentPage: number
    totalPages: number
    totalBlogs: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface BlogListParams {
  page?: number
  limit?: number
  category?: string
  status?: string
  search?: string
}

// 1. Create Blog
export const createBlogPost = async (blogData: {
  title: string
  content: string
  excerpt: string
  category: string
  status: 'draft' | 'published'
  image?: string
}): Promise<BlogPost> => {
  try {
    const response = await axios.post<ApiResponse<BlogPost>>(
      `${API_BASE_URL}/blog/create`,
      blogData,
      { headers: getAuthHeaders() }
    )
    return response.data.data
  } catch (error) {
    console.error('Error creating blog:', error)
    throw error
  }
}

// 2. List All Blogs
export const getBlogPosts = async (params: BlogListParams = {}): Promise<BlogListResponse> => {
  try {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.category) queryParams.append('category', params.category)
    if (params.status) queryParams.append('status', params.status)
    if (params.search) queryParams.append('search', params.search)

    const response = await axios.get<ApiResponse<BlogListResponse>>(
      `${API_BASE_URL}/blog/list?${queryParams.toString()}`
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching blogs:', error)
    throw error
  }
}

// 3. Get User's Blogs
export const getMyBlogs = async (params: BlogListParams = {}): Promise<BlogListResponse> => {
  try {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.status) queryParams.append('status', params.status)

    const response = await axios.get<ApiResponse<BlogListResponse>>(
      `${API_BASE_URL}/blog/my-blogs?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching my blogs:', error)
    throw error
  }
}

// 4. Get Single Blog
export const getBlogPost = async (blogId: string): Promise<BlogPost> => {
  try {
    const response = await axios.get<ApiResponse<BlogPost>>(
      `${API_BASE_URL}/blog/${blogId}`
    )
    return response.data.data
  } catch (error) {
    console.error('Error fetching blog:', error)
    throw error
  }
}

// 5. Update Blog
export const updateBlogPost = async (blogId: string, updates: Partial<{
  title: string
  content: string
  excerpt: string
  category: string
  status: 'draft' | 'published'
  image: string
}>): Promise<BlogPost> => {
  try {
    const response = await axios.put<ApiResponse<BlogPost>>(
      `${API_BASE_URL}/blog/${blogId}`,
      updates,
      { headers: getAuthHeaders() }
    )
    return response.data.data
  } catch (error) {
    console.error('Error updating blog:', error)
    throw error
  }
}

// 6. Delete Blog
export const deleteBlogPost = async (blogId: string): Promise<void> => {
  try {
    await axios.delete(
      `${API_BASE_URL}/blog/${blogId}`,
      { headers: getAuthHeaders() }
    )
  } catch (error) {
    console.error('Error deleting blog:', error)
    throw error
  }
}
