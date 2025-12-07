# Cases Page – API Reference

This document explains **all APIs used for cases**, grouped by **UI action** on the cases-related pages.

---

## 1. Main Cases List Page (`/cases`)

### 1.1 Load / search / filter cases

- **UI place**:
  - `app/cases/page.tsx` → `CasesTable` (`components/cases/cases-table.tsx`)
  - Search input and status dropdown at the top of the table.
- **When it’s called**:
  - On page load of `/cases`.
  - When you change the search text.
  - When you change the status filter.
- **Frontend function**:
  - `getCases` from `lib/api/cases-api.ts` (re-export of `casesApi.getCases`).
- **HTTP request**:
  - `GET {NEXT_PUBLIC_API_URL}/user/cases`
  - **Query params**:
    - `status` (optional, case status or omitted for "all").
    - `query` (optional, free-text search).
    - `page` (default `1`).
    - `limit` (default `10`).
- **Used in code**:
  - `components/cases/cases-table.tsx`
    - `useEffect` → `fetchCases()` → `getCases({ status, query })`.

---

## 2. Eye (View) Buttons – Open Case Details

### 2.1 Eye button in cases table

- **UI place**:
  - Table row action Eye icon in `components/cases/cases-table.tsx`.
- **When you click Eye**:
  - It **navigates** to the case details page: `/cases/[id]`.
  - The actual data fetch for the case details happens on that page/component.
- **Navigation**:
  - `router.push(`/cases/${caseId}`)` in `viewCaseDetails(caseItem)`.

### 2.2 Eye button in client cases list

- **UI place**:
  - Client details → Cases table in `components/clients/client-cases.tsx`.
- **When you click Eye**:
  - Navigates to case details with serialized data in the URL query:
  - `router.push(`/cases/${caseItem._id}?data=${caseData}`)`.

### 2.3 API for loading a **single case** (used in details view)

- **Frontend function**:
  - `getCaseById` from `lib/api/cases-api.ts`.
- **HTTP request**:
  - `GET {NEXT_PUBLIC_API_URL}/cases/:caseId`
- **Intended usage**:
  - In the case details page/component to fetch the full case object when you open `/cases/[id]`.

---

## 3. Create New Case Buttons

There are **two main create flows**.

### 3.1 "Create New Case" page (`/cases/new`)

- **UI place**:
  - Route: `app/cases/new/page.tsx`.
  - Button to go here is usually a **New Case** button on the cases UI.
- **When you submit the form**:
  - Calls `createCase(payload)` from `lib/api/cases-api.ts`.
- **Frontend function**:
  - `createCase` (re-export of `casesApi.createCase`).
- **HTTP request**:
  - `POST {NEXT_PUBLIC_API_URL}/user/CreateCases`
- **Payload shape (simplified)**:
  - `title`
  - `description`
  - `status` (capitalized: `Pending`, `Approved`, `Rejected`)
  - `client_id`
  - `lawyer_id`
  - `summary`
  - `key_points[]`

### 3.2 Case creation dialog component (`CaseCreationForm`)

- **UI place**:
  - `components/cases/case-creation-form.tsx`
  - Likely triggered by a **"Create Case" / plus (+)** button in the cases header.
- **When you click "Create" in the dialog**:
  - Submits `CaseCreationForm`.
  - Calls `createCase(caseData)` from `lib/api/cases-api.ts`.
- **Frontend function**:
  - `createCase` from `lib/api/cases-api.ts` (same endpoint as above).
- **HTTP request**:
  - `POST {NEXT_PUBLIC_API_URL}/user/CreateCases`
- **Payload shape (simplified)**:
  - `title`, `description`
  - `case_identifier` (built from `court_name + case_code + case_number`)
  - `lawyer_id`
  - `status` (from `case_status` field)
  - `court_name`, `court_type`
  - `case_type`, `case_code`, `case_number`
  - Client-related fields (existing or new client)
  - `priority`, `expected_duration`, `notes` (optional)

---

## 4. Status Update – Buttons and Dialog

There are **two different technical paths** for status updates.

### 4.1 Status change from Case Details page

- **UI place**:
  - `components/cases/case-details.tsx`.
  - Could be buttons/dropdown to change status.
- **When you change status**:
  - Calls `handleStatusUpdate(newStatus)`.
  - Uses `updateCaseStatus` from `lib/api/cases-api.ts`.
- **Frontend function**:
  - `updateCaseStatus(caseId, status)`.
