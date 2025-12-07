# Video Consultations API Documentation - Lawyer Side

## Overview

This document provides a comprehensive overview of all APIs and functionality specifically for **lawyers** in the video consultation system of the lawyer app, including their endpoints, permissions, and workflow.

## Core API Files for Lawyers

### 1. `lib/api/meeting-api-updated.ts` - **REAL PRODUCTION LAWYER API**

This is the **ONLY** API file lawyers actually use in production. All lawyer functionality goes through this real backend API.

#### Lawyer-Specific Functions (REAL APIs)

| Function | Parameters | Returns | What Lawyer Sees & Does |
|----------|------------|---------|------------------------|
| `getMeetings()` | None | `Promise<MeetingResponse>` | **Loads all consultations** - lawyer sees pending requests, approved meetings, completed sessions |
| `getPendingMeetings()` | None | `Promise<MeetingResponse>` | **Shows only pending client requests** - lawyer sees who needs approval |
| `approveMeeting(meetingId)` | `meetingId: string` | `Promise<MeetingResponse>` | **Approves client requests** - lawyer clicks "Approve" button, client gets notification |
| `rejectMeeting(meetingId, reason)` | `meetingId: string, reason?: string` | `Promise<MeetingResponse>` | **Rejects with reason** - lawyer clicks "Reject", optionally adds reason |
| `updateMeeting(meetingId, updateData)` | `meetingId: string, updateData: Partial<CreateMeetingData>` | `Promise<MeetingResponse>` | **Edits consultation details** - lawyer changes time, rate, adds notes |
| `createMeeting(data)` | `CreateMeetingData` | `Promise<MeetingResponse>` | **Schedules consultations** - lawyer creates meetings directly for clients |

#### Real Lawyer API Endpoints (PRODUCTION)

| Method | Endpoint | What Lawyer Does |
|--------|----------|-----------------|
| `GET` | `/api/v1/meeting/list` | **Views dashboard** - sees all consultations |
| `GET` | `/api/v1/meeting/pending` | **Checks pending requests** - sees who needs approval |
| `PUT` | `/api/v1/meeting/approve/{id}` | **Approves requests** - clicks approve button |
| `PUT` | `/api/v1/meeting/reject/{id}` | **Rejects requests** - clicks reject button |
| `PUT` | `/api/v1/meeting/edit/{id}` | **Edits meetings** - modifies consultation details |
| `POST` | `/api/v1/meeting/create` | **Creates consultations** - schedules for clients |

#### What Lawyer Actually Sees in Real Data

```typescript
// REAL consultation data lawyer sees in their dashboard
interface Meeting {
  _id: string
  lawyer_id: User         // Current lawyer (themselves)
  client_id: User         // Client who requested/is scheduled
  created_by: User        // Who created the request (client or lawyer)
  meeting_title: string   // "Legal Consultation - Contract Review"
  meeting_description?: string  // Client's description or lawyer's notes
  requested_date: string  // "2025-03-24"
  requested_time?: string // "09:30"
  meeting_link?: string   // "https://meet.google.com/xyz123" (set by lawyer after approval)
  consultation_type?: 'free' | 'paid'  // Lawyer sets this when creating
  hourly_rate?: number    // 150 (lawyer's rate - can be custom per consultation)
  custom_fee?: boolean    // true if lawyer set custom rate
  status: 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'active' | 'completed' | 'cancelled'
  approval_date?: string  // Set when lawyer approves
  rejection_reason?: string  // "Schedule conflict" (set when lawyer rejects)
  notes?: string          // Lawyer's private notes about consultation
  createdAt: string
  updatedAt: string
}

// REAL API response lawyer gets
interface MeetingResponse {
  success: boolean
  meeting?: Meeting       // Single meeting
  meetings?: Meeting[]    // Array of meetings
  data?: Meeting | Meeting[] | any
  message?: string        // "Consultation approved successfully"
}
```

#### REAL Lawyer API Usage Examples

