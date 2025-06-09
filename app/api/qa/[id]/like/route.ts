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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const index = qaItems.findIndex((item) => item.id === params.id)

  if (index === -1) {
    return NextResponse.json({ error: "Q&A item not found" }, { status: 404 })
  }

  // Increment likes
  qaItems[index].likes += 1

  return NextResponse.json({ likes: qaItems[index].likes })
}
