import { type NextRequest, NextResponse } from "next/server"
import type { QAItem } from "@/types/qa"

// Mock data - in a real app, this would come from a database
const qaItems: QAItem[] = [
  {
    id: "1",
    question:
      "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    client: {
      id: "client1",
      name: "Anonymous",
      isAnonymous: true,
    },
    date: "2025-05-15",
    status: "answered",
    likes: 12,
    category: "family-law",
    tags: ["divorce", "custody"],
  },
  // Add more mock items as needed
]

export async function GET(request: NextRequest) {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const category = searchParams.get("category")

  let filteredItems = [...qaItems]

  // Apply filters if provided
  if (status) {
    filteredItems = filteredItems.filter((item) => item.status === status)
  }

  if (category) {
    filteredItems = filteredItems.filter((item) => item.category === category)
  }

  return NextResponse.json(filteredItems)
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Create new Q&A item
    const newItem: QAItem = {
      id: Math.random().toString(36).substring(2, 9),
      question: data.question,
      answer: "",
      client: {
        id: data.clientId || "anonymous",
        name: data.clientName || "Anonymous",
        isAnonymous: data.isAnonymous || true,
      },
      date: new Date().toISOString(),
      status: "pending",
      likes: 0,
      category: data.category || "general",
      tags: data.tags || [],
    }

    // Add to collection
    qaItems.push(newItem)

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error("Error creating Q&A item:", error)
    return NextResponse.json({ error: "Failed to create Q&A item" }, { status: 500 })
  }
}
