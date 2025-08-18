"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Save, Send, Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import endpoints from "@/constant/endpoints"
import { useTranslation } from "@/hooks/useTranslation"

interface QAItem {
  _id: string
  question: string
  answer?: string
  userId: {
    _id: string
    first_name: string
    last_name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  status?: string
  likes?: number
  category: string
  tags?: string[]
}

const answerSchema = z.object({
  answer: z.string().min(10, "Answer must be at least 10 characters"),
})

type AnswerFormData = z.infer<typeof answerSchema>

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
  const [loading, setLoading] = useState<boolean>(true)
  const { t } = useTranslation()
  const form = useForm<AnswerFormData>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      answer: "",
    },
  })

  // Get token from localStorage
  const getToken = () => {
    try {
      if (typeof window === "undefined") return null;
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).token : null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await fetch(`${endpoints.question.GET_QUESTION_BY_ID}${questionId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setQaItem(data.data);
          
          if (isEditing && data.data.answer) {
            form.setValue("answer", data.data.answer);
          }
        } else {
          throw new Error("Failed to load question data");
        }
      } catch (err) {
        console.error("Failed to load question:", err);
        setError("Failed to load question data");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId, isEditing, form]);

  const onSubmit = async (data: AnswerFormData) => {
    setError(null);

    try {
      const token = getToken();
      
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${endpoints.question.SUBMIT_ANSWER}${questionId}`, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      // Redirect back to question list on success
      router.push("/qa");
    } catch (err) {
      console.error("Failed to save answer:", err);
      setError("Failed to save answer. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">{t("pages:qas.loading")}</span>
      </div>
    );
  }

  if (!qaItem) {
    return <div className="text-center py-8 text-red-500">{t("pages:qas.questionNotFound")}</div>
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="text-sm text-gray-500 mb-2">
          {qaItem.userId?.first_name} {qaItem.userId?.last_name || ""} • {format(new Date(qaItem.createdAt), "MMM dd, yyyy")}
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
                <FormLabel>{t("pages:qas.form.yourAnswer")}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t("pages:qas.form.answerPlaceholder")}
 className="min-h-[200px]" {...field} />
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
               {t("pages:qas.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Save size={16} />
                  {form.formState.isSubmitting ? t("pages:qas.buttons.saving") : t("pages:qas.buttons.saveChanges")}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {form.formState.isSubmitting ? t("pages:qas.buttons.submitting") : t("pages:qas.buttons.submit")}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
