# Client System - Complete Documentation

This document provides comprehensive documentation for the client system including the client table, eye button functionality, client details page, and all related API calls.

## Table of Contents

1. [File Locations](#file-locations)
2. [Client Table Structure](#client-table-structure)
3. [Eye Button Functionality](#eye-button-functionality)
4. [API Endpoints](#api-endpoints)
5. [Client Details Page](#client-details-page)
6. [Client Features & APIs](#client-features--apis)
7. [Data Flow Analysis](#data-flow-analysis)
8. [Code Implementation](#code-implementation)

---

## File Locations

### 📁 Client System Files

| Component | File Path | Description |
|-----------|-----------|-------------|
| **Client Main Page** | `app/client/page.tsx` | Main clients listing page |
| **Client Table** | `components/clients/clients-table.tsx` | Clients table with eye button |
| **Client Details Page** | `app/client/[id]/page.tsx` | Individual client details page |
| **Client Details Component** | `components/clients/client-details.tsx` | Client details display component |
| **Client Documents** | `components/clients/client-documents.tsx` | Client documents management |
| **Client Cases** | `components/clients/client-cases.tsx` | Client-specific cases table |
| **Clients API** | `lib/api/clients-api.ts` | Clients API functions |
| **Meeting API** | `lib/api/meeting-api.ts` | Meeting/consultation API |
| **Files API** | `lib/api/files-api.ts` | Document management API |
| **Client Layout** | `components/layouts/client-layout.tsx` | Layout wrapper for client pages |

### 📁 Directory Structure
```
lawyer-app/
├── app/
│   └── client/
│       ├── page.tsx                    # Main clients page
│       └── [id]/
│           └── page.tsx                # Client details page
├── components/
│   ├── clients/
│   │   ├── clients-table.tsx           # Clients table with eye button
│   │   ├── client-details.tsx          # Client details component
│   │   ├── client-documents.tsx        # Client documents component
│   │   ├── client-cases.tsx            # Client cases component
│   │   └── clients-header.tsx          # Clients page header
│   └── layouts/
│       └── client-layout.tsx           # Client layout wrapper
├── lib/
│   └── api/
│       ├── clients-api.ts              # Clients API functions
│       ├── meeting-api.ts              # Meeting API functions
│       └── files-api.ts                # Files API functions
└── types/
    └── client.ts                       # Client type definitions
```

---

## Client Table Structure

### 1. Clients Table Component

**Location:** `components/clients/clients-table.tsx`

#### Table Columns:
- **Name** - Client/Lawyer full name with favorite star (⭐)
- **Email** - Contact email address
- **Phone** - Contact phone number
- **Address** - Physical address (truncated)
- **Charges** - Hourly rates (only visible to clients viewing lawyers)
- **Last Contact** - Last contact date
- **Actions** - Eye button (👁) for viewing details

#### Action Column Implementation:
```typescript
<TableCell>
  <button
    onClick={(e) => {
      e.stopPropagation();
      viewClientDetails(client);
    }}
    className="p-1 text-blue-600 hover:text-blue-800"
    title={t("common.viewDetails") || "View details"}
  >
    <Eye className="h-4 w-4" />
  </button>
</TableCell>
```

#### Row Click Functionality:
```typescript
<TableRow
  key={client.id}
  className={`hover:bg-muted/50 cursor-pointer ${
    index % 2 === 0 ? "bg-gray-50" : "bg-white"
  }`}
  onClick={() => viewClientDetails(client)}
>
```

**Note:** Both the entire row AND the eye button trigger the same `viewClientDetails` function.

---

## Eye Button Functionality

### 1. Eye Button Click Handler

**Location:** `components/clients/clients-table.tsx` (Line 204-208)

```typescript
// View client details
const viewClientDetails = (client: Client) => {
  console.log(client,"clientclientclientclientclientclientclientclientclientclient")
  const clientData = encodeURIComponent(JSON.stringify(client));
  router.push(`/client/${client.id}?data=${clientData}`);
};
```

### 2. What Happens When Eye Button is Clicked:

1. **Data Encoding**: The entire client object is JSON stringified and URL encoded
2. **Navigation**: User is redirected to `/client/{clientId}?data={encodedClientData}`
3. **No API Call**: The client details are passed via URL parameters, not fetched from API

### 3. Alternative API Available:

There is a `getClientById()` function available but not used in the eye button flow:

```typescript
export async function getClientById(id: string): Promise<Client | null> {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${id}`, {
      headers: getAuthHeaders()
    })
    // ... process response
  } catch (error) {
    console.error('Error fetching client by ID:', error)
    return null
  }
}
```

---

## API Endpoints

### 1. Get All Clients/Lawyers

**Endpoint:** `GET ${NEXT_PUBLIC_API_URL}/user/list` (for lawyers viewing clients)
**Endpoint:** `GET ${NEXT_PUBLIC_API_URL}/charges/lawyers-with-charges` (for clients viewing lawyers)

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Query Parameters (for /user/list):**
```json
{
  "accountType": "client|lawyer",
  "offset": 0,
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id_here",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "address": "123 Main St, City, State",
      "account_type": "client",
      "bio": "Client bio information",
      "charges": 150,
      "video_rate": 100,
      "chat_rate": 50,
      "pratice_area": "Criminal Law",
      "experience": "5 years",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Get Single Client by ID

**Endpoint:** `GET ${NEXT_PUBLIC_API_URL}/user/{userId}`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id_here",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "account_type": "client",
    "bio": "User bio",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Update Client Status

**Endpoint:** `PATCH ${NEXT_PUBLIC_API_URL}/user/{userId}/status`

**Request Body:**
```json
{
  "status": "active|inactive|pending"
}
```

### 4. Toggle Favorite

**Endpoint:** `PATCH ${NEXT_PUBLIC_API_URL}/user/{userId}/favorite`

**Request Body:**
```json
{
  "isFavorite": true
}
```

### 5. Toggle Blocked

**Endpoint:** `PATCH ${NEXT_PUBLIC_API_URL}/user/{userId}/block`

**Request Body:**
```json
{
  "isBlocked": true
}
```

---

## Client Details Page

### 1. Client Details Page Implementation

**Location:** `app/client/[id]/page.tsx`

#### Key Features:
- ✅ Receives client data via URL search parameters
- ✅ Parses JSON data from URL
- ✅ Displays client details without additional API call
- ✅ Shows "Not Found" if no client data available

#### Implementation:
```typescript
export default async function ClientDetailPage({ params, searchParams }: ClientPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  let clientData: Client | null = null
  
  if (resolvedSearchParams.data) {
    try {
      clientData = JSON.parse(decodeURIComponent(resolvedSearchParams.data)) as Client
    } catch (error) {
      console.error("Failed to parse client data from URL:", error)
    }
  }
  
  if (!clientData) {
    notFound()
  }

  return (
    <ClientLayout>
      <ClientDetails client={clientData} />
    </ClientLayout>
  )
}
```

### 2. Client Details Component Features

**Location:** `components/clients/client-details.tsx`

#### Tabs Available:
1. **Overview** - Basic client information
2. **Cases** - Client's cases (using ClientCases component)
3. **Documents** - Client's documents (using ClientDocuments component)

#### Key Features:
- ✅ Client information display
- ✅ Meeting scheduling functionality
- ✅ Video consultation integration
- ✅ Chat functionality
- ✅ Tabbed interface for different sections

---

## Client Features & APIs

### 1. Meeting Scheduling

**API:** `lib/api/meeting-api.ts`

#### Create Meeting Endpoint:
**Endpoint:** `POST ${NEXT_PUBLIC_API_URL}/meetings`

**Request Body:**
```json
{
  "lawyerId": "lawyer_id",
  "clientId": "client_id", 
  "meetingLink": "https://meet.google.com/abc-def-ghi",
  "meeting_title": "Legal Consultation",
  "meeting_description": "Discussion about case details",
  "requested_date": "2024-01-15",
  "requested_time": "14:00",
  "consultation_type": "paid",
  "hourly_rate": 150
}
```

**Response:**
```json
{
  "success": true,
  "meeting": {
    "_id": "meeting_id",
    "lawyer_id": {...},
    "client_id": {...},
    "meeting_link": "https://meet.google.com/abc-def-ghi",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Client Documents

**API:** `lib/api/files-api.ts`

#### Get Client Files:
**Endpoint:** `GET ${NEXT_PUBLIC_API_URL}/files/client/{clientId}`

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "file_id",
      "filename": "contract.pdf",
      "file_type": "pdf",
      "file_size": 1024000,
      "link": "https://storage.example.com/files/contract.pdf",
      "uploaded_at": "2024-01-01T00:00:00Z",
      "shared_with": ["lawyer_id"]
    }
  ]
}
```

### 3. Client Cases

**API:** `lib/api/cases-api.ts`

#### Get Client Cases:
**Endpoint:** `GET ${NEXT_PUBLIC_API_URL}/case/{account_type}/{clientId}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "case_id",
      "case_number": "CASE-2024-001",
      "title": "Contract Dispute",
      "description": "Case description",
      "status": "pending",
      "client_id": {...},
      "lawyer_id": {...},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4. Chat Functionality

**Component:** `SimpleChat`

#### Features:
- ✅ Real-time messaging
- ✅ Chat rate integration
- ✅ Client-lawyer communication

### 5. Video Consultations

#### Features:
- ✅ Meeting link integration
- ✅ Consultation scheduling
- ✅ Video rate management

---

## Data Flow Analysis

### 1. Client Table Loading

```
Page Load → getClients() API Call → Display Clients in Table
    ↓
Determine user role (lawyer/client)
    ↓
If lawyer: GET /user/list?accountType=client
If client: GET /charges/lawyers-with-charges
    ↓
{success: true, data: [...]} or {success: true, lawyers: [...]}
    ↓
Transform data to Client interface
    ↓
Render table with Eye buttons
```

### 2. Eye Button Click Flow

```
Eye Button Click → viewClientDetails(client)
    ↓
Encode client data: JSON.stringify(client)
    ↓
Navigate to: /client/{id}?data={encodedData}
    ↓
Client Details Page receives data via URL params
    ↓
Parse and display client details (NO API CALL)
    ↓
Load additional data:
- Client Cases (API call)
- Client Documents (API call)
```

### 3. Client Details Sub-Components

```
Client Details Page
    ↓
├── Overview Tab (from URL data)
├── Cases Tab → ClientCases component → API call to get cases
└── Documents Tab → ClientDocuments component → API call to get files
```

---

## Code Implementation

### 1. Clients API Service

**Location:** `lib/api/clients-api.ts`

#### Get Clients Function:
```typescript
export async function getClients({
  status = "all",
  query = "",
  page = 1,
  limit = 10,
}: GetClientsParams = {}) {
  try {
    const currentUser = getCurrentUser()
    
    // Determine what type of users to fetch based on current user's role
    let accountType: string
    if (currentUser.account_type === 'lawyer') {
      accountType = 'client' // Lawyers see clients
    } else if (currentUser.account_type === 'client') {
      accountType = 'lawyer' // Clients see lawyers
    }

    // If client is viewing lawyers, use the lawyers-with-charges endpoint
    let response
    if (currentUser.account_type === 'client' && accountType === 'lawyer') {
      response = await axios.get(`${API_BASE_URL}/charges/lawyers-with-charges`, {
        headers: getAuthHeaders()
      })
    } else {
      response = await axios.get(`${API_BASE_URL}/user/list`, {
        headers: getAuthHeaders(),
        params: { accountType, offset: (page - 1) * limit, limit }
      })
    }

    // Transform backend response to match Client interface
    const users = (currentUser.account_type === 'client' && accountType === 'lawyer') 
      ? response.data.lawyers || []
      : response.data.data || []
      
    return users.map((user: any) => ({
      id: user._id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || 'N/A',
      address: user.address || 'N/A',
      charges: user.charges || 0,
      video_rate: user.video_rate || 0,
      chat_rate: user.chat_rate || 0,
      // ... other fields
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}
```

### 2. Authentication Headers

```typescript
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {}
  
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}
```

### 3. Meeting Creation

```typescript
export const createMeeting = async (meetingData: CreateMeetingData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/meetings`, meetingData, {
      headers: getAuthHeaders()
    })
    return response.data
  } catch (error) {
    console.error('Error creating meeting:', error)
    throw error
  }
}
```

---

## Client Status System

### Available Statuses:
- `active` - Active client/lawyer
- `inactive` - Inactive client/lawyer  
- `pending` - Pending approval

### Status Badge Colors:
- **Pending**: Yellow background with yellow text
- **Active**: Green background with green text
- **Inactive**: Red background with red text

---

## Key Findings

### 🔍 Important Notes:

1. **Role-Based Display**: The client table shows different users based on the current user's role:
   - **Lawyers** see **clients**
   - **Clients** see **lawyers** (with charges/rates)

2. **No API Call for Client Details**: When the eye button is clicked, the client details page does NOT make an API call for basic client info. Instead, it receives the complete client data via URL parameters.

3. **Sub-Component API Calls**: While the main client details don't require an API call, the sub-components (Cases, Documents) do make their own API calls.

4. **Dual Navigation**: Both the table row click AND the eye button trigger the same navigation function.

5. **Meeting Integration**: Client details page includes meeting scheduling functionality with video consultation integration.

6. **Document Management**: Clients can upload and share documents with lawyers.

7. **Chat Integration**: Real-time chat functionality between clients and lawyers.

---

## Recommendations

### 1. Consider API-Based Approach
For better security and data freshness, consider using the `getClientById()` API:

```typescript
// Alternative implementation
const viewClientDetails = (client: Client) => {
  router.push(`/client/${client.id}`)
  // Let the details page fetch fresh data via API
}
```

### 2. Add Loading States
Consider adding loading states when navigating to client details.

### 3. Error Handling
Add better error handling for URL parameter parsing failures.

### 4. Security Considerations
URL-based data passing exposes client information in browser history and logs.

### 5. Optimize API Calls
Consider implementing caching for frequently accessed client data.
