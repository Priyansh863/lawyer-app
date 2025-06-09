import QAAnswerForm from "@/components/qa/qa-answer-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Edit Answer | Legal Practice Management",
  description: "Edit your answer to a legal question",
}

export default function EditAnswerPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit Answer</h1>
      <QAAnswerForm questionId={params.id} isEditing />
    </div>
  )
}
