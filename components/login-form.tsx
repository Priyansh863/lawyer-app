"use client"
import { getSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import Link from "next/link"
import { useToast } from "./ui/use-toast"
import { useDispatch } from "react-redux";
import { setUser } from "@/lib/slices/authSlice"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { toast } = useToast()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      console.log("Login result:", result,result?.ok,!result?.ok)

      if (!result?.ok) {
        console.error("Login failed:", result!.error)
        toast({
          title: "Login Failed",
          description: result!.error || "An unexpected error occurred. Please try again.",
          variant: "error",
        })
        return
      }
      const userInfo: any = await getSession();
      console.log("User Info from session:", userInfo)
      if (userInfo?.user?._id) {
        // Save user details to local storage
        localStorage.setItem("user", JSON.stringify(userInfo.user));

        // Dispatch user details to Redux store
        dispatch(setUser(userInfo.user));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${userInfo.user.first_name || userInfo.user.email}!`,
          variant: "success",
        })

        router.push("/dashboard"); // Redirect after successful login
      } else {
        toast({
          title: "Login Failed",
          description: "User data not found. Please try again.",
          variant: "error",
        })
        return
      }
      console.log("User Info:", userInfo)
      router.refresh()
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "error",
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold font-heading">Welcome Back!</h1>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" className="bg-gray-50" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" className="bg-gray-50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-[#0f0921] hover:bg-[#0f0921]/90 text-white"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Logging In..." : "Log In"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm mt-4">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium hover:underline">
            Sign Up
          </Link>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-center text-muted-foreground flex flex-col">
        <p>This site is protected by reCAPTCHA and the</p>
        <p>
          Google{" "}
          <Link href="#" className="underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline">
            Terms
          </Link>{" "}
          of service apply.
        </p>
      </CardFooter>
    </Card>
  )
}
