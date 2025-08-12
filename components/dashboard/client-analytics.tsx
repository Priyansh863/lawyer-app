"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp,
  Activity,
  Coins,
  FileText
} from 'lucide-react';
import axios from 'axios';

interface TokenUsageData {
  category: string;
  usage: number;
  color: string;
}

interface ActivityData {
  month: string;
  cases: number;
  meetings: number;
  documents: number;
}

const ClientAnalytics: React.FC = () => {
  const profile = useSelector((state: RootState) => state.auth.user);
  const [tokenUsage, setTokenUsage] = useState<TokenUsageData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).token : null;
    }
    return null;
  };

  useEffect(() => {
    if (profile?.account_type === 'client') {
      fetchAnalyticsData();
    }
  }, [profile]);

  const fetchAnalyticsData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Fetch token usage breakdown
      const tokenResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/user/token-stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (tokenResponse.data.success && tokenResponse.data.data.usage_breakdown) {
        setTokenUsage(tokenResponse.data.data.usage_breakdown);
      }

      // Set sample activity data (you can replace this with actual API call)
      setActivityData([
        { month: 'Jan', cases: 2, meetings: 4, documents: 8 },
        { month: 'Feb', cases: 3, meetings: 6, documents: 12 },
        { month: 'Mar', cases: 4, meetings: 8, documents: 15 },
        { month: 'Apr', cases: 2, meetings: 5, documents: 10 },
        { month: 'May', cases: 5, meetings: 7, documents: 18 },
        { month: 'Jun', cases: 6, meetings: 9, documents: 22 }
      ]);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (profile?.account_type !== 'client') {
    return null; // Don't render for non-client users
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Activity Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cases" fill="#8884d8" name="Cases" />
                <Bar dataKey="meetings" fill="#82ca9d" name="Meetings" />
                <Bar dataKey="documents" fill="#ffc658" name="Documents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAnalytics;