```typescript
// 1. Lawyer loads their dashboard - sees all consultations
const meetings = await getMeetings()
// Lawyer sees: pending requests, approved meetings, completed sessions

// 2. Lawyer approves a client request
await approveMeeting("meetingId123")
// Client gets notification, status changes to "approved"

// 3. Lawyer rejects with reason
await rejectMeeting("meetingId456", "Schedule conflict - fully booked")
// Client gets notification with reason

// 4. Lawyer creates consultation directly for client
const newMeeting = await createMeeting({
  lawyerId: "currentLawyerId",
  clientId: "selectedClientId", 
  meeting_title: "Follow-up Consultation",
  consultation_type: "paid",
  hourly_rate: 200,  // Custom rate for this client
  requested_date: "2025-03-25",
  requested_time: "14:00"
})
// No approval needed - lawyer creates directly
```

### 2. `lib/api/notifications-api.ts` - **REAL Lawyer Notification System**

**REAL PRODUCTION API** - lawyers use this to send notifications to clients about consultation updates.

#### REAL Lawyer Notification Functions

| Function | Parameters | Returns | What Lawyer Actually Does |
|----------|------------|---------|--------------------------|
| `getNotifications(params)` | `{ page?: number, limit?: number, unreadOnly?: boolean }` | `Promise<NotificationsResponse>` | **Views notifications** - sees new consultation requests |
| `createNotification(data)` | Notification data | `Promise<{ success: boolean; notification: Notification; message: string }>` | **Sends notifications to clients** - after approval/rejection |
| `markAsRead(notificationId)` | `notificationId: string` | `Promise<{ success: boolean; message: string }>` | **Marks notifications as read** - cleans up dashboard |
| `getUnreadCount()` | None | `Promise<UnreadCountResponse>` | **Checks unread count** - sees badge number |

#### REAL Lawyer Notification Types

- `video_consultation_started` - **New client consultation requests** (what lawyer sees)
- `case_status_changed` - **Status updates** (what lawyer sends to clients)

#### REAL Lawyer Notification Example

```typescript
// Lawyer sends notification to client after approving consultation
await notificationsApi.createNotification({
  userId: "client123",           // Client gets this notification
  title: "Consultation Approved",
  message: "Your video consultation has been approved for March 24, 2025 at 9:30 AM",
  type: 'video_consultation_started',
  relatedId: "meetingId456",
  relatedType: 'meeting',
  redirectUrl: '/video-consultations',
  priority: 'high'               // Client sees this as important
})
// Result: Client gets immediate notification about approval
```

## Important Files for Lawyers - Video Consultation System

### Primary Lawyer Page

#### `app/video-consultations/page.tsx` - **REAL Lawyer Dashboard**

**What Lawyer Actually Sees:** This is the main page lawyers use every day to manage consultations.

**REAL Lawyer Interface:**
```typescript
// Lawyer sees this page with:
- "New Consultation" button (top right)
- Consultation table showing all their meetings
- Integration with consultation scheduling modal
- Real-time updates when clients request consultations
```

**REAL Lawyer Features:**
- **View all client consultation requests** in one dashboard
- **Click "New Consultation"** to schedule directly for clients
- **See real-time updates** when new requests come in
- **Filter and search** through consultations

### Core Lawyer Components (REAL UI)

#### `components/video-consultations/video-consultation-table.tsx` - **LAWYER'S MAIN WORKSPACE**

**What Lawyer Actually Uses:** This is the most important component - it's where lawyers spend most of their time managing consultations.

**REAL Lawyer Table View - EXACTLY WHAT LAWYER SEES:**

```
Video Consultations
Manage video consultations, schedule new meetings, and track consultation status.
[New consultation]

Meeting Management
Manage your scheduled meetings, connect to video calls, and track meeting status.
[All Status ▼]

| Client Name      | Lawyer Name    | Rate & Type                     | Scheduled Time              | End Time                    | Status           | Meeting Link                           | Actions          |
|------------------|----------------|---------------------------------|-----------------------------|-----------------------------|------------------|----------------------------------------|------------------|
| Akshay bondre    | dasom kim      | $0                              | Oct 25, 2025 at 00:30       | Oct 25, 2025 at 01:30 AM    | Pending Approval | https://meet.google.com/consultation-96fgdewcp2s | [Approve][Reject] |
| Jane Smith       | John Lawyer    | $150/hr                         | Oct 26, 2025 at 2:00 PM     | Oct 26, 2025 at 3:00 PM     | Approved         | https://meet.google.com/xyz123         | [Edit][Connect]  |
| Mike Johnson     | Sarah Attorney | Free                            | Oct 24, 2025 at 10:00 AM    | Oct 24, 2025 at 11:00 AM    | Active           | https://meet.google.com/abc456         | [Connect]        |
| Emily Davis      | Robert Legal   | $200/hr                         | Oct 23, 2025 at 3:30 PM     | Oct 23, 2025 at 4:30 PM     | Completed        | https://meet.google.com/def789         | [View Details]   |
```

