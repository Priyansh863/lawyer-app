import QAHeader from "@/components/qa/qa-header"
import QAList from "@/components/qa/qa-list"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Q&A | Legal Practice Management",
  description: "Answer user-submitted legal questions",
}

export default function QAPage() {
  return (
    <div className="space-y-6" style={{ marginTop: "2.25rem" }}>
      <QAHeader />
      <QAList />
    </div>
  )
}
