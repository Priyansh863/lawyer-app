import type { Case, CaseStatus } from "@/types/case"
import endpoints from "@/constant/endpoints"

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
  
  const userString = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userString ? JSON.parse(userString) : null;
  

  const params = new URLSearchParams();

  if (status && status !== "all") params.append("status", status);
  if (query) params.append("query", query);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const res = await fetch(`${endpoints.user.GET_USER_CASES}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch cases");
  }

  const data = await res.json();

  return data.cases;
}

/**
 * Get a case by ID
 */
export async function getCaseById(id: string): Promise<Case | null> {
  // this would call an API endpoint
  const cases = await getCases({ limit: 100 })
  const caseData = cases.find((c) => c._id === id)

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
    _id: id,
    title: "Business Settlement",
    clientName: "John Doe",
    clientId: "client_1",
    status,
    created_at: "2025-03-24T10:00:00Z",
    updated_at: new Date().toISOString(),
    description: "Business settlement agreement between parties.",
    assignedTo: ["user_1"],
  }
}

/**
 * Create a new case
 */
export async function createCase(data: any) {
  const token = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}").token : null;

  const res = await fetch(endpoints.user.CREATE_CASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create case");

  return res.json(); // { success: true, case: {...} }
}
