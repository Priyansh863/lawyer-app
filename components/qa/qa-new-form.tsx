"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import endpoints from "@/constant/endpoints"
import { useState } from "react"

const qaSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  clientName: z.string().optional(),
  isAnonymous: z.boolean().default(true),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(),
})

type QAFormData = z.infer<typeof qaSchema>

export default function QANewForm() {
  const router = useRouter()
  const user = useSelector((state: RootState) => state.auth.user);
  const token = typeof window !== "undefined" && localStorage.getItem("user") 
    ? JSON.parse(localStorage.getItem("user") as string).token 
    : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QAFormData>({
    resolver: zodResolver(qaSchema),
    defaultValues: {
      question: "",
      clientName: `${user?.first_name + " " + user?.last_name}`,
      isAnonymous: true,
      category: "general",
      tags: "",
    },
  })

  const onSubmit = async (data: QAFormData) => {
    try {
      // Show loading state
      setIsSubmitting(true);
      
      // Process tags if they exist and handle anonymous submissions
      const processedData = {
        ...data,
        // When isAnonymous is true, send blank clientName
        clientName: data.isAnonymous ? "" : data.clientName
        // If tags is a string, keep it as is for the backend to process
      };

      // Call our API endpoint
      const response = await fetch(endpoints.question.CREATE_QUESTION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(processedData),
      })

      console.log(response, "<<<<<<<<<response")

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle token expiration specifically
        if (errorData.error === "token-expired") {
          console.error("Your session has expired. Redirecting to login...");
          // Redirect to login page
          // router.push("/login");
          return; // Exit early
        }
        
        throw new Error(errorData.error || "Failed to create question");
      }

      // Redirect to Q&A page on success
      router.push("/qa");
    } catch (error) {
      console.error("Failed to save question:", error);
      // Could add toast notification here for error feedback
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter the legal question..." className="min-h-[150px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" disabled={form.watch("isAnonymous")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="family-law">Family Law</SelectItem>
                      <SelectItem value="criminal-law">Criminal Law</SelectItem>
                      <SelectItem value="corporate-law">Corporate Law</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="intellectual-property">Intellectual Property</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. divorce, custody, property" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Submit as anonymous</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/qa")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Question"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
