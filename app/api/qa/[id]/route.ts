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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const item = qaItems.find((item) => item.id === params.id)

  if (!item) {
    return NextResponse.json({ error: "Q&A item not found" }, { status: 404 })
  }

  return NextResponse.json(item)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const index = qaItems.findIndex((item) => item.id === params.id)

    if (index === -1) {
      return NextResponse.json({ error: "Q&A item not found" }, { status: 404 })
    }

    // Update item
    const updatedItem = {
      ...qaItems[index],
      ...data,
      // Don't allow overriding these fields
      id: params.id,
      client: qaItems[index].client,
      date: qaItems[index].date,
      // If answer is provided and was empty before, update status
      status: data.answer && !qaItems[index].answer ? "answered" : qaItems[index].status,
    }

    qaItems[index] = updatedItem

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Error updating Q&A item:", error)
    return NextResponse.json({ error: "Failed to update Q&A item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const index = qaItems.findIndex((item) => item.id === params.id)

  if (index === -1) {
    return NextResponse.json({ error: "Q&A item not found" }, { status: 404 })
  }

  // Remove item
  qaItems.splice(index, 1)

  return NextResponse.json({ success: true })
}
