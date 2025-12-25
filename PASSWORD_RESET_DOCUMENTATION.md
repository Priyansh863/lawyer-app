# Password Reset System - Complete Documentation

This document provides comprehensive documentation for the password reset system including forgot password and reset password functionality with detailed UI flow analysis.

## Table of Contents

1. [File Locations](#file-locations)
2. [UI Flow Analysis](#ui-flow-analysis)
3. [API Endpoints](#api-endpoints)
4. [Code Implementation](#code-implementation)
5. [Issues Found](#issues-found)
6. [Complete Flow Examples](#complete-flow-examples)

---

## File Locations

### 📁 Password Reset Files

| Component | File Path | Description |
|-----------|-----------|-------------|
| **Forgot Password Page** | `app/forgot-password/page.tsx` | Email input and OTP request page |
| **Reset Password Page** | `app/reset-password/page.tsx` | Password reset with OTP verification |
| **Auth Services** | `services/auth.ts` | Authentication API functions |
| **API Endpoints** | `constant/endpoints.ts` | API endpoint configurations |

### 📁 Directory Structure
```
lawyer-app/
├── app/
│   ├── forgot-password/
│   │   └── page.tsx                    # Forgot password page
│   └── reset-password/
│       └── page.tsx                    # Reset password page
├── services/
│   └── auth.ts                        # Auth service functions
└── constant/
    └── endpoints.ts                   # API endpoints
```

---

## UI Flow Analysis

### 1. Forgot Password Page UI Elements

**Location:** `app/forgot-password/page.tsx`

#### Initial State:
```
┌─────────────────────────────────────┐
│           ← Back to Login           │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │           📧 Icon              │ │
│  │      Forgot Password?          │ │
│  │   Enter your email address     │ │
│  │                                │ │
│  │  Email: [________________]     │ │
│  │                                │ │
│  │      [Send OTP Button]         │ │
│  │                                │ │
│  │   Remember password? Sign in   │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### After OTP Sent State:
```
┌─────────────────────────────────────┐
│           ← Back to Login           │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │           📧 Icon              │ │
│  │        Check Your Email        │ │
│  │  We've sent a password reset   │ │
│  │     OTP to your email address  │ │
│  │                                │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │ ✅ OTP sent successfully!   │ │ │
│  │  │ Check notification above    │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                │ │
│  │   [Continue to Reset Password] │ │
│  │      [Send Another OTP]        │ │
│  │                                │ │
│  │   Remember password? Sign in   │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2. Reset Password Page UI Elements

**Location:** `app/reset-password/page.tsx`

#### Current Implementation:
```
┌─────────────────────────────────────┐
│      ← Back to Forgot Password     │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │           🔒 Icon              │ │
│  │      Reset Your Password       │ │
│  │  Enter the OTP sent to email   │ │
│  │     and your new password      │ │
│  │                                │ │
│  │  New Password: [__________] 👁  │ │
│  │  Confirm Password: [______] 👁  │ │
│  │                                │ │
│  │      [Reset Password]          │ │
│  │                                │ │
│  │   Remember password? Sign in   │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## API Endpoints

### 1. Forgot Password API

**Endpoint:** `POST ${NEXT_PUBLIC_API_URL}/auth/forgot-password`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset OTP sent to your email",
    "otp": "123456",  // Only in development
    "otp_expires": "2024-01-01T10:30:00Z"
  }
}
```

### 2. Reset Password API

**Endpoint:** `PATCH ${NEXT_PUBLIC_API_URL}/auth/reset-password`

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
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

---

## Code Implementation

### 1. Forgot Password Page Implementation

**File:** `app/forgot-password/page.tsx`

#### Key Features:
- ✅ Email validation with Zod schema
- ✅ Loading states during API calls
- ✅ Success/Error toast notifications
- ✅ OTP display in development mode
- ✅ Automatic redirect to reset password page
- ✅ Internationalization support
- ✅ Two-state UI (email input → success confirmation)

#### API Call Implementation:
```typescript
const onSubmit = async (data: ForgotPasswordFormData) => {
  try {
    setIsLoading(true)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: data.email }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      setIsOtpSent(true)
      
      // Show OTP in toast if available (development mode)
      if (result.data?.otp) {
        toast({
          title: "OTP Sent",
          description: `Your OTP is: ${result.data.otp}`,
          variant: "success",
        })
      }
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(data.email)}`)
      }, 2000)
    }
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false)
  }
}
```

### 2. Reset Password Page Implementation

**File:** `app/reset-password/page.tsx`

#### Key Features:
- ✅ Password validation (min 8 characters)
- ✅ Password confirmation matching
- ✅ Show/hide password toggles
- ✅ Email parameter validation from URL
- ✅ Loading states during API calls
- ✅ Success/Error toast notifications
- ✅ Automatic redirect to login after success
- ❌ **MISSING: OTP Input Field in UI**

#### Schema Definition:
```typescript
const resetPasswordSchema = z.object({
  otp: z.string().optional(),  // ⚠️ Optional but not shown in UI
  newPassword: z.string().min(8, "passwordMinLength"),
  confirmPassword: z.string().min(8, "passwordMinLength"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "passwordsDontMatch",
  path: ["confirmPassword"],
})
```

#### API Call Implementation:
```typescript
const onSubmit = async (data: ResetPasswordFormData) => {
  try {
    setIsLoading(true)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        otp: data.otp,  // ⚠️ Sending empty OTP
        newPassword: data.newPassword,
      }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      toast.success("Password reset successfully")
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false)
  }
}
```

---

## Issues Found

### 🚨 Critical Issue: Missing OTP Input Field

**Problem:** The reset password page is missing the OTP input field in the UI, even though:
- The schema includes `otp` field
- The API call sends `otp` parameter
- The form default values include `otp: ""`

**Impact:** Users cannot enter the OTP they received, making password reset impossible.

**Location:** `app/reset-password/page.tsx` lines 129-196 (form fields section)

**Current Form Fields:**
- ✅ New Password
- ✅ Confirm Password
- ❌ **Missing: OTP Input**

**Fix Required:** Add OTP input field to the form:

```typescript
// Add this field before the password fields
<FormField
  control={form.control}
  name="otp"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Verification Code</FormLabel>
      <FormControl>
        <Input
          placeholder="Enter 6-digit OTP"
          className="bg-gray-50"
          maxLength={6}
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Complete Flow Examples

