"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { signIn } from "next-auth/react"
import OtpVerificationForm from "@/components/otp-verification-form"
import { VerifyOtpData, OtpResponseData } from "@/services/auth"

export default function VerifyOtpPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState<string>("")
  const [purpose, setPurpose] = useState<"signup" | "login">("signup")
  const [otpExpires, setOtpExpires] = useState<Date | null>(null)

  useEffect(() => {
    // Get email and purpose from URL params
    const emailParam = searchParams.get("email")
    const purposeParam = searchParams.get("purpose") as "signup" | "login" | null

    if (!emailParam) {
      // If no email provided, redirect to home
      router.push("/")
      return
    }

    setEmail(emailParam)
    setPurpose(purposeParam === "login" ? "login" : "signup")
  }, [searchParams, router])

  const handleOtpSuccess = async (data: VerifyOtpData | null) => {
    if (purpose === "login") {
      if (data?.token) {
        // For login flow, we have the token, so we can sign in directly
        try {
          const result = await signIn("credentials", {
            email,
            token: data.token,
            redirect: false,
          })
          
          if (result?.ok) {
            // Success - the session will be updated and user will be redirected
            return
          }
          throw new Error(result?.error || "Failed to sign in after verification")
        } catch (error) {
          console.error("Error signing in after verification:", error)
          toast({
            title: "Error",
            description: "Account verified, but failed to sign in. Please try logging in manually.",
            variant: "error",
          })
          router.push("/login")
        }
      } else {
        // If no token in response, redirect to login page
        toast({
          title: "Success",
          description: "Your account has been verified successfully! Please log in to continue.",
          variant: "success",
        })
        router.push("/login")
      }
    } else {
      // For signup flow, redirect to login page
      toast({
        title: "Success",
        description: "Your account has been verified successfully! Please log in to continue.",
        variant: "success",
      })
      router.push("/login")
    }
  }

  const handleResendSuccess = (data: OtpResponseData | null) => {
    if (data?.otp_expires) {
      setOtpExpires(new Date(data.otp_expires))
    }
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading verification form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <OtpVerificationForm
          email={email}
          purpose={purpose}
          onSuccess={handleOtpSuccess}
          onResendSuccess={handleResendSuccess}
          otpExpires={otpExpires || undefined}
        />
      </div>
    </div>
  )
}
