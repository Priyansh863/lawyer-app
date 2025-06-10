"use client"
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
import { useToast } from "@/hooks/use-toast"

const sign_up_schema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  account_type: z.enum(["client", "lawyer"]).refine((val) => !!val, {
    message: "Please select an account type",
  }),
  agree_to_terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
})

type SignUpFormData = z.infer<typeof sign_up_schema>

export default function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();


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
      const response = await signUp(data);

      if (response && response.data!.success) {
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        router.push("/login") // Redirect after successful login

        console.log("Account created successfully");
      } else {
        toast({
          title: "Error",
          description: "Failed to create account. Please try again.",
        });
        console.error("Sign up error:", response.error || "Unknown error");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
      });
      console.error("Sign up error:", error);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <h1 className="text-2xl font-bold font-heading">Welcome!</h1>
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
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" className="bg-gray-50" {...field} />
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
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" className="bg-gray-50" {...field} />
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

            <FormField
              control={form.control}
              name="account_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="lawyer">Lawyer</SelectItem>
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
                      I agree with all conditions terms of Service Privacy Policy and Terms that I have read.
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
              {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link href="/" className="font-medium hover:underline">
            Sign In
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