**REAL Lawyer Interface Elements:**
- **Header:** "Video Consultations" with description
- **New Consultation Button:** Top-right to schedule directly
- **Meeting Management Section:** Status filter dropdown
- **Table Columns:** 
  - Client Name (who requested consultation)
  - Lawyer Name (current lawyer sees their name)
  - Rate & Type (shows pricing and consultation type)
  - Scheduled Time (when consultation starts)
  - End Time (when consultation ends)
  - Status (Pending Approval, Approved, Active, Completed)
  - Meeting Link (Google Meet URL)
  - Actions (buttons only lawyers see)

**REAL Lawyer Actions by Status:**
- **Pending Approval:** [Approve] [Reject] buttons (only lawyers see these)
- **Approved:** [Edit] [Connect] buttons
- **Active:** [Connect] button (join ongoing meeting)
- **Completed:** [View Details] button

**REAL Korean Text Support (as shown in your example):**
- **Paid Consultation:** "유료 영상 상담"
- **Rate Display:** "유료 영상 상담 시간당 500 토큰"
- **Status Labels:** Support for multiple languages

**REAL Lawyer Functions:**
```typescript
// These are the actual functions lawyers use:
- fetchMeetings()           // Loads their consultation list
- handleApproveMeeting()    // Clicks "Approve" on pending requests
- handleRejectMeeting()     // Clicks "Reject" with reason
- handleEditMeeting()       // Changes time/rate for existing consultations
- handleConnectToMeeting()  // Joins approved video calls
- shouldShowApproveReject() // Shows approve/reject buttons only to lawyers
```

**REAL API Calls Made:**
- `getMeetings()` - Load all consultations on page load
- `approveMeeting()` - When lawyer clicks "Approve"
- `rejectMeeting()` - When lawyer clicks "Reject"
- `updateMeeting()` - When lawyer edits consultation details

#### `components/modals/consultation-type-modal.tsx` - **LAWYER'S SCHEDULING WORKFLOW**

**What Lawyer Actually Does:** This modal opens when lawyer clicks "New Consultation" button.

**REAL Lawyer Scheduling Steps:**
1. **Choose Type:** Free or Paid consultation
2. **Select Client:** Browse lawyer's existing client list
3. **Set Details:** Date, time, custom rates (if paid)
4. **Create & Notify:** Schedule and notify client automatically

**REAL Lawyer Features in This Modal:**
- **Free vs Paid selection** - Lawyer decides consultation type
- **Client selection** - Shows only lawyer's clients
- **Custom rate setting** - Set per-consultation pricing
- **Direct scheduling** - No approval needed (lawyer creates directly)
- **Date/time picker** - Set consultation schedule
- **Meeting link generation** - Creates video meeting link

**REAL Lawyer API Usage:**
```typescript
// When lawyer creates consultation:
- createMeeting()          // Creates consultation directly
- createNotification()     // Notifies client automatically
- getRelatedUsers()        // Loads lawyer's client list
```

**REAL Lawyer Workflow:**
```typescript
// Lawyer's actual scheduling process:
1. Click "New Consultation" → Opens modal
2. Select "Paid" → Shows rate options
3. Choose client from list → Shows client info
4. Set custom rate $200/hr → Calculates total
5. Pick date/time → Schedule consultation
6. Click "Schedule" → Creates meeting, notifies client
7. Consultation appears in table as "Approved"
```

#### `components/ui/video-consultation-dialog.tsx` - **LAWYER'S QUICK SCHEDULER**

**What Lawyer Uses:** Alternative way to schedule consultations with specific clients.

**REAL Lawyer Quick Scheduling:**
- **Direct client scheduling** - Skip the multi-step modal
- **Custom rate input** - Set specific rates
- **Token balance check** - Verify client can pay
- **Meeting link creation** - Generate video call link

### Supporting Lawyer Components (REAL TOOLS)

