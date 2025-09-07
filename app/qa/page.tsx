import QAHeader from "@/components/qa/qa-header"
import QAListWithSearch from "@/components/qa/qa-list-with-search"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Q&A | Legal Practice Management",
  description: "Answer user-submitted legal questions",
}

export default function QAPage() {
  return (
    <div className="space-y-6" style={{ marginTop: "2.25rem" }}>
      <QAHeader />
      <QAListWithSearch />
    </div>
  )
}
