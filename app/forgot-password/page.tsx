"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

// ✅ Schema with translation support
const createForgotPasswordSchema = (t: any) =>
  z.object({
    email: z.string().email(t("pages:authf.forgotPassword.errors.invalidEmail")),
  })

type ForgotPasswordFormData = {
  email: string
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(t)),
    defaultValues: {
      email: "",
    },
  })

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
      console.log("Forgot Password response:", result)

      if (result.success) {
        setIsOtpSent(true)

        // ✅ Show OTP in toast message if email service not available
        if (result.data?.otp) {
          toast({
            title: t("pages:authf.forgotPassword.otpSent.title"),
            description:
              result.data.message ||
              t("pages:authf.forgotPassword.otpSent.descriptionWithCode", { otp: result.data.otp }),
            variant: "success" as const,
          })
        } else {
          toast({
            title: t("pages:authf.forgotPassword.otpSent.title"),
            description: t("pages:authf.forgotPassword.otpSent.description"),
            variant: "success" as const,
          })
        }

        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(data.email)}`)
        }, 2000)
      } else {
        toast({
          title: t("pages:authf.forgotPassword.errors.sendFailed"),
          description: t("pages:authf.forgotPassword.errors.sendFailed"),
          variant: "error" as const,
        })
      }
    } catch (error) {
      toast({
        title: t("pages:authf.forgotPassword.errors.networkTitle"),
        description: t("pages:authf.forgotPassword.errors.checkConnection"),
        variant: "error" as const,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="max-w-md w-full mx-4">
        {/* Back to Login Link */}
        <div className="text-center mb-6 -mt-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-white hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("pages:authf.forgotPassword.backToLogin")}
          </Link>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isOtpSent
                ? t("pages:authf.forgotPassword.checkEmail")
                : t("pages:authf.forgotPassword.title")}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {isOtpSent
                ? t("pages:authf.forgotPassword.otpSentMessage")
                : t("pages:authf.forgotPassword.instructions")}
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
                        <FormLabel>{t("pages:authf.forgotPassword.emailLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t("pages:authf.forgotPassword.emailPlaceholder")}
                            className="bg-white"
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
                    {isLoading
                      ? t("pages:authf.forgotPassword.sendingOtp")
                      : t("pages:authf.forgotPassword.sendOtpButton")}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    {t("pages:authf.forgotPassword.otpSuccess")}
                  </p>
                </div>

                <Button
                  onClick={() =>
                    router.push(`/reset-password?email=${encodeURIComponent(form.getValues("email"))}`)
                  }
                  className="w-full bg-[#0f0921] hover:bg-[#0f0921]/90 text-white"
                >
                  {t("pages:authf.forgotPassword.continueButton")}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOtpSent(false)
                    form.reset()
                  }}
                  className="w-full"
                >
                  {t("pages:authf.forgotPassword.sendAnotherOtp")}
                </Button>
              </div>
            )}

            <div className="text-center mt-6">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                {t("pages:authf.forgotPassword.rememberPassword")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
