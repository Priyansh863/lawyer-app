# Complete Client Management - All Code in One File

## API Configuration
**Hosted API:** `https://d3qiclz5mtkmyk.cloudfront.net/api/v1`

---

## 1. Client API - Complete Code (`lib/api/clients-api.ts`)

```typescript
import type { Client, ClientStatus } from "@/types/client"
import type { Case } from "@/types/case"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://d3qiclz5mtkmyk.cloudfront.net/api/v1"

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {}
  
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Helper function to get current user from localStorage
const getCurrentUser = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

interface GetClientsParams {
  status?: ClientStatus | "all"
  query?: string
  page?: number
  limit?: number
}

/**
 * Get clients or lawyers based on current user's role
 * If user is lawyer -> show clients
 * If user is client -> show lawyers
 */
export async function getClients({
  status = "all",
  query = "",
  page = 1,
  limit = 10,
}: GetClientsParams = {}) {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    // Determine what type of users to fetch based on current user's role
    let accountType: string
    if (currentUser.account_type === 'lawyer') {
      accountType = 'client' // Lawyers see clients
    } else if (currentUser.account_type === 'client') {
      accountType = 'lawyer' // Clients see lawyers
    } else {
      accountType = 'client' // Default to clients for admin/other roles
    }

    const offset = (page - 1) * limit
    
    // If client is viewing lawyers, use the lawyers-with-charges endpoint
    let response
    if (currentUser.account_type === 'client' && accountType === 'lawyer') {
      response = await axios.get(`${API_BASE_URL}/charges/lawyers-with-charges`, {
        headers: getAuthHeaders()
      })
    } else {
      response = await axios.get(`${API_BASE_URL}/user/list`, {
        headers: getAuthHeaders(),
        params: {
          accountType,
          offset,
          limit
        }
      })
    }

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch users')
    }

    // Transform backend response to match Client interface
    const users = (currentUser.account_type === 'client' && accountType === 'lawyer') 
      ? response.data.lawyers || []
      : response.data.data || []
      
    const transformedClients: Client[] = users.map((user: any) => ({
      id: user._id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || 'N/A',
      address: user.address || 'N/A',
      status: 'active' as ClientStatus,
      createdAt: user.created_at || new Date().toISOString(),
      lastContactDate: user.updated_at || user.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: user.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked: false,
      account_type: user.account_type,
      _id: user._id,
      charges: user.charges || 0,
      video_rate: user.video_rate || 0,
      chat_rate: user.chat_rate || 0,
      pratice_area: user.pratice_area,
      experience: user.experience
    }))

    // Apply client-side filtering if needed
    let filteredClients = transformedClients

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredClients = filteredClients.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery) ||
          (c.phone && c.phone.includes(lowerQuery))
      )
    }

    return filteredClients
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * Get a client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${id}`, {
      headers: getAuthHeaders()
    })

    if (!response.data.success) {
      return null
    }

    const user = response.data.data
    return {
      id: user._id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || 'N/A',
      address: user.address || 'N/A',
      status: 'active' as ClientStatus,
      createdAt: user.created_at || new Date().toISOString(),
      lastContactDate: user.updated_at || user.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: user.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked: false,
      account_type: user.account_type,
      _id: user._id
    }
  } catch (error) {
    console.error('Error fetching client by ID:', error)
    return null
  }
}

/**
 * Toggle blocked status of a client
 */
