# Video Consultation Buttons - Complete Guide

## Overview

This guide shows exactly what happens when lawyers click buttons in the video consultation system:
- **"New Consultation" button** - Opens consultation scheduling modal
- **"Edit" button** - Opens meeting editing modal

---

## 1. "New Consultation" Button

### **Where it's located:**
- File: `app/video-consultations/page.tsx`
- Button in top-right corner of video consultations page

### **What opens when clicked:**
**File:** `components/modals/consultation-type-modal.tsx`

### **Complete Code Flow:**

#### **Step 1: Button Click in page.tsx**
```typescript
// File: app/video-consultations/page.tsx
<Button onClick={() => setIsConsultationModalOpen(true)}>
  <Plus className="w-4 h-4" />
  <span>New Consultation</span>
</Button>

// Modal component
<ConsultationTypeModal
  isOpen={isConsultationModalOpen}
  onClose={() => setIsConsultationModalOpen(false)}
  onConsultationScheduled={handleConsultationScheduled}
/>
```

#### **Step 2: Modal Opens - consultation-type-modal.tsx**
```typescript
// File: components/modals/consultation-type-modal.tsx

// IMPORTS - APIs Used
import { getRelatedUsers } from "@/lib/api/users-api";
import { createMeeting } from "@/lib/api/meeting-api";
import { notificationsApi } from "@/lib/api/notifications-api";

// Main Modal Component
export default function ConsultationTypeModal({
  isOpen,
  onClose,
  onConsultationScheduled,
}: ConsultationTypeModalProps) {
  
  // State Management
  const [currentStep, setCurrentStep] = useState<'typeSelection' | 'userSelection' | 'details'>('typeSelection');
  const [consultationType, setConsultationType] = useState<'free' | 'paid'>('free');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Step 1: Select Consultation Type (Free/Paid)
  const handleConsultationTypeSelect = (type: 'free' | 'paid') => {
    setConsultationType(type);
    setCurrentStep('userSelection');
  };

  // Step 2: Fetch and Select User
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getRelatedUsers();
      if (response.success) {
        // Filter users based on lawyer/client logic
        let filtered = response.data;
        
        // For lawyers, show clients
        if (currentProfile?.account_type === 'lawyer') {
          filtered = filtered.filter(user => user.account_type === 'client');
        }
        // For clients, show lawyers (only for free consultations)
        else if (consultationType === 'free') {
          filtered = filtered.filter(user => user.account_type === 'lawyer');
        }
        
        setUsers(filtered);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create Meeting and Send Notification
  const handleSendConsultationLink = async () => {
    try {
      setLoading(true);
      
      // API Call 1: Create Meeting
      const meetingResponse = await createMeeting({
        lawyerId: currentProfile?.account_type === 'lawyer' ? currentProfile._id : selectedUser?._id,
        clientId: currentProfile?.account_type === 'lawyer' ? selectedUser?._id : currentProfile._id,
        meeting_title: `Video Consultation - ${consultationType === 'free' ? 'Free' : 'Paid'}`,
        consultation_type: consultationType,
        hourly_rate: consultationType === 'paid' ? (selectedUser?.charges || 0) : 0,
        requested_date: selectedDate,
        requested_time: selectedTime,
        meeting_link: meetingLink,
      });

      if (meetingResponse.success) {
        // API Call 2: Send Notification
        await notificationsApi.createNotification({
          userId: currentProfile?.account_type === 'lawyer' ? selectedUser?._id : currentProfile._id,
          title: consultationType === 'free' ? 'Free Consultation Scheduled' : 'Paid Consultation Scheduled',
          message: `Your ${consultationType} video consultation has been scheduled`,
          type: 'video_consultation_started',
          relatedId: meetingResponse.meeting._id,
          relatedType: 'meeting',
          redirectUrl: '/video-consultations',
          priority: 'high'
        });

        onConsultationScheduled();
        onClose();
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Step 1: Type Selection */}
        {currentStep === 'typeSelection' && (
          <div>
            <h2>Select Consultation Type</h2>
            <Button onClick={() => handleConsultationTypeSelect('free')}>
              <Video className="w-4 h-4 mr-2" />
              Free Consultation
            </Button>
            <Button onClick={() => handleConsultationTypeSelect('paid')}>
              <DollarSign className="w-4 h-4 mr-2" />
              Paid Consultation
            </Button>
          </div>
        )}

        {/* Step 2: User Selection */}
        {currentStep === 'userSelection' && (
          <div>
            <h2>Select {currentProfile?.account_type === 'lawyer' ? 'Client' : 'Lawyer'}</h2>
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {users.map(user => (
              <div key={user._id} onClick={() => setSelectedUser(user)}>
                <Avatar src={user.profile_image} />
                <span>{user.first_name} {user.last_name}</span>
                <span>{user.email}</span>
              </div>
            ))}
            <Button onClick={() => setCurrentStep('details')}>
              Next
            </Button>
          </div>
        )}

        {/* Step 3: Details & Schedule */}
        {currentStep === 'details' && (
          <div>
            <h2>Schedule Consultation</h2>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
            <Input 
              placeholder="Meeting link (e.g., https://meet.google.com/xxx)" 
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
            {consultationType === 'paid' && (
              <div>
                <span>Rate: ${selectedUser?.charges}/hour</span>
                <span>Estimated Total: ${calculateTotal()}</span>
              </div>
            )}
            <Button onClick={handleSendConsultationLink} disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Consultation'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### **APIs Used by "New Consultation":**

1. **`getRelatedUsers()`** - `/api/v1/users/related`
   - Fetches list of clients/lawyers based on current user type

2. **`createMeeting()`** - `/api/v1/meeting/create`
   - Creates new meeting/consultation record

3. **`createNotification()`** - `/api/v1/notifications`
   - Sends notification to selected user

---

## 2. "Edit" Button

### **Where it's located:**
- File: `components/video-consultations/video-consultation-table.tsx`
- Button appears in Actions column for pending/approved meetings

### **What opens when clicked:**
**File:** `components/modals/edit-meeting-modal.tsx`

### **Complete Code Flow:**

#### **Step 1: Edit Button Click in video-consultation-table.tsx**
```typescript
// File: components/video-consultations/video-consultation-table.tsx

