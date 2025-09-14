import { Console } from "node:console"

// Q&A API Service - Real Backend Integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Helper function to get auth headers
const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Interfaces for API responses
export interface QAQuestion {
  _id: string
  title: string
  question: string
  answer?: string
  category: string
  tags: string[]
  userId: {
    _id: string
    first_name: string
    last_name: string
    email: string
  }
  selectedLawyer?: string
  isPublic: boolean
  isAnonymous: boolean
  likes?: number
  status?: string
  createdAt: string
  updatedAt: string
}

export interface CreateQAData {
  title: string
  question: string
  category: string
  tags?: string[]
  selectedLawyer?: string
  clientId: string
  isPublic?: boolean
  isAnonymous?: boolean
}

export interface QAListResponse {
  success: boolean
  data?: QAQuestion[]
  questions?: QAQuestion[]
  message?: string
}

export interface QAResponse {
  success: boolean
  data?: QAQuestion
  question?: QAQuestion
  message?: string
}

// API Functions
export async function createQuestion(data: CreateQAData): Promise<QAResponse> {
  const response = await fetch(`${API_BASE_URL}/question/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      isPublic: data.isPublic ?? true,
      isAnonymous: data.isAnonymous ?? false
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create question: ${response.statusText}`)
  }

  return response.json()
}

export async function getQAItems(): Promise<QAQuestion[]> {
  const response = await fetch(`${API_BASE_URL}/question/`, {
    method: 'GET',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.statusText}`)
  }

  const data: any = await response.json()

  console.log(data,"datadatadatadatadatadatadatadatadatadata")
  
  if (data.success) {
    return data.data.questions 
  }
  
  throw new Error(data.message || 'Failed to fetch questions')
}

export async function getQAItem(id: string): Promise<QAQuestion | null> {
  const response = await fetch(`${API_BASE_URL}/question/${id}`, {
    method: 'GET',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Failed to fetch question: ${response.statusText}`)
  }

  const data: QAResponse = await response.json()

  console.log(data,"datadatadatadatadatadatadatadatadatadatadata")  
  
  if (data.success) {
    return data.data || data.question || null
  }
  
  return null
}

export async function answerQuestion(id: string, answer: string): Promise<QAQuestion> {
  const response = await fetch(`${API_BASE_URL}/question/answer/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ answer })
  })

  if (!response.ok) {
    throw new Error(`Failed to answer question: ${response.statusText}`)
  }

  const data: QAResponse = await response.json()
  
  if (data.success && (data.data || data.question)) {
    return data.data || data.question!
  }
  
  throw new Error(data.message || 'Failed to answer question')
}

export async function updateAnswer(id: string, answer: string): Promise<QAQuestion> {
  const response = await fetch(`${API_BASE_URL}/question/answer/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ answer })
  })

  if (!response.ok) {
    throw new Error(`Failed to update answer: ${response.statusText}`)
  }

  const data: QAResponse = await response.json()
  
  if (data.success && (data.data || data.question)) {
    return data.data || data.question!
  }
  
  throw new Error(data.message || 'Failed to update answer')
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/question/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(`Failed to delete question: ${response.statusText}`)
  }

  const data = await response.json()
  return data.success || false
}

export async function likeAnswer(id: string): Promise<{ likes: number }> {
  const response = await fetch(`${API_BASE_URL}/question/${id}/like`, {
    method: 'POST',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(`Failed to like answer: ${response.statusText}`)
  }

  const data = await response.json()
  
  if (data.success) {
    return { likes: data.likes || 0 }
  }
  
  throw new Error(data.message || 'Failed to like answer')
}

// Get available lawyers for Q&A
export async function getLawyers() {
  const response = await fetch(`${API_BASE_URL}/user/clients-and-lawyers`, {
    method: 'GET',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch lawyers: ${response.statusText}`)
  }

  const data = await response.json()
  
  if (data.success) {
    return data.lawyers || data.data?.lawyers || []
  }
  
  return []
}