#### `components/modals/edit-meeting-modal.tsx` - **LAWYER'S EDITOR**

**What Lawyer Actually Does:** Edit existing consultation details.

**REAL Lawyer Edit Capabilities:**
- **Change date/time** - Reschedule consultations
- **Adjust rates** - Modify consultation pricing
- **Update meeting link** - Change video call URL
- **Add notes** - Private consultation notes
- **Change consultation type** - Switch between free/paid

#### `components/modals/schedule-meeting-modal.tsx` - **LAWYER'S ALTERNATIVE SCHEDULER**

**What Lawyer Uses:** Another way to schedule meetings with clients.

**REAL Lawyer Features:**
- **Client selection** from lawyer's client base
- **Rate display** for transparency
- **Meeting link generation** and management

#### `hooks/useNotificationToasts.ts` - Lawyer Notifications

**Purpose:** Toast notifications for lawyer consultation events
**Lawyer Features:**
- **Approval/rejection confirmations**
- **New consultation request alerts**
- **Status update notifications**
- **Error handling for lawyer actions**

## REAL Lawyer Workflow - How APIs Actually Work

### **LAWYER'S DAILY WORKFLOW - What Actually Happens**

#### **1. Lawyer Starts Day - Opens Dashboard**
```typescript
// Lawyer navigates to /video-consultations
// Page automatically calls:
await getMeetings()  // Loads all consultations

// Lawyer sees EXACTLY this interface:
Video Consultations
Manage video consultations, schedule new meetings, and track consultation status.
[New consultation]

Meeting Management
Manage your scheduled meetings, connect to video calls, and track meeting status.
[All Status ▼]

| Client Name      | Lawyer Name    | Rate & Type                     | Scheduled Time              | End Time                    | Status           | Meeting Link                           | Actions          |
|------------------|----------------|---------------------------------|-----------------------------|-----------------------------|------------------|----------------------------------------|------------------|
| Akshay bondre    | dasom kim      | $0                              | Oct 25, 2025 at 00:30       | Oct 25, 2025 at 01:30 AM    | Pending Approval | https://meet.google.com/consultation-96fgdewcp2s | [Approve][Reject] |
| Jane Smith       | John Lawyer    | $150/hr                         | Oct 26, 2025 at 2:00 PM     | Oct 26, 2025 at 3:00 PM     | Approved         | https://meet.google.com/xyz123         | [Edit][Connect]  |
| Mike Johnson     | Sarah Attorney | Free                            | Oct 24, 2025 at 10:00 AM    | Oct 24, 2025 at 11:00 AM    | Active           | https://meet.google.com/abc456         | [Connect]        |
```

#### **2. Lawyer Reviews Pending Requests**
```typescript
// Lawyer sees "Pending Approval" status for Akshay bondre
// Client requested: Oct 25, 2025 at 00:30
// Rate: $0 (Free consultation)
// Meeting link: https://meet.google.com/consultation-96fgdewcp2s

// Lawyer clicks "Approve" button:
await approveMeeting("meetingId123")

// What happens behind the scenes:
1. API call to PUT /api/v1/meeting/approve/123
2. Backend updates status from "Pending Approval" to "Approved"
3. Client (Akshay bondre) gets notification automatically
4. Table refreshes to show "Approved" status
5. "Connect" button becomes available for lawyer
6. Client can now join the meeting at scheduled time
```

#### **3. Lawyer Rejects with Reason**
```typescript
// Lawyer clicks "Reject" for a pending request
// Modal opens: "Reason for rejection?"
// Lawyer types: "Schedule conflict - fully booked"

await rejectMeeting("meetingId456", "Schedule conflict - fully booked")

// What happens:
1. API call to PUT /api/v1/meeting/reject/456
2. Backend adds rejection reason
3. Client gets notification: "Your consultation was rejected: Schedule conflict - fully booked"
4. Request disappears from lawyer's pending list
5. Client sees rejection in their dashboard
```

#### **4. Lawyer Joins Video Consultation**
```typescript
// Lawyer sees "Approved" consultation with "Connect" button
// Example: Jane Smith - Oct 26, 2025 at 2:00 PM - $150/hr
// Meeting link: https://meet.google.com/xyz123

// Lawyer clicks "Connect" button:
handleConnectToMeeting(meeting)

// What happens:
1. Opens meeting.meeting_link in new tab: https://meet.google.com/xyz123
2. Status updates from "Approved" to "Active"
3. Both lawyer and client can now join the video call
4. Meeting timer starts (if applicable)
5. Lawyer can see client joined status
```

