import endpoints from "@/constant/endpoints";
import ApiResponse from "@/lib/api";
import { http } from "@/lib/http";

/**
 * signup
 * @param data
 * @returns
 */
export const getDashboardStats = (): Promise<ApiResponse> => {
    return http.get(`${endpoints.auth.SIGNUP}`);
  };

/**
 * getDashboardRecentActivity
 * @returns
 */
export const getDashboardRecentActivity = (): Promise<ApiResponse> => {
    return http.get(`${endpoints.user.RECENT_ACTIVITY}`);
};

/**
 * get user list with account type, offset, and limit
 * @param params
 * @returns
 */
export const getUserList = (params:any): Promise<ApiResponse<any>> =>
    http.get(`${endpoints.user.GET_USER_LIST}`, { params });

/**
 * get user info by ID
 * @param id
 * @returns
 */
export const getUserInfo = (id: string): Promise<ApiResponse<any>> =>
    http.get(`${endpoints.user.GET_USER_INFO}/${id}`);

/**
 *get presigned url for image upload
 * @returns
 */
 export const getSignedUrl = (data:any): Promise<ApiResponse<any>> =>
    http.post(`${endpoints.user.GET_PRESIGNED_URL}`, data);


/**
 * update user details
 * @param data
 * @returns
 */
export const updateUser = (id: string, data:any): Promise<ApiResponse<any>> =>
    http.put(`${endpoints.user.UPDATE_USER}/${id}`, data);


