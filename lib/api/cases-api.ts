import type { Case, CaseStatus } from "@/types/case"

interface GetCasesParams {
  status?: CaseStatus | "all"
  query?: string
  page?: number
  limit?: number
}

/**
 * Get cases with optional filtering
 */
export async function getCases({
  status = "all",
  query = "",
  page = 1,
  limit = 10,
}: GetCasesParams = {}): Promise<Case[]> {
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Mock data
  const mockCases: Case[] = [
    {
      id: "123456",
      title: "Business Settlement",
      clientName: "John Doe",
      clientId: "client_1",
      status: "pending",
      createdAt: "2025-03-24T10:00:00Z",
      updatedAt: "2025-03-24T10:00:00Z",
      description: "Business settlement agreement between parties.",
      assignedTo: ["user_1"],
    },
    {
      id: "125632",
      title: "Business Settlement",
      clientName: "John Doe",
      clientId: "client_1",
      status: "rejected",
      createdAt: "2025-03-23T09:30:00Z",
      updatedAt: "2025-03-24T10:00:00Z",
      description: "Business settlement agreement between parties.",
      assignedTo: ["user_1"],
    },
    {
      id: "230641",
      title: "Business Settlement",
      clientName: "John Doe",
      clientId: "client_1",
      status: "approved",
      createdAt: "2025-03-22T14:15:00Z",
      updatedAt: "2025-03-24T10:00:00Z",
      description: "Business settlement agreement between parties.",
      assignedTo: ["user_1"],
    },
    {
      id: "653241",
      title: "Rent Agreement",
      clientName: "John Doe",
      clientId: "client_1",
      status: "approved",
      createdAt: "2025-03-21T11:45:00Z",
      updatedAt: "2025-03-24T10:00:00Z",
      description: "Rent agreement for commercial property.",
      assignedTo: ["user_1"],
    },
    {
      id: "032152",
      title: "Business Settlement",
      clientName: "John Doe",
      clientId: "client_1",
      status: "approved",
      createdAt: "2025-03-20T16:30:00Z",
      updatedAt: "2025-03-24T10:00:00Z",
      description: "Business settlement agreement between parties.",
      assignedTo: ["user_1"],
    },
    {
      id: "125421",
      title: "Purchase House",
      clientName: "John Doe",
      clientId: "client_1",
      status: "approved",
      createdAt: "2025-03-19T13:20:00Z",
      updatedAt: "2025-03-24T10:00:00Z",
      description: "House purchase agreement and documentation.",
      assignedTo: ["user_1"],
    },
  ]

  // Filter by status
  let filteredCases = mockCases
  if (status !== "all") {
    filteredCases = filteredCases.filter((c) => c.status === status)
  }

  // Filter by search query
  if (query) {
    const lowerQuery = query.toLowerCase()
    filteredCases = filteredCases.filter(
      (c) =>
        c.id.toLowerCase().includes(lowerQuery) ||
        c.title.toLowerCase().includes(lowerQuery) ||
        c.clientName.toLowerCase().includes(lowerQuery) ||
        c.description?.toLowerCase().includes(lowerQuery),
    )
  }

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedCases = filteredCases.slice(startIndex, endIndex)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return paginatedCases
}

/**
 * Get a case by ID
 */
export async function getCaseById(id: string): Promise<Case | null> {
  // this would call an API endpoint
  const cases = await getCases({ limit: 100 })
  const caseData = cases.find((c) => c.id === id)

  if (!caseData) {
    return null
  }

  return {
    ...caseData,
    description: caseData.description || "No description provided.",
  }
}

/**
 * Update a case's status
 */
export async function updateCaseStatus(id: string, status: CaseStatus): Promise<Case> {
  // this would call an API endpoint

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Return mock updated case
  return {
    id,
    title: "Business Settlement",
    clientName: "John Doe",
    clientId: "client_1",
    status,
    createdAt: "2025-03-24T10:00:00Z",
    updatedAt: new Date().toISOString(),
    description: "Business settlement agreement between parties.",
    assignedTo: ["user_1"],
  }
}

/**
 * Create a new case
 */
export async function createCase(caseData: Partial<Case>): Promise<Case> {
  // this would call an API endpoint

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return mock created case
  return {
    id: `case_${Date.now()}`,
    title: caseData.title || "New Case",
    clientName: caseData.clientName || "Unknown Client",
    clientId: caseData.clientId || "client_unknown",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: caseData.description || "",
    assignedTo: caseData.assignedTo || ["user_1"],
  }
}
