// Q&A API Service - Real Backend Integration
import { resolveProfileImageUrlLoose } from "@/lib/utils/profile-image"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

const getToken = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    if (token) return token
    const user = localStorage.getItem("user")
    try {
      return user ? JSON.parse(user).token : null
    } catch {
      return null
    }
  }
  return null
}

const getAuthHeaders = () => {
  const token = getToken()
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export interface QAAnswer {
  lawyer_name?: string
  /** Backend may send a Mongo id string or a populated user document (like post.author). */
  lawyer_id?: string | Record<string, unknown>
  answeredBy?: {
    _id: string
    first_name: string
    last_name: string
    avatar?: string
    profile_image?: string
  }
  answer: string
  images?: string[]
  location?: string
  createdAt?: string
  _id: string
}

export interface QAQuestion {
  _id: string
  title: string
  question: string
  answer?: QAAnswer[]
  category: string
  tags: string[]
  clientId: {
    _id: string
    first_name: string
    last_name: string
    email: string
    avatar?: string
    profile_image?: string
  }
  selectedLawyer?: string
  images?: string[]
  isPublic: boolean
  isAnonymous: boolean
  likes?: number
  status?: string
  isBookmarked?: boolean
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
  images?: string[]
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

function mergeClientIdFromPayload(raw: Record<string, unknown>): QAQuestion["clientId"] {
  const direct = raw.clientId as unknown
  const directObj = typeof direct === "object" && direct !== null ? (direct as Record<string, unknown>) : {}
  const idFromString = typeof direct === "string" ? direct : undefined
  const src: Record<string, unknown> = { ...directObj }
  const id = (src._id ?? src.id ?? idFromString ?? "") as string | undefined
  const img = resolveProfileImageUrlLoose(src)
  return {
    _id: String(id ?? ""),
    first_name: typeof src.first_name === "string" ? src.first_name : "",
    last_name: typeof src.last_name === "string" ? src.last_name : "",
    email: typeof src.email === "string" ? src.email : "",
    ...(img ? { profile_image: img, avatar: img } : {}),
  }
}

function normalizeAnswerRow(row: Record<string, unknown>): QAAnswer {
  const lid = row.lawyer_id
  const lidObj =
    lid && typeof lid === "object" && !Array.isArray(lid) ? (lid as Record<string, unknown>) : undefined
  const abRaw = row.answeredBy ?? row.answered_by
  const abObj =
    abRaw && typeof abRaw === "object" && !Array.isArray(abRaw) ? (abRaw as Record<string, unknown>) : undefined
  const merged: Record<string, unknown> | undefined =
    abObj && lidObj ? { ...lidObj, ...abObj } : abObj ?? lidObj

  if (!merged) return row as QAAnswer

  const img = resolveProfileImageUrlLoose(merged)
  const answeredBy = {
    ...merged,
    ...(img ? { profile_image: img, avatar: img } : {}),
  } as QAAnswer["answeredBy"]

  return {
    ...row,
    answeredBy,
    lawyer_id: row.lawyer_id as QAAnswer["lawyer_id"],
  } as QAAnswer
}

function normalizeAnswers(rawAnswers: unknown): QAAnswer[] | undefined {
  if (!Array.isArray(rawAnswers) || rawAnswers.length === 0) return undefined
  return rawAnswers.map((a) => normalizeAnswerRow(a as Record<string, unknown>))
}

function extractQuestionListFromResponse(data: Record<string, unknown>): unknown[] {
  const d = data.data
  if (Array.isArray(d)) return d
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const o = d as Record<string, unknown>
    for (const key of ["questions", "answers", "items", "list", "docs", "rows", "results", "data"]) {
      const v = o[key]
      if (Array.isArray(v)) return v
    }
  }
  if (Array.isArray(data.questions)) return data.questions
  if (Array.isArray(data.answers)) return data.answers
  if (Array.isArray(data.results)) return data.results
  return []
}

/** Unify clientId / answer lawyer blobs (relative URLs, populated lawyer_id). */
export function normalizeQAQuestionForUi(raw: Record<string, unknown>): QAQuestion {
  return {
    ...(raw as unknown as QAQuestion),
    clientId: mergeClientIdFromPayload(raw),
    answer: normalizeAnswers(raw.answer),
  }
}

export async function createQuestion(data: CreateQAData): Promise<QAResponse> {
  const response = await fetch(`${API_BASE_URL}/question/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...data,
      isPublic: data.isPublic ?? true,
      isAnonymous: data.isAnonymous ?? false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create question: ${response.statusText}`)
  }

  return response.json()
}

