import endpoints from "@/constant/endpoints";
import ApiResponse, { withData, withError, TApiState } from "@/lib/api";
import { http } from "@/lib/http";
import { AxiosResponse } from "axios";

export interface SignUpData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  account_type: 'client' | 'lawyer';
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ResendOtpData {
  email: string;
}

// Define the shape of successful OTP response data
export interface OtpResponseData {
  otp_expires: string;
  email: string;
  success: boolean;
  message?: string;
  [key: string]: any; // Allow additional properties
}

// Define the shape of successful verification response data
export interface VerifyOtpData {
  email: string;
  otp: string;
  user?: any;
  token?: string;
  [key: string]: any; // Allow additional properties
}

// Extend the base ApiResponse with our specific data types
export interface ApiResponseWithOtpData extends ApiResponse {
  data: OtpResponseData | null;
}

export interface ApiResponseWithVerifyOtp extends ApiResponse {
  data: VerifyOtpData | null;
}

/**
 * Sign up a new user
 * @param data User signup data
 * @returns Promise with API response
 */
export const signUp = (data: SignUpData): Promise<ApiResponse> => {
  return http.post(`${endpoints.auth.SIGNUP}`, data);
};

/**
 * Verify OTP for user signup or login
 * @param email User's email
 * @param otp OTP to verify
 * @returns Promise with API response
 */
export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  user?: any;
  token?: string;
  [key: string]: any;
}

export const verifySignupOtp = async (email: string, otp: string): Promise<{ data?: VerifyOtpResponse; error?: { message: string } }> => {
  try {
    const response = await http.post<VerifyOtpResponse>(`${endpoints.auth.VERIFYOTP}`, { email, otp });
    
    if (!response.data.success) {
      return { 
        error: { 
          message: response.data.message || 'Invalid OTP. Please try again.' 
        } 
      };
    }
    
    return { data: response.data };
  } catch (error: any) {
    return { 
      error: { 
        message: error.response?.data?.message || 'Failed to verify OTP. Please try again.' 
      } 
    };
  }
};

/**
 * Resend OTP to user's email
 * @param email User's email
 * @returns Promise with API response
 */
export const resendSignupOtp = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await http.post(`${endpoints.auth.RESENDOTP}`, { email });
    return withData(response.data);
  } catch (error: any) {
    return withError(error.response?.data || { message: 'Failed to resend OTP' });
  }
};

/**
 * Login with email and password
 * @param email User's email
 * @param password User's password
 * @returns Promise with API response
 */
export const login = async (email: string, password: string): Promise<ApiResponse> => {
  try {
    const response = await http.post(`${endpoints.auth.LOGIN}`, { email, password });
    return withData(response.data);
  } catch (error: any) {
    return withError(error.response?.data || { message: 'Login failed' });
  }
};