#### **5. Lawyer Edits Consultation Details**
```typescript
// Lawyer sees "Approved" consultation and clicks "Edit"
// Edit modal opens with current details:
- Client: Jane Smith
- Date: Oct 26, 2025 at 2:00 PM
- Rate: $150/hr
- Meeting Link: https://meet.google.com/xyz123

// Lawyer changes time to 3:00 PM and rate to $175/hr:
await updateMeeting("meetingId123", {
  requested_time: "15:00",
  hourly_rate: 175
})

// What happens:
1. API call to PUT /api/v1/meeting/edit/123
2. Backend updates consultation details
3. Client gets notification about schedule/rate change
4. Table refreshes with new details
```

### **REAL LAWYER API AUTHENTICATION**

```typescript
// Every lawyer API call uses this authentication:
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')  // Lawyer's JWT token
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Permission check (only lawyers can approve):
const shouldShowApproveReject = (meeting) => {
  return currentUser?.account_type === 'lawyer' && 
         meeting.status === 'pending_approval'
}
```

### **REAL LAWYER ERROR HANDLING**

```typescript
// When lawyer approves consultation:
try {
  const response = await approveMeeting(meetingId)
  if (response.success) {
    toast({
      title: "✅ Consultation Approved",
      description: "Client has been notified"
    })
    // Table refreshes automatically
  } else {
    throw new Error(response.message)
  }
} catch (error) {
  toast({
    title: "❌ Approval Failed",
    description: error.message,
    variant: "destructive"
  })
}
```

## **PRODUCTION ENVIRONMENT ONLY**

**IMPORTANT:** Lawyers only use PRODUCTION APIs - no mock data:

- ✅ **REAL API:** `lib/api/meeting-api-updated.ts` 
- ❌ **MOCK API:** `lib/api/video-consultations-api.ts` (NOT used by lawyers)

**All lawyer functionality uses real backend endpoints:**
- `/api/v1/meeting/list` - Real consultation data
- `/api/v1/meeting/approve/{id}` - Real approval system
- `/api/v1/meeting/reject/{id}` - Real rejection system
- `/api/v1/meeting/create` - Real consultation creation
- `/api/v1/notifications` - Real notification system

## Lawyer Best Practices

### API Usage Best Practices for Lawyers

1. **Always check API response success field before updating UI**
2. **Handle loading states properly during approve/reject operations**
3. **Implement proper error boundaries for consultation management**
4. **Use optimistic updates for better UX when approving consultations**
5. **Validate lawyer permissions before showing approve/reject buttons**
6. **Implement proper rate management and token validation**
7. **Use debounced search for client selection**
8. **Handle network failures gracefully during consultation updates**

### Lawyer Workflow Best Practices

1. **Review pending requests regularly** - Check dashboard for new client requests
2. **Respond promptly to consultation requests** - Set expectations for response times
3. **Set clear consultation rates** - Use custom pricing when appropriate
4. **Provide detailed rejection reasons** - Help clients understand decisions
5. **Maintain professional communication** - Use notifications effectively
6. **Keep consultation calendar updated** - Avoid scheduling conflicts
7. **Generate secure meeting links** - Use reliable video conferencing platforms
8. **Document consultation outcomes** - Add notes for future reference

## Future Lawyer Enhancements

### Potential Improvements for Lawyer Experience

1. **Real-time WebSocket updates** for instant consultation request notifications
2. **Advanced video integration** with platforms like Zoom, Microsoft Teams
3. **Calendar integration** with Google Calendar, Outlook for automatic scheduling
4. **Advanced filtering** by consultation type, client status, date ranges
5. **Bulk actions** for multiple consultation approvals/rejections
6. **Analytics dashboard** for consultation metrics and revenue tracking
7. **Automated reminders** for upcoming consultations and follow-ups
8. **Recording integration** for consultation archives and quality assurance
9. **Client management system** integrated with consultation history
10. **Invoice generation** for paid consultations with automatic billing
11. **Legal document integration** for consultation preparation
12. **Mobile app** for on-the-go consultation management
