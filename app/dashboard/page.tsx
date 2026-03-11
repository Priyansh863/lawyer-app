"use client";

import DashboardLayout from "@/components/layouts/dashboard-layout"
import StatsCards from "@/components/dashboard/stats-cards"
import QuickActions from "@/components/dashboard/quick-actions"
import RecentActivity from "@/components/dashboard/recent-activity"
import TokenBalanceCard from "@/components/dashboard/token-balance-card"
import { useState, useEffect } from "react";
import { dashboardApi, type DashboardStats } from "@/lib/api/dashboard-api";
import { useTranslation } from "@/hooks/useTranslation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

export default function ProfessionalDashboardPage() {
  const { t } = useTranslation();
  const profile = useSelector((state: RootState) => state.auth.user);
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?._id) return;

      try {
        setIsLoading(true);
        console.log("Fetching dashboard stats for user:", profile._id);
        const response = await dashboardApi.getStats(profile._id);
        console.log("Dashboard Stats Response:", response);
        setData(response);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [profile?._id]);

  // Determine the correct data object (handle potential 'data' wrapper from API)
  const dashboardData = data && ('data' in data) ? (data as any).data : data;
  const statsData = dashboardData?.stats;

  // Deduplicate activities (filter out items from same user at nearly same time)
  const rawActivities = dashboardData?.activities || [];
  const activitiesData = rawActivities.reduce((acc: any[], current: any) => {
    const currentTime = new Date(current.time || current.createdAt || current.created_at).getTime();
    const isDuplicate = acc.some(item => {
      const itemTime = new Date(item.time || item.createdAt || item.created_at).getTime();
      // If same user and within 2 seconds of each other, consider it a duplicate event
      return item.user === current.user && Math.abs(currentTime - itemTime) < 2000;
    });
    if (!isDuplicate) acc.push(current);
    return acc;
  }, []);

  const tokensData = dashboardData?.tokens;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse p-2 max-w-[1200px]">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl border border-gray-100"></div>)}
          </div>
          <div className="h-8 bg-gray-200 rounded w-48 mt-10 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-100 rounded-xl border border-gray-100"></div>)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pt-0 pb-10 max-w-[1400px]">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">{t('pages:dashboard.dashboard')}</h1>
        </div>

        <div className="max-w-[1200px] space-y-10">
          {/* Stats Row */}
          <StatsCards data={statsData} />

          {/* Quick Actions Row */}
          <QuickActions />
        </div>

        {/* Bottom Section: Activity and Tokens */}
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-[4] min-w-0">
            <RecentActivity activities={activitiesData} />
          </div>
          <div className="flex-1 lg:max-w-[300px]">
            <TokenBalanceCard
              balance={tokensData?.balance ?? 0}
              valueUSD={tokensData?.valueUSD ?? 0}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