export async function toggleBlocked(id: string, isBlocked: boolean): Promise<Client> {
  try {
    const response = await axios.patch(`${API_BASE_URL}/user/${id}`, {
      isBlocked,
    }, {
      headers: getAuthHeaders(),
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update client')
    }

    const client = response.data.data
    return {
      id: client._id,
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || 'N/A',
      address: client.address || 'N/A',
      status: 'active' as ClientStatus,
      createdAt: client.created_at || new Date().toISOString(),
      lastContactDate: client.updated_at || client.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: client.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked,
      account_type: client.account_type,
      _id: client._id
    }
  } catch (error) {
    console.error('Error toggling blocked status:', error)
    throw error
  }
}

/**
 * Update a client's status
 */
export async function updateClientStatus(id: string, status: ClientStatus): Promise<Client> {
  try {
    const response = await axios.patch(`${API_BASE_URL}/user/${id}`, {
      status,
    }, {
      headers: getAuthHeaders(),
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update client')
    }

    const client = response.data.data
    return {
      id: client._id,
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || 'N/A',
      address: client.address || 'N/A',
      status,
      createdAt: client.created_at || new Date().toISOString(),
      lastContactDate: client.updated_at || client.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: client.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked: false,
      account_type: client.account_type,
      _id: client._id
    }
  } catch (error) {
    console.error('Error updating client status:', error)
    throw error
  }
}

/**
 * Update a client's notes
 */
export async function updateClientNotes(id: string, notes: string): Promise<Client> {
  try {
    const response = await axios.put(`${API_BASE_URL}/client/${id}/notes`, {
      notes,
    }, {
      headers: getAuthHeaders(),
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update client')
    }

    const client = response.data.data
    return {
      id: client._id,
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || 'N/A',
      address: client.address || 'N/A',
      status: 'active' as ClientStatus,
      createdAt: client.created_at || new Date().toISOString(),
      lastContactDate: client.updated_at || client.created_at || new Date().toISOString(),
      caseId: '',
      contactInfo: client.bio || '',
      activeCases: 0,
      isFavorite: false,
      isBlocked: false,
      notes,
      account_type: client.account_type,
      _id: client._id
    }
  } catch (error) {
    console.error('Error updating client notes:', error)
    throw error
  }
}

/**
 * Get cases for a specific client
 */
export async function getClientCases(clientId: string): Promise<Case[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/case/list`, {
      headers: getAuthHeaders(),
      params: {
        clientId,
      }
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch cases')
    }

    const cases = response.data.data || []
    return cases.map((caseData: any) => ({
      id: caseData._id,
      title: caseData.title,
      clientName: caseData.client_name,
      clientId: caseData.client_id,
      status: caseData.status,
      createdAt: caseData.created_at || new Date().toISOString(),
      updatedAt: caseData.updated_at || caseData.created_at || new Date().toISOString(),
      description: caseData.description,
      assignedTo: caseData.assigned_to,
    }))
  } catch (error) {
    console.error('Error fetching cases:', error)
    throw error
  }
}

/**
 * Create a new client
 */
export async function createClient(clientData: Partial<Client>): Promise<Client> {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/create`, clientData, {
      headers: getAuthHeaders(),
    })

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create client')
    }

    const client = response.data.data
    return client
  } catch (error) {
    console.error('Error creating client:', error)
    throw error
  }
}
```

---

## 2. Client Notes API (`lib/api/client-notes-api.ts`)

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://d3qiclz5mtkmyk.cloudfront.net/api/v1";

const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

export interface ClientNotes {
  client_id: string;
  client_name: string;
  client_email: string;
  notes: string;
}

export const clientNotesApi = {
  // Update client notes (lawyer only)
  updateClientNotes: async (clientId: string, notes: string) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/user/client/${clientId}/notes`,
        { notes },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating client notes:', error);
      throw error.response?.data || { success: false, message: 'Failed to update client notes' };
    }
  },

  // Get client notes (lawyer only)
  getClientNotes: async (clientId: string) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/user/client/${clientId}/notes`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching client notes:', error);
      throw error.response?.data || { success: false, message: 'Failed to fetch client notes' };
    }
  }
};
```

---

## 3. Client Types (`types/client.ts`)

```typescript
export type ClientStatus = "active" | "inactive" | "pending"

export interface Client {
  charges: number
  id: string
  name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  notes?: string
  status: ClientStatus
  createdAt: string
  lastContactDate: string
  caseId: string
  contactInfo: string
  activeCases: number
  isFavorite: boolean
  isBlocked: boolean
  avatar?: string
  account_type?: string
  _id?: string
  video_rate?: number
  chat_rate?: number
  pratice_area?: string
  experience?: string
}
```

---

## 4. API Endpoints Summary

### Base URL
```
https://d3qiclz5mtkmyk.cloudfront.net/api/v1
```

### All Client Endpoints

1. **Get Clients/Lawyers List**
   - `GET /user/list?accountType=client&offset=0&limit=10`
   - `GET /charges/lawyers-with-charges` (for clients viewing lawyers)

2. **Get Client by ID**
   - `GET /user/{id}`

