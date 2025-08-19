"use client"
import { getSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { setUser, setToken } from "@/lib/slices/authSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { useTranslation } from "@/hooks/useTranslation"

// Note: Validation messages will be handled by the component using i18n
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { t } = useTranslation()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema.refine(
      (data) => {
        // Custom validation with i18n messages
        if (!data.email || !z.string().email().safeParse(data.email).success) {
          throw new Error(t('auth.emailValidation'))
        }
        if (!data.password || data.password.length < 8) {
          throw new Error(t('auth.passwordMinLength'))
        }
        return true
      }
    )),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      
      const result = await signIn("credentials", {
        email: data.email.trim(),
        password: data.password,
        redirect: false,
      });


      if (!result) {
        throw new Error("No response from server. Please try again.");
      }

      if (result.error) {
        // Handle unverified account
        if (result.error === 'account_not_verified') {
          router.push(`/verify-otp?email=${encodeURIComponent(data.email)}&purpose=login`);
          toast({
            title: t('auth.accountNotVerified'),
            description: t('auth.verifyEmailOtp'),
            variant: "success" as const,
          });
          return;
        }

        // For all other errors, show the error message from the server
        throw new Error(result.error);
      }
      
      // If we get here, login was successful
      const userInfo = await getSession();
      
      if (userInfo?.user?.email) {
        // Save user details to local storage
        localStorage.setItem("user", JSON.stringify(userInfo.user));
        
        // Update Redux store immediately
        dispatch(setUser(userInfo.user as any));
        
        // If there's a token in the user object, save it to Redux
        if ((userInfo.user as any)?.token) {
          localStorage.setItem("token", (userInfo.user as any).token);
          dispatch(setToken((userInfo.user as any).token));
        }

        toast({
          title: t('auth.loginSuccessful'),
          description: t('auth.welcomeBackUser', { email: userInfo.user.email }),
          variant: "success",
        });

        router.push("/dashboard"); // Redirect after successful login
      } else {
        throw new Error(t('auth.userDataNotFound'));
      }
    } catch (error) {
      toast({
        title: t('auth.loginFailed'),
        description: error instanceof Error ? error.message : t('auth.unexpectedError'),
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold font-heading">{t('auth.welcomeBack')}</h1>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email')}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('auth.enterEmail')} className="bg-gray-50" {...field} />
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
                  <FormLabel>{t('auth.password')}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t('auth.enterPassword')} className="bg-gray-50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#0f0921] hover:underline">
                 {t('auth.forgotPassword')}
              </Link>
            </div>

         

            <Button
              type="submit"
              className="w-full bg-[#0f0921] hover:bg-[#0f0921]/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? t('auth.loggingIn') : t('auth.logIn')}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm mt-4">
          {t('auth.dontHaveAccount')}{" "}
          <Link href="/signup" className="font-medium hover:underline">
            {t('auth.signUp')}
          </Link>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-center text-muted-foreground flex flex-col">
        <p>{t('auth.recaptchaNotice')}</p>
        <p>
          Google{" "}
          <Link href="#" className="underline">
            {t('auth.privacyPolicy')}
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline">
            {t('auth.termsOfService')}
          </Link>{" "}
          of service apply.
        </p>
      </CardFooter>
    </Card>
  )
}
