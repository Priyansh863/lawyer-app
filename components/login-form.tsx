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
import { Eye, EyeOff } from "lucide-react"

// Validation schema
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

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        if (result.error === 'account_not_verified') {
          router.push(`/verify-otp?email=${encodeURIComponent(data.email)}&purpose=login`);
          toast({
            title: t('auth.accountNotVerified'),
            description: t('auth.verifyEmailOtp'),
            variant: "success" as const,
          });
          return;
        }
        throw new Error(result.error);
      }

      const userInfo = await getSession();

      if (userInfo?.user?.email) {
        localStorage.setItem("user", JSON.stringify(userInfo.user));
        dispatch(setUser(userInfo.user as any));

        if ((userInfo.user as any)?.token) {
          localStorage.setItem("token", (userInfo.user as any).token);
          dispatch(setToken((userInfo.user as any).token));
        }

        toast({
          title: t('auth.loginSuccessful'),
          description: t('auth.welcomeBackUser', { email: userInfo.user.email }),
          variant: "success",
        });

        router.push("/dashboard");
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
            {/* Email Field */}
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

            {/* Password Field with Eye Toggle */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t('auth.enterPassword')}
                        className="bg-gray-50 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1} // prevent focus from jumping
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forgot Password */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#0f0921] hover:underline">
                 {t('auth.forgotPassword')}
              </Link>
            </div>

            {/* Submit Button */}
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