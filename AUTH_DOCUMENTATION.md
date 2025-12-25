# Authentication System Documentation

This document provides comprehensive documentation for the authentication system including signup, forgot password, and reset password functionality.

## Table of Contents

1. [File Locations](#file-locations)
2. [API Endpoints](#api-endpoints)
3. [Signup Flow](#signup-flow)
4. [Forgot Password Flow](#forgot-password-flow)
5. [Reset Password Flow](#reset-password-flow)
6. [OTP Verification](#otp-verification)
7. [Component Usage](#component-usage)
8. [Service Functions](#service-functions)
9. [Error Handling](#error-handling)

## File Locations

### 📁 Authentication Pages & Components

| Functionality | File Path | Description |
|---------------|-----------|-------------|
| **Signup Page** | `app/signup/page.tsx` | Main signup page wrapper |
| **Signup Form** | `components/sign-up-form.tsx` | Signup form component with validation |
| **Verify OTP Page** | `app/verify-otp/page.tsx` | OTP verification page |
| **OTP Form Component** | `components/otp-verification-form.tsx` | Reusable OTP verification form |
| **Forgot Password Page** | `app/forgot-password/page.tsx` | Forgot password request page |
| **Reset Password Page** | `app/reset-password/page.tsx` | Password reset with OTP page |

### 📁 Services & Configuration

| File | Path | Description |
|------|------|-------------|
| **Auth Services** | `services/auth.ts` | Authentication API functions |
| **API Endpoints** | `constant/endpoints.ts` | API endpoint configurations |

### 📁 Authentication Flow Files Structure

```
lawyer-app/
├── app/
│   ├── signup/
│   │   └── page.tsx                    # Signup page
│   ├── verify-otp/
│   │   └── page.tsx                    # OTP verification page
│   ├── forgot-password/
│   │   └── page.tsx                    # Forgot password page
│   └── reset-password/
│       └── page.tsx                    # Reset password page
├── components/
│   ├── sign-up-form.tsx               # Signup form component
│   └── otp-verification-form.tsx      # OTP verification component
├── services/
│   └── auth.ts                        # Authentication services
└── constant/
    └── endpoints.ts                   # API endpoint constants
```

---

## API Endpoints

### Base URL
```
NEXT_PUBLIC_API_URL = your-api-base-url
```

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | Register a new user |
| `/auth/verify-otp` | POST | Verify OTP for signup/login |
| `/auth/resend-otp` | POST | Resend OTP to user email |
| `/auth/forgot-password` | POST | Send password reset OTP |
| `/auth/reset-password` | PATCH | Reset user password with OTP |

---

## Signup Flow

### 1. User Registration

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "account_type": "client" // or "lawyer"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "User registered successfully. Please verify your email.",
    "otp": "123456", // Only in development/testing
    "otp_expires": "2024-01-01T10:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### 2. OTP Verification

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "user": {
    "id": "user_id",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "account_type": "client"
  },
  "token": "jwt_token_here"
}
```

### 3. Resend OTP

**Endpoint:** `POST /auth/resend-otp`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "otp": "654321", // Only in development/testing
    "otp_expires": "2024-01-01T10:40:00Z"
  }
}
```

---

## Forgot Password Flow

### 1. Request Password Reset

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset OTP sent to your email",
    "otp": "789012", // Only in development/testing
    "otp_expires": "2024-01-01T10:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email not found"
}
```

---

## Reset Password Flow

### 1. Reset Password with OTP

**Endpoint:** `PATCH /auth/reset-password`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "789012",
  "newPassword": "newSecurePassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## OTP Verification

### OTP Verification Component

The OTP verification is handled by the `OtpVerificationForm` component which supports both signup and login flows.

**Component Props:**
```typescript
interface OtpVerificationFormProps {
  email: string
  onSuccess: (data: VerifyOtpData | null) => void
  onResendSuccess?: (data: OtpResponseData | null) => void
  purpose: 'signup' | 'login'
  otpExpires?: Date
}
```

**Usage:**
```tsx
<OtpVerificationForm
  email="user@example.com"
  purpose="signup"
  onSuccess={handleOtpSuccess}
  onResendSuccess={handleResendSuccess}
  otpExpires={new Date()}
/>
```

---

## Component Usage

### 1. SignUp Form Component

**File:** `components/sign-up-form.tsx`

**Features:**
- Form validation with Zod schema
- Account type selection (client/lawyer)
- Terms and conditions agreement
- Internationalization support
- Automatic redirect to OTP verification

**Usage:**
```tsx
import SignUpForm from "@/components/sign-up-form"

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUpForm />
    </main>
  )
}
```

### 2. Forgot Password Page

**File:** `app/forgot-password/page.tsx`

**Features:**
- Email validation
- OTP request handling
- Success state management
- Automatic redirect to reset password

### 3. Reset Password Page

**File:** `app/reset-password/page.tsx`

**Features:**
- Password strength validation
- Password confirmation
- Show/hide password toggle
- Email parameter validation

### 4. OTP Verification Form

**File:** `components/otp-verification-form.tsx`

**Features:**
- 6-digit OTP input
- Resend OTP functionality
- Countdown timer
- Support for both signup and login flows

---

## Service Functions

### Authentication Service

**File:** `services/auth.ts`

#### SignUp Function
```typescript
export const signUp = (data: SignUpData): Promise<ApiResponse> => {
  return http.post(`${endpoints.auth.SIGNUP}`, data);
};
```

#### Verify OTP Function
```typescript
export const verifySignupOtp = async (
  email: string, 
  otp: string
): Promise<{ data?: VerifyOtpResponse; error?: { message: string } }> => {
  try {
    const response = await http.post<VerifyOtpResponse>(
      `${endpoints.auth.VERIFYOTP}`, 
      { email, otp }
    );
    
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
```

#### Resend OTP Function
```typescript
export const resendSignupOtp = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await http.post(`${endpoints.auth.RESENDOTP}`, { email });
    return withData(response.data);
  } catch (error: any) {
    return withError(error.response?.data || { message: 'Failed to resend OTP' });
  }
};
```

---

## Error Handling

### Common Error Responses

#### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

#### Authentication Errors
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### OTP Errors
```json
{
  "success": false,
  "message": "OTP expired or invalid"
}
```

#### Network Errors
```json
{
  "success": false,
  "message": "Network error occurred"
}
```

### Error Handling in Components

All components use the `useToast` hook for displaying error messages:

```typescript
import { useToast } from "@/components/ui/use-toast"

const { toast } = useToast()

// Error handling example
try {
  const response = await signUp(data)
  // Handle success
} catch (error: any) {
  toast({
    title: "Error",
    description: error?.response?.data?.message ?? "An unexpected error occurred",
    variant: "error",
  })
}
```

---

## Data Types and Interfaces

### SignUp Data
```typescript
export interface SignUpData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  account_type: 'client' | 'lawyer';
}
```

### OTP Response Data
```typescript
export interface OtpResponseData {
  otp_expires: string;
  email: string;
  success: boolean;
  message?: string;
  [key: string]: any;
}
```

### Verify OTP Data
```typescript
export interface VerifyOtpData {
  email: string;
  otp: string;
  user?: any;
  token?: string;
  [key: string]: any;
}
```

---

## Authentication Flow Diagram

```
1. User Registration Flow:
   User fills signup form → POST /auth/signup → OTP sent → 
   User enters OTP → POST /auth/verify-otp → Account verified → Redirect to login

2. Forgot Password Flow:
   User enters email → POST /auth/forgot-password → OTP sent → 
   Redirect to reset password page

3. Reset Password Flow:
   User enters new password + OTP → PATCH /auth/reset-password → 
   Password updated → Redirect to login
```

---

## Environment Variables

Make sure to set the following environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

---

## Notes

1. **OTP Display**: In development/testing environments, the OTP is returned in the API response and displayed in toast messages for easier testing.

2. **Security**: In production, OTPs should only be sent via email and never returned in API responses.

3. **Expiration**: All OTPs have a 10-minute expiration time.

4. **Rate Limiting**: Consider implementing rate limiting for OTP requests to prevent abuse.

5. **Internationalization**: All components support multiple languages through the `useTranslation` hook.

6. **Validation**: All forms use Zod schemas for client-side validation with proper error messages.
