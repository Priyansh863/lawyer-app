"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { verifySignupOtp, resendSignupOtp, OtpResponseData, VerifyOtpData } from "@/services/auth"
import { useRouter } from "next/navigation"

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
})

type OtpVerificationFormProps = {
  email: string
  onSuccess: (data: VerifyOtpData | null) => void
  onResendSuccess?: (data: OtpResponseData | null) => void
  purpose: 'signup' | 'login'
  otpExpires?: Date
}

export function OtpVerificationForm({
  email,
  onSuccess,
  onResendSuccess,
  purpose = 'signup',
  otpExpires: initialOtpExpires
}: OtpVerificationFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(initialOtpExpires || null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  })

  // Update OTP expiration timer
  useEffect(() => {
    if (!otpExpiresAt) return

    const timer = setInterval(() => {
      const now = new Date()
      const diffInSeconds = Math.floor((otpExpiresAt.getTime() - now.getTime()) / 1000)
      
      if (diffInSeconds <= 0) {
        clearInterval(timer)
        setResendCooldown(0)
      } else {
        setResendCooldown(Math.max(0, diffInSeconds))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [otpExpiresAt])

  const handleVerifyOtp = async (data: z.infer<typeof otpSchema>) => {
    try {
      setIsSubmitting(true)
      const { data: responseData, error } = await verifySignupOtp(email, data.otp)

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "error",
        })
        return
      }

      if (responseData?.success) {
        toast({
          title: "Success",
          description: "Your account has been verified successfully!",
          variant: "success",
        })
        // Create a properly typed VerifyOtpData object
        const verificationData: VerifyOtpData = {
          email,
          otp: data.otp,
          ...responseData
        }
        onSuccess(verificationData)
      } else {
        toast({
          title: "Verification Failed",
          description: responseData?.message || "Invalid OTP. Please try again.",
          variant: "error",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      setIsResending(true)
      const response = await resendSignupOtp(email)

      if (response?.data) {
        const otpData = response.data as OtpResponseData
        if (otpData.otp_expires) {
          const newExpiry = new Date(otpData.otp_expires)
          setOtpExpiresAt(newExpiry)
          
          toast({
            title: "OTP Resent",
            description: `A new OTP has been sent to ${email}.`,
            variant: "success",
          })

          if (onResendSuccess) {
            onResendSuccess(otpData)
          }
        }
      } else {
        toast({
          title: "Error",
          description: response?.data?.message || "Failed to resend OTP. Please try again.",
          variant: "error",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "An error occurred while resending OTP. Please try again.",
        variant: "error",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleVerifyOtp)} className="space-y-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit code"
                      className="text-center text-xl tracking-widest h-14"
                      maxLength={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 h-12"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Account"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || isResending}
            className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : isResending
              ? "Sending..."
              : "Resend Code"}
          </button>
        </p>
      </CardFooter>
    </Card>
  )
}

export default OtpVerificationForm
