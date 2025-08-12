"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';
import axios from 'axios';
import MeetingApprovalCard from './meeting-approval-card';

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

const MeetingDashboard: React.FC = () => {
  const profile = useSelector((state: RootState) => state.auth.user);
  const userType = profile?.account_type;

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pendingMeetings, setPendingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).token : null;
    }
    return null;
  };

  const token = getToken()

  useEffect(() => {
    fetchMeetings();
    if (userType === 'lawyer') {
      fetchPendingMeetings();
    }
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/meeting/list`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setMeetings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch meetings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingMeetings = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/meeting/pending`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPendingMeetings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending meetings:', error);
    }
  };

  const handleMeetingUpdate = () => {
    fetchMeetings();
    if (userType === 'lawyer') {
      fetchPendingMeetings();
    }
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
    return meetings.filter(meeting => meeting.status === status);
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Meetings</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {filterMeetingsByStatus('pending').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filterMeetingsByStatus('pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No meetings found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {meetings.map((meeting) => (
                <MeetingApprovalCard
                  key={meeting._id}
                  meeting={meeting}
                  onUpdate={handleMeetingUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {userType === 'lawyer' && pendingMeetings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-800 font-medium">
                    You have {pendingMeetings.length} meeting request(s) awaiting your approval
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {filterMeetingsByStatus('pending').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending meetings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterMeetingsByStatus('pending').map((meeting) => (
                <MeetingApprovalCard
                  key={meeting._id}
                  meeting={meeting}
                  onUpdate={handleMeetingUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {filterMeetingsByStatus('approved').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No approved meetings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterMeetingsByStatus('approved').map((meeting) => (
                <MeetingApprovalCard
                  key={meeting._id}
                  meeting={meeting}
                  onUpdate={handleMeetingUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {filterMeetingsByStatus('rejected').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No rejected meetings</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterMeetingsByStatus('rejected').map((meeting) => (
                <MeetingApprovalCard
                  key={meeting._id}
                  meeting={meeting}
                  onUpdate={handleMeetingUpdate}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filterMeetingsByStatus('completed').length === 0 ? (
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
