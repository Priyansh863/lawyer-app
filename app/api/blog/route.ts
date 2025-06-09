import { type NextRequest, NextResponse } from "next/server"
import type { BlogPost } from "@/types/blog"

// Mock data 
const blogPosts: BlogPost[] = [
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

export async function GET(request: NextRequest) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const category = searchParams.get("category")

  let filteredPosts = [...blogPosts]

  // Apply filters if provided
  if (status) {
    filteredPosts = filteredPosts.filter((post) => post.status === status)
  }

  if (category) {
    filteredPosts = filteredPosts.filter((post) => post.category === category)
  }

  return NextResponse.json(filteredPosts)
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Create new post
    const newPost: BlogPost = {
      id: Math.random().toString(36).substring(2, 9),
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, 150) + "...",
      image: data.image || "/placeholder.svg?height=400&width=800",
      date: new Date().toISOString(),
      author: {
        id: "1", // In a real app, this would be the authenticated user's ID
        name: "Joseph Smith",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      category: data.category || "legal-advice",
      status: data.status || "draft",
      likes: 0,
      views: 0,
    }

    // Add to collection
    blogPosts.push(newPost)

    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    console.error("Error creating blog post:", error)
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 })
  }
}
