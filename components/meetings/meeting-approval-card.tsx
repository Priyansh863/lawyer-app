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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
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
  created_by: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  meeting_link?: string;
  notes?: string;
  rejection_reason?: string;
  createdAt: string;
  updatedAt: string;
}

interface MeetingApprovalCardProps {
  meeting: Meeting;
  onUpdate: () => void;
}

const MeetingApprovalCard: React.FC<MeetingApprovalCardProps> = ({ meeting, onUpdate }) => {
  const profile = useSelector((state: RootState) => state.auth.user);

  const [isLoading, setIsLoading] = useState(false);
  const [meetingLink, setMeetingLink] = useState(meeting.meeting_link || '');
  const [notes, setNotes] = useState(meeting.notes || '');
  const [rejectionReason, setRejectionReason] = useState(meeting.rejection_reason || '');
  const [isRejecting, setIsRejecting] = useState(false);
  const isLawyer = profile?.account_type === 'lawyer';

  const handleApprove = async () => {
    if (!meetingLink.trim() && !meeting.meeting_link) {
      toast({
        title: "Error",
        description: "Meeting link is required for approval",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = getToken();
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
        setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const handleRejectClick = () => {
    setIsRejecting(true);
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = getToken();
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/meeting/reject/${meeting._id}`,
        { rejection_reason: rejectionReason },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast({
        title: 'Success',
        description: 'Meeting rejected successfully',
      });
      
      onUpdate();
      setIsRejecting(false);
    } catch (error) {
      console.error('Error rejecting meeting:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject meeting',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col space-y-1">
              <CardTitle className="text-lg font-medium">
                {meeting.meeting_title}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={
                    meeting.status === 'approved' ? 'default' : 
                    meeting.status === 'rejected' ? 'destructive' : 
                    meeting.status === 'pending' ? 'secondary' : 'outline'
                  }
                >
                  {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                </Badge>
                {meeting.status === 'pending' && meeting.created_by !== profile?._id && (
                  <span className="text-xs text-muted-foreground">
                    Requires your approval
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meeting Details */}
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {meeting.client_id?._id === profile?._id ? 'Lawyer: ' : 'Client: '}{
                  meeting.client_id?._id === profile?._id 
                    ? `${meeting.lawyer_id?.first_name} ${meeting.lawyer_id?.last_name}`
                    : `${meeting.client_id?.first_name} ${meeting.client_id?.last_name}`
                }
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(meeting.requested_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{meeting.requested_time}</span>
            </div>
            {meeting.meeting_link && (
              <div className="flex items-center space-x-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={meeting.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Join Meeting
                </a>
              </div>
            )}
            
            {/* Status message */}
            {meeting.status === 'rejected' && meeting.rejection_reason && (
              <div className="mt-2 p-2 bg-red-50 rounded-md text-sm text-red-700">
                <p><strong>Rejection Reason:</strong> {meeting.rejection_reason}</p>
              </div>
            )}
            
            {/* Notes */}
            {meeting.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                <p><strong>Notes:</strong> {meeting.notes}</p>
              </div>
            )}
          </div>
          {meeting.meeting_description && (
            <div>
              <p className="font-medium mb-1">Description:</p>
              <p className="text-gray-600">{meeting.meeting_description}</p>
            </div>
          )}
        </CardContent>

        {/* Approval Form */}
        {meeting.status === 'pending' && isLawyer && meeting.created_by?._id !== profile?._id && (
          <div className="flex flex-col space-y-2 mt-4">
            {isRejecting ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Reason for rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsRejecting(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleReject}
                    disabled={isLoading || !rejectionReason.trim()}
                  >
                    {isLoading ? 'Rejecting...' : 'Confirm Reject'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                {!meetingLink && (
                  <div className="space-y-1">
                    <Label htmlFor="meetingLink">Meeting Link</Label>
                    <Input
                      id="meetingLink"
                      placeholder="https://meet.google.com/..."
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRejectClick}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleApprove}
                    disabled={isLoading || (!meetingLink && !meeting.meeting_link)}
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </div>
              </div>
            )}
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
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsRejecting(false)}
                disabled={isLoading}
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
