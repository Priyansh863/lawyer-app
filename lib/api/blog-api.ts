import endpoints from "@/constant/endpoints";
import type { BlogPost } from "@/types/blog";

// This is a real API service for the blog functionality
//these functions make actual API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getBlogPosts(): Promise<BlogPost[]> {
  const response = await fetch(`${endpoints.blog.GET_BLOGS}`);
  if (!response.ok) {
    throw new Error('Failed to fetch blog posts');
  }
  return response.json();
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  const response = await fetch(`${API_BASE_URL}/user/blogs/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch blog post');
  }
  return response.json();
}

export async function createBlogPost(
  post: Omit<BlogPost, "id" | "date" | "author" | "likes" | "views"> & { category: string },
): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/user/blogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  });
  if (!response.ok) {
    throw new Error('Failed to create blog post');
  }
  return response.json();
}

export async function updateBlogPost(
  id: string,
  updates: Partial<BlogPost> & { category?: string },
): Promise<BlogPost> {
  const response = await fetch(`${API_BASE_URL}/blogs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update blog post');
  }
  return response.json();
}

export async function deleteBlogPost(id: string): Promise<void> {
  const response = await fetch(`${endpoints.blog.DELETE_BLOG}${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete blog post');
  }
}

export async function likeBlogPost(id: string): Promise<{ likes: number }> {
  const response = await fetch(`${API_BASE_URL}/blogs/${id}/like`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to like blog post');
  }
  return response.json();
}