export async function getQAItems(params?: {
  status?: string
  filter?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}): Promise<QAQuestion[]> {
  const queryParams = new URLSearchParams()
  if (params?.status && params.status !== "all") queryParams.append("status", params.status)
  if (params?.filter) queryParams.append("filter", params.filter)
  if (params?.category && params.category !== "all") queryParams.append("category", params.category)
  if (params?.search) queryParams.append("search", params.search)
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())

  const response = await fetch(`${API_BASE_URL}/question/?${queryParams.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.statusText}`)
  }

  const data = (await response.json()) as Record<string, unknown> & { success?: boolean; message?: string }
  const list = extractQuestionListFromResponse(data)
  const hasEnvelope =
    data.success ||
    data.questions !== undefined ||
    data.answers !== undefined ||
    data.data !== undefined

  if (hasEnvelope || list.length > 0) {
    return list.map((q) => normalizeQAQuestionForUi(q as Record<string, unknown>))
  }

  throw new Error((data.message as string) || "Failed to fetch questions")
}

export async function toggleBookmark(id: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/question/${id}/bookmark`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to toggle bookmark: ${response.statusText}`)
  }

  const data = await response.json()
  return data.success || false
}

export async function getQAItem(id: string): Promise<QAQuestion | null> {
  const response = await fetch(`${API_BASE_URL}/question/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    if (response.status === 404) return null
    throw new Error(`Failed to fetch question: ${response.statusText}`)
  }

  const data: QAResponse = await response.json()

  if (data.success) {
    const q = data.data || data.question
    return q ? normalizeQAQuestionForUi(q as Record<string, unknown>) : null
  }

  return null
}

export async function answerQuestion(
  id: string,
  answer: string,
  images?: string[],
  location?: string,
  lawyerName?: string
): Promise<QAQuestion> {
  const response = await fetch(`${API_BASE_URL}/question/answer/${id}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ answer, images, location, lawyer_name: lawyerName }),
  })

  if (!response.ok) {
    throw new Error(`Failed to answer question: ${response.statusText}`)
  }

  const data: QAResponse = await response.json()

  if (data.success && (data.data || data.question)) {
    return normalizeQAQuestionForUi((data.data || data.question) as Record<string, unknown>)
  }

  throw new Error(data.message || "Failed to answer question")
}

export async function updateAnswer(
  id: string,
  answer: string,
  images?: string[],
  location?: string,
  lawyerName?: string
): Promise<QAQuestion> {
  const response = await fetch(`${API_BASE_URL}/question/answer/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ answer, images, location, lawyer_name: lawyerName }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update answer: ${response.statusText}`)
  }

  const data: QAResponse = await response.json()

  if (data.success && (data.data || data.question)) {
    return normalizeQAQuestionForUi((data.data || data.question) as Record<string, unknown>)
  }

  throw new Error(data.message || "Failed to update answer")
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/question/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to delete question: ${response.statusText}`)
  }

  const data = await response.json()
  return data.success || false
}

export async function likeAnswer(id: string): Promise<{ likes: number }> {
  const response = await fetch(`${API_BASE_URL}/question/${id}/like`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Failed to like answer: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.success) {
    return { likes: data.likes || 0 }
  }

  throw new Error(data.message || "Failed to like answer")
}

export async function getLawyers() {
  const response = await fetch(`${API_BASE_URL}/user/clients-and-lawyers`, {
    method: "GET",
    headers: getAuthHeaders(),
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
