import QAAnswerForm from "@/components/qa/qa-answer-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Answer Question | Legal Practice Management",
  description: "Provide an answer to a legal question",
}

export default function AnswerQuestionPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Answer Question</h1>
      <QAAnswerForm questionId={params.id} />
    </div>
  )
}
