import endpoints from "@/constant/endpoints";
import ApiResponse from "@/lib/api";
import { http } from "@/lib/http";

/**
 * signup
 * @param data
 * @returns
 */
export const signUp = (data): Promise<ApiResponse> => {
    return http.post(`${endpoints.auth.SIGNUP}`, data);
  };