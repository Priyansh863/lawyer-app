import QAAnswerForm from "@/components/qa/qa-answer-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Answer Question | Legal Practice Management",
  description: "Provide an answer to a legal question",
}

export default function AnswerQuestionPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-slate-50/50 -m-8 p-8 flex items-start justify-center">
      <div className="w-full pt-12">
        <QAAnswerForm questionId={params.id} />
      </div>
    </div>
  )
}
