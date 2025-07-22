import endpoints from "@/constant/endpoints";
import ApiResponse from "@/lib/api";
import { http } from "@/lib/http";
import type { BlogPost } from "@/types/blog";

/**
 * signup
 * @param data
 * @returns
 */
export const getDashboardStats = (): Promise<ApiResponse> => {
    return http.get(`${endpoints.auth.SIGNUP}`);
  };

/**
 * getDashboardRecentActivity
 * @returns
 */
export const getDashboardRecentActivity = (): Promise<ApiResponse> => {
    return http.get(`${endpoints.user.RECENT_ACTIVITY}`);
};

/**
 * get user list with account type, offset, and limit
 * @param params
 * @returns
 */
export const getUserList = (params:any): Promise<ApiResponse<any>> =>
    http.get(`${endpoints.user.GET_USER_LIST}`, { params });

/**
 * get user info by ID
 * @param id
 * @returns
 */
export const getUserInfo = (id: string): Promise<ApiResponse<any>> =>
    http.get(`${endpoints.user.GET_USER_INFO}/${id}`);

/**
 *get presigned url for image upload
 * @returns
 */
 export const getSignedUrl = (data:any): Promise<ApiResponse<any>> =>
    http.post(`${endpoints.user.GET_PRESIGNED_URL}`, data);


/**
 * update user details
 * @param data
 * @returns
 */
export const updateUser = (id: string, data:any): Promise<ApiResponse<any>> =>
    http.put(`${endpoints.user.UPDATE_USER}/${id}`, data);

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const response = await fetch(endpoints.blog.GET_BLOGS);
  if (!response.ok) throw new Error('Failed to fetch blog posts');
  return response.json();
}

export async function fetchBlogPost(id: string): Promise<BlogPost | null> {
  const response = await fetch(`${endpoints.blog.GET_BLOG}${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch blog post');
  }
  return response.json();
}

export async function createNewBlogPost(post: Omit<BlogPost, "id" | "date" | "author" | "likes" | "views">): Promise<BlogPost> {
    
    const response = await fetch(endpoints.blog.CREATE_BLOG, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(post)
  });
  if (!response.ok) throw new Error('Failed to create blog post');
  return response.json();
}

export async function updateExistingBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    
    const response = await fetch(`${endpoints.blog.UPDATE_BLOG}${id}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(updates)
  });
  if (!response.ok) throw new Error('Failed to update blog post');
  return response.json();
}

export async function removeBlogPost(id: string): Promise<void> {
  const response = await fetch(`${endpoints.blog.DELETE_BLOG}${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete blog post');
}

export async function likeABlogPost(id: string): Promise<{ likes: number }> {
  const response = await fetch(`${endpoints.blog.LIKE_BLOG}${id}/like`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to like blog post');
  return response.json();
}

export const getBlogs = async () => {
  return await fetchBlogPosts();
};

export const getBlogById = async (id: string) => {
  return await fetchBlogPost(id);
};

export const createBlog = async (blogData: any) => {
  return await createNewBlogPost(blogData);
};

export const updateBlog = async (id: string, blogData: any) => {
  return await updateExistingBlogPost(id, blogData);
};

export const deleteBlog = async (id: string) => {
  await removeBlogPost(id);
};