### 1. Successful Password Reset Flow

```
1. User goes to /forgot-password
   ↓
2. User enters email → POST /auth/forgot-password
   ↓
3. API sends OTP to email + shows in toast (dev mode)
   ↓
4. Page shows success state with "Continue" button
   ↓
5. Auto redirect to /reset-password?email=user@example.com
   ↓
6. User enters OTP + new password → PATCH /auth/reset-password
   ↓
7. Password updated successfully
   ↓
8. Auto redirect to /login
```

### 2. Current Broken Flow (Due to Missing OTP Field)

```
1. User goes to /forgot-password ✅
   ↓
2. User enters email → POST /auth/forgot-password ✅
   ↓
3. OTP sent to email ✅
   ↓
4. Redirect to /reset-password ✅
   ↓
5. User sees password fields but NO OTP field ❌
   ↓
6. User enters passwords → API call with empty OTP ❌
   ↓
7. API rejects request due to invalid/missing OTP ❌
```

---

## Toast Notifications

### Forgot Password Page Toasts:
- **Success with OTP:** "OTP sent successfully! Your OTP is: 123456"
- **Success without OTP:** "Password reset OTP sent to your email"
- **Error:** "Failed to send OTP. Please try again."
- **Network Error:** "Network error. Please check your connection."

### Reset Password Page Toasts:
- **Success:** "Password reset successfully"
- **Error:** "Invalid or expired OTP" / Custom error message
- **Network Error:** "Network error occurred"

---

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

---

## Internationalization Keys

### Forgot Password Translation Keys:
```
pages:authf.forgotPassword.title
pages:authf.forgotPassword.checkEmail
pages:authf.forgotPassword.otpSent.title
pages:authf.forgotPassword.sendOtpButton
pages:authf.forgotPassword.continueButton
pages:authf.forgotPassword.sendAnotherOtp
```

### Reset Password Translation Keys:
```
pages:resetPassword.title
pages:resetPassword.subtitle
pages:resetPassword.newPasswordLabel
pages:resetPassword.confirmPasswordLabel
pages:resetPassword.resetButton
pages:resetPassword.resettingButton
```

---

## Security Considerations

1. **OTP Expiration:** OTPs expire after 10 minutes
2. **HTTPS Only:** All API calls should use HTTPS in production
3. **Rate Limiting:** Implement rate limiting for forgot password requests
4. **Password Strength:** Minimum 8 characters required
5. **Development Mode:** OTP display in toast should be disabled in production

---

## Recommended Fixes

1. **Add OTP Input Field** to reset password form (Critical)
2. **Update OTP Schema** to make it required instead of optional
3. **Add OTP Validation** with proper error messages
4. **Implement OTP Resend** functionality on reset password page
5. **Add OTP Expiry Timer** to show remaining time
6. **Improve Error Handling** with specific error codes
