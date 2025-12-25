# Cases System - Complete Documentation

This document provides comprehensive documentation for the cases system including the cases table, eye button functionality, and case details API calls.

## Table of Contents

1. [File Locations](#file-locations)
2. [Cases Table Structure](#cases-table-structure)
3. [Eye Button Functionality](#eye-button-functionality)
4. [API Endpoints](#api-endpoints)
5. [Case Details Flow](#case-details-flow)
6. [Data Flow Analysis](#data-flow-analysis)
7. [Code Implementation](#code-implementation)

---

## File Locations

### 📁 Cases System Files

| Component | File Path | Description |
|-----------|-----------|-------------|
| **Cases Main Page** | `app/cases/page.tsx` | Main cases listing page |
| **Cases Table** | `components/cases/cases-table.tsx` | Cases table with eye button |
| **Case Details Page** | `app/cases/[id]/page.tsx` | Individual case details page |
| **Case Details Component** | `components/cases/case-details.tsx` | Case details display component |
| **Client Cases** | `components/clients/client-cases.tsx` | Cases table for specific client |
| **Cases API** | `lib/api/cases-api.ts` | Cases API functions |
| **Cases Layout** | `components/layouts/cases-layout.tsx` | Layout wrapper for cases pages |
| **API Endpoints** | `constant/endpoints.ts` | API endpoint configurations |

### 📁 Directory Structure
```
lawyer-app/
├── app/
│   ├── cases/
│   │   ├── page.tsx                    # Main cases page
│   │   └── [id]/
│   │       └── page.tsx                # Case details page
├── components/
│   ├── cases/
│   │   ├── cases-table.tsx             # Cases table with eye button
│   │   ├── case-details.tsx            # Case details component
│   │   └── case-documents.tsx          # Case documents component
│   ├── clients/
│   │   └── client-cases.tsx            # Client-specific cases table
│   └── layouts/
│       └── cases-layout.tsx            # Cases layout wrapper
├── lib/
│   └── api/
│       └── cases-api.ts                # Cases API functions
└── constant/
    └── endpoints.ts                    # API endpoints
```

---

## Cases Table Structure

### 1. Main Cases Table

**Location:** `components/cases/cases-table.tsx`

#### Table Columns:
- **Case Number** - Unique case identifier
- **Title** - Case title/name
- **Client** - Associated client name
- **Status** - Current case status with colored badges
- **Court Type** - Type of court handling the case
- **Case Type** - Category of the case
- **Created** - Case creation date
- **Updated** - Last update date
- **Actions** - Eye button (👁) and Edit button (for lawyers)

#### Action Column Implementation:
```typescript
<TableCell>
  <div className="flex items-center gap-2">
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => viewCaseDetails(caseItem)} 
      className="h-8 w-8"
      aria-label={t("pages:common.viewDetails")}
    >
      <Eye className="h-4 w-4" />
    </Button>
    {profile?.account_type === 'lawyer' && (
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleUpdateStatus(caseItem)} 
        className="h-8 w-8"
        aria-label={t("pages:cases.updateStatus")}
      >
        <Edit3 className="h-4 w-4" />
      </Button>
    )}
  </div>
</TableCell>
```

### 2. Client Cases Table

**Location:** `components/clients/client-cases.tsx`

Similar structure but filtered for a specific client with simplified action column containing only the eye button.

---

## Eye Button Functionality

### 1. Eye Button Click Handler

**Location:** `components/cases/cases-table.tsx` (Line 116-120)

```typescript
// View case details
const viewCaseDetails = (caseItem: Case) => {
  // Encode case data as URL search params to pass to details page
  const caseData = encodeURIComponent(JSON.stringify(caseItem))
  router.push(`/cases/${caseItem._id}?data=${caseData}`)
}
```

### 2. What Happens When Eye Button is Clicked:

1. **Data Encoding**: The entire case object is JSON stringified and URL encoded
2. **Navigation**: User is redirected to `/cases/{caseId}?data={encodedCaseData}`
3. **No API Call**: The case details are passed via URL parameters, not fetched from API

### 3. Client Cases Eye Button

**Location:** `components/clients/client-cases.tsx` (Line 54-58)

```typescript
const viewCaseDetails = (caseItem: Case) => {
  const caseData = encodeURIComponent(JSON.stringify(caseItem))
  console.log(caseItem, "caseItemcaseItemcaseItemcaseItemcaseItemcaseItem")
  router.push(`/cases/${caseItem._id}?data=${caseData}`)
}
```

---

## API Endpoints

### 1. Get All Cases

**Endpoint:** `GET ${NEXT_PUBLIC_API_URL}/user/cases`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Query Parameters:**
```json
{
  "page": "1",
  "limit": "10",
  "status": "pending|approved|rejected|in_progress|...", // Optional
  "query": "search term" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "cases": [
    {
      "_id": "case_id_here",
      "case_number": "CASE-2024-001",
      "title": "Contract Dispute Case",
      "description": "Case description here",
      "summary": "Case summary",
      "status": "pending",
      "client_id": {
        "_id": "client_id",
        "first_name": "John",
        "last_name": "Doe"
      },
      "lawyer_id": {
        "_id": "lawyer_id", 
        "first_name": "Jane",
        "last_name": "Smith"
      },
      "court_type": "district",
      "case_type": "civil",
      "files": [],
      "important_dates": [],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

### 2. Get Single Case by ID

**Endpoint:** `GET ${NEXT_PUBLIC_API_URL}/cases/{caseId}`

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
  "case": {
    "_id": "case_id_here",
    "case_number": "CASE-2024-001",
    "title": "Contract Dispute Case",
    "description": "Detailed case description",
    "summary": "Case summary",
    "status": "pending",
    "client_id": "client_id",
    "lawyer_id": "lawyer_id",
    "files": [],
    "important_dates": [],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Get Client Cases

**Endpoint:** `GET ${NEXT_PUBLIC_API_URL}/case/{account_type}/{clientId}`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Path Parameters:**
- `account_type`: "client" or "lawyer"
- `clientId`: The client's ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "case_id",
      "case_number": "CASE-2024-001",
      "title": "Case Title",
      "description": "Case description",
      "status": "pending",
      "client_id": {
        "_id": "client_id",
        "first_name": "John",
        "last_name": "Doe"
      },
      "lawyer_id": {
        "_id": "lawyer_id",
        "first_name": "Jane", 
        "last_name": "Smith"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 4. Create New Case

**Endpoint:** `POST ${NEXT_PUBLIC_API_URL}/user/CreateCases`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "title": "New Case Title",
  "description": "Case description",
  "client_id": "client_id_here",
  "case_type": "civil",
  "court_type": "district",
  "status": "pending"
}
```

### 5. Update Case Status

**Endpoint:** `PATCH ${NEXT_PUBLIC_API_URL}/cases/{caseId}/status`

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "status": "approved|rejected|in_progress|pending|..."
}
```

---

## Case Details Flow

### 1. Navigation Flow

```
Cases Table → Eye Button Click → Case Details Page
     ↓              ↓                    ↓
Load cases    Pass case data      Display case details
from API      via URL params      from URL params
```

### 2. Case Details Page Implementation

**Location:** `app/cases/[id]/page.tsx`

#### Key Features:
- ✅ Receives case data via URL search parameters
- ✅ Parses JSON data from URL
- ✅ Displays case details without additional API call
- ✅ Shows "Not Found" if no case data available

#### Implementation:
```typescript
export default async function CasePage({ params, searchParams }: CasePageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  let caseData: Case | null = null

  // Try to get case data from URL search params
  if (resolvedSearchParams.data) {
    try {
      caseData = JSON.parse(decodeURIComponent(resolvedSearchParams.data)) as Case
    } catch (error) {
      console.error("Failed to parse case data from URL:", error)
    }
  }

  // If no case data is available, show not found
  if (!caseData) {
    notFound()
  }

  return (
    <CasesLayout>
      <CaseDetails caseData={caseData} />
    </CasesLayout>
  )
}
```

### 3. Case Details Component

**Location:** `components/cases/case-details.tsx`

#### Features:
- ✅ Displays case information (title, description, status, dates)
- ✅ Shows case documents
- ✅ Status update functionality (for lawyers)
- ✅ Internationalization support
- ✅ Status badges with color coding

---

## Data Flow Analysis

### 1. Cases Table Loading

```
Page Load → getCases() API Call → Display Cases in Table
    ↓
GET /user/cases
    ↓
{success: true, cases: [...]}
    ↓
Render table with Eye buttons
```

### 2. Eye Button Click Flow

```
Eye Button Click → viewCaseDetails(caseItem)
    ↓
Encode case data: JSON.stringify(caseItem)
    ↓
Navigate to: /cases/{id}?data={encodedData}
    ↓
Case Details Page receives data via URL params
    ↓
Parse and display case details (NO API CALL)
```

### 3. Alternative Flow (If API Call Was Used)

**Note:** Currently NOT implemented, but could be:

```
Eye Button Click → Navigate to /cases/{id}
    ↓
Case Details Page loads
    ↓
useEffect calls getCaseById(id)
    ↓
GET /cases/{id}
    ↓
Display fetched case details
```

---

## Code Implementation

### 1. Cases API Service

**Location:** `lib/api/cases-api.ts`

#### Get Cases Function:
```typescript
getCases: async ({
  status = "all",
  query = "",
  page = 1,
  limit = 10,
}: GetCasesParams = {}): Promise<CasesApiResponse> => {
  try {
    const params: any = {
      page: page.toString(),
      limit: limit.toString()
    }
    
    if (status && status !== "all") {
      params.status = status
    }
    
    if (query && query.trim()) {
      params.query = query.trim()
    }

    const response = await axios.get(`${API_BASE_URL}/user/cases`, {
      headers: getAuthHeaders(),
      params
    })

    return {
      success: response.data.success || true,
      cases: response.data.cases || [],
      total: response.data.total,
      page: page,
      limit: limit
    }
  } catch (error) {
    console.error('Error fetching cases:', error)
    throw error
  }
}
```

#### Get Case by ID Function:
```typescript
getCaseById: async (caseId: string): Promise<{ success: boolean; case: Case }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/cases/${caseId}`, {
      headers: getAuthHeaders()
    })
    return response.data
  } catch (error) {
    console.error('Error fetching case:', error)
    throw error
  }
}
```

### 2. Authentication Headers

```typescript
const getAuthHeaders = () => {
  const token = getToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

const getToken = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).token : null;
  }
  return null;
};
```

---

## Case Status System

### Available Statuses:

#### Judgment Outcomes (판결 종국):
- `full_win` - Full Win
- `full_loss` - Full Loss  
- `partial_win` - Partial Win
- `partial_loss` - Partial Loss
- `dismissal` - Dismissal
- `rejection` - Rejection

#### Non-Judgment Outcomes (판결 외 종국):
- `withdrawal` - Withdrawal
- `mediation` - Mediation
- `settlement` - Settlement
- `trial_cancellation` - Trial Cancellation
- `suspension` - Suspension
- `closure` - Closure

#### Active Case Statuses:
- `in_progress` - In Progress
- `pending` - Pending

---

## Key Findings

### 🔍 Important Notes:

1. **No API Call for Case Details**: When the eye button is clicked, the case details page does NOT make an API call. Instead, it receives the complete case data via URL parameters.

2. **Data Passing Method**: Case data is JSON stringified, URL encoded, and passed as a query parameter.

3. **Fallback API Available**: There is a `getCaseById()` function available but it's not currently used in the eye button flow.

4. **Two Cases Tables**: There are two different cases tables - one for all cases and one for client-specific cases, both using the same eye button pattern.

5. **Authentication Required**: All API calls require Bearer token authentication from localStorage.

---

## Recommendations

### 1. Consider API-Based Approach
Instead of passing data via URL, consider using the `getCaseById()` API for better security and data freshness:

```typescript
// Alternative implementation
const viewCaseDetails = (caseItem: Case) => {
  router.push(`/cases/${caseItem._id}`)
  // Let the details page fetch fresh data via API
}
```

### 2. Add Error Handling
Add better error handling for URL parameter parsing failures.

### 3. Add Loading States
Consider adding loading states when navigating to case details.

### 4. Security Considerations
URL-based data passing exposes case information in browser history and logs.