// IMPORTS
import EditMeetingModal from '@/components/modals/edit-meeting-modal'
import { updateMeeting } from '@/lib/api/meeting-api-updated'

// State for edit modal
const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
const [isEditModalOpen, setIsEditModalOpen] = useState(false)

// Edit button handler
const handleEditMeeting = (meeting: Meeting) => {
  setEditingMeeting(meeting)
  setIsEditModalOpen(true)
}

// Edit button in table
{(meeting.status === 'pending_approval' || meeting.status === 'approved') && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleEditMeeting(meeting)}
  >
    <Edit className="h-3 w-3 mr-1" />
    Edit
  </Button>
)}

// Modal component at bottom of file
<EditMeetingModal
  isOpen={isEditModalOpen}
  onClose={handleCloseEditModal}
  meeting={editingMeeting}
  onMeetingUpdated={handleMeetingUpdated}
/>
```

#### **Step 2: Edit Modal Opens - edit-meeting-modal.tsx**
```typescript
// File: components/modals/edit-meeting-modal.tsx

// IMPORTS - APIs Used
import { updateMeeting, type Meeting } from "@/lib/api/meeting-api";

export default function EditMeetingModal({
  isOpen,
  onClose,
  meeting,
  onMeetingUpdated,
}: EditMeetingModalProps) {
  
  // Form State
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [consultationType, setConsultationType] = useState<'free' | 'paid'>('paid');
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [customFee, setCustomFee] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [updating, setUpdating] = useState(false);

  // Load meeting data when modal opens
  useEffect(() => {
    if (meeting && isOpen) {
      setMeetingTitle(meeting.meeting_title || "");
      setMeetingDescription(meeting.meeting_description || "");
      
      // Format dates
      if (meeting.requested_date) {
        const date = new Date(meeting.requested_date);
        setRequestedDate(date.toISOString().split('T')[0]);
      }
      
      setRequestedTime(meeting.requested_time || "");
      setConsultationType(meeting.consultation_type || 'paid');
      setHourlyRate(meeting.hourly_rate || 0);
      setCustomFee(meeting.custom_fee || false);
      setMeetingLink(meeting.meeting_link || "");
    }
  }, [meeting, isOpen]);

  // Calculate duration and cost
  const meetingDuration = useMemo(() => {
    if (!requestedDate || !requestedTime || !endDate || !endTime) return 0;
    
    const startDateTime = new Date(`${requestedDate}T${requestedTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    return Math.round(durationMs / 60000); // Convert to minutes
  }, [requestedDate, requestedTime, endDate, endTime]);

  const totalCost = useMemo(() => {
    if (consultationType === 'free') return 0;
    
    const rate = customFee ? hourlyRate : (meeting?.lawyer_id?.charges || 0);
    const durationHours = meetingDuration / 60;
    
    return rate * durationHours;
  }, [consultationType, customFee, hourlyRate, meeting?.lawyer_id?.charges, meetingDuration]);

  // Update Meeting API Call
  const handleUpdateMeeting = async () => {
    try {
      setUpdating(true);
      
      const updateData = {
        meeting_title: meetingTitle,
        meeting_description: meetingDescription,
        requested_date: requestedDate,
        requested_time: requestedTime,
        end_date: endDate,
        end_time: endTime,
        consultation_type: consultationType,
        hourly_rate: consultationType === 'paid' ? hourlyRate : 0,
        custom_fee: customFee,
        meeting_link: meetingLink,
      };

      // API Call: Update Meeting
      const response = await updateMeeting(meeting._id, updateData);
      
      if (response.success) {
        onMeetingUpdated(response.meeting);
        onClose();
        
        toast({
          title: "Meeting Updated",
          description: "Consultation details have been updated successfully",
        });
      } else {
        throw new Error(response.message || "Failed to update meeting");
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Consultation</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Meeting Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Meeting Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={meetingDescription}
              onChange={(e) => setMeetingDescription(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Start Date</Label>
              <Input
                id="date"
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="time">Start Time</Label>
              <Input
                id="time"
                type="time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Consultation Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label>Consultation Type</Label>
            <Select value={consultationType} onValueChange={(value: 'free' | 'paid') => setConsultationType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free Consultation</SelectItem>
                <SelectItem value="paid">Paid Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rate Settings (for paid consultations) */}
          {consultationType === 'paid' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rate">Hourly Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customFee"
                  checked={customFee}
                  onCheckedChange={(checked) => setCustomFee(checked as boolean)}
                />
                <Label htmlFor="customFee">Use custom rate for this consultation</Label>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Duration: {meetingDuration} minutes</span>
                  <span className="font-semibold">Total Cost: ${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {/* Meeting Link */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="meetingLink">Meeting Link</Label>
            <Input
              id="meetingLink"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xxx"
              className="col-span-3"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdateMeeting} disabled={updating}>
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Consultation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### **APIs Used by "Edit" Button:**

1. **`updateMeeting(meetingId, updateData)`** - `/api/v1/meeting/edit/{id}`
   - Updates existing meeting/consultation details

---

## Summary of APIs Used

### **New Consultation Button APIs:**
| API | Endpoint | Purpose |
|-----|----------|---------|
| `getRelatedUsers()` | `/api/v1/users/related` | Fetch clients/lawyers for selection |
| `createMeeting()` | `/api/v1/meeting/create` | Create new consultation |
| `createNotification()` | `/api/v1/notifications` | Notify user about new consultation |

### **Edit Button APIs:**
| API | Endpoint | Purpose |
|-----|----------|---------|
| `updateMeeting()` | `/api/v1/meeting/edit/{id}` | Update existing consultation details |

---

## File Locations Summary

### **New Consultation Flow:**
1. **Button:** `app/video-consultations/page.tsx` (lines 50-60)
2. **Modal:** `components/modals/consultation-type-modal.tsx` (entire file)
3. **APIs:** `lib/api/users-api.ts`, `lib/api/meeting-api.ts`, `lib/api/notifications-api.ts`

### **Edit Button Flow:**
1. **Button:** `components/video-consultations/video-consultation-table.tsx` (lines 423-426, 557-567)
2. **Modal:** `components/modals/edit-meeting-modal.tsx` (entire file)
3. **APIs:** `lib/api/meeting-api-updated.ts` (updateMeeting function)

Both modals use real production APIs and provide complete functionality for scheduling and editing video consultations.
