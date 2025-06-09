"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Save, Send } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface QAItem {
  id: string
  question: string
  answer: string
  client: string
  date: string
  status: "pending" | "answered"
  likes: number
}

const answerSchema = z.object({
  answer: z.string().min(10, "Answer must be at least 10 characters"),
})

type AnswerFormData = z.infer<typeof answerSchema>

// Mock data for a single Q&A item
const MOCK_QA_ITEM: QAItem = {
  id: "1",
  question:
    "Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.",
  answer:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  client: "Anonymous",
  date: "2025-05-15",
  status: "answered",
  likes: 12,
}

export default function QAAnswerForm({
  questionId,
  isEditing = false,
}: {
  questionId: string
  isEditing?: boolean
}) {
  const router = useRouter()
  const [qaItem, setQaItem] = useState<QAItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AnswerFormData>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      answer: "",
    },
  })

  useEffect(() => {
    // this would in real app fetch the question data from API
    const fetchQuestion = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
        const mockItem = { ...MOCK_QA_ITEM, id: questionId }
        setQaItem(mockItem)

        if (isEditing) {
          form.setValue("answer", mockItem.answer)
        }
      } catch (err) {
        setError("Failed to load question data")
        console.error(err)
      }
    }

    fetchQuestion()
  }, [questionId, isEditing, form])

  const onSubmit = async (data: AnswerFormData) => {
    setError(null)

    try {
      // Example API call structure for backend person
      const response = await fetch(`/api/qa/${questionId}/answer`, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push("/qa")
      }
    } catch (err) {
      setError("Failed to save answer")
      console.error(err)
    }
  }

  if (!qaItem) {
    return <div className="text-center py-8">Loading question...</div>
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="text-sm text-gray-500 mb-2">
          {qaItem.client} • {new Date(qaItem.date).toLocaleDateString()}
        </div>
        <p className="font-medium font-heading">{qaItem.question}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Answer</FormLabel>
                <FormControl>
                  <Textarea placeholder="Write your answer here..." className="min-h-[200px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/qa")}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Save size={16} />
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {form.formState.isSubmitting ? "Submitting..." : "Submit Answer"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
