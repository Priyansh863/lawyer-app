"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { signUp } from "@/services/auth"
import { useRouter } from "next/navigation"
import { useToast } from "./ui/use-toast"
import { useTranslation } from "@/hooks/useTranslation"

const sign_up_schema = z.object({
  first_name: z.string().min(2, "first_name_error"),
  last_name: z.string().min(2, "last_name_error"),
  email: z.string().email("email_error"),
  password: z.string().min(8, "password_error"),
  account_type: z.enum(["client", "lawyer"]).refine((val) => !!val, {
    message: "account_type_error",
  }),
  agree_to_terms: z.boolean().refine((val) => val === true, {
    message: "terms_error",
  }),
})

type SignUpFormData = z.infer<typeof sign_up_schema>

export default function SignUpForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslation()

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(sign_up_schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      account_type: "client",
      agree_to_terms: false,
    },
  })

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true)
      const response = await signUp(data)

      if (response?.data?.success) {
        // Show OTP in toast message since email service may not be working
        if (response?.data?.data?.otp) {
          toast({
            title: "Signup OTP Sent",
            description: response.data.data.message || `Your verification OTP is: ${response.data.data.otp}. This OTP will expire in 10 minutes.`,
            variant: "success",
          })
        } else {
          toast({
            title: "Account Created Successfully",
            description: "Please check your email for the verification OTP.",
            variant: "success",
          })
        }
        
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}&purpose=signup`)
      } else {
        toast({
          title: t("pages:signu.error"),
          description: t(response?.data?.message ?? "pages:signu.signup.error"),
          variant: "error",
        })
      }
    } catch (error: any) {
      toast({
        title: t("pages:signu.error"),
        description: error?.response?.data?.message ?? t("pages:signu.signup.unexpected_error"),
        variant: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold font-heading">{t("pages:signu.signup.title")}</h1>
        <p className="text-sm text-gray-600">
          {t("pages:signu.signup.have_account")}{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            {t("pages:signu.signup.sign_in")}
          </Link>
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:signu.signup.first_name")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("pages:signu.signup.first_name_placeholder")} 
                        className="bg-gray-50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("pages:signu.signup.last_name")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t("pages:signu.signup.last_name_placeholder")} 
                        className="bg-gray-50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("pages:signu.signup.email")}</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder={t("pages:signu.signup.email_placeholder")} 
                      className="bg-gray-50" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("pages:signu.signup.password")}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={t("pages:signu.signup.password_placeholder")} 
                      className="bg-gray-50" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("pages:signu.signup.account_type")}</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("pages:signu.signup.account_type_placeholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">{t("pages:signu.signup.client")}</SelectItem>
                        <SelectItem value="lawyer">{t("pages:signu.signup.lawyer")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agree_to_terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs text-muted-foreground">
                      {t("pages:signu.signup.terms_agreement")}
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-[#0f0921] hover:bg-[#0f0921]/90 text-white"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? t("pages:signu.signup.creating_account") : t("pages:signu.signup.create_account")}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm mt-4">
          {t("pages:signu.signup.have_account")}{" "}
          <Link href="/login" className="font-medium hover:underline">
            {t("pages:signu.signup.sign_in")}
          </Link>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-center text-muted-foreground flex flex-col">
        <p>{t("pages:signu.signup.recaptcha_notice")}</p>
        <p>
          {t("pages:signu.signup.google_policy_prefix")}{" "}
          <Link href="#" className="underline">
            {t("pages:signu.signup.privacy_policy")}
          </Link>{" "}
          {t("pages:signu.signup.and")}{" "}
          <Link href="#" className="underline">
            {t("pages:signu.signup.terms_of_service")}
          </Link>{" "}
          {t("pages:signu.signup.apply")}
        </p>
      </CardFooter>
    </Card>
  )
}