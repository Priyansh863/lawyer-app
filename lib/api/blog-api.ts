import type { BlogPost } from "@/types/blog"

// This is a mock API service for the blog functionality
//these functions would make actual API calls

// Mock data
const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Master Layer: Your fall Style Guide",
    content:
      "# Master Layer: Your fall Style Guide\n\nLorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts.\n\n## Introduction\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n## Legal Considerations\n\n1. First point\n2. Second point\n3. Third point\n\n> Important quote or legal precedent here.",
    excerpt:
      "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts.",
    image: "/placeholder.svg?height=400&width=800",
    date: "2025-05-01",
    author: {
      id: "1",
      name: "Joseph Smith",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    category: "legal-advice",
    status: "published",
    likes: 24,
    views: 156,
  },
  
]

export async function getBlogPosts(): Promise<BlogPost[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return BLOG_POSTS
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return BLOG_POSTS.find((post) => post.id === id) || null
}

export async function createBlogPost(
  post: Omit<BlogPost, "id" | "date" | "author" | "likes" | "views">,
): Promise<BlogPost> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const newPost: BlogPost = {
    ...post,
    id: Math.random().toString(36).substring(2, 9),
    date: new Date().toISOString(),
    author: {
      id: "1",
      name: "Joseph Smith",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    likes: 0,
    views: 0,
  }

  return newPost
}

export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const post = BLOG_POSTS.find((post) => post.id === id)
  if (!post) {
    throw new Error(`Post with ID ${id} not found`)
  }

  const updatedPost = { ...post, ...updates }
  return updatedPost
}

export async function deleteBlogPost(id: string): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))
  // this would delete the post from the database
}

export async function likeBlogPost(id: string): Promise<{ likes: number }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const post = BLOG_POSTS.find((post) => post.id === id)
  if (!post) {
    throw new Error(`Post with ID ${id} not found`)
  }

  const newLikes = post.likes + 1
  return { likes: newLikes }
}