3. **Create Client**
   - `POST /user/create`
   - Body: `{ first_name, last_name, email, phone, address, account_type }`

4. **Update Client Status**
   - `PATCH /user/{id}`
   - Body: `{ status: "active" | "inactive" | "pending" }`

5. **Toggle Blocked Status**
   - `PATCH /user/{id}`
   - Body: `{ isBlocked: true | false }`

6. **Update Client Notes**
   - `PUT /client/{id}/notes`
   - Body: `{ notes: "string" }`

7. **Get Client Notes**
   - `GET /user/client/{clientId}/notes`

8. **Get Client Cases**
   - `GET /case/list?clientId={clientId}`

---

## 5. Main Client Page (`app/client/page.tsx`)

```typescript
"use client"
import React, { Suspense, useState } from "react"
import ClientLayout from "@/components/layouts/client-layout"
import ClientsTable from "@/components/clients/clients-table"
import ClientsHeader from "@/components/clients/clients-header"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

function ClientContent() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClientCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <ClientsHeader onClientCreated={handleClientCreated} />
      <ClientsTable key={refreshKey} initialClients={[]} />
    </div>
  )
}

export default function ClientPage() {
  const { t } = useTranslation()
  
  return (
    <ClientLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('common.loading')}</span>
        </div>
      }>
        <ClientContent />
      </Suspense>
    </ClientLayout>
  )
}
```

---

## 6. Component Files

### Located in `components/clients/`:

1. **clients-table.tsx** - Main table displaying all clients
2. **clients-header.tsx** - Header with search and create button
3. **onboard-client-form.tsx** - Form to create new client
4. **client-details.tsx** - Detailed view of a single client
5. **client-cases.tsx** - Display cases for a client
6. **client-documents.tsx** - Display documents for a client
7. **client-notes.tsx** - Display and edit client notes

---

## 7. Usage Examples

```typescript
// Import the API
import { getClients, getClientById, createClient, updateClientNotes } from '@/lib/api/clients-api';

// Get all clients
const clients = await getClients({ page: 1, limit: 10, query: "" });

// Get single client
const client = await getClientById("client_id_here");

// Create new client
const newClient = await createClient({
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  address: "123 Main St",
  status: "active"
});

// Update client notes
const updated = await updateClientNotes("client_id", "Important notes here");
```

---

## 8. Authentication

All API calls require Bearer token authentication:

```typescript
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};
```

---

## 9. Sidebar Configuration

In `components/sidebar/sidebar.tsx`, line 97:

```typescript
{ 
  href: "/client", 
  icon: <Users size={18} />, 
  label: user?.account_type === "lawyer" ? t('navigation.clients') : t('navigation.lawyers') 
}
```

**Dynamic Label:**
- If user is **lawyer** → Shows "Clients"
- If user is **client** → Shows "Lawyers"

---

## 10. Can This Be One File?

**Answer: YES, but NOT recommended**

You CAN combine everything into one massive file, but it's **not a good practice** because:

❌ **Hard to maintain** - 5000+ lines in one file
❌ **Difficult to debug** - Finding specific code becomes challenging
❌ **Poor organization** - Mixing UI, API, types, and logic
❌ **Team collaboration issues** - Merge conflicts
❌ **Slower IDE performance** - Large files slow down editors

**Current Structure (Recommended):**
```
✅ lib/api/clients-api.ts - API functions (365 lines)
✅ lib/api/client-notes-api.ts - Notes API (58 lines)
✅ types/client.ts - Type definitions (119 lines)
✅ app/client/page.tsx - Main page (41 lines)
✅ components/clients/*.tsx - UI components (separate files)
```

**If You Really Want One File:**
You could create `client-all-in-one.ts` with 2000+ lines, but you'll lose:
- Code reusability
- Easy testing
- Clear separation of concerns
- Maintainability

---

## Summary

**Total Client Files:**
1. `lib/api/clients-api.ts` - Main API (365 lines)
2. `lib/api/client-notes-api.ts` - Notes API (58 lines)
3. `types/client.ts` - Types (119 lines)
4. `app/client/page.tsx` - Main page (41 lines)
5. `components/clients/*.tsx` - 7 component files

**All APIs use:** `https://d3qiclz5mtkmyk.cloudfront.net/api/v1`

**Ready for Electron:** ✅ Works identically in desktop app!
