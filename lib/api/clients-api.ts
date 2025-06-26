import type { Client, ClientStatus } from "@/types/client"
import type { Case } from "@/types/case"
import endpoints from "@/constant/endpoints"

interface GetClientsParams {
  status?: ClientStatus | "all"
  query?: string
  page?: number
  limit?: number
}

/**
 * Get clients with optional filtering
 */
export async function getClients({
  status = "all",
  query = "",
  page = 1,
  limit = 10,
}: GetClientsParams = {}): Promise<Client[]> {
  const userString = typeof window !== "undefined" ? localStorage.getItem("user") : null;;
  const user = userString ? JSON.parse(userString) : null;
  

  const params = new URLSearchParams();

  if (status && status !== "all") params.set("status", status);
  if (query) params.set("query", query);
  params.set("page", page.toString());
  params.set("limit", limit.toString());

  const res = await fetch(`${endpoints.user.GET_RELATED_USERS}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODU2NTJkNmNlNzUyOGI2OTYxZWJkM2MiLCJlbWFpbCI6ImdhdXJhdkBnbWFpbC5jb20iLCJhY2NvdW50X3R5cGUiOiJjbGllbnQiLCJpYXQiOjE3NTA1MDM3NTd9.5B-ApV7-d5qYO2Y0Isn6KntS3OO10aNgk5ashon28Jc
`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await res.json();

  // Assuming backend sends: { success: true, users: [...] }
  return data.users;
}

/**
 * Get a client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  // In a real app, this would call an API endpoint
  const clients = await getClients({ limit: 100 })
  const client = clients.find((c) => c.id === id)

  if (!client) {
    return null
  }

  return {
    ...client,
    notes:
      "This client has been with us since December 2024. They are reliable with payments and responsive to communications. They are looking to expand their business operations and may need additional legal support in the coming months.",
  }
}

/**
 * Toggle a client's favorite status
 */
export async function toggleFavorite(id: string, isFavorite: boolean): Promise<Client> {
  // this would call an API endpoint

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Get existing client
  const client = await getClientById(id)
  if (!client) {
    throw new Error("Client not found")
  }

  // Return updated client
  return {
    ...client,
    isFavorite,
  }
}

/**
 * Toggle a client's blocked status
 */
export async function toggleBlocked(id: string, isBlocked: boolean): Promise<Client> {
  //  this would call an API endpoint

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Get existing client
  const client = await getClientById(id)
  if (!client) {
    throw new Error("Client not found")
  }

  // Return updated client
  return {
    ...client,
    isBlocked,
  }
}

/**
 * Update a client's status
 */
export async function updateClientStatus(id: string, status: ClientStatus): Promise<Client> {
  // this would call an API endpoint

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Get existing client
  const client = await getClientById(id)
  if (!client) {
    throw new Error("Client not found")
  }

  // Return updated client
  return {
    ...client,
    status,
  }
}

/**
 * Update a client's notes
 */
export async function updateClientNotes(id: string, notes: string): Promise<Client> {
  // this would call an API endpoint

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Get existing client
  const client = await getClientById(id)
  if (!client) {
    throw new Error("Client not found")
  }

  // Return updated client
  return {
    ...client,
    notes,
  }
}

/**
 * Get cases for a specific client
 */
export async function getClientCases(clientId: string): Promise<Case[]> {
  // this would call an API endpoint

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 700))

  // Mock data
  return [
    {
      _id: "123456",
      title: "Business Settlement",
      clientName: "John Doe",
      clientId,
      status: "pending",
      created_at: "2025-03-24T10:00:00Z",
      updated_at: "2025-03-24T10:00:00Z",
      description: "Business settlement agreement between parties.",
      assignedTo: ["user_1"],
    },
    {
      _id: "230641",
      title: "Business Settlement",
      clientName: "John Doe",
      clientId,
      status: "approved",
      created_at: "2025-03-22T14:15:00Z",
      updated_at: "2025-03-24T10:00:00Z",
      description: "Business settlement agreement between parties.",
      assignedTo: ["user_1"],
    },
    {
      _id: "653241",
      title: "Rent Agreement",
      clientName: "John Doe",
      clientId,
      status: "approved",
      created_at: "2025-03-21T11:45:00Z",
      updated_at: "2025-03-24T10:00:00Z",
      description: "Rent agreement for commercial property.",
      assignedTo: ["user_1"],
    },
  ]
}

/**
 * Create a new client
 */
export async function createClient(clientData: Partial<Client>): Promise<Client> {
  // this would call an API endpoint

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return mock created client
  return {
    id: `client_${Date.now()}`,
    first_name: clientData.first_name || "New Client",
    last_name: clientData.last_name || "",
    email: clientData.email || "client@example.com",
    phone: clientData.phone || "(555) 000-0000",
    address: clientData.address || "",
    notes: clientData.notes || "",
    status: clientData.status || "active",
    createdAt: new Date().toISOString(),
    lastContactDate: new Date().toISOString(),
    caseId: "",
    contactInfo: "",
    activeCases: 0,
    isFavorite: clientData.isFavorite || false,
    isBlocked: clientData.isBlocked || false,
  }
}
