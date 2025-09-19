"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, DollarSign, Edit, Save, X } from "lucide-react";
import { updateMeeting, type Meeting } from "@/lib/api/meeting-api";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { useTranslation } from "@/hooks/useTranslation";

interface EditMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  onMeetingUpdated: (updatedMeeting: Meeting) => void;
}

export default function EditMeetingModal({
  isOpen,
  onClose,
  meeting,
  onMeetingUpdated,
}: EditMeetingModalProps) {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [consultationType, setConsultationType] = useState<'free' | 'paid'>('paid');
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [customFee, setCustomFee] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  // Reset form when meeting changes
  useEffect(() => {
    if (meeting && isOpen) {
      setMeetingTitle(meeting.meeting_title || meeting.title || "");
      setMeetingDescription(meeting.meeting_description || meeting.description || "");
      
      // Handle date formatting
      if (meeting.requested_date || meeting.date) {
        const dateValue = meeting.requested_date || meeting.date;
        const date = new Date(dateValue);
        setRequestedDate(date.toISOString().split('T')[0]);
      } else {
        setRequestedDate("");
      }
      
      setRequestedTime(meeting.requested_time || meeting.time || "");
      setConsultationType(meeting.consultation_type || 'paid');
      setHourlyRate(meeting.hourly_rate || 0);
      setCustomFee(meeting.custom_fee || false);
      setMeetingLink(meeting.meeting_link || "");
    }
  }, [meeting, isOpen]);

  const handleSave = async () => {
    if (!meeting) return;

    // Validation
    if (!requestedDate || !requestedTime) {
      toast({
        title: "Validation Error",
        description: "Please provide both date and time for the meeting",
        variant: "destructive",
      });
      return;
    }

    if (consultationType === 'paid' && customFee && (!hourlyRate || hourlyRate <= 0)) {
      toast({
        title: "Validation Error", 
        description: "Please provide a valid hourly rate for custom pricing",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      
      const updateData = {
        meeting_title: meetingTitle,
        meeting_description: meetingDescription,
        requested_date: requestedDate,
        requested_time: requestedTime,
        consultation_type: consultationType,
        hourly_rate: consultationType === 'free' ? 0 : (customFee ? hourlyRate : undefined),
        custom_fee: consultationType === 'paid' ? customFee : false,
        meetingLink: meetingLink,
      };

      // Remove undefined values
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      const response = await updateMeeting(meeting._id, cleanUpdateData);
      
      if (response.success && response.data) {
        toast({
          title: "Meeting Updated",
          description: "Meeting details have been updated successfully",
        });
        
        onMeetingUpdated(response.data);
        handleClose();
      } else {
        throw new Error(response.message || "Failed to update meeting");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update meeting",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setMeetingTitle("");
    setMeetingDescription("");
    setRequestedDate("");
    setRequestedTime("");
    setConsultationType('paid');
    setHourlyRate(0);
    setCustomFee(false);
    setMeetingLink("");
    onClose();
  };

  const getDefaultRate = () => {
    if (!meeting) return 0;
    
    // Get lawyer's default rate
    const lawyer = meeting.lawyer_id;
    if (lawyer && typeof lawyer === 'object') {
      return lawyer.charges || 0;
    }
    return 0;
  };

  const getCurrentRate = () => {
    if (consultationType === 'free') return 0;
    if (customFee) return hourlyRate;
    return getDefaultRate();
  };

  if (!meeting) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Edit Meeting Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meeting Info Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Meeting Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Client:</span>
                <p className="font-medium">
                  {meeting.client_id && typeof meeting.client_id === 'object'
                    ? `${meeting.client_id.first_name} ${meeting.client_id.last_name}`
                    : 'Unknown Client'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-500">Lawyer:</span>
                <p className="font-medium">
                  {meeting.lawyer_id && typeof meeting.lawyer_id === 'object'
                    ? `${meeting.lawyer_id.first_name} ${meeting.lawyer_id.last_name}`
                    : 'Unknown Lawyer'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium capitalize">{meeting.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Default Rate:</span>
                <p className="font-medium">${getDefaultRate()}</p>
              </div>
            </div>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Enter meeting title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder="Enter meeting description"
                rows={3}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Meeting Date
              </Label>
              <Input
                id="date"
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Meeting Time
              </Label>
              <Input
                id="time"
                type="time"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
              />
            </div>
          </div>

          {/* Consultation Type & Pricing */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Consultation Pricing
            </h4>
            
            <div>
              <Label>Consultation Type</Label>
              <Select value={consultationType} onValueChange={(value: 'free' | 'paid') => setConsultationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Consultation</SelectItem>
                  <SelectItem value="paid">Paid Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {consultationType === 'paid' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="custom_fee"
                    checked={customFee}
                    onCheckedChange={(checked) => setCustomFee(checked as boolean)}
                  />
                  <Label htmlFor="custom_fee" className="text-sm">
                    Use custom rate (override default ${getDefaultRate()})
                  </Label>
                </div>

                {customFee && (
                  <div>
                    <Label htmlFor="hourly_rate">Custom Hourly Rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      min="1"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      placeholder="Enter custom rate"
                    />
                  </div>
                )}

                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Current Rate:</strong> {consultationType === 'free' ? 'Free' : `$${getCurrentRate()}`}
                    {consultationType === 'paid' && customFee && ' (Custom)'}
                    {consultationType === 'paid' && !customFee && ' (Default)'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Meeting Link */}
          <div>
            <Label htmlFor="link">Meeting Link (Optional)</Label>
            <Input
              id="link"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="Enter or paste meeting link"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updating}>
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