- **HTTP request**:
  - `PATCH {NEXT_PUBLIC_API_URL}/user/cases/:caseId/status`
  - Body: `{ status: <CaseStatus> }`.

### 4.2 Status change from Cases table dialog

- **UI place**:
  - `components/cases/cases-table.tsx` → opens `CaseStatusUpdateDialog` when you click the **Edit (pencil)** icon.
  - Component: `components/cases/case-status-update-dialog.tsx`.
- **When you click the Edit icon**:
  - `handleUpdateStatus(caseItem)` in `cases-table.tsx` opens the dialog.
- **When you submit the status in dialog**:
  - `CaseStatusUpdateDialog` calls its own `onSubmit`.
  - Uses a direct `fetch` (legacy/alternate path):
- **HTTP request in dialog**:
  - `PUT {NEXT_PUBLIC_API_URL}/case/:id`
  - Body: `{ status: <CaseStatus> }`.
- **After success**:
  - Dialog calls `onStatusUpdated(caseId, newStatus)` passed from `CasesTable`.
  - `CasesTable` updates the local `cases` state so the table shows the new status.

> Note: You may want to unify both flows to use **one** endpoint, preferably `PATCH /user/cases/:id/status` via `updateCaseStatus`.

---

## 5. Client → Cases listing

### 5.1 Load all cases for a specific client

- **UI place**:
  - `components/clients/client-cases.tsx`.
- **When it’s called**:
  - On mount, once a `clientId` is available.
- **Frontend function**:
  - `getClientCases(clientId, role)` from `lib/api/cases-api.ts` (imported there).
- **HTTP request (pattern)**:
  - Depends on the implementation of `getClientCases` (not fully shown), but typically:
    - `GET {NEXT_PUBLIC_API_URL}/user/client/:clientId/cases` or similar.
- **Usage notes**:
  - `role` argument is `'client'` if current user is lawyer, otherwise `'lawyer'`.

---

## 6. Next.js Internal API Route `/api/cases`

These are **server-side routes inside Next.js**, which themselves call the external REST API via the helpers above.

File: `app/api/cases/route.ts`

### 6.1 `GET /api/cases`

- **Purpose**:
  - Server-side proxy to list cases with filters.
- **Reads query params**:
  - `status`, `query`, `page`, `limit`.
- **Calls**:
  - `getCases({ status, query, page, limit })` from `lib/api/cases-api.ts`.
- **Returns**:
  - `{ cases }` JSON.

### 6.2 `POST /api/cases`

- **Purpose**:
  - Server-side proxy to create a case using a **frontend-friendly body**.
- **Field mapping**:
  - Uses `caseApiMapping.create` from `types/case.ts`:
    - `title` → `title`
    - `clientId` → `client_id`
    - `description` → `description`
    - `status` → `status`
    - `assignedTo` → `assigned_to`
    - `case_type` → `case_type`
    - `court_type` → `court_type`
- **Calls**:
  - `createCase(apiData)` from `lib/api/cases-api.ts`.
- **Returns**:
  - `{ case: newCase }` with status `201`.

Currently, the UI components you’re using **mostly call `createCase` and `getCases` directly**, not via `/api/cases`.

---

## 7. Quick mapping: Button → API

- **Eye button (Cases table)**
  - Action: Navigate to `/cases/[id]`.
  - API used on details page: `GET {NEXT_PUBLIC_API_URL}/cases/:id` via `getCaseById`.

- **Eye button (Client → Cases)**
  - Action: Navigate to `/cases/[id]?data=...`.
  - API used on details page: same as above (`getCaseById`).

- **Create New Case button (go to /cases/new)**
  - Action: Navigate to `/cases/new`.
  - On submit: `POST {NEXT_PUBLIC_API_URL}/user/CreateCases` via `createCase`.

- **Create Case button in `CaseCreationForm` dialog**
  - Action: Submit dialog form.
  - API: `POST {NEXT_PUBLIC_API_URL}/user/CreateCases` via `createCase` with extended data (court, codes, etc.).

- **Status change on Case Details page**
  - Action: Status buttons/dropdown.
  - API: `PATCH {NEXT_PUBLIC_API_URL}/user/cases/:id/status` via `updateCaseStatus`.

- **Edit (status) button in Cases table**
  - Action: Opens `CaseStatusUpdateDialog`.
  - Dialog submit: `PUT {NEXT_PUBLIC_API_URL}/case/:id` via `fetch`.

- **Client’s Cases list load**
  - Action: Load client’s cases section.
  - API: `getClientCases(...)` → some `GET` endpoint under `NEXT_PUBLIC_API_URL`.
