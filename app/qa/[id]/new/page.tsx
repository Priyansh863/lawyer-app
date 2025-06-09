import QANewForm from "@/components/qa/qa-new-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Question | Legal Practice Management",
  description: "Add a new question to the Q&A system",
}

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add New Question</h1>
      <QANewForm />
    </div>
  )
}
