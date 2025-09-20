"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [consultationType, setConsultationType] = useState<'free' | 'paid'>('paid');
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [customFee, setCustomFee] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const { toast } = useToast();
  const profile = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();

  // Calculate meeting duration in minutes
  const meetingDuration = useMemo(() => {
    if (!requestedDate || !requestedTime || !endDate || !endTime) return 0;

    try {
      const startDateTime = new Date(`${requestedDate}T${requestedTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      // Ensure end time is after start time
      if (endDateTime <= startDateTime) return 0;
      
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      return Math.round(durationMs / 60000); // Convert to minutes
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 0;
    }
  }, [requestedDate, requestedTime, endDate, endTime]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (consultationType === 'free') return 0;
    
    const rate = customFee ? hourlyRate : (meeting?.lawyer_id?.charges || 0);
    const durationHours = meetingDuration / 60;
    
    return rate * durationHours;
  }, [consultationType, customFee, hourlyRate, meeting?.lawyer_id?.charges, meetingDuration]);

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
      
      // Set end date and time if available, otherwise calculate from start time and duration
      if (meeting.end_date) {
        const endDateValue = new Date(meeting.end_date);
        setEndDate(endDateValue.toISOString().split('T')[0]);
      } else if (meeting.requested_date && meeting.requested_time && meeting.duration) {
        // Calculate end time based on start time and duration
        calculateEndDateTime(
          meeting.requested_date || meeting.date,
          meeting.requested_time || meeting.time,
          meeting.duration
        );
      }
      
      if (meeting.end_time) {
        setEndTime(meeting.end_time);
      } else if (meeting.requested_date && meeting.requested_time && meeting.duration) {
        // Calculate end time based on start time and duration
        calculateEndDateTime(
          meeting.requested_date || meeting.date,
          meeting.requested_time || meeting.time,
          meeting.duration
        );
      }
    }
  }, [meeting, isOpen]);

  // Calculate end date and time based on start time and duration
  const calculateEndDateTime = (startDate: string, startTime: string, duration: number) => {
    if (!startDate || !startTime) return;
    
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDateTime = new Date(startDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
      
      setEndDate(endDateTime.toISOString().split('T')[0]);
      setEndTime(endDateTime.toTimeString().substring(0, 5));
    } catch (error) {
      console.error('Error calculating end date/time:', error);
    }
  };

  // Update end time when start time changes to maintain duration
  const handleStartTimeChange = (time: string) => {
    setRequestedTime(time);
    
    // If we have both start and end times, adjust end time to maintain duration
    if (time && endTime && requestedDate && endDate) {
      try {
        const startDateTime = new Date(`${requestedDate}T${time}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
        const durationMs = endDateTime.getTime() - startDateTime.getTime();
        
        if (durationMs > 0) {
          const newEndDateTime = new Date(startDateTime.getTime() + durationMs);
          setEndTime(newEndDateTime.toTimeString().substring(0, 5));
          
          // Also update end date if it crosses midnight
          if (newEndDateTime.toDateString() !== startDateTime.toDateString()) {
            setEndDate(newEndDateTime.toISOString().split('T')[0]);
          }
        }
      } catch (error) {
        console.error('Error adjusting end time:', error);
      }
    }
  };

  // Update end time when start date changes
  const handleStartDateChange = (date: string) => {
    setRequestedDate(date);
    
    // If we have both start and end dates/times, adjust end date to maintain duration
    if (date && endDate && requestedTime && endTime) {
      try {
        const startDateTime = new Date(`${date}T${requestedTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
        const durationMs = endDateTime.getTime() - startDateTime.getTime();
        
        if (durationMs > 0) {
          const newEndDateTime = new Date(startDateTime.getTime() + durationMs);
          setEndDate(newEndDateTime.toISOString().split('T')[0]);
          setEndTime(newEndDateTime.toTimeString().substring(0, 5));
        }
      } catch (error) {
        console.error('Error adjusting end date:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!meeting) return;

    // Validation
    if (!requestedDate || !requestedTime) {
      toast({
        title: t("pages:consuledit.validationError"),
        description: t("pages:consuledit.dateTimeRequired"),
        variant: "destructive",
      });
      return;
    }

    // Validate end date and time if provided
    if ((endDate && !endTime) || (!endDate && endTime)) {
      toast({
        title: t("pages:consuledit.validationError"),
        description: t("pages:consuledit.endDateTimeRequired"),
        variant: "destructive",
      });
      return;
    }

    // Validate that end time is after start time
    if (endDate && endTime) {
      try {
        const startDateTime = new Date(`${requestedDate}T${requestedTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
        
        if (endDateTime <= startDateTime) {
          toast({
            title: t("pages:consuledit.validationError"),
            description: t("pages:consuledit.endTimeAfterStart"),
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error validating time range:', error);
      }
    }

    if (consultationType === 'paid' && customFee && (!hourlyRate || hourlyRate <= 0)) {
      toast({
        title: t("pages:consuledit.validationError"),
        description: t("pages:consuledit.validRateRequired"),
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
        end_date: endDate || undefined,
        end_time: endTime || undefined,
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
          title: t("pages:consuledit.meetingUpdated"),
          description: t("pages:consuledit.meetingUpdatedDesc"),
        });
        
        onMeetingUpdated(response.data);
        handleClose();
      } else {
        throw new Error(response.message || t("pages:consuledit.updateFailed"));
      }
    } catch (error: any) {
      toast({
        title: t("pages:commonp.error"),
        description: error.message || t("pages:consuledit.updateFailed"),
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
    setEndDate("");
    setEndTime("");
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
            {t("pages:consuledit.editMeetingDetails")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meeting Info Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{t("pages:consuledit.meetingInformation")}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t("pages:consuledit.client")}:</span>
                <p className="font-medium">
                  {meeting.client_id && typeof meeting.client_id === 'object'
                    ? `${meeting.client_id.first_name} ${meeting.client_id.last_name}`
                    : t("pages:consuledit.unknownClient")
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-500">{t("pages:consuledit.lawyer")}:</span>
                <p className="font-medium">
                  {meeting.lawyer_id && typeof meeting.lawyer_id === 'object'
                    ? `${meeting.lawyer_id.first_name} ${meeting.lawyer_id.last_name}`
                    : t("pages:consuledit.unknownLawyer")
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-500">{t("pages:consuledit.status")}:</span>
                <p className="font-medium capitalize">{meeting.status}</p>
              </div>
              <div>
                <span className="text-gray-500">{t("pages:consuledit.defaultRate")}:</span>
                <p className="font-medium">${meeting.custom_fee ? meeting.hourly_rate : meeting.lawyer_id.charges}</p>
              </div>
            </div>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="title">{t("pages:consuledit.meetingTitle")}</Label>
              <Input
                id="title"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder={t("pages:consuledit.enterMeetingTitle")}
              />
            </div>

            <div>
              <Label htmlFor="description">{t("pages:consuledit.description")} ({t("pages:commonp.optional")})</Label>
              <Textarea
                id="description"
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder={t("pages:consuledit.enterMeetingDescription")}
                rows={3}
              />
            </div>
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("pages:consuledit.meetingDate")}
              </Label>
              <Input
                id="date"
                type="date"
                value={requestedDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t("pages:consuledit.meetingTime")}
              </Label>
              <Input
                id="time"
                type="time"
                value={requestedTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t("pages:consuledit.endMeetingDate")}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={requestedDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t("pages:consuledit.endMeetingTime")}
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration and Cost Display */}
          {(requestedDate && requestedTime && endDate && endTime) && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t("pages:consuledit.meetingDetails")}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">{t("pages:consuledit.duration")}:</span>
                  <p className="font-medium text-blue-900">
                    {meetingDuration > 0 ? `${meetingDuration} minutes` : t("pages:consuledit.invalidDuration")}
                  </p>
                </div>
                {consultationType === 'paid' && meetingDuration > 0 && (
                  <div>
                    <span className="text-blue-700">{t("pages:consuledit.estimatedCost")}:</span>
                    <p className="font-medium text-blue-900">
                      ${totalCost.toFixed(2)}
                      <span className="text-xs text-blue-600 ml-1">
                        ({getCurrentRate()}/hour × {(meetingDuration / 60).toFixed(1)} hours)
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consultation Type & Pricing */}
          {profile?.account_type === 'lawyer' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {t("pages:consuledit.consultationPricing")}
              </h4>
              
              <div>
                <Label>{t("pages:consuledit.consultationType")}</Label>
                <Select value={consultationType} onValueChange={(value: 'free' | 'paid') => setConsultationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{t("pages:consuledit.freeConsultation")}</SelectItem>
                    <SelectItem value="paid">{t("pages:consuledit.paidConsultation")}</SelectItem>
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
                      {t("pages:consuledit.useCustomRate", { rate: getDefaultRate() })}
                    </Label>
                  </div>

                  {customFee && (
                    <div>
                      <Label htmlFor="hourly_rate">{t("pages:consuledit.customHourlyRate")}</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        min="1"
                        step="0.01"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                        placeholder={t("pages:consuledit.enterCustomRate")}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Meeting Link */}
          <div>
            <Label htmlFor="link">{t("pages:consuledit.meetingLink")} ({t("pages:commonp.optional")})</Label>
            <Input
              id="link"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder={t("pages:consuledit.enterMeetingLink")}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="w-4 h-4 mr-2" />
            {t("pages:commonp.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={updating}>
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t("pages:commonp.updating")}...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t("pages:commonp.saveChanges")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}