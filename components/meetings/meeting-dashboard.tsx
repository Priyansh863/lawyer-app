"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, User, AlertCircle, CheckCircle, History } from 'lucide-react';
import axios from 'axios';
import MeetingApprovalCard from './meeting-approval-card';

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type?: string;
}

interface Meeting {
  _id: string;
  meeting_title: string;
  meeting_description?: string;
  requested_date: string;
  requested_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  client_id: User;
  lawyer_id: User;
  created_by: User;
  meeting_link?: string;
  notes?: string;
  rejection_reason?: string;
  createdAt: string;
  updatedAt: string;
  title?: string; // Alias for meeting_title
  description?: string; // Alias for meeting_description
}

const MeetingDashboard: React.FC = () => {
  const profile = useSelector((state: RootState) => state.auth.user);
  const userType = profile?.account_type;

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pendingMeetings, setPendingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Get token from localStorage with proper type checking
  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      return user?.token || null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [userType]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      
      const currentToken = getToken();
      
      if (!currentToken) {
        console.error('No authentication token found');
        toast({
          title: 'Authentication Error',
          description: 'Please log in to view meetings',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Fetching meetings from:', `${process.env.NEXT_PUBLIC_API_URL}/meeting/list`);
      
      // Use axios directly - the interceptor will handle the token
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/meeting/list`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API Response Status:', response.status);
      console.log('API Response Data:', response.data);
      
      if (response.status !== 200) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      // Handle different response formats
      let meetingsData = [];
      
      if (response.data && Array.isArray(response.data)) {
        // If response is already an array
        meetingsData = response.data;
      } else if (response.data && response.data.data) {
        // If response has a data property that contains the array
        meetingsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : [response.data.data];
      } else if (response.data && response.data.meetings) {
        // If response has a meetings property
        meetingsData = Array.isArray(response.data.meetings)
          ? response.data.meetings
          : [response.data.meetings];
      }
      
      console.log('Processed meetings data:', meetingsData); // Debug log
      
      if (meetingsData && meetingsData.length > 0) {
        // Sort meetings by date (newest first)
        meetingsData = meetingsData.sort((a: Meeting, b: Meeting) => 
          new Date(b.requested_date || b.createdAt).getTime() - new Date(a.requested_date || a.createdAt).getTime()
        );
        
        setMeetings(meetingsData);
        
        // For lawyers, show pending meetings that they need to approve
        // For clients, show their pending meetings
        const pending = meetingsData.filter((m: Meeting) => {
          if (!m || !m.status) return false;
          
          if (userType === 'lawyer') {
            return m.status.toLowerCase() === 'pending' && 
                   m.lawyer_id && 
                   m.lawyer_id._id === profile?._id;
          } else {
            return m.status.toLowerCase() === 'pending' && 
                   m.client_id && 
                   m.client_id._id === profile?._id;
          }
        });
        
        console.log('Pending meetings:', pending); // Debug log
        setPendingMeetings(pending || []);
      } else {
        console.log('No meetings data found in response');
        setMeetings([]);
        setPendingMeetings([]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      let errorMessage = 'Failed to fetch meetings';
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data
        });
        
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingUpdate = () => {
    fetchMeetings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterMeetingsByStatus = (status: string) => {
    if (!meetings || !Array.isArray(meetings)) return [];
    return meetings.filter((meeting: Meeting) => 
      meeting && meeting.status && meeting.status.toLowerCase() === status.toLowerCase()
    );
  };

  const getUpcomingMeetings = () => {
    if (!meetings || !Array.isArray(meetings)) return [];
    
    const now = new Date();
    return meetings.filter(meeting => {
      if (!meeting || !meeting.status) return false;
      
      const meetingDate = meeting.requested_date ? new Date(meeting.requested_date) : null;
      if (!meetingDate) return false;
      
      const status = meeting.status.toLowerCase();
      return meetingDate > now && 
             status !== 'completed' && 
             status !== 'rejected' &&
             status !== 'cancelled';
    });
  };

  const getPastMeetings = () => {
    if (!meetings || !Array.isArray(meetings)) return [];
    
    const now = new Date();
    return meetings.filter(meeting => {
      if (!meeting || !meeting.status) return false;
      
      const meetingDate = meeting.requested_date ? new Date(meeting.requested_date) : null;
      const status = meeting.status.toLowerCase();
      
      if (status === 'completed' || status === 'rejected' || status === 'cancelled') {
        return true;
      }
      
      return meetingDate ? meetingDate <= now : false;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-bold">{meetings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filterMeetingsByStatus('pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {filterMeetingsByStatus('approved').length}
                </p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filterMeetingsByStatus('completed').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meetings Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Meetings</TabsTrigger>
          {userType === 'lawyer' && (
            <TabsTrigger value="pending">
              Pending Approval
              {pendingMeetings.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {pendingMeetings.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No meetings found</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {userType === 'lawyer' 
                    ? "You don't have any scheduled meetings yet."
                    : "You haven't scheduled any meetings yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {meetings.map((meeting) => (
                <MeetingApprovalCard
                  key={meeting._id}
                  meeting={meeting}
                  onUpdate={fetchMeetings}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {userType === 'lawyer' && (
          <TabsContent value="pending">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
            ) : pendingMeetings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">No pending approval</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    You don't have any pending meeting requests that require your approval.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingMeetings.map((meeting) => (
                  <MeetingApprovalCard
                    key={meeting._id}
                    meeting={meeting}
                    onUpdate={fetchMeetings}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="upcoming">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : getUpcomingMeetings().length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No upcoming meetings</h3>
                <p className="text-sm text-gray-500 mt-2">
                  {userType === 'lawyer' 
                    ? "You don't have any upcoming meetings scheduled."
                    : "You don't have any upcoming video consultations."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {getUpcomingMeetings().map(meeting => (
                <MeetingApprovalCard
                  key={meeting._id}
                  meeting={meeting}
                  onUpdate={fetchMeetings}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : getPastMeetings().length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No past meetings</h3>
                <p className="text-sm text-gray-500 mt-2">
                  {userType === 'lawyer' 
                    ? "Your past video consultations will appear here."
                    : "Your past video consultations will appear here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {getPastMeetings().map(meeting => (
                <MeetingApprovalCard
                  key={meeting._id}
                  meeting={meeting}
                  onUpdate={fetchMeetings}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {!meetings || filterMeetingsByStatus('completed').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No completed meetings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterMeetingsByStatus('completed').map((meeting) => (
                <MeetingApprovalCard
                  key={meeting._id}
                  meeting={meeting}
                  onUpdate={handleMeetingUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MeetingDashboard;
