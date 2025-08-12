"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, User, FileText, Send } from 'lucide-react';
import axios from 'axios';

interface MeetingRequestFormProps {
  lawyerId: string;
  lawyerName: string;
  onSuccess?: () => void;
}

const MeetingRequestForm: React.FC<MeetingRequestFormProps> = ({ 
  lawyerId, 
  lawyerName, 
  onSuccess 
}) => {
  const profile = useSelector((state: RootState) => state.auth.user);

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).token : null;
    }
    return null;
  };

  const token = getToken()

  const [formData, setFormData] = useState({
    meeting_title: '',
    meeting_description: '',
    requested_date: '',
    requested_time: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.meeting_title || !formData.requested_date || !formData.requested_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/meeting/create-request`,
        {
          lawyer_id: lawyerId,
          ...formData
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Meeting request sent successfully! The lawyer will review and respond to your request."
        });
        
        // Reset form
        setFormData({
          meeting_title: '',
          meeting_description: '',
          requested_date: '',
          requested_time: ''
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('Error creating meeting request:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create meeting request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Request Meeting
        </CardTitle>
        <p className="text-sm text-gray-600">
          Request a meeting with {lawyerName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting_title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meeting Title *
            </Label>
            <Input
              id="meeting_title"
              name="meeting_title"
              value={formData.meeting_title}
              onChange={handleInputChange}
              placeholder="e.g., Legal Consultation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_description">
              Description
            </Label>
            <Textarea
              id="meeting_description"
              name="meeting_description"
              value={formData.meeting_description}
              onChange={handleInputChange}
              placeholder="Brief description of what you'd like to discuss..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requested_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date *
              </Label>
              <Input
                id="requested_date"
                name="requested_date"
                type="date"
                value={formData.requested_date}
                onChange={handleInputChange}
                min={today}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time *
              </Label>
              <Input
                id="requested_time"
                name="requested_time"
                type="time"
                value={formData.requested_time}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending Request...' : 'Send Meeting Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MeetingRequestForm;
