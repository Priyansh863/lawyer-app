import type { Client, ClientStatus } from "@/types/client"
import type { Case } from "@/types/case"

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
  // this would call an API endpoint
  // This is a mock implementation for demonstration

  // Mock data
  const mockClients: Client[] = [
    {
      id: "client_1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, USA",
      status: "active",
      createdAt: "2024-12-01T10:00:00Z",
      lastContactDate: "2025-03-24T10:00:00Z",
      caseId: "123456",
      contactInfo: "Business Settlement",
      activeCases: 3,
      isFavorite: true,
      isBlocked: false,
    },
    {
      id: "client_2",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, USA",
      status: "inactive",
      createdAt: "2024-11-15T10:00:00Z",
      lastContactDate: "2025-03-24T10:00:00Z",
      caseId: "125632",
      contactInfo: "Business Settlement",
      activeCases: 0,
      isFavorite: false,
      isBlocked: true,
    },
    {
      id: "client_3",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, USA",
      status: "active",
      createdAt: "2025-01-10T10:00:00Z",
      lastContactDate: "2025-03-24T10:00:00Z",
      caseId: "230641",
      contactInfo: "Business Settlement",
      activeCases: 1,
      isFavorite: false,
      isBlocked: false,
    },
    {
      id: "client_4",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, USA",
      status: "active",
      createdAt: "2025-02-05T10:00:00Z",
      lastContactDate: "2025-03-24T10:00:00Z",
      caseId: "653241",
      contactInfo: "Rent Agreement",
      activeCases: 2,
      isFavorite: true,
      isBlocked: false,
    },
    {
      id: "client_5",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, USA",
      status: "active",
      createdAt: "2024-10-20T10:00:00Z",
      lastContactDate: "2025-03-24T10:00:00Z",
      caseId: "032152",
      contactInfo: "Business Settlement",
      activeCases: 1,
      isFavorite: false,
      isBlocked: false,
    },
    {
      id: "client_6",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, USA",
      status: "pending",
      createdAt: "2025-03-01T10:00:00Z",
      lastContactDate: "2025-03-24T10:00:00Z",
      caseId: "125421",
      contactInfo: "Purchase House",
      activeCases: 1,
      isFavorite: false,
      isBlocked: false,
    },
  ]

  // Filter by status
  let filteredClients = mockClients
  if (status !== "all") {
    filteredClients = filteredClients.filter((c) => c.status === status)
  }

  // Filter by search query
  if (query) {
    const lowerQuery = query.toLowerCase()
    filteredClients = filteredClients.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.email.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(lowerQuery) ||
        c.caseId.includes(query),
    )
  }

  // Pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return paginatedClients
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
      id: "123456",
      title: "Business Settlement",
      clientName: "John Doe",
      clientId,
      status: "pending",
      createdAt: "2025-03-24T10:00:00Z",
      updatedAt: "2025-03-24T10:00:00Z",
      description: "Business settlement agreement between parties.",
      assignedTo: ["user_1"],
    },
    {
      id: "230641",
      title: "Business Settlement",
      clientName: "John Doe",
      clientId,
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
      clientId,
      status: "approved",
      createdAt: "2025-03-21T11:45:00Z",
      updatedAt: "2025-03-24T10:00:00Z",
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
    name: clientData.name || "New Client",
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
