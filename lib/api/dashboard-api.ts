import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const getToken = () => {
    if (typeof window !== "undefined") {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user).token : null;
    }
    return null;
};

const getAuthHeaders = () => {
    const token = getToken()
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}

export interface DashboardStats {
    success: boolean;
    stats: {
        ongoingCases: number;
        todayConsultations: number;
        unreadNotifications: number;
        unreviewedDocuments: number;
    };
    activities: {
        type: 'client' | 'document' | 'consultation' | 'system';
        title: string;
        user: string;
        time: string;
        category?: string;
    }[];
    tokens: {
        balance: number;
        valueUSD: number;
    };
}

export const dashboardApi = {
    getStats: async (userId: string): Promise<DashboardStats> => {
        try {
            const response = await axios.get(`${API_BASE_URL}/dashboard/stats`, {
                headers: getAuthHeaders(),
                params: { user_id: userId }
            })
            return response.data
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
            throw error
        }
    }
}
