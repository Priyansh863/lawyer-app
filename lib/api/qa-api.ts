import type { QAItem } from "@/types/qa"

// This is a mock API service for the Q&A functionality
// these functions would make actual API calls

// Mock data
const QA_ITEMS: QAItem[] = [
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
  
]

export async function getQAItems(): Promise<QAItem[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return QA_ITEMS
}

export async function getQAItem(id: string): Promise<QAItem | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return QA_ITEMS.find((item) => item.id === id) || null
}

export async function answerQuestion(id: string, answer: string): Promise<QAItem> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const item = QA_ITEMS.find((item) => item.id === id)
  if (!item) {
    throw new Error(`Question with ID ${id} not found`)
  }

  const updatedItem = {
    ...item,
    answer,
    status: "answered" as const,
  }

  return updatedItem
}

export async function updateAnswer(id: string, answer: string): Promise<QAItem> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const item = QA_ITEMS.find((item) => item.id === id)
  if (!item) {
    throw new Error(`Question with ID ${id} not found`)
  }

  const updatedItem = {
    ...item,
    answer,
  }

  return updatedItem
}

export async function likeAnswer(id: string): Promise<{ likes: number }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const item = QA_ITEMS.find((item) => item.id === id)
  if (!item) {
    throw new Error(`Question with ID ${id} not found`)
  }

  const newLikes = item.likes + 1
  return { likes: newLikes }
}
