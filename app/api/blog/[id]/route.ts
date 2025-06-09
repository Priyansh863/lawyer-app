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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const post = blogPosts.find((post) => post.id === params.id)

  if (!post) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
  }

  // Increment view count in a real app

  return NextResponse.json(post)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const index = blogPosts.findIndex((post) => post.id === params.id)

    if (index === -1) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    // Update post
    const updatedPost = {
      ...blogPosts[index],
      ...data,
      // Don't allow overriding these fields
      id: params.id,
      author: blogPosts[index].author,
      date: blogPosts[index].date,
    }

    blogPosts[index] = updatedPost

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error("Error updating blog post:", error)
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const index = blogPosts.findIndex((post) => post.id === params.id)

  if (index === -1) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
  }

  // Remove post
  blogPosts.splice(index, 1)

  return NextResponse.json({ success: true })
}
