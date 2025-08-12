"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Check, 
  X, 
  Link,
  MessageSquare
} from 'lucide-react';
import axios from 'axios';

interface Meeting {
  _id: string;
  meeting_title: string;
  meeting_description?: string;
  requested_date: string;
  requested_time: string;
  status: string;
  client_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  lawyer_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  meeting_link?: string;
  notes?: string;
  rejection_reason?: string;
  createdAt: string;
}

interface MeetingApprovalCardProps {
  meeting: Meeting;
  onUpdate: () => void;
}

const MeetingApprovalCard: React.FC<MeetingApprovalCardProps> = ({ meeting, onUpdate }) => {
  const profile = useSelector((state: RootState) => state.auth.user);

  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    if (!meetingLink.trim()) {
      toast({
        title: "Error",
        description: "Meeting link is required for approval",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/meeting/approve/${meeting._id}`,
        {
          meeting_link: meetingLink,
          notes: notes
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
          description: "Meeting approved successfully!"
        });
        setShowApprovalForm(false);
        setMeetingLink('');
        setNotes('');
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error approving meeting:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve meeting",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/meeting/reject/${meeting._id}`,
        {
          rejection_reason: rejectionReason
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
          description: "Meeting rejected successfully"
        });
        setShowRejectionForm(false);
        setRejectionReason('');
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error rejecting meeting:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject meeting",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).token : null;
    }
    return null;
  };

  const token = getToken()


  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {meeting.meeting_title}
          </CardTitle>
          {getStatusBadge(meeting.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meeting Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Client:</span>
            <span>{meeting.client_id.first_name} {meeting.client_id.last_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Date:</span>
            <span>{new Date(meeting.requested_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Time:</span>
            <span>{meeting.requested_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Requested:</span>
            <span>{new Date(meeting.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Description */}
        {meeting.meeting_description && (
          <div>
            <p className="font-medium mb-1">Description:</p>
            <p className="text-gray-600">{meeting.meeting_description}</p>
          </div>
        )}

        {/* Meeting Link (if approved) */}
        {meeting.meeting_link && (
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Meeting Link:</span>
            <a 
              href={meeting.meeting_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Join Meeting
            </a>
          </div>
        )}

        {/* Notes (if any) */}
        {meeting.notes && (
          <div>
            <p className="font-medium mb-1">Notes:</p>
            <p className="text-gray-600">{meeting.notes}</p>
          </div>
        )}

        {/* Rejection Reason (if rejected) */}
        {meeting.rejection_reason && (
          <div>
            <p className="font-medium mb-1">Rejection Reason:</p>
            <p className="text-red-600">{meeting.rejection_reason}</p>
          </div>
        )}

        {/* Action Buttons (only for pending meetings) */}
        {meeting.status === 'pending' && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => setShowApprovalForm(true)}
              className="flex-1"
              disabled={showRejectionForm}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectionForm(true)}
              className="flex-1"
              disabled={showApprovalForm}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}

        {/* Approval Form */}
        {showApprovalForm && (
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <h4 className="font-medium text-green-800">Approve Meeting</h4>
            
            <div className="space-y-2">
              <Label htmlFor="meeting_link">Meeting Link *</Label>
              <Input
                id="meeting_link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes for the client..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={isProcessing}>
                <Check className="h-4 w-4 mr-2" />
                {isProcessing ? 'Approving...' : 'Confirm Approval'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowApprovalForm(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Rejection Form */}
        {showRejectionForm && (
          <div className="space-y-4 p-4 border rounded-lg bg-red-50">
            <h4 className="font-medium text-red-800">Reject Meeting</h4>
            
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Reason for Rejection *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this meeting request..."
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={handleReject} 
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-2" />
                {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRejectionForm(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingApprovalCard;
