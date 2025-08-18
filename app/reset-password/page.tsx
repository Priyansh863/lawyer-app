"use client"

import { useState, useEffect, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

const resetPasswordSchema = z.object({
  otp: z.string().optional(),
  newPassword: z.string().min(8, "passwordMinLength"),
  confirmPassword: z.string().min(8, "passwordMinLength"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "passwordsDontMatch",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (!email) {
      toast.error(t("resetPassword.invalidRequest.title"), {
        description: t("pages:resetPassword.invalidRequest.description"),
      })
      router.push('/forgot-password')
    }
  }, [email, router, t])

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
          otp: data.otp,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(t("pages:resetPassword.success.title"), {
          description: t("pages:resetPassword.success.description"),
          duration: 5000,
        })

        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        toast.error(t("pages:resetPassword.error.title"), {
          description: result.message || t("pages:resetPassword.error.description"),
        })
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error(t("pages:resetPassword.networkError.title"), {
        description: t("pages:resetPassword.networkError.description"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          <Link 
            href="/forgot-password" 
            className="inline-flex items-center text-sm text-white hover:text-gray-200 mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("pages:resetPassword.backLink")}
          </Link>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Lock className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {t("pages:resetPassword.title")}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {t("pages:resetPassword.subtitle", { email })}
            </p>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:resetPassword.newPasswordLabel")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t("pages:resetPassword.newPasswordPlaceholder")}
                            className="bg-gray-50 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("pages:resetPassword.confirmPasswordLabel")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t("pages:resetPassword.confirmPasswordPlaceholder")}
                            className="bg-gray-50 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
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
                  {isLoading ? t("pages:resetPassword.resettingButton") : t("pages:resetPassword.resetButton")}
                </Button>
              </form>
            </Form>

            <div className="text-center mt-6">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                {t("pages:resetPassword.rememberPasswordLink")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[url('/background.jpg')] bg-cover bg-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f0921] mx-auto"></div>
          <p className="mt-2 text-white">{t("pages:commonra.loading")}</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}