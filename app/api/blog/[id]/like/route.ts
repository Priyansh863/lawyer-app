import { type NextRequest, NextResponse } from "next/server"
import type { BlogPost } from "@/types/blog"

// Mock data 
const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Master Layer: Your fall Style Guide",
    content:
      "# Master Layer: Your fall Style Guide\n\nLorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts.",
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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const index = blogPosts.findIndex((post) => post.id === params.id)

  if (index === -1) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
  }

  // Increment likes
  blogPosts[index].likes += 1

  return NextResponse.json({ likes: blogPosts[index].likes })
}
