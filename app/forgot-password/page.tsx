"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const router = useRouter()

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (result.success) {
        setIsOtpSent(true)
        
        // Show OTP in toast message since email service may not be working
        if (result.data?.otp) {
          toast.success("Password Reset OTP", {
            description: result.data.message || `Your password reset OTP is: ${result.data.otp}. This OTP will expire in 10 minutes.`,
            duration: 10000, // Show for 10 seconds
          })
        } else {
          toast.success("OTP Sent Successfully", {
            description: "Please check your email for the password reset OTP.",
            duration: 5000,
          })
        }

        // Redirect to reset password page after 2 seconds
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(data.email)}`)
        }, 2000)
      } else {
        toast.error("Failed to Send OTP", {
          description: result.message || "Please try again later.",
        })
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error("Network Error", {
        description: "Please check your connection and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isOtpSent ? "Check Your Email" : "Forgot Password?"}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {isOtpSent 
                ? "We've sent a password reset OTP to your email address."
                : "Enter your email address and we'll send you an OTP to reset your password."
              }
            </p>
          </CardHeader>

          <CardContent>
            {!isOtpSent ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            className="bg-gray-50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-[#0f0921] hover:bg-[#0f0921]/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending OTP..." : "Send Reset OTP"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    OTP sent successfully! Check the notification above for your OTP code.
                  </p>
                </div>
                
                <Button
                  onClick={() => router.push(`/reset-password?email=${encodeURIComponent(form.getValues('email'))}`)}
                  className="w-full bg-[#0f0921] hover:bg-[#0f0921]/90 text-white"
                >
                  Continue to Reset Password
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOtpSent(false)
                    form.reset()
                  }}
                  className="w-full"
                >
                  Send Another OTP
                </Button>
              </div>
            )}

            <div className="text-center mt-6">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Remember your password? Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